const router = require('express').Router();
const c = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/profile').get(c.getProfile).put(c.updateProfile);
router.put('/password', c.changePassword);
router.put('/settings', c.updateSettings);
router.get('/export', c.exportData);
router.delete('/account', c.deleteAccount);

module.exports = router;
