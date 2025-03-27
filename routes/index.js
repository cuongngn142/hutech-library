const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { isLoggedIn } = require('../middleware/auth');

// Trang chủ
router.get('/', (req, res) => {
    res.render('index', {
        title: 'Trang chủ',
        user: req.session.user,
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg')
    });
});

// Danh sách sách
router.get('/sach', bookController.getBooksPage);

// Giỏ sách
router.get('/gio-sach', isLoggedIn, (req, res) => {
    res.redirect('/sach/cart');
});

router.post('/gio-sach/add', isLoggedIn, bookController.addToCart);
router.delete('/gio-sach/remove/:bookId', isLoggedIn, bookController.removeFromCart);
router.put('/gio-sach/update/:bookId', isLoggedIn, bookController.updateCartQuantity);

// Sách đang mượn
router.get('/my-borrows', isLoggedIn, (req, res) => {
    res.redirect('/sach/my-borrows');
});

// Hướng dẫn
router.get('/huong-dan', (req, res) => {
    res.render('huong-dan', {
        title: 'Hướng dẫn sử dụng',
        user: req.session.user,
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg')
    });
});

// Nội quy
router.get('/noi-quy', (req, res) => {
    res.render('noi-quy', {
        title: 'Nội quy thư viện',
        user: req.session.user,
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg')
    });
});

module.exports = router;
