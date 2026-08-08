const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    subtask: { type: mongoose.Schema.Types.ObjectId, ref: 'Subtask', default: null },

    message: { type: String, required: true, maxlength: 240 },
    remindAt: { type: Date, required: true, index: true },

    sent: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    kind: { type: String, enum: ['reminder', 'due', 'streak', 'system'], default: 'reminder' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reminder', reminderSchema);
