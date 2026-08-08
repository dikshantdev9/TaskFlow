const router = require('express').Router();
const c = require('../controllers/subtaskController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/task/:taskId', c.getSubtasks);
router.post('/', c.createSubtask);
router.post('/bulk', c.createSubtasksBulk);
router.put('/:id', c.updateSubtask);
router.patch('/:id/toggle', c.toggleSubtask);
router.delete('/:id', c.deleteSubtask);

module.exports = router;
