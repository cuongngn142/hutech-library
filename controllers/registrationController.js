// Hiển thị trang đăng ký thẻ thư viện
exports.getLibraryCardPage = (req, res) => {
    res.render('dky-the-thu-vien', {
        title: 'Đăng ký thẻ thư viện',
        user: req.session.user,
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg')
    });
};

// Hiển thị trang đăng ký đọc sách online
exports.getOnlineReadingPage = (req, res) => {
    res.render('dky-doc-sach-online', {
        title: 'Đăng ký đọc sách online',
        user: req.session.user,
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg')
    });
}; 