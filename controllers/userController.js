
exports.getAuthenticationUIPage = (req, res) => {
    res.render('authentication');
};  

exports.postLoginRequest = (req, res) => {
    const { username, password } = req.body;

    if (username === "admin@gmail.com" && password === "123456") {
        // Trả về JSON thay vì plain text để frontend dễ xử lý
        res.json({ success: true, message: "Đăng nhập thành công!" });
    } else {
        res.json({ success: false, message: "Sai tên đăng nhập hoặc mật khẩu!" });
    }
};

exports.postRegisterRequest = (req, res) => {
    const { username, email, password, confirm_password } = req.body;
    if (password !== confirm_password) {
        res.send("Mật khẩu nhập lại không khớp!");
    } else {
        res.send("Đăng ký thành công!");
    }
};