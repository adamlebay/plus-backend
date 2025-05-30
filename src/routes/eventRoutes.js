import express from 'express';
import { createEvent, getEvents, updateEvent } from '../controllers/eventController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route to create a new event
router.post('/', verifyToken, createEvent);

// Route to get all events
router.get('/', getEvents);

// Route to update an existing event
router.put('/:id', verifyToken, updateEvent);

export default router;