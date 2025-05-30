const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const createEvent = async (eventData) => {
    return await prisma.events.create({
        data: eventData,
    });
};

const getEventById = async (eventId) => {
    return await prisma.events.findUnique({
        where: { id: eventId },
    });
};

const updateEvent = async (eventId, eventData) => {
    return await prisma.events.update({
        where: { id: eventId },
        data: eventData,
    });
};

const deleteEvent = async (eventId) => {
    return await prisma.events.delete({
        where: { id: eventId },
    });
};

const getAllEvents = async () => {
    return await prisma.events.findMany();
};

module.exports = {
    createEvent,
    getEventById,
    updateEvent,
    deleteEvent,
    getAllEvents,
};