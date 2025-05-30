require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const eventRoutes = require('./src/routes/eventRoutes');

const app = express();
const prisma = new PrismaClient();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const JWT_SECRET = process.env.JWT_SECRET;

app.use(express.json());
app.use('/events', eventRoutes);

app.get('/', (req, res) => {
  res.send('PLUS backend is running!');
});

// Utility function to create a notification for a user
async function createNotification(userId, content) {
  return prisma.notification.create({
    data: {
      userId,
      content,
    },
  });
}

async function awardBadgeIfNotExists(userId, badgeName) {
  // Find the badge by name
  const badge = await prisma.badge.findUnique({ where: { name: badgeName } });
  if (!badge) return;

  // Check if user already has this badge
  const existing = await prisma.userBadge.findFirst({
    where: { userId, badgeId: badge.id }
  });
  if (existing) return;

  // Award the badge
  await prisma.userBadge.create({
    data: { userId, badgeId: badge.id }
  });

  // Optionally, notify the user
  await createNotification(userId, `Congratulations! You've earned the "${badge.name}" badge!`);
}


// Create a new association
app.post('/associations', async (req, res) => {
  try {
    const { name } = req.body;
    const association = await prisma.association.create({
      data: { name },
    });
    res.status(201).json(association);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all associations
app.get('/associations', async (req, res) => {
  try {
    const associations = await prisma.association.findMany();
    res.json(associations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update an association
app.put('/associations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updated = await prisma.association.update({
      where: { id },
      data: { name },
    });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete an association
app.delete('/associations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.association.delete({ where: { id } });
    res.json({ message: 'Association deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// User signup
app.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });

  // Store user profile in your DB
  try {
    await prisma.user.create({
      data: {
        id: data.user.id,
        name,
        email,
      },
    });
    res.status(201).json({ message: 'Signup successful', user: data.user });
  } catch (dbError) {
    res.status(500).json({ error: dbError.message });
  }
});

// User login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(400).json({ error: error.message });

  // Issue JWT for session management
  const token = jwt.sign({ userId: data.user.id, email: data.user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ message: 'Login successful', token, user: data.user });
});

// Google OAuth
app.post('/auth/google', async (req, res) => {
  const { access_token } = req.body;
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: access_token,
  });
  if (error) return res.status(400).json({ error: error.message });

  // Upsert user profile in your DB
  try {
    await prisma.user.upsert({
      where: { email: data.user.email },
      update: {},
      create: {
        id: data.user.id,
        name: data.user.user_metadata.full_name || data.user.email,
        email: data.user.email,
      },
    });
    const token = jwt.sign({ userId: data.user.id, email: data.user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Google login successful', token, user: data.user });
  } catch (dbError) {
    res.status(500).json({ error: dbError.message });
  }
});

// JWT authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Role-based access control middleware
function requireRole(roles) {
  return async (req, res, next) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}

// Get current user's profile
app.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        events: true // shows volunteering history
      }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      plus_credits: user.plus_credits,
      created_at: user.created_at,
      events: user.events
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update current user's profile
app.put('/me', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data: { name }
    });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update profile visibility
app.patch('/users/me/visibility', authenticateToken, async (req, res) => {
  try {
    const { profileVisibility } = req.body;
    if (!['public', 'private'].includes(profileVisibility)) {
      return res.status(400).json({ error: 'Invalid visibility option.' });
    }
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { profileVisibility }
    });
    res.json({ message: 'Profile visibility updated.', user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Change password (Supabase Auth)
app.post('/users/me/change-password', authenticateToken, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const { data, error } = await supabase.auth.api.updateUser(req.headers.authorization, { password: newPassword });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Password updated.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete account
app.delete('/users/me', authenticateToken, async (req, res) => {
  try {
    // Delete from Supabase Auth
    await supabase.auth.api.deleteUser(req.user.userId, process.env.SUPABASE_SERVICE_ROLE_KEY);
    // Delete from your DB
    await prisma.user.delete({ where: { id: req.user.userId } });
    res.json({ message: 'Account deleted.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// User joins an event (requests participation)
app.post('/events/:id/join', authenticateToken, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.userId;

    // Add user to event's users relation (pending approval)
    // You may want to add a join table with status, but for simplicity:
    await prisma.event.update({
      where: { id: eventId },
      data: {
        users: { connect: { id: userId } }
      }
    });

    res.json({ message: 'Participation requested. Awaiting approval.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin/association approves participation and awards credits
app.post('/events/:eventId/approve/:userId', authenticateToken, async (req, res) => {
  try {
    const { eventId, userId } = req.params;

    // Award credits (e.g., +10) to the user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        plus_credits: { increment: 10 }
      }
    });

    // Automatic badge logic
    // Example: 100 credits badge
    if (user.plus_credits >= 100) {
      await awardBadgeIfNotExists(userId, "100 PLUS+ Credits");
    }
    // Example: 10 events badge
    const eventsCount = await prisma.event.count({
      where: {
        users: { some: { id: userId } }
      }
    });
    if (eventsCount >= 10) {
      await awardBadgeIfNotExists(userId, "10 Events Attended");
    }

    res.json({ message: 'Participation approved and credits awarded.', user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// User leaves an event
app.post('/events/:id/leave', authenticateToken, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.userId;

    await prisma.event.update({
      where: { id: eventId },
      data: {
        users: { disconnect: { id: userId } }
      }
    });

    res.json({ message: 'You have left the event.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Leaderboard: Top users by PLUS+ credits
app.get('/leaderboard', async (req, res) => {
  try {
    const topUsers = await prisma.user.findMany({
      orderBy: { plus_credits: 'desc' },
      take: 10, // Top 10 users
      select: {
        id: true,
        name: true,
        email: true,
        plus_credits: true,
      },
    });
    res.json(topUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Post a new activity (volunteering experience, comment, etc.)
app.post('/activities', authenticateToken, async (req, res) => {
  try {
    const { content, eventId } = req.body;
    const activity = await prisma.activity.create({
      data: {
        userId: req.user.userId,
        eventId,
        content,
      },
      include: { user: true, event: true }
    });
    res.status(201).json(activity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get the activity feed (latest first)
app.get('/activities', async (req, res) => {
  try {
    const activities = await prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: true, event: true }
    });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a comment to an activity
app.post('/activities/:activityId/comments', authenticateToken, async (req, res) => {
  try {
    const { activityId } = req.params;
    const { content } = req.body;
    const comment = await prisma.comment.create({
      data: {
        content,
        activityId,
        userId: req.user.userId,
      },
      include: { user: true }
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all comments for an activity
app.get('/activities/:activityId/comments', async (req, res) => {
  try {
    const { activityId } = req.params;
    const comments = await prisma.comment.findMany({
      where: { activityId },
      orderBy: { createdAt: 'asc' },
      include: { user: true }
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add or update a reaction to an activity
app.post('/activities/:activityId/reactions', authenticateToken, async (req, res) => {
  try {
    const { activityId } = req.params;
    const { type } = req.body;
    // Upsert: one reaction per user per activity
    const reaction = await prisma.reaction.upsert({
      where: {
        userId_activityId: {
          userId: req.user.userId,
          activityId,
        }
      },
      update: { type },
      create: {
        type,
        activityId,
        userId: req.user.userId,
      },
      include: { user: true }
    });
    res.status(201).json(reaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all reactions for an activity
app.get('/activities/:activityId/reactions', async (req, res) => {
  try {
    const { activityId } = req.params;
    const reactions = await prisma.reaction.findMany({
      where: { activityId },
      include: { user: true }
    });
    res.json(reactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send a message in an event chat
app.post('/events/:eventId/messages', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { content } = req.body;
    const message = await prisma.message.create({
      data: {
        content,
        senderId: req.user.userId,
        eventId,
      },
      include: { sender: true }
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all messages for an event
app.get('/events/:eventId/messages', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const messages = await prisma.message.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
      include: { sender: true }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User or organizer rates another user for an event
app.post('/events/:eventId/ratings', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { revieweeId, stars, comment } = req.body;
    if (stars < 1 || stars > 5) {
      return res.status(400).json({ error: 'Stars must be between 1 and 5.' });
    }
    // Prevent self-rating
    if (req.user.userId === revieweeId) {
      return res.status(400).json({ error: 'You cannot rate yourself.' });
    }
    // Only allow one rating per event per reviewer/reviewee
    const existing = await prisma.rating.findFirst({
      where: { eventId, reviewerId: req.user.userId, revieweeId }
    });
    if (existing) {
      return res.status(400).json({ error: 'You have already rated this user for this event.' });
    }
    const rating = await prisma.rating.create({
      data: {
        stars,
        comment,
        reviewerId: req.user.userId,
        revieweeId,
        eventId,
      }
    });
    res.status(201).json(rating);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all ratings for a user
app.get('/users/:userId/ratings', async (req, res) => {
  try {
    const { userId } = req.params;
    const ratings = await prisma.rating.findMany({
      where: { revieweeId: userId },
      include: { reviewer: true, event: true }
    });
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate a shareable summary for a user's achievements
app.get('/share/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { activities: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const summary = `${user.name} has earned ${user.plus_credits} PLUS+ credits volunteering with +PLUS! 🎉`;
    // Optionally, include a link to the user's public profile or leaderboard
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate a shareable summary for an event
app.get('/share/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { association: true }
    });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const summary = `Join me at "${event.title}" by ${event.association.name} on +PLUS! Let's make an impact together.`;
    // Optionally, include a link to the event page
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new badge (admin only)
app.post('/badges', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, description, iconUrl } = req.body;
    const badge = await prisma.badge.create({
      data: { name, description, iconUrl }
    });
    res.status(201).json(badge);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Award a badge to a user (admin or system logic)
app.post('/users/:userId/badges/:badgeId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { userId, badgeId } = req.params;
    const userBadge = await prisma.userBadge.create({
      data: { userId, badgeId }
    });
    res.status(201).json(userBadge);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all badges for a user
app.get('/users/:userId/badges', async (req, res) => {
  try {
    const { userId } = req.params;
    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true }
    });
    res.json(userBadges.map(ub => ub.badge));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all available badges
app.get('/badges', async (req, res) => {
  try {
    const badges = await prisma.badge.findMany();
    res.json(badges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Subscribe to new notifications for the current user




// Admin Analytics Dashboard
app.get('/admin/analytics', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Total users
    const totalUsers = await prisma.user.count();

    // Total events
    const totalEvents = await prisma.event.count();

    // Total PLUS+ credits awarded
    const totalCredits = await prisma.user.aggregate({
      _sum: { plus_credits: true }
    });

    // Total participations (users joined events)
    const totalParticipations = await prisma.event.aggregate({
      _sum: { available_slots: true }
    });

    // Total badges awarded
    const totalBadgesAwarded = await prisma.userBadge.count();

    // Top 5 events by participation
    const topEvents = await prisma.event.findMany({
      orderBy: {
        users: {
          _count: 'desc'
        }
      },
      take: 5,
      select: {
        id: true,
        title: true,
        users: true,
        date: true
      }
    });

    // Top 5 users by credits
    const topUsers = await prisma.user.findMany({
      orderBy: { plus_credits: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        plus_credits: true,
      }
    });

    res.json({
      totalUsers,
      totalEvents,
      totalCredits: totalCredits._sum.plus_credits || 0,
      totalParticipations: totalParticipations._sum.available_slots || 0,
      totalBadgesAwarded,
      topEvents: topEvents.map(e => ({
        id: e.id,
        title: e.title,
        participantCount: e.users.length,
        date: e.date
      })),
      topUsers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});