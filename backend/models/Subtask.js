const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    title: { type: String, required: [true, 'Subtask title is required'], trim: true, maxlength: 160 },
    notes: { type: String, default: '', maxlength: 1000 },

    // The date this piece of work is scheduled for — the heart of TaskFlow
    date: { type: Date, required: [true, 'Subtask date is required'], index: true },

    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },

    order: { type: Number, default: 0 },
    estimateMinutes: { type: Number, default: null },
  },
  { timestamps: true }
);

subtaskSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model('Subtask', subtaskSchema);
