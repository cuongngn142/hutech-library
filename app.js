const express = require('express');
const session = require('express-session');
const path = require('path');
const flash = require('connect-flash');
const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Flash messages
app.use(flash());

// Set local variables for all views
app.use((req, res, next) => {
    res.locals.path = req.path;
    res.locals.search = req.query.search || '';
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.user = req.session.user;
    res.locals.categories = [];
    res.locals.locations = [];
    next();
});

// Routes
const userRoutes = require('./routes/user');
const bookRoutes = require('./routes/book');
const adminRoutes = require('./routes/admin');
const registrationRoutes = require('./routes/registration');

app.use('/', require('./routes/index'));
app.use('/user', userRoutes);
app.use('/sach', bookRoutes);
app.use('/admin', adminRoutes);
app.use('/', registrationRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', {
        title: 'Không tìm thấy trang',
        user: req.session.user
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    // Handle specific errors
    if (err.name === 'ValidationError') {
        return res.status(400).render('error', {
            title: 'Lỗi dữ liệu',
            message: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.',
            path: '/error'
        });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).render('error', {
            title: 'Không có quyền truy cập',
            message: 'Bạn cần đăng nhập để thực hiện thao tác này.',
            path: '/error'
        });
    }

    // Default error
    res.status(500).render('error', {
        title: 'Lỗi máy chủ',
        message: 'Có lỗi xảy ra. Vui lòng thử lại sau.',
        path: '/error'
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;