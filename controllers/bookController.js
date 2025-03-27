const BookModel = require('../models/bookModel');
const BorrowModel = require('../models/borrowModel');
const FineModel = require('../models/fineModel');
const multer = require('multer');
const upload = multer();
const { sql, poolPromise } = require('../config/db');
const db = require('../config/db');

class BookController {
    // Trang danh sách sách cho user
    async getBooksPage(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const search = req.query.search || '';
            const category = req.query.category || '';
            const location = req.query.location || '';

            const booksData = await BookModel.getBooks(page, 9, search, category, location);
            const [categories, locations] = await Promise.all([
                BookModel.getCategories(),
                BookModel.getLocations()
            ]);

            res.render('sach', {
                title: 'Danh sách sách',
                user: req.session.user,
                books: booksData.books,
                categories,
                locations,
                currentPage: booksData.currentPage,
                totalPages: booksData.totalPages,
                search,
                selectedCategory: category,
                selectedLocation: location,
                success_msg: req.flash('success_msg'),
                error_msg: req.flash('error_msg')
            });
        } catch (error) {
            console.error('Error in getBooksPage:', error);
            req.flash('error_msg', 'Có lỗi xảy ra khi tải trang');
            res.redirect('/');
        }
    }

    // Trang quản lý sách cho admin
    async getAdminBooksPage(req, res) {
        try {
            const books = await BookModel.getAllBooks();
            res.render('admin/books', {
                title: 'Quản lý sách',
                user: req.session.user,
                books,
                success_msg: req.flash('success_msg'),
                error_msg: req.flash('error_msg')
            });
        } catch (error) {
            console.error('Error in getAdminBooksPage:', error);
            req.flash('error_msg', 'Có lỗi xảy ra khi tải trang quản lý sách');
            res.redirect('/admin');
        }
    }

    // Trang thêm sách mới
    async getAddBookPage(req, res) {
        try {
            const [locations, categories] = await Promise.all([
                BookModel.getLocations(),
                BookModel.getCategories()
            ]);
            
            res.render('admin/add-book', {
                title: 'Thêm sách mới',
                user: req.session.user,
                locations,
                categories,
                success_msg: req.flash('success_msg'),
                error_msg: req.flash('error_msg')
            });
        } catch (error) {
            console.error('Error in getAddBookPage:', error);
            req.flash('error_msg', 'Có lỗi xảy ra khi tải trang');
            res.redirect('/admin/books');
        }
    }

    // Thêm sách mới
    async addBook(req, res) {
        try {
            console.log('Form Data:', req.body);
            const bookData = {
                tenSach: req.body.tenSach,
                tacGia: req.body.tacGia,
                namXuatBan: parseInt(req.body.namXuatBan),
                soLuong: parseInt(req.body.soLuong),
                maViTri: parseInt(req.body.maViTri),
                urlAnh: req.body.urlAnh || null,
                filePDF: req.body.filePDF || null,
                theLoai: req.body.theLoai
            };
            
            await BookModel.addBook(bookData);
            req.flash('success_msg', 'Thêm sách thành công');
            res.redirect('/admin/books');
        } catch (error) {
            console.error('Error in addBook:', error);
            req.flash('error_msg', error.message || 'Có lỗi xảy ra khi thêm sách');
            res.redirect('/admin/books/add');
        }
    }

    // Trang giỏ sách
    async getCartPage(req, res) {
        try {
            const userId = req.session.user.MaTaiKhoan;

            // Lấy MaSV từ userId
            const pool = await poolPromise;
            const userResult = await pool.request()
                .input('userId', sql.Int, userId)
                .query('SELECT MaSV FROM TaiKhoan WHERE MaTaiKhoan = @userId');

            if (!userResult.recordset[0]) {
                throw new Error('Không tìm thấy thông tin người dùng');
            }

            const maSV = userResult.recordset[0].MaSV;
            const cartItems = await BookModel.getCart(maSV);

            res.render('cart', {
                title: 'Giỏ sách',
                user: req.session.user,
                cart: cartItems,
                success_msg: req.flash('success_msg'),
                error_msg: req.flash('error_msg')
            });
        } catch (error) {
            console.error('Error in getCartPage:', error);
            req.flash('error_msg', 'Có lỗi xảy ra khi tải giỏ sách');
            res.redirect('/');
        }
    }

    // Thêm sách vào giỏ
    async addToCart(req, res) {
        try {
            const { bookId, quantity } = req.body;
            const userId = req.session.user.MaTaiKhoan;

            // Lấy MaSV từ userId
            const pool = await poolPromise;
            const userResult = await pool.request()
                .input('userId', sql.Int, userId)
                .query('SELECT MaSV FROM TaiKhoan WHERE MaTaiKhoan = @userId');

            if (!userResult.recordset[0]) {
                throw new Error('Không tìm thấy thông tin người dùng');
            }

            const maSV = userResult.recordset[0].MaSV;
            
            await BookModel.addToCart(maSV, bookId, parseInt(quantity));
            
            res.json({ 
                success: true, 
                message: 'Thêm sách vào giỏ thành công' 
            });
        } catch (error) {
            console.error('Error in addToCart:', error);
            res.status(400).json({ 
                success: false, 
                message: error.message || 'Có lỗi xảy ra khi thêm sách vào giỏ' 
            });
        }
    }

    // Cập nhật số lượng sách trong giỏ
    async updateCartQuantity(req, res) {
        try {
            const { quantity } = req.body;
            const bookId = parseInt(req.params.bookId);
            const userId = req.session.user.MaTaiKhoan;

            if (!quantity || quantity < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Số lượng sách không hợp lệ'
                });
            }

            // Kiểm tra user có tồn tại và lấy MaSV
            const pool = await poolPromise;
            const userResult = await pool.request()
                .input('userId', sql.Int, userId)
                .query('SELECT MaSV FROM TaiKhoan WHERE MaTaiKhoan = @userId');

            if (!userResult.recordset[0]) {
                return res.status(400).json({
                    success: false,
                    message: 'Không tìm thấy thông tin người dùng'
                });
            }

            const maSV = userResult.recordset[0].MaSV;

            // Cập nhật số lượng trong giỏ
            await BookModel.updateCartItem(maSV, bookId, parseInt(quantity));
            
            res.json({
                success: true,
                message: 'Cập nhật số lượng thành công'
            });
        } catch (error) {
            console.error('Error in updateCartQuantity:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Có lỗi xảy ra khi cập nhật số lượng'
            });
        }
    }

    // Xóa sách khỏi giỏ
    async removeFromCart(req, res) {
        try {
            const { bookId } = req.params;
            const userId = req.session.user.MaTaiKhoan;
            
            await BookModel.removeFromCart(userId, bookId);
            res.json({ success: true, message: 'Xóa sách khỏi giỏ thành công' });
        } catch (error) {
            console.error('Error in removeFromCart:', error);
            res.status(400).json({ 
                success: false, 
                message: error.message || 'Có lỗi xảy ra khi xóa sách khỏi giỏ' 
            });
        }
    }

    // Trang sách đang mượn
    async getMyBorrowsPage(req, res) {
        try {
            const userId = req.session.user.MaTaiKhoan;

            // Lấy MaSV từ userId
            const pool = await poolPromise;
            const userResult = await pool.request()
                .input('userId', sql.Int, userId)
                .query('SELECT MaSV FROM TaiKhoan WHERE MaTaiKhoan = @userId');

            if (!userResult.recordset[0]) {
                throw new Error('Không tìm thấy thông tin người dùng');
            }

            const maSV = userResult.recordset[0].MaSV;
            const borrows = await BookModel.getMyBorrows(maSV);

            res.render('my-borrows', {
                title: 'Sách đang mượn',
                user: req.session.user,
                borrows,
                success_msg: req.flash('success_msg'),
                error_msg: req.flash('error_msg')
            });
        } catch (error) {
            console.error('Error in getMyBorrowsPage:', error);
            req.flash('error_msg', 'Có lỗi xảy ra khi tải trang');
            res.redirect('/');
        }
    }

    // Trả sách
    async returnBook(req, res) {
        try {
            const { id } = req.params;
            const userId = req.session.user.MaTaiKhoan;

            // Lấy MaSV từ userId
            const pool = await poolPromise;
            const userResult = await pool.request()
                .input('userId', sql.Int, userId)
                .query('SELECT MaSV FROM TaiKhoan WHERE MaTaiKhoan = @userId');

            if (!userResult.recordset[0]) {
                return res.status(400).json({
                    success: false,
                    message: 'Không tìm thấy thông tin người dùng'
                });
            }

            const maSV = userResult.recordset[0].MaSV;

            // Kiểm tra và trả sách
            await BookModel.returnBook(id, maSV);

            res.json({
                success: true,
                message: 'Trả sách thành công'
            });
        } catch (error) {
            console.error('Error in returnBook:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Có lỗi xảy ra khi trả sách'
            });
        }
    }

    // Quản lý phiếu mượn (Admin)
    async getAdminBorrowsPage(req, res) {
        try {
            const borrows = await BookModel.getAllBorrows();
            res.render('admin/borrows', {
                title: 'Quản lý phiếu mượn',
                borrows,
                user: req.session.user
            });
        } catch (error) {
            console.error('Error getting admin borrows page:', error);
            req.flash('error_msg', 'Có lỗi xảy ra khi tải trang quản lý phiếu mượn.');
            res.redirect('/admin');
        }
    }

    async approveBorrow(req, res) {
        try {
            await BorrowModel.approveBorrow(req.params.id);
            req.flash('success_msg', 'Đã duyệt phiếu mượn!');
            res.redirect('/admin/borrows');
        } catch (error) {
            console.error('Error approving borrow:', error);
            req.flash('error_msg', 'Có lỗi xảy ra khi duyệt phiếu mượn.');
            res.redirect('/admin/borrows');
        }
    }

    async rejectBorrow(req, res) {
        try {
            await BorrowModel.rejectBorrow(req.params.id);
            req.flash('success_msg', 'Đã từ chối phiếu mượn!');
            res.redirect('/admin/borrows');
        } catch (error) {
            console.error('Error rejecting borrow:', error);
            req.flash('error_msg', 'Có lỗi xảy ra khi từ chối phiếu mượn.');
            res.redirect('/admin/borrows');
        }
    }

    // Quản lý phiếu phạt (Admin)
    async getAdminFinesPage(req, res) {
        try {
            const fines = await FineModel.getAllFines();
            res.render('admin/fines', {
                title: 'Quản lý phiếu phạt',
                fines,
                user: req.session.user
            });
        } catch (error) {
            console.error('Error getting admin fines page:', error);
            req.flash('error_msg', 'Có lỗi xảy ra khi tải trang quản lý phiếu phạt.');
            res.redirect('/admin');
        }
    }

    async createFine(req, res) {
        try {
            const { maPhieuMuon, soTien, lyDo } = req.body;
            await FineModel.createFine(maPhieuMuon, soTien, lyDo);
            req.flash('success_msg', 'Đã tạo phiếu phạt!');
            res.redirect('/admin/fines');
        } catch (error) {
            console.error('Error creating fine:', error);
            req.flash('error_msg', 'Có lỗi xảy ra khi tạo phiếu phạt.');
            res.redirect('/admin/fines');
        }
    }

    async updateFine(req, res) {
        try {
            const { soTien, lyDo, trangThai } = req.body;
            await FineModel.updateFine(req.params.id, soTien, lyDo, trangThai);
            req.flash('success_msg', 'Đã cập nhật phiếu phạt!');
            res.redirect('/admin/fines');
        } catch (error) {
            console.error('Error updating fine:', error);
            req.flash('error_msg', 'Có lỗi xảy ra khi cập nhật phiếu phạt.');
            res.redirect('/admin/fines');
        }
    }

    async getEditBookPage(req, res) {
        try {
            const [book, locations, categories] = await Promise.all([
                BookModel.getBookById(req.params.id),
                BookModel.getLocations(),
                BookModel.getCategories()
            ]);
            
            res.render('admin/edit-book', {
                title: 'Chỉnh sửa sách',
                user: req.session.user,
                book,
                locations,
                categories,
                success_msg: req.flash('success_msg'),
                error_msg: req.flash('error_msg')
            });
        } catch (error) {
            console.error('Error in getEditBookPage:', error);
            req.flash('error_msg', 'Có lỗi xảy ra khi tải trang');
            res.redirect('/admin/books');
        }
    }

    async updateBook(req, res) {
        try {
            const { id } = req.params;
            const bookData = req.body;
            await BookModel.updateBook(id, bookData);
            req.flash('success_msg', 'Cập nhật sách thành công');
            res.redirect('/admin/books');
        } catch (error) {
            console.error('Error in updateBook:', error);
            req.flash('error_msg', 'Có lỗi xảy ra khi cập nhật sách');
            res.redirect(`/admin/books/edit/${req.params.id}`);
        }
    }

    async deleteBook(req, res) {
        try {
            await BookModel.deleteBook(req.params.id);
            req.flash('success_msg', 'Xóa sách thành công');
            res.redirect('/admin/books');
        } catch (error) {
            console.error('Error in deleteBook:', error);
            req.flash('error_msg', 'Có lỗi xảy ra khi xóa sách');
            res.redirect('/admin/books');
        }
    }

    async borrowBook(req, res) {
        try {
            const { id } = req.params;
            const borrowData = req.body;
            await BookModel.borrowBook(id, req.session.user.MaSV, borrowData);
            req.flash('success_msg', 'Gửi yêu cầu mượn sách thành công');
            res.redirect('/sach');
        } catch (error) {
            console.error('Error in borrowBook:', error);
            req.flash('error_msg', 'Có lỗi xảy ra khi mượn sách');
            res.redirect('/sach');
        }
    }

    // Mượn sách từ giỏ
    async borrowFromCart(req, res) {
        try {
            const { ngayTraDuKien } = req.body;
            const userId = req.session.user.MaTaiKhoan;

            // Lấy MaSV từ userId
            const pool = await poolPromise;
            const userResult = await pool.request()
                .input('userId', sql.Int, userId)
                .query('SELECT MaSV FROM TaiKhoan WHERE MaTaiKhoan = @userId');

            if (!userResult.recordset[0]) {
                return res.status(400).json({
                    success: false,
                    message: 'Không tìm thấy thông tin người dùng'
                });
            }

            const maSV = userResult.recordset[0].MaSV;

            // Lấy danh sách sách trong giỏ
            const cartItems = await BookModel.getCart(maSV);
            if (!cartItems || cartItems.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Giỏ sách trống'
                });
            }

            // Kiểm tra ngày trả dự kiến
            const ngayMuon = new Date();
            const ngayTra = new Date(ngayTraDuKien);
            const soNgayMuon = Math.ceil((ngayTra - ngayMuon) / (1000 * 60 * 60 * 24));
            
            if (soNgayMuon <= 0 || soNgayMuon > 30) {
                return res.status(400).json({
                    success: false,
                    message: 'Ngày trả dự kiến không hợp lệ (tối đa 30 ngày)'
                });
            }

            // Mượn sách
            await BookModel.borrowFromCart(maSV, ngayTraDuKien);

            // Xóa sách khỏi giỏ
            await BookModel.clearCart(maSV);

            res.json({
                success: true,
                message: 'Mượn sách thành công'
            });
        } catch (error) {
            console.error('Error in borrowFromCart:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Có lỗi xảy ra khi mượn sách'
            });
        }
    }

    // Trang phiếu phạt
    async getMyFinesPage(req, res) {
        try {
            const userId = req.session.user.MaTaiKhoan;

            // Lấy MaSV từ userId
            const pool = await poolPromise;
            const userResult = await pool.request()
                .input('userId', sql.Int, userId)
                .query('SELECT MaSV FROM TaiKhoan WHERE MaTaiKhoan = @userId');

            if (!userResult.recordset[0]) {
                throw new Error('Không tìm thấy thông tin người dùng');
            }

            const maSV = userResult.recordset[0].MaSV;
            const fines = await BookModel.getMyFines(maSV);

            res.render('my-fines', {
                title: 'Phiếu phạt',
                user: req.session.user,
                fines,
                success_msg: req.flash('success_msg'),
                error_msg: req.flash('error_msg')
            });
        } catch (error) {
            console.error('Error in getMyFinesPage:', error);
            req.flash('error_msg', 'Có lỗi xảy ra khi tải trang');
            res.redirect('/');
        }
    }

    // Trang chủ
    async getHomePage(req, res) {
        try {
            const maSV = req.user ? req.user.MaSV : null;
            let dashboardData = {};
            
            if (maSV) {
                dashboardData = await BookModel.getUserDashboardStats(maSV);
            }

            res.render('index', {
                title: 'Trang chủ - Thư viện HUTECH',
                user: req.user,
                ...dashboardData
            });
        } catch (error) {
            console.error('Error in getHomePage:', error);
            req.flash('error', 'Có lỗi xảy ra khi tải trang chủ');
            res.redirect('/');
        }
    }
}

module.exports = new BookController(); 