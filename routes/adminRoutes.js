const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Admin login route
router.post('/admin-login', adminController.login);

// Admin dashboard route
router.get('/dashboard', adminController.dashboard);

// Delete user route
router.delete('/users/:id', adminController.deleteUser);

// Update user details route
router.put('/users/:id', adminController.updateUserDetails);

router.get('/logout', adminController.logout);

module.exports = router;
