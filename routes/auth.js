const express = require('express');
const router = express.Router();
const { sendOTPEmail } = require('../emailService');

const users = []; // Replace with DB in production
const otps = {};  // { email: otp }

router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    // ...save user logic...
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otps[email] = otp;
    await sendOTPEmail(email, otp);
    res.json({ message: 'OTP sent', email });
});

router.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (otps[email] && otps[email] === otp) {
        // ...mark user as verified...
        delete otps[email];
        return res.json({ success: true });
    }
    res.status(400).json({ success: false, message: 'Invalid OTP' });
});

module.exports = router;
