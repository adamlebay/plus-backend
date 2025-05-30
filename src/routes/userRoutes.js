const express = require('express');
const { getUser, getUserProfile, updateUserProfile } = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

console.log({ getUser, getUserProfile, updateUserProfile });

// Route to get the logged-in user's profile
router.get('/me', verifyToken, getUserProfile);

// Route to update the logged-in user's profile
router.put('/me', verifyToken, updateUserProfile);

// Route to get a user by ID
router.get('/:id', getUser);

module.exports = router;