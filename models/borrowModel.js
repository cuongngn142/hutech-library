const { poolPromise, sql } = require('../config/db');

class BorrowModel {
    static async createBorrow(maTaiKhoan, maSach, ngayMuon, ngayHenTra) {
        try {
            const pool = await poolPromise;
            const request = pool.request();
            
            // Lấy thông tin sinh viên từ tài khoản
            const userResult = await request
                .input('maTaiKhoan', sql.Int, maTaiKhoan)
                .query('SELECT MaSV FROM TaiKhoan WHERE MaTaiKhoan = @maTaiKhoan');

            if (!userResult.recordset[0]) {
                throw new Error('Không tìm thấy thông tin sinh viên');
            }

            // Kiểm tra số lượng sách còn lại
            const bookResult = await request
                .input('maSach', sql.Int, maSach)
                .query('SELECT SoLuongTon FROM Sach WHERE MaSach = @maSach');

            if (!bookResult.recordset[0] || bookResult.recordset[0].SoLuongTon < 1) {
                throw new Error('Số lượng sách trong kho không đủ');
            }

            // Tạo phiếu mượn
            await request
                .input('maSV', sql.Char(10), userResult.recordset[0].MaSV)
                .input('maSach', sql.Int, maSach)
                .input('ngayMuon', sql.Date, ngayMuon)
                .input('ngayHenTra', sql.Date, ngayHenTra)
                .query(`
                    INSERT INTO MuonSach (MaSV, MaSach, NgayMuon, NgayTraDuKien, TrangThai)
                    VALUES (@maSV, @maSach, @ngayMuon, @ngayHenTra, N'Đang mượn')
                `);

            // Cập nhật số lượng sách
            await request
                .input('maSach', sql.Int, maSach)
                .query('UPDATE Sach SET SoLuongTon = SoLuongTon - 1 WHERE MaSach = @maSach');

            return true;
        } catch (error) {
            console.error('Create borrow error:', error);
            throw error;
        }
    }

    static async getBorrowsByUserId(maTaiKhoan) {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('maTaiKhoan', sql.Int, maTaiKhoan)
                .query(`
                    SELECT ms.*, s.TenSach, s.TacGia
                    FROM MuonSach ms
                    JOIN Sach s ON ms.MaSach = s.MaSach
                    JOIN TaiKhoan tk ON ms.MaSV = tk.MaSV
                    WHERE tk.MaTaiKhoan = @maTaiKhoan
                    ORDER BY ms.NgayMuon DESC
                `);
            return result.recordset;
        } catch (error) {
            console.error('Get borrows error:', error);
            throw error;
        }
    }

    static async getAllBorrows() {
        try {
            const pool = await poolPromise;
            const result = await pool.request().query(`
                SELECT ms.*, s.TenSach, s.TacGia, tk.TenDangNhap
                FROM MuonSach ms
                JOIN Sach s ON ms.MaSach = s.MaSach
                JOIN TaiKhoan tk ON ms.MaSV = tk.MaSV
                ORDER BY ms.NgayMuon DESC
            `);
            return result.recordset;
        } catch (error) {
            console.error('Get all borrows error:', error);
            throw error;
        }
    }

    static async approveBorrow(maPhieuMuon) {
        try {
            const pool = await poolPromise;
            await pool.request()
                .input('maPhieuMuon', sql.Int, maPhieuMuon)
                .query(`
                    UPDATE MuonSach
                    SET TrangThai = N'Đã duyệt'
                    WHERE MaPhieuMuon = @maPhieuMuon
                `);
        } catch (error) {
            console.error('Approve borrow error:', error);
            throw error;
        }
    }

    static async rejectBorrow(maPhieuMuon) {
        try {
            const pool = await poolPromise;
            const request = pool.request();
            
            // Lấy thông tin phiếu mượn
            const borrowResult = await request
                .input('maPhieuMuon', sql.Int, maPhieuMuon)
                .query('SELECT MaSach FROM MuonSach WHERE MaPhieuMuon = @maPhieuMuon');

            if (!borrowResult.recordset[0]) {
                throw new Error('Không tìm thấy phiếu mượn');
            }

            // Cập nhật trạng thái phiếu mượn
            await request
                .input('maPhieuMuon', sql.Int, maPhieuMuon)
                .query(`
                    UPDATE MuonSach 
                    SET TrangThai = N'Từ chối'
                    WHERE MaPhieuMuon = @maPhieuMuon
                `);

            // Hoàn lại số lượng sách
            await request
                .input('maSach', sql.Int, borrowResult.recordset[0].MaSach)
                .query('UPDATE Sach SET SoLuongTon = SoLuongTon + 1 WHERE MaSach = @maSach');

            return true;
        } catch (error) {
            console.error('Reject borrow error:', error);
            throw error;
        }
    }

    static async returnBook(maPhieuMuon) {
        try {
            const pool = await poolPromise;
            const request = pool.request();
            
            // Lấy thông tin phiếu mượn
            const borrowResult = await request
                .input('maPhieuMuon', sql.Int, maPhieuMuon)
                .query('SELECT MaSach FROM MuonSach WHERE MaPhieuMuon = @maPhieuMuon');

            if (!borrowResult.recordset[0]) {
                throw new Error('Không tìm thấy phiếu mượn');
            }

            // Cập nhật trạng thái phiếu mượn
            await request
                .input('maPhieuMuon', sql.Int, maPhieuMuon)
                .query(`
                    UPDATE MuonSach 
                    SET TrangThai = N'Đã trả',
                        NgayTraThucTe = GETDATE()
                    WHERE MaPhieuMuon = @maPhieuMuon
                `);

            // Hoàn lại số lượng sách
            await request
                .input('maSach', sql.Int, borrowResult.recordset[0].MaSach)
                .query('UPDATE Sach SET SoLuongTon = SoLuongTon + 1 WHERE MaSach = @maSach');

            return true;
        } catch (error) {
            console.error('Return book error:', error);
            throw error;
        }
    }
}

module.exports = BorrowModel; 