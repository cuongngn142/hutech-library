const BookModel = require('../models/bookModel');

class CartController {
    async getCartPage(req, res) {
        try {
            const cart = req.session.cart || [];
            const books = await BookModel.getBooksByIds(cart.map(item => item.MaSach));
            
            // Kết hợp thông tin sách với số lượng trong giỏ
            const cartItems = books.map(book => ({
                ...book,
                SoLuong: cart.find(item => item.MaSach === book.MaSach)?.SoLuong || 0
            }));

            res.render('cart', {
                title: 'Giỏ sách',
                cart: cartItems,
                user: req.session.user
            });
        } catch (error) {
            console.error('Error getting cart page:', error);
            req.flash('error_msg', 'Có lỗi xảy ra khi tải trang giỏ sách.');
            res.redirect('/');
        }
    }

    async addToCart(req, res) {
        try {
            const { maSach, soLuong } = req.body;
            
            // Kiểm tra sách có tồn tại không
            const book = await BookModel.getBookById(maSach);
            if (!book) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy sách.' });
            }

            // Kiểm tra số lượng tồn kho
            if (book.SoLuongTon < soLuong) {
                return res.status(400).json({ success: false, message: 'Số lượng sách trong kho không đủ.' });
            }

            // Khởi tạo giỏ hàng nếu chưa có
            if (!req.session.cart) {
                req.session.cart = [];
            }

            // Kiểm tra sách đã có trong giỏ chưa
            const existingItem = req.session.cart.find(item => item.MaSach === maSach);
            if (existingItem) {
                existingItem.SoLuong += soLuong;
            } else {
                req.session.cart.push({ MaSach: maSach, SoLuong: soLuong });
            }

            res.json({ success: true, message: 'Đã thêm sách vào giỏ.' });
        } catch (error) {
            console.error('Error adding to cart:', error);
            res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi thêm sách vào giỏ.' });
        }
    }

    async removeFromCart(req, res) {
        try {
            const { bookId } = req.params;
            
            if (!req.session.cart) {
                return res.status(404).json({ success: false, message: 'Giỏ sách trống.' });
            }

            req.session.cart = req.session.cart.filter(item => item.MaSach !== parseInt(bookId));
            res.json({ success: true, message: 'Đã xóa sách khỏi giỏ.' });
        } catch (error) {
            console.error('Error removing from cart:', error);
            res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi xóa sách khỏi giỏ.' });
        }
    }

    async updateCartQuantity(req, res) {
        try {
            const { bookId } = req.params;
            const { quantity } = req.body;

            if (!req.session.cart) {
                return res.status(404).json({ success: false, message: 'Giỏ sách trống.' });
            }

            const item = req.session.cart.find(item => item.MaSach === parseInt(bookId));
            if (!item) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy sách trong giỏ.' });
            }

            // Kiểm tra số lượng tồn kho
            const book = await BookModel.getBookById(bookId);
            if (book.SoLuongTon < quantity) {
                return res.status(400).json({ success: false, message: 'Số lượng sách trong kho không đủ.' });
            }

            item.SoLuong = quantity;
            res.json({ success: true, message: 'Đã cập nhật số lượng sách.' });
        } catch (error) {
            console.error('Error updating cart quantity:', error);
            res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi cập nhật số lượng sách.' });
        }
    }
}

module.exports = new CartController(); 