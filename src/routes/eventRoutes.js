const express = require('express');
const { createEvent, getEvents, updateEvent } = require('../controllers/eventController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Route to create a new event
router.post('/', verifyToken, createEvent);

// Route to get all events
router.get('/', getEvents);

// Route to update an existing event
router.put('/:id', verifyToken, updateEvent);

module.exports = router;