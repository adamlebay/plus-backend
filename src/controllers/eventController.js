const prisma = require('../config/prisma'); // Add this line

console.log('eventController loaded');

exports.createEvent = async (req, res) => {
    const { title, description, location, date, available_slots, association_id } = req.body;

    try {
        const newEvent = await prisma.event.create({
            data: {
                title,
                description,
                location,
                date,
                available_slots,
                association_id // <-- ONLY this, not association: { ... }
            }
        });
        res.status(201).json(newEvent);
    } catch (error) {
        console.error('Failed to create event:', error);
        res.status(500).json({ error: 'Failed to create event' });
    }
};

exports.getAllEvents = async (req, res) => {
    try {
        const events = await prisma.event.findMany();
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve events' });
    }
};

exports.updateEvent = async (req, res) => {
    const { id } = req.params;
    const { title, description, location, date, available_slots } = req.body;

    try {
        const updatedEvent = await prisma.event.update({
            where: { id },
            data: {
                title,
                description,
                location,
                date,
                available_slots
            }
        });
        res.status(200).json(updatedEvent);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update event' });
    }
};

exports.getEventById = async (req, res) => {
    const { id } = req.params;

    try {
        const event = await prisma.event.findUnique({
            where: { id }
        });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve event' });
    }
};

exports.createAssociation = async (req, res) => {
    const { name } = req.body;
    try {
        const association = await prisma.association.create({
            data: { name }
        });
        res.status(201).json(association);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create association' });
    }
};

exports.joinEvent = async (req, res) => {
    const userId = req.user.id;
    const { id: eventId } = req.params;

    try {
        // Create a participation request with status 'pending'
        const participation = await prisma.participation.create({
            data: {
                userId,
                eventId,
                status: 'pending'
            }
        });
        res.status(200).json({ message: 'Participation requested. Awaiting approval.', participation });
    } catch (error) {
        console.error('Failed to request participation:', error);
        res.status(500).json({ error: 'Failed to request participation' });
    }
};

exports.leaveEvent = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const event = await prisma.event.update({
            where: { id },
            data: {
                users: {
                    disconnect: { id: userId }
                }
            }
        });
        res.status(200).json({ message: 'Left event', event });
    } catch (error) {
        console.error('Failed to leave event:', error);
        res.status(500).json({ error: 'Failed to leave event' });
    }
};

exports.approveParticipation = async (req, res) => {
    const { eventId, userId } = req.params;

    try {
        const participation = await prisma.participation.updateMany({
            where: { eventId, userId, status: 'pending' },
            data: { status: 'approved' }
        });
        // Optionally, award credits here if needed
        res.status(200).json({ message: 'Participation approved', participation });
    } catch (error) {
        console.error('Failed to approve participation:', error);
        res.status(500).json({ error: 'Failed to approve participation' });
    }
};