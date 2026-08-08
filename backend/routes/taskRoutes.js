const router = require('express').Router();
const c = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // every task route is private and user-scoped

// stats
router.get('/stats/overview', c.getStats);
router.get('/stats/analytics', c.getAnalytics);
router.get('/stats/calendar', c.getCalendar);

// categories / tags / reminders
router.route('/meta/categories').get(c.getCategories).post(c.createCategory);
router.delete('/meta/categories/:id', c.deleteCategory);
router.get('/meta/tags', c.getTags);
router.route('/meta/reminders').get(c.getReminders).post(c.createReminder);

// trash
router.delete('/trash/empty', c.emptyTrash);

// tasks
router.route('/').get(c.getTasks).post(c.createTask);
router.route('/:id').get(c.getTask).put(c.updateTask).delete(c.deleteTask);
router.patch('/:id/pin', c.togglePin);
router.patch('/:id/restore', c.restoreTask);
router.delete('/:id/permanent', c.destroyTask);

module.exports = router;
