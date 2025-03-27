const { poolPromise, sql } = require('../config/db');

class FineModel {
    static async getAllFines() {
        try {
            const pool = await poolPromise;
            const result = await pool.request().query(`
                SELECT p.*, ms.MaSV, tk.TenDangNhap, s.TenSach
                FROM PhieuPhat p
                JOIN MuonSach ms ON p.MaMuon = ms.MaMuon
                JOIN TaiKhoan tk ON ms.MaSV = tk.MaSV
                JOIN Sach s ON ms.MaSach = s.MaSach
                ORDER BY p.NgayPhat DESC
            `);
            return result.recordset;
        } catch (error) {
            console.error('Get all fines error:', error);
            throw error;
        }
    }

    static async createFine(maMuon, soTien, lyDo) {
        try {
            const pool = await poolPromise;
            await pool.request()
                .input('maMuon', sql.Int, maMuon)
                .input('soTien', sql.Decimal(10,2), soTien)
                .input('lyDo', sql.NVarChar, lyDo)
                .query(`
                    INSERT INTO PhieuPhat (MaMuon, SoTienPhat, LyDo, NgayPhat)
                    VALUES (@maMuon, @soTien, @lyDo, GETDATE())
                `);
        } catch (error) {
            console.error('Create fine error:', error);
            throw error;
        }
    }

    static async updateFine(maPhieuPhat, soTien, lyDo, trangThai) {
        try {
            const pool = await poolPromise;
            await pool.request()
                .input('maPhieuPhat', sql.Int, maPhieuPhat)
                .input('soTien', sql.Decimal(10,2), soTien)
                .input('lyDo', sql.NVarChar, lyDo)
                .input('trangThai', sql.NVarChar, trangThai)
                .query(`
                    UPDATE PhieuPhat
                    SET SoTienPhat = @soTien,
                        LyDo = @lyDo,
                        TrangThai = @trangThai,
                        NgayCapNhat = GETDATE()
                    WHERE MaPhieuPhat = @maPhieuPhat
                `);
        } catch (error) {
            console.error('Update fine error:', error);
            throw error;
        }
    }

    static async getFinesByUserId(maTaiKhoan) {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('maTaiKhoan', sql.Int, maTaiKhoan)
                .query(`
                    SELECT p.*, s.TenSach
                    FROM PhieuPhat p
                    JOIN MuonSach ms ON p.MaMuon = ms.MaMuon
                    JOIN TaiKhoan tk ON ms.MaSV = tk.MaSV
                    JOIN Sach s ON ms.MaSach = s.MaSach
                    WHERE tk.MaTaiKhoan = @maTaiKhoan
                    ORDER BY p.NgayPhat DESC
                `);
            return result.recordset;
        } catch (error) {
            console.error('Get fines by user error:', error);
            throw error;
        }
    }
}

module.exports = FineModel; 