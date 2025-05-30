const express = require('express');
const { createEvent, getAllEvents, updateEvent, getEventById } = require('../controllers/eventController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();


console.log('eventRoutes loaded');
console.log({
  createEventType: typeof createEvent,
  getAllEventsType: typeof getAllEvents,
  updateEventType: typeof updateEvent,
  getEventByIdType: typeof getEventById,
});

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

module.exports = router;