const { poolPromise, sql } = require('../config/db');

class IndexModel {
    async getAdminStats() {
        try {
            const pool = await poolPromise;
            const result = await pool.request().query(`
                SELECT 
                    (SELECT COUNT(*) FROM Sach) as totalBooks,
                    (SELECT COUNT(*) FROM MuonSach) as totalBorrows,
                    (SELECT COUNT(*) FROM SinhVien) as totalStudents,
                    (SELECT COUNT(*) FROM MuonSach WHERE TrangThai = N'Quá hạn') as overdueBooks
            `);
            return result.recordset[0];
        } catch (error) {
            console.error('Error in getAdminStats:', error);
            throw error;
        }
    }

    async getRecentBorrows(limit = 5) {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('limit', sql.Int, limit)
                .query(`
                    SELECT TOP (@limit)
                        ms.MaMuonSach,
                        s.TenSach,
                        sv.HoTen as TenSinhVien,
                        ms.NgayMuon,
                        ms.NgayTra,
                        ms.TrangThai
                    FROM MuonSach ms
                    JOIN Sach s ON ms.MaSach = s.MaSach
                    JOIN SinhVien sv ON ms.MaSinhVien = sv.MaSinhVien
                    ORDER BY ms.NgayMuon DESC
                `);
            return result.recordset;
        } catch (error) {
            console.error('Error in getRecentBorrows:', error);
            throw error;
        }
    }

    async getPopularBooks(limit = 5) {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('limit', sql.Int, limit)
                .query(`
                    SELECT TOP (@limit)
                        s.MaSach,
                        s.TenSach,
                        s.TacGia,
                        COUNT(ms.MaMuonSach) as SoLanMuon
                    FROM Sach s
                    LEFT JOIN MuonSach ms ON s.MaSach = ms.MaSach
                    GROUP BY s.MaSach, s.TenSach, s.TacGia
                    ORDER BY SoLanMuon DESC
                `);
            return result.recordset;
        } catch (error) {
            console.error('Error in getPopularBooks:', error);
            throw error;
        }
    }
}

module.exports = new IndexModel();  
