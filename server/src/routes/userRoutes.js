const express = require('express');
const {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { registerLimiter } = require('../middleware/authRateLimiter');
const { validate } = require('../middleware/validate');
const { createUserSchema, updateUserSchema } = require('../validation/userSchemas');

const router = express.Router();

router.post('/', registerLimiter, validate(createUserSchema), createUser);

router.use(authenticate, authorize('admin'));

router.get('/', listUsers);
router.get('/:userId', getUser);
router.put('/:userId', validate(updateUserSchema), updateUser);
router.delete('/:userId', deleteUser);

module.exports = router;
