const express = require('express');
const { listInvites, createInvite, revokeInvite } = require('../controllers/adminInviteController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/', listInvites);
router.post('/', createInvite);
router.delete('/:inviteId', revokeInvite);

module.exports = router;
