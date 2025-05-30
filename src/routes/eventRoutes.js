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
router.post('/', verifyToken, createEvent);

// Route to get all events
router.get('/', getAllEvents);

// Route to get an event by ID
router.get('/:id', getEventById);

// Route to update an existing event
router.put('/:id', verifyToken, updateEvent);

module.exports = router;