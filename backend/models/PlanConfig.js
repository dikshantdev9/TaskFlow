const mongoose = require('mongoose');

const planConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, enum: ['monthly', 'quarterly', 'yearly'] },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    days: { type: Number, required: true },
    badge: { type: String, default: '' },
    description: { type: String, default: '' },
    equivalentText: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const DEFAULT_PLANS = [
  {
    key: 'monthly',
    name: 'Monthly Pro',
    price: 299,
    days: 30,
    badge: 'Flexible',
    description: 'Month-to-month full power access.',
    equivalentText: '₹299 / month',
    active: true,
  },
  {
    key: 'quarterly',
    name: 'Quarterly Pro',
    price: 699,
    days: 90,
    badge: 'Popular • Save 22%',
    description: '3 Months sprint for focused achievers.',
    equivalentText: '₹233 / month equivalent',
    active: true,
  },
  {
    key: 'yearly',
    name: 'Yearly Pro',
    price: 1999,
    days: 365,
    badge: 'Best Value • Save 45%',
    description: '12 full months of uninterrupted growth.',
    equivalentText: 'Just ₹166 / month',
    active: true,
  },
];

planConfigSchema.statics.getOrSeedPlans = async function () {
  let count = await this.countDocuments();
  if (count === 0) {
    await this.insertMany(DEFAULT_PLANS);
  }
  return this.find().sort({ days: 1 });
};

module.exports = mongoose.model('PlanConfig', planConfigSchema);
