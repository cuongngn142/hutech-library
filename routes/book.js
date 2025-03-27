const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { isLoggedIn } = require('../middleware/auth');

// Danh sách sách
router.get('/', isLoggedIn, bookController.getBooksPage);
// Mượn sách
router.post('/borrow/:id', isLoggedIn, bookController.borrowBook);

// Giỏ sách
router.get('/cart', isLoggedIn, bookController.getCartPage);
router.post('/cart/add', isLoggedIn, bookController.addToCart);
router.put('/cart/:bookId/quantity', isLoggedIn, bookController.updateCartQuantity);
router.delete('/cart/:bookId', isLoggedIn, bookController.removeFromCart);
router.post('/borrow', isLoggedIn, bookController.borrowFromCart);

// Sách đang mượn
router.get('/my-borrows', isLoggedIn, bookController.getMyBorrowsPage);

// Phiếu phạt
router.get('/my-fines', isLoggedIn, bookController.getMyFinesPage);

module.exports = router; 
