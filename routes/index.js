const express = require('express');
const router = express.Router();
const indexController = require('../controllers/indexController');

router.get('/', indexController.getHomePage);
router.get('/dky-the-thu-vien', indexController.getDkyTheThuVienPage);
router.get('/dky-doc-sach-online', indexController.getDkyDocOnlinePage);
router.get('/noi-quy', indexController.getNoiQuyPage);
router.get('/admin', indexController.getAdminPage);
router.get('/gio-sach', indexController.getShoppingCartPage);
module.exports = router;
