exports.getHomePage = (req, res) => {
    res.render('index', { title: 'Thư Viện Trường Đại Học Hutech' });
};

exports.getDkyTheThuVienPage = (req, res) => {
    res.render('dky-the-thu-vien');
}

exports.getDkyDocOnlinePage = (req, res) => {
    res.render('dky-doc-sach-online');
}

exports.getNoiQuyPage = (req, res) => {
    res.render('noi-quy');
}

exports.getAdminPage = (req, res) => {
    res.render('admin-dashboard');
}

exports.getShoppingCartPage = (req, res) => {
    res.render('gio-sach');
}