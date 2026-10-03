const router = require('express').Router();
const {
  adminLogin,
  getOverview,
  getAdminMe,
  approveSubscription,
  rejectSubscription,
  setUserPlan,
  getAdminPlans,
  updateAdminPlan,
  deleteUser,
} = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

// Public admin login endpoint
router.post('/login', adminLogin);

// Protected admin endpoints
router.use(protect);
router.use(requireAdmin);

router.get('/me', getAdminMe);
router.get('/overview', getOverview);
router.post('/approve-subscription', approveSubscription);
router.post('/reject-subscription', rejectSubscription);
router.post('/set-plan', setUserPlan);
router.get('/plans', getAdminPlans);
router.put('/plans/:key', updateAdminPlan);
router.delete('/users/:userId', deleteUser);

module.exports = router;
