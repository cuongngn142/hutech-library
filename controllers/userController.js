const UserModel = require('../models/userModel');
const bcrypt = require('bcryptjs');

class UserController {
    // Hiển thị trang đăng nhập
    async getLoginPage(req, res) {
        try {
            res.render('user/login', {
                title: 'Đăng nhập',
                error: req.flash('error_msg')
            });
        } catch (error) {
            console.error('Error rendering login page:', error);
            res.status(500).render('error', {
                title: 'Lỗi',
                message: 'Có lỗi xảy ra khi tải trang đăng nhập.'
            });
        }
    }

    // Hiển thị trang đăng ký
    async getRegisterPage(req, res) {
        try {
            res.render('user/register', {
                title: 'Đăng ký',
                error: req.flash('error_msg')
            });
        } catch (error) {
            console.error('Error rendering register page:', error);
            res.status(500).render('error', {
                title: 'Lỗi',
                message: 'Có lỗi xảy ra khi tải trang đăng ký.'
            });
        }
    }

    // Xử lý đăng ký
    async register(req, res) {
        try {
            const { maSV, tenDangNhap, matKhau, maVaiTro } = req.body;

            // Kiểm tra dữ liệu đầu vào
            if (!maSV || !tenDangNhap || !matKhau || !maVaiTro) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng nhập đầy đủ thông tin.'
                });
            }

            // Kiểm tra định dạng mã sinh viên
            if (!/^\d{10}$/.test(maSV)) {
                return res.status(400).json({
                    success: false,
                    message: 'Mã sinh viên phải có 10 chữ số.'
                });
            }

            // Kiểm tra độ dài tên đăng nhập
            if (tenDangNhap.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Tên đăng nhập phải có ít nhất 6 ký tự.'
                });
            }

            // Kiểm tra độ dài mật khẩu
            if (matKhau.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'Mật khẩu phải có ít nhất 8 ký tự.'
                });
            }

            // Kiểm tra role hợp lệ
            if (maVaiTro !== 1 && maVaiTro !== 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Vai trò không hợp lệ.'
                });
            }

            // Kiểm tra sinh viên có tồn tại không
            const studentExists = await UserModel.checkStudentExists(maSV);
            if (!studentExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Mã sinh viên không tồn tại trong hệ thống.'
                });
            }

            // Kiểm tra sinh viên đã có tài khoản chưa
            const hasAccount = await UserModel.checkStudentHasAccount(maSV);
            if (hasAccount) {
                return res.status(400).json({
                    success: false,
                    message: 'Sinh viên này đã có tài khoản.'
                });
            }

            // Kiểm tra tên đăng nhập đã tồn tại
            const usernameExists = await UserModel.checkUsernameExists(tenDangNhap);
            if (usernameExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Tên đăng nhập đã được sử dụng.'
                });
            }

            // Đăng ký tài khoản mới
            await UserModel.register({
                maSV,
                tenDangNhap,
                matKhau,
                maVaiTro
            });
            
            res.json({
                success: true,
                message: 'Đăng ký thành công!'
            });
        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.'
            });
        }
    }

    // Xử lý đăng nhập
    async login(req, res) {
        try {
            const { username, password } = req.body;
            
            // Kiểm tra dữ liệu đầu vào
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng nhập đầy đủ thông tin.'
                });
            }

            // Kiểm tra đăng nhập
            const user = await UserModel.login(username, password);
            
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'Tên đăng nhập hoặc mật khẩu không chính xác.'
                });
            }

            // Lưu thông tin user vào session
            req.session.user = {
                MaTaiKhoan: user.MaTaiKhoan,
                TenDangNhap: user.TenDangNhap,
                MaVaiTro: user.MaVaiTro,
                MaSV: user.MaSV
            };

            // Trả về response JSON cho AJAX request
            res.json({
                success: true,
                message: 'Đăng nhập thành công!',
                redirect: '/'
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.'
            });
        }
    }

    // Xử lý đăng xuất
    async logout(req, res) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Logout error:', err);
            }
            res.redirect('/');
        });
    }
}

module.exports = new UserController();
