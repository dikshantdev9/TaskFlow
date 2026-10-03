const router = require('express').Router();
const {
  getPublicPlans,
  getPlanStatus,
  submitPayment,
  instantUpgrade,
  aiTaskBreakdown,
} = require('../controllers/billingController');
const { protect } = require('../middleware/authMiddleware');

// Public route to view plans
router.get('/plans', getPublicPlans);

router.use(protect);

router.get('/plan', getPlanStatus);
router.post('/submit-payment', submitPayment);
router.post('/instant-upgrade', instantUpgrade);
router.post('/ai-breakdown', aiTaskBreakdown);

module.exports = router;
