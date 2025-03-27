const { poolPromise, sql } = require('../config/db');
const IndexModel = require('../models/indexModel');
const BookModel = require('../models/bookModel');

class IndexController {
    // Hiển thị trang chủ
    async getHomePage(req, res) {
        try {
            const [categories, locations] = await Promise.all([
                BookModel.getCategories(),
                BookModel.getLocations()
            ]);

            res.render('index', {
                title: 'Trang chủ',
                categories,
                locations
            });
        } catch (error) {
            console.error('Error in getHomePage:', error);
            req.flash('error_msg', 'Có lỗi xảy ra khi tải trang chủ.');
            res.redirect('/');
        }
    }

    // Hiển thị trang admin
    async getAdminPage(req, res) {
        try {
            const stats = await IndexModel.getAdminStats();
            const books = await BookModel.getBooks(1, 10);
            
            res.render('admin-dashboard', {
                title: 'Quản trị hệ thống',
                stats,
                books: books.books
            });
        } catch (error) {
            console.error('Error in getAdminPage:', error);
            req.flash('error_msg', 'Có lỗi xảy ra khi tải trang quản trị.');
            res.redirect('/');
        }
    }

    // Hiển thị trang giỏ sách
    async getCartPage(req, res) {
        try {
            if (!req.session.user) {
                req.flash('error_msg', 'Vui lòng đăng nhập để xem giỏ sách.');
                return res.redirect('/user/login');
            }

            const cartItems = await BookModel.getCartItems(req.session.user.MaTaiKhoan);
            res.render('gio-sach', {
                title: 'Giỏ sách',
                cartItems
            });
        } catch (error) {
            console.error('Error in getCartPage:', error);
            req.flash('error_msg', 'Có lỗi xảy ra khi tải giỏ sách.');
            res.redirect('/sach');
        }
    }

    // Hiển thị trang đăng ký thẻ thư viện
    getLibraryCardPage(req, res) {
        res.render('dky-the-thu-vien', { 
            title: 'Đăng ký thẻ thư viện - Thư viện HUTECH',
            user: req.session.user
        });
    }

    // Hiển thị trang đăng ký đọc online
    getOnlineReadingPage(req, res) {
        res.render('dky-doc-sach-online', { 
            title: 'Đăng ký đọc trực tuyến - Thư viện HUTECH',
            user: req.session.user
        });
    }

    // Hiển thị trang nội quy
    getRulesPage(req, res) {
        res.render('noi-quy', { 
            title: 'Nội quy thư viện - Thư viện HUTECH',
            user: req.session.user
        });
    }

    // Hiển thị trang sách
    async getBooksPage(req, res) {
        try {
            const search = req.query.search || '';
            const category = req.query.category || '';
            const location = req.query.location || '';
            const page = parseInt(req.query.page) || 1;

            const [booksData, categories, locations] = await Promise.all([
                BookModel.getBooks(page, 9, search, category, location),
                BookModel.getCategories(),
                BookModel.getLocations()
            ]);
            
            res.render('sach', {
                title: 'Danh sách sách',
                books: booksData.books,
                categories,
                locations,
                currentPage: page,
                totalPages: booksData.totalPages,
                search,
                selectedCategory: category,
                selectedLocation: location
            });
        } catch (error) {
            console.error('Error in getBooksPage:', error);
            req.flash('error_msg', 'Có lỗi xảy ra khi tải danh sách sách.');
            res.redirect('/');
        }
    }

    // Hiển thị trang hướng dẫn
    getGuidePage(req, res) {
        res.render('huong-dan', { 
            title: 'Hướng dẫn - Thư viện HUTECH',
            user: req.session.user,
            path: '/huong-dan'
        });
    }
}

module.exports = new IndexController();