const User = require('../models/User');
const PlanConfig = require('../models/PlanConfig');
const { asyncHandler } = require('../middleware/errorMiddleware');

// @route   GET /api/billing/plans
// @desc    Get dynamic public plans and pricing
exports.getPublicPlans = asyncHandler(async (req, res) => {
  const plans = await PlanConfig.getOrSeedPlans();
  res.json({
    success: true,
    plans: plans.filter((p) => p.active),
  });
});

// @route   GET /api/billing/plan
// @desc    Get current user subscription and plan status
exports.getPlanStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  // Check if expired
  if (user.subscription && user.subscription.expiresAt && new Date() > new Date(user.subscription.expiresAt)) {
    user.isPro = false;
    user.plan = 'free';
    user.subscription.status = 'expired';
    await user.save();
  }

  res.json({
    success: true,
    data: {
      plan: user.plan || 'free',
      isPro: !!user.isPro,
      subscription: user.subscription || {},
      limits: {
        maxTasks: user.isPro ? Infinity : 15,
        maxSubtasksPerTask: user.isPro ? Infinity : 10,
        aiBreakdown: !!user.isPro,
        advancedAnalytics: !!user.isPro,
        proThemes: !!user.isPro,
        exportFormats: user.isPro ? ['json', 'csv', 'pdf'] : ['json'],
      },
    },
  });
});

// @route   POST /api/billing/submit-payment
// @desc    Submit Razorpay / UPI Transaction Reference (UTR) for Approval
exports.submitPayment = asyncHandler(async (req, res) => {
  const { plan = 'pro', billingCycle = 'monthly', transactionId, amount } = req.body;

  if (!transactionId || String(transactionId).trim().length < 4) {
    res.status(400);
    throw new Error('Please enter a valid Transaction / UTR reference number.');
  }

  const user = await User.findById(req.user._id);
  const cycle = ['monthly', 'quarterly', 'yearly'].includes(billingCycle) ? billingCycle : 'monthly';
  
  const planDoc = await PlanConfig.findOne({ key: cycle });
  const finalPrice = Number(amount) || (planDoc ? planDoc.price : 299);

  user.subscription = {
    status: 'pending_approval',
    plan: plan || 'pro',
    billingCycle: cycle,
    transactionId: String(transactionId).trim(),
    amount: finalPrice,
    requestedAt: new Date(),
    approvedAt: null,
    expiresAt: null,
  };

  await user.save();

  res.json({
    success: true,
    message: 'Payment verification submitted! Your Pro access will be activated upon confirmation.',
    subscription: user.subscription,
  });
});

// @route   POST /api/billing/instant-upgrade
// @desc    Instant Upgrade Toggle (for testing or direct admin approval)
exports.instantUpgrade = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { plan = 'pro', billingCycle = 'monthly' } = req.body;

  const cycle = ['monthly', 'quarterly', 'yearly'].includes(billingCycle) ? billingCycle : 'monthly';
  const planDoc = await PlanConfig.findOne({ key: cycle });
  const days = planDoc ? planDoc.days : 30;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  user.isPro = true;
  user.plan = plan;
  user.subscription = {
    status: 'active',
    plan,
    billingCycle: cycle,
    transactionId: 'DEMO_ACTIVATION_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
    amount: planDoc ? planDoc.price : 299,
    requestedAt: new Date(),
    approvedAt: new Date(),
    expiresAt,
  };

  await user.save();

  res.json({
    success: true,
    message: '🎉 Congratulations! TaskFlow Pro has been activated.',
    user: user.toPublic(),
  });
});

// @route   POST /api/billing/ai-breakdown
// @desc    AI-Powered Subtask Generator (Gated to Pro users)
exports.aiTaskBreakdown = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user.isPro && user.role !== 'admin') {
    res.status(403);
    throw new Error('AI Task Breakdown is a TaskFlow Pro exclusive feature. Please upgrade to unlock.');
  }

  const { title, description = '', targetDays = 7 } = req.body;
  if (!title) {
    res.status(400);
    throw new Error('Task title is required to generate breakdown');
  }

  const generatedSubtasks = generateSmartBreakdown(title, description, targetDays);

  res.json({
    success: true,
    subtasks: generatedSubtasks,
  });
});

/** Smart algorithmic subtask synthesizer */
function generateSmartBreakdown(title, description, days = 7) {
  const cleanTitle = title.trim();
  const lower = cleanTitle.toLowerCase();
  const span = Math.max(3, Math.min(14, Number(days) || 7));

  const stages = [
    { prefix: 'Step 1: Planning & Scope', action: 'Define requirements, research prerequisites, and set key milestone criteria for ' + cleanTitle },
    { prefix: 'Step 2: Architecture & Setup', action: 'Set up core environment, configure dependencies, and outline initial draft' },
    { prefix: 'Step 3: Core Implementation (Part 1)', action: 'Build the fundamental modules and primary workflows' },
    { prefix: 'Step 4: Core Implementation (Part 2)', action: 'Develop secondary features, edge-case handlers, and UI integrations' },
    { prefix: 'Step 5: Testing & Refinement', action: 'Perform thorough debugging, validation, and performance optimization' },
    { prefix: 'Step 6: Review & Final Delivery', action: 'Finalize documentation, run final checklist, and complete milestone for ' + cleanTitle },
  ];

  // Specific domain detection
  if (lower.includes('learn') || lower.includes('study') || lower.includes('course')) {
    stages[0].action = 'Research syllabus, gather learning resources, and establish daily study schedule';
    stages[1].action = 'Master foundational concepts and core syntax';
    stages[2].action = 'Complete practice exercises and solve hands-on problems';
    stages[3].action = 'Build a mini practice project applying new knowledge';
    stages[4].action = 'Review key topics and take a self-assessment quiz';
    stages[5].action = 'Complete final comprehensive project review';
  } else if (lower.includes('build') || lower.includes('app') || lower.includes('website') || lower.includes('project')) {
    stages[0].action = 'Create wireframes, schema diagrams, and project roadmap';
    stages[1].action = 'Initialize repository, project structure, and component architecture';
    stages[2].action = 'Implement primary user flows and backend endpoints';
    stages[3].action = 'Style frontend with responsive design and interactive feedback';
    stages[4].action = 'Conduct cross-browser testing and fix UI quirks';
    stages[5].action = 'Deploy project to production and verify live release';
  }

  return stages.map((s, idx) => {
    const dayOffset = Math.round((idx / (stages.length - 1)) * (span - 1));
    return {
      title: `${s.prefix} — ${s.action}`,
      dayOffset,
    };
  });
}
