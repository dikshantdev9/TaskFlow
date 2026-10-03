const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 60 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
    avatarColor: { type: String, default: '#0F7A52' },
    bio: { type: String, default: '', maxlength: 240 },
    timezone: { type: String, default: 'Asia/Kolkata' },

    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    loginCount: { type: Number, default: 0 },
    lastLogin: { type: Date, default: null },

    // Subscription & Pro Status
    plan: { type: String, enum: ['free', 'pro', 'team'], default: 'free' },
    isPro: { type: Boolean, default: false },
    subscription: {
      status: { type: String, enum: ['inactive', 'active', 'pending_approval', 'expired'], default: 'inactive' },
      plan: { type: String, default: 'free' },
      billingCycle: { type: String, enum: ['monthly', 'quarterly', 'yearly', 'lifetime'], default: 'monthly' },
      transactionId: { type: String, default: null },
      amount: { type: Number, default: 0 },
      requestedAt: { type: Date, default: null },
      approvedAt: { type: Date, default: null },
      expiresAt: { type: Date, default: null },
    },

    // Productivity streak
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActiveDate: { type: String, default: null }, // 'YYYY-MM-DD'
    },

    // Per-user preferences
    settings: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      accent: { type: String, default: 'emerald' },
      weekStart: { type: String, enum: ['sun', 'mon'], default: 'mon' },
      notifications: {
        dueSoon: { type: Boolean, default: true },
        dailyDigest: { type: Boolean, default: true },
        streakReminder: { type: Boolean, default: true },
        phoneAlerts: { type: Boolean, default: true },
        pendingTaskSms: { type: Boolean, default: true },
      },
      compactMode: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// Hash the password whenever it is set or changed (async hook — no `next` needed)
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function matchPassword(entered) {
  return bcrypt.compare(entered, this.password);
};

userSchema.methods.toPublic = function toPublic() {
  const o = this.toObject();
  delete o.password;
  return o;
};

module.exports = mongoose.model('User', userSchema);
