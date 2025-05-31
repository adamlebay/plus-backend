const express = require('express');
const { createEvent, getAllEvents, updateEvent, getEventById, joinEvent, leaveEvent, approveParticipation } = require('../controllers/eventController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();


console.log('eventRoutes loaded');
console.log({
  createEvent,
  getAllEvents,
  updateEvent,
  getEventById,
  joinEvent,
  leaveEvent,
  approveParticipation
});

console.log('approveParticipation type:', typeof approveParticipation)

// Route to create a new event
router.post('/', verifyToken, (req, res, next) => {
  console.log('POST /events hit');
  createEvent(req, res, next);
});

// Route to get all events
router.get('/', (req, res, next) => {
  console.log('GET /events hit');
  getAllEvents(req, res, next);
});

// Route to get an event by ID
router.get('/:id', (req, res, next) => {
  console.log('GET /events/:id hit', req.params);
  getEventById(req, res, next);
});

// Route to update an existing event
router.put('/:id', verifyToken, (req, res, next) => {
  console.log('PUT /events/:id hit', req.params);
  updateEvent(req, res, next);
});

// Join event
router.post('/:id/join', verifyToken, (req, res, next) => {
  console.log('POST /events/:id/join hit', req.params);
  joinEvent(req, res, next);
});

// Leave event
router.post('/:id/leave', verifyToken, (req, res, next) => {
  console.log('POST /events/:id/leave hit', req.params);
  leaveEvent(req, res, next);
});

// Approve participation
router.post('/:eventId/approve/:userId', verifyToken, requireAdmin, approveParticipation);

// After decoding JWT


module.exports = router;