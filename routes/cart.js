const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { isAuthenticated } = require('../middleware/auth');

// Cart routes
router.get('/', isAuthenticated, cartController.getCartPage);
router.post('/add', isAuthenticated, cartController.addToCart);
router.delete('/:bookId', isAuthenticated, cartController.removeFromCart);
router.put('/:bookId/quantity', isAuthenticated, cartController.updateCartQuantity);

module.exports = router; 