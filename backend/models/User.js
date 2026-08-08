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
    password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
    avatarColor: { type: String, default: '#0F7A52' },
    bio: { type: String, default: '', maxlength: 240 },
    timezone: { type: String, default: 'Asia/Kolkata' },

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
