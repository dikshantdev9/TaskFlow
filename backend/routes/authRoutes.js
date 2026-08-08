const router = require('express').Router();
const { signup, login, me, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, me);

module.exports = router;
