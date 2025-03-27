// Middleware kiểm tra đăng nhập
const isLoggedIn = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    req.flash('error_msg', 'Vui lòng đăng nhập để tiếp tục.');
    res.redirect('/user/login');
};

// Middleware kiểm tra quyền admin
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.MaVaiTro === 1) {
        return next();
    }
    req.flash('error_msg', 'Bạn không có quyền truy cập trang này.');
    res.redirect('/');
};

module.exports = {
    isLoggedIn,
    isAdmin
}; 