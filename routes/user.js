const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/authentication', userController.getAuthenticationUIPage);
router.post('/login', userController.postLoginRequest);
router.post('/register', userController.postRegisterRequest);
module.exports = router;