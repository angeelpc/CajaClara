const express = require('express');
const { register, login, profile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validateRequest = require('../middleware/validate');
const { registerRules, loginRules } = require('../validators/authValidators');

const router = express.Router();

router.post('/register', registerRules, validateRequest, register);
router.post('/login', loginRules, validateRequest, login);
router.get('/me', protect, profile);

module.exports = router;
