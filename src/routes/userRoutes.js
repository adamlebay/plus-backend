const express = require('express');
const { getUserProfile, updateUserProfile } = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Route to get user profile
router.get('/profile', verifyToken, getUserProfile);

// Route to update user profile
router.put('/profile', verifyToken, updateUserProfile);

module.exports = router;