const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Sign-up + 5-digit email verification
router.post('/register', authController.register);
router.post('/verify-pin', authController.verifyPin);
router.post('/resend-pin', authController.resendPin);

// Password reset workflow
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;