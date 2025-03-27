const { poolPromise, sql } = require('../config/db');
const bcrypt = require('bcryptjs');

class UserModel {
    // Kiểm tra đăng nhập
    async login(username, password) {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('username', sql.NVarChar(50), username)
                .query(`
                    SELECT tk.*, sv.MaSV 
                    FROM TaiKhoan tk 
                    LEFT JOIN SinhVien sv ON tk.MaSV = sv.MaSV 
                    WHERE tk.TenDangNhap = @username
                `);

            if (result.recordset.length === 0) {
                return null;
            }

            const user = result.recordset[0];
            const isMatch = await bcrypt.compare(password, user.MatKhau);

            if (!isMatch) {
                return null;
            }

            return user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // Đăng ký tài khoản mới
    async register({ maSV, tenDangNhap, matKhau, maVaiTro }) {
        try {
            const pool = await poolPromise;
            const hashedPassword = await bcrypt.hash(matKhau, 10);
            
            // Kiểm tra sinh viên có tồn tại không
            const studentResult = await pool.request()
                .input('maSV', sql.Char(10), maSV)
                .query('SELECT COUNT(*) as count FROM SinhVien WHERE MaSV = @maSV');
            
            if (studentResult.recordset[0].count === 0) {
                throw new Error('Mã sinh viên không tồn tại trong hệ thống.');
            }

            // Kiểm tra sinh viên đã có tài khoản chưa
            const accountResult = await pool.request()
                .input('maSV', sql.Char(10), maSV)
                .query('SELECT COUNT(*) as count FROM TaiKhoan WHERE MaSV = @maSV');
            
            if (accountResult.recordset[0].count > 0) {
                throw new Error('Sinh viên này đã có tài khoản.');
            }

            // Kiểm tra tên đăng nhập đã tồn tại
            const usernameResult = await pool.request()
                .input('username', sql.NVarChar(50), tenDangNhap)
                .query('SELECT COUNT(*) as count FROM TaiKhoan WHERE TenDangNhap = @username');
            
            if (usernameResult.recordset[0].count > 0) {
                throw new Error('Tên đăng nhập đã được sử dụng.');
            }

            // Thêm tài khoản mới
            await pool.request()
                .input('tenDangNhap', sql.NVarChar(50), tenDangNhap)
                .input('matKhau', sql.NVarChar(255), hashedPassword)
                .input('maVaiTro', sql.Int, maVaiTro)
                .input('maSV', sql.Char(10), maSV)
                .query(`
                    INSERT INTO TaiKhoan (TenDangNhap, MatKhau, MaVaiTro, MaSV)
                    VALUES (@tenDangNhap, @matKhau, @maVaiTro, @maSV)
                `);

            return true;
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    }

    // Kiểm tra sinh viên có tồn tại không
    async checkStudentExists(maSV) {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('maSV', sql.Char(10), maSV)
                .query('SELECT COUNT(*) as count FROM SinhVien WHERE MaSV = @maSV');
            
            return result.recordset[0].count > 0;
        } catch (error) {
            console.error('Check student exists error:', error);
            throw error;
        }
    }

    // Kiểm tra sinh viên đã có tài khoản chưa
    async checkStudentHasAccount(maSV) {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('maSV', sql.Char(10), maSV)
                .query('SELECT COUNT(*) as count FROM TaiKhoan WHERE MaSV = @maSV');
            
            return result.recordset[0].count > 0;
        } catch (error) {
            console.error('Check student has account error:', error);
            throw error;
        }
    }

    // Kiểm tra tên đăng nhập đã tồn tại
    async checkUsernameExists(username) {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('username', sql.NVarChar(50), username)
                .query('SELECT COUNT(*) as count FROM TaiKhoan WHERE TenDangNhap = @username');
            
            return result.recordset[0].count > 0;
        } catch (error) {
            console.error('Check username exists error:', error);
            throw error;
        }
    }

    // Kiểm tra email đã tồn tại
    async checkEmailExists(email) {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('email', sql.NVarChar(100), email)
                .query('SELECT COUNT(*) as count FROM SinhVien WHERE Email = @email');
            
            return result.recordset[0].count > 0;
        } catch (error) {
            console.error('Check email exists error:', error);
            throw error;
        }
    }
}

module.exports = new UserModel();
