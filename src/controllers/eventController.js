// Remove these lines:
// const express = require('express');
// const { createEvent, getAllEvents, updateEvent, getEventById } = require('../controllers/eventController');
// const { verifyToken } = require('../middleware/authMiddleware');
// const router = express.Router();
// router.post('/', verifyToken, createEvent);
// router.get('/', getAllEvents);
// router.get('/:id', getEventById);
// router.put('/:id', verifyToken, updateEvent);

// Handler functions
exports.createEvent = async (req, res) => {
    const { title, description, location, date, available_slots } = req.body;

    try {
        const newEvent = await Event.create({
            data: {
                title,
                description,
                location,
                date,
                available_slots
            }
        });
        res.status(201).json(newEvent);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create event' });
    }
};

exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.findMany();
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve events' });
    }
};

exports.updateEvent = async (req, res) => {
    const { id } = req.params;
    const { title, description, location, date, available_slots } = req.body;

    try {
        const updatedEvent = await Event.update({
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
        const event = await Event.findUnique({
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