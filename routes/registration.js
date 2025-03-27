const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { isLoggedIn } = require('../middleware/auth');

// Trang đăng ký thẻ thư viện
router.get('/dky-the-thu-vien', isLoggedIn, registrationController.getLibraryCardPage);

// Trang đăng ký đọc sách online
router.get('/dky-doc-sach-online', isLoggedIn, registrationController.getOnlineReadingPage);

module.exports = router; 