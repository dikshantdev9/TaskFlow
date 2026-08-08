const mongoose = require('mongoose');

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const taskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    title: { type: String, required: [true, 'Task title is required'], trim: true, maxlength: 140 },
    description: { type: String, default: '', maxlength: 2000 },
    notes: { type: String, default: '', maxlength: 5000 },

    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    tags: { type: [String], default: [] },

    priority: { type: String, enum: PRIORITIES, default: 'medium', index: true },

    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null },

    // Cached progress — recomputed by utils/calculateProgress.js on every subtask change
    progress: { type: Number, default: 0, min: 0, max: 100 },
    subtaskCount: { type: Number, default: 0 },
    completedCount: { type: Number, default: 0 },

    status: { type: String, enum: ['active', 'completed'], default: 'active', index: true },
    completedAt: { type: Date, default: null },

    pinned: { type: Boolean, default: false },
    color: { type: String, default: '#0F7A52' },

    // Soft delete (Trash + restore)
    deleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

taskSchema.index({ user: 1, deleted: 1, status: 1 });
taskSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Task', taskSchema);
module.exports.PRIORITIES = PRIORITIES;
