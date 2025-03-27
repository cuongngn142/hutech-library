const sql = require('mssql');
const { poolPromise } = require('../config/db');

class BookModel {
    // Lấy danh sách sách với phân trang và tìm kiếm
    async getBooks(page = 1, limit = 10, search = '', category = '', location = '') {
        try {
            const pool = await poolPromise;
            const offset = (page - 1) * limit;

            // Xây dựng câu query cơ bản
            let query = `
                SELECT s.MaSach, s.TenSach, s.TacGia, s.NamXuatBan, s.SoLuongTon, 
                       s.MaViTri, s.URLAnh, s.FilePDF, vt.TenViTri,
                       (SELECT STRING_AGG(tl.TenTheLoai, N', ')
                        FROM Sach_TheLoai st
                        JOIN TheLoai tl ON st.MaTheLoai = tl.MaTheLoai
                        WHERE st.MaSach = s.MaSach) as TheLoai
                FROM Sach s
                LEFT JOIN ViTriKho vt ON s.MaViTri = vt.MaViTri
                WHERE 1=1
            `;

            // Thêm điều kiện tìm kiếm
            if (search) {
                query += ` AND (s.TenSach LIKE @search OR s.TacGia LIKE @search)`;
            }

            // Thêm điều kiện thể loại
            if (category) {
                query += ` AND EXISTS (
                    SELECT 1 FROM Sach_TheLoai st
                    JOIN TheLoai tl ON st.MaTheLoai = tl.MaTheLoai
                    WHERE st.MaSach = s.MaSach AND tl.MaTheLoai = @category
                )`;
            }

            // Thêm điều kiện vị trí
            if (location) {
                query += ` AND s.MaViTri = @location`;
            }

            // Thêm phân trang
            query += ` ORDER BY s.MaSach DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;

            // Thực thi query
            const result = await pool.request()
                .input('search', sql.NVarChar, `%${search}%`)
                .input('category', sql.Int, category || null)
                .input('location', sql.Int, location || null)
                .input('offset', sql.Int, offset)
                .input('limit', sql.Int, limit)
                .query(query);

            // Lấy tổng số sách cho phân trang
            let countQuery = `
                SELECT COUNT(*) as total
                FROM Sach s
                WHERE 1=1
            `;

            if (search) {
                countQuery += ` AND (s.TenSach LIKE @search OR s.TacGia LIKE @search)`;
            }

            if (category) {
                countQuery += ` AND EXISTS (
                    SELECT 1 FROM Sach_TheLoai st
                    JOIN TheLoai tl ON st.MaTheLoai = tl.MaTheLoai
                    WHERE st.MaSach = s.MaSach AND tl.MaTheLoai = @category
                )`;
            }

            if (location) {
                countQuery += ` AND s.MaViTri = @location`;
            }

            const countResult = await pool.request()
                .input('search', sql.NVarChar, `%${search}%`)
                .input('category', sql.Int, category || null)
                .input('location', sql.Int, location || null)
                .query(countQuery);

            const total = countResult.recordset[0].total;
            const totalPages = Math.ceil(total / limit);

            return {
                books: result.recordset,
                currentPage: page,
                totalPages,
                total
            };
        } catch (error) {
            console.error('Error in getBooks:', error);
            throw error;
        }
    }

    // Lấy tất cả sách kèm thể loại và vị trí
    async getAllBooks() {
        try {
            const pool = await poolPromise;
            const result = await pool.request().query(`
                SELECT s.MaSach, s.TenSach, s.TacGia, s.NamXuatBan, s.SoLuongTon, 
                       s.MaViTri, s.URLAnh, s.FilePDF, vt.TenViTri,
                       (SELECT STRING_AGG(tl.TenTheLoai, N', ')
                        FROM Sach_TheLoai st
                        JOIN TheLoai tl ON st.MaTheLoai = tl.MaTheLoai
                        WHERE st.MaSach = s.MaSach) as TheLoai
                FROM Sach s
                LEFT JOIN ViTriKho vt ON s.MaViTri = vt.MaViTri
                ORDER BY s.MaSach DESC
            `);
            return result.recordset;
        } catch (error) {
            console.error('Error in getAllBooks:', error);
            throw error;
        }
    }

    // Lấy sách theo ID
    async getBookById(id) {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT s.MaSach, s.TenSach, s.TacGia, s.NamXuatBan, s.SoLuongTon, 
                           s.MaViTri, s.URLAnh, s.FilePDF, vt.TenViTri,
                           (SELECT STRING_AGG(st.MaTheLoai, ',')
                            FROM Sach_TheLoai st
                            WHERE st.MaSach = s.MaSach) as DanhSachTheLoai,
                           (SELECT STRING_AGG(tl.TenTheLoai, N', ')
                            FROM Sach_TheLoai st
                            JOIN TheLoai tl ON st.MaTheLoai = tl.MaTheLoai
                            WHERE st.MaSach = s.MaSach) as TheLoai
                    FROM Sach s
                    LEFT JOIN ViTriKho vt ON s.MaViTri = vt.MaViTri
                    WHERE s.MaSach = @id
                `);
            return result.recordset[0];
        } catch (error) {
            console.error('Error in getBookById:', error);
            throw error;
        }
    }

    // Lấy nhiều sách theo danh sách ID
    async getBooksByIds(ids) {
        try {
            if (!ids || ids.length === 0) return [];
            const pool = await poolPromise;
            const idList = ids.join(',');
            const result = await pool.request()
                .query(`
                    SELECT s.MaSach, s.TenSach, s.TacGia, s.NamXuatBan, s.SoLuongTon, 
                           s.MaViTri, s.URLAnh, s.FilePDF, vt.TenViTri,
                           (SELECT STRING_AGG(tl.TenTheLoai, N', ')
                            FROM Sach_TheLoai st
                            JOIN TheLoai tl ON st.MaTheLoai = tl.MaTheLoai
                            WHERE st.MaSach = s.MaSach) as TheLoai
                    FROM Sach s
                    LEFT JOIN ViTriKho vt ON s.MaViTri = vt.MaViTri
                    WHERE s.MaSach IN (${idList})
            `);
            return result.recordset;
        } catch (error) {
            console.error('Error in getBooksByIds:', error);
            throw error;
        }
    }

    // Thêm sách mới
    async addBook(bookData) {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        try {
            await transaction.begin();

            // Log input data for debugging
            console.log('Add Book Input:', bookData);

            // Validate required fields based on database schema
            const requiredFields = ['tenSach', 'tacGia', 'namXuatBan', 'soLuong', 'maViTri'];
            const missingFields = requiredFields.filter(field => !bookData[field]);
            
            if (missingFields.length > 0) {
                console.log('Missing Fields:', missingFields);
                throw new Error(`Thiếu các thông tin bắt buộc: ${missingFields.join(', ')}`);
            }

            // Validate field lengths according to database constraints
            if (bookData.tenSach.length <= 5) {
                throw new Error('Tên sách phải có độ dài lớn hơn 5 ký tự');
            }
            if (bookData.tacGia.length <= 3) {
                throw new Error('Tên tác giả phải có độ dài lớn hơn 3 ký tự');
            }

            // Validate year according to database constraint
            const currentYear = new Date().getFullYear();
            if (bookData.namXuatBan < 1900 || bookData.namXuatBan > currentYear) {
                throw new Error(`Năm xuất bản phải từ 1900 đến ${currentYear}`);
            }

            // Validate quantity according to database constraint
            if (bookData.soLuong < 0) {
                throw new Error('Số lượng sách không được âm');
            }

            // Check if location exists (foreign key constraint)
            const locationResult = await transaction.request()
                .input('maViTri', sql.Int, parseInt(bookData.maViTri))
                .query('SELECT MaViTri FROM ViTriKho WHERE MaViTri = @maViTri');

            if (!locationResult.recordset[0]) {
                throw new Error('Vị trí không tồn tại');
            }

            // Check for duplicate book (unique constraint)
            const duplicateResult = await transaction.request()
                .input('tenSach', sql.NVarChar, bookData.tenSach)
                .input('tacGia', sql.NVarChar, bookData.tacGia)
                .input('namXuatBan', sql.Int, parseInt(bookData.namXuatBan))
                .query(`
                    SELECT COUNT(*) as count
                    FROM Sach
                    WHERE TenSach = @tenSach 
                    AND TacGia = @tacGia 
                    AND NamXuatBan = @namXuatBan
                `);

            if (duplicateResult.recordset[0].count > 0) {
                throw new Error('Sách đã tồn tại trong hệ thống');
            }

            // Insert book with exact database column names
            const result = await transaction.request()
                .input('tenSach', sql.NVarChar, bookData.tenSach)
                .input('tacGia', sql.NVarChar, bookData.tacGia)
                .input('namXuatBan', sql.Int, parseInt(bookData.namXuatBan))
                .input('soLuongTon', sql.Int, parseInt(bookData.soLuong))
                .input('maViTri', sql.Int, parseInt(bookData.maViTri))
                .input('urlAnh', sql.NVarChar, bookData.urlAnh || null)
                .input('filePDF', sql.NVarChar, bookData.filePDF || null)
                .query(`
                    INSERT INTO Sach (TenSach, TacGia, NamXuatBan, SoLuongTon, MaViTri, URLAnh, FilePDF)
                    OUTPUT INSERTED.MaSach
                    VALUES (@tenSach, @tacGia, @namXuatBan, @soLuongTon, @maViTri, @urlAnh, @filePDF)
                `);

            const maSach = result.recordset[0].MaSach;

            // Add categories if provided
            if (bookData.theLoai) {
                const theLoaiArray = Array.isArray(bookData.theLoai) 
                    ? bookData.theLoai 
                    : [bookData.theLoai];

                for (const maTheLoai of theLoaiArray) {
                    // Check if category exists (foreign key constraint)
                    const theLoaiResult = await transaction.request()
                        .input('maTheLoai', sql.Int, parseInt(maTheLoai))
                        .query('SELECT MaTheLoai FROM TheLoai WHERE MaTheLoai = @maTheLoai');

                    if (!theLoaiResult.recordset[0]) {
                        throw new Error(`Không tìm thấy thể loại với mã ${maTheLoai}`);
                    }

                    // Insert into Sach_TheLoai with exact column names
                    await transaction.request()
                        .input('maSach', sql.Int, maSach)
                        .input('maTheLoai', sql.Int, parseInt(maTheLoai))
                        .query(`
                            INSERT INTO Sach_TheLoai (MaSach, MaTheLoai)
                            VALUES (@maSach, @maTheLoai)
                        `);
                }
            }

            await transaction.commit();
            return maSach;
        } catch (error) {
            await transaction.rollback();
            console.error('Error in addBook:', error);
            throw error;
        }
    }

    // Cập nhật sách
    async updateBook(id, bookData) {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        try {
            await transaction.begin();

            // Log input data for debugging
            console.log('Update Book Input:', {
                id,
                bookData
            });

            // Kiểm tra sách có tồn tại không
            const existingBook = await this.getBookById(id);
            if (!existingBook) {
                throw new Error('Không tìm thấy sách cần cập nhật');
            }

            // Validate required fields
            const requiredFields = ['tenSach', 'tacGia', 'namXuatBan', 'soLuongTon', 'maViTri'];
            const missingFields = requiredFields.filter(field => !bookData[field]);
            
            if (missingFields.length > 0) {
                console.log('Missing Fields:', missingFields);
                console.log('Book Data:', bookData);
                throw new Error(`Thiếu các thông tin bắt buộc: ${missingFields.join(', ')}`);
            }

            // Validate field lengths
            if (bookData.tenSach.length <= 5) {
                throw new Error('Tên sách phải có độ dài lớn hơn 5 ký tự');
            }
            if (bookData.tacGia.length <= 3) {
                throw new Error('Tên tác giả phải có độ dài lớn hơn 3 ký tự');
            }

            // Validate year
            const currentYear = new Date().getFullYear();
            if (bookData.namXuatBan < 1900 || bookData.namXuatBan > currentYear) {
                throw new Error(`Năm xuất bản phải từ 1900 đến ${currentYear}`);
            }

            // Validate quantity
            if (bookData.soLuongTon < 0) {
                throw new Error('Số lượng sách không được âm');
            }

            // Cập nhật thông tin sách
            await transaction.request()
                .input('id', sql.Int, id)
                .input('tenSach', sql.NVarChar, bookData.tenSach)
                .input('tacGia', sql.NVarChar, bookData.tacGia)
                .input('namXuatBan', sql.Int, parseInt(bookData.namXuatBan))
                .input('soLuongTon', sql.Int, parseInt(bookData.soLuongTon))
                .input('maViTri', sql.Int, parseInt(bookData.maViTri))
                .input('urlAnh', sql.NVarChar, bookData.urlAnh || null)
                .input('filePDF', sql.NVarChar, bookData.filePDF || null)
                .query(`
                    UPDATE Sach 
                    SET TenSach = @tenSach,
                        TacGia = @tacGia,
                        NamXuatBan = @namXuatBan,
                        SoLuongTon = @soLuongTon,
                        MaViTri = @maViTri,
                        URLAnh = @urlAnh,
                        FilePDF = @filePDF
                    WHERE MaSach = @id
                `);

            // Cập nhật thể loại nếu có
            if (bookData.theLoai) {
                // Xóa thể loại cũ
                await transaction.request()
                    .input('maSach', sql.Int, id)
                    .query('DELETE FROM Sach_TheLoai WHERE MaSach = @maSach');

                // Thêm thể loại mới
                const theLoaiArray = Array.isArray(bookData.theLoai) 
                    ? bookData.theLoai 
                    : [bookData.theLoai];

                for (const maTheLoai of theLoaiArray) {
                    await transaction.request()
                        .input('maSach', sql.Int, id)
                        .input('maTheLoai', sql.Int, parseInt(maTheLoai))
                    .query(`
                            INSERT INTO Sach_TheLoai (MaSach, MaTheLoai)
                            VALUES (@maSach, @maTheLoai)
                        `);
                }
            }

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            console.error('Error in updateBook:', error);
            throw error;
        }
    }

    // Xóa sách
    async deleteBook(maSach) {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        try {
            await transaction.begin();

            // Kiểm tra sách có tồn tại không
            const bookResult = await transaction.request()
                .input('maSach', sql.Int, parseInt(maSach))
                .query('SELECT MaSach FROM Sach WHERE MaSach = @maSach');

            if (!bookResult.recordset[0]) {
                throw new Error('Không tìm thấy sách cần xóa');
            }

            // Kiểm tra sách có đang được mượn không
            const borrowResult = await transaction.request()
                .input('maSach', sql.Int, parseInt(maSach))
                    .query(`
                    SELECT COUNT(*) as count 
                    FROM MuonSach 
                    WHERE MaSach = @maSach 
                    AND TrangThai = N'Đang mượn'
                `);

            if (borrowResult.recordset[0].count > 0) {
                throw new Error('Không thể xóa sách đang được mượn');
            }

            // Kiểm tra sách có trong giỏ của ai không
            const cartResult = await transaction.request()
                .input('maSach', sql.Int, parseInt(maSach))
                .query('SELECT COUNT(*) as count FROM GioSach WHERE MaSach = @maSach');

            if (cartResult.recordset[0].count > 0) {
                throw new Error('Không thể xóa sách đang có trong giỏ của người dùng');
            }

            // Xóa sách (sẽ tự động xóa các bản ghi liên quan trong Sach_TheLoai nhờ ON DELETE CASCADE)
            await transaction.request()
                .input('maSach', sql.Int, parseInt(maSach))
                .query('DELETE FROM Sach WHERE MaSach = @maSach');

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            console.error('Error in deleteBook:', error);
            throw error;
        }
    }

    // Lấy danh sách vị trí kho
    async getLocations() {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .query('SELECT * FROM ViTriKho ORDER BY TenViTri');
            return result.recordset;
        } catch (error) {
            console.error('Error in getLocations:', error);
            throw error;
        }
    }

    // Lấy danh sách thể loại
    async getCategories() {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .query('SELECT * FROM TheLoai ORDER BY TenTheLoai');
            return result.recordset;
        } catch (error) {
            console.error('Error in getCategories:', error);
            throw error;
        }
    }

    // Lấy danh sách sách trong giỏ của user
    async getCartItems(userId) {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .query(`
                    SELECT gs.MaSach, gs.SoLuong, gs.NgayThem,
                           s.TenSach, s.TacGia, s.NamXuatBan, s.SoLuongTon, 
                           s.MaViTri, s.URLAnh, s.FilePDF, vt.TenViTri
                    FROM GioSach gs
                    JOIN Sach s ON gs.MaSach = s.MaSach
                    LEFT JOIN ViTriKho vt ON s.MaViTri = vt.MaViTri
                    JOIN TaiKhoan tk ON gs.MaSV = tk.MaSV
                    WHERE tk.MaTaiKhoan = @userId
                    ORDER BY gs.NgayThem DESC
                `);
            return result.recordset;
        } catch (error) {
            console.error('Error in getCartItems:', error);
            throw error;
        }
    }

    // Thêm sách vào giỏ
    async addToCart(maSV, maSach, soLuong) {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        try {
            await transaction.begin();

            // Kiểm tra sách có tồn tại không
            const bookResult = await transaction.request()
                .input('maSach', sql.Int, parseInt(maSach))
                .query('SELECT SoLuongTon FROM Sach WHERE MaSach = @maSach');

            if (!bookResult.recordset[0]) {
                throw new Error('Không tìm thấy sách');
            }

            // Kiểm tra số lượng tồn
            if (bookResult.recordset[0].SoLuongTon < soLuong) {
                throw new Error('Số lượng sách trong kho không đủ');
            }

            // Kiểm tra sách đã có trong giỏ chưa
            const cartResult = await transaction.request()
                .input('maSV', sql.Char(10), maSV)
                .input('maSach', sql.Int, parseInt(maSach))
                .query('SELECT SoLuong FROM GioSach WHERE MaSV = @maSV AND MaSach = @maSach');

            if (cartResult.recordset[0]) {
                // Nếu đã có trong giỏ, cập nhật số lượng
                const newQuantity = cartResult.recordset[0].SoLuong + soLuong;
                if (newQuantity > bookResult.recordset[0].SoLuongTon) {
                    throw new Error('Số lượng sách trong kho không đủ');
                }

                await transaction.request()
                    .input('maSV', sql.Char(10), maSV)
                    .input('maSach', sql.Int, parseInt(maSach))
                    .input('soLuong', sql.Int, newQuantity)
                    .query(`
                        UPDATE GioSach 
                        SET SoLuong = @soLuong 
                        WHERE MaSV = @maSV AND MaSach = @maSach
                    `);
            } else {
                // Nếu chưa có trong giỏ, thêm mới
                await transaction.request()
                    .input('maSV', sql.Char(10), maSV)
                    .input('maSach', sql.Int, parseInt(maSach))
                    .input('soLuong', sql.Int, soLuong)
                    .query(`
                        INSERT INTO GioSach (MaSV, MaSach, SoLuong)
                        VALUES (@maSV, @maSach, @soLuong)
                    `);
            }

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            console.error('Error in addToCart:', error);
            throw error;
        }
    }

    // Xóa sách khỏi giỏ
    async removeFromCart(userId, bookId) {
        try {
            const pool = await poolPromise;
            
            // Kiểm tra user có tồn tại và lấy MaSV
            const userResult = await pool.request()
                .input('userId', sql.Int, userId)
                .query('SELECT MaSV FROM TaiKhoan WHERE MaTaiKhoan = @userId');

            if (!userResult.recordset[0]) {
                throw new Error('Không tìm thấy thông tin người dùng');
            }

            const maSV = userResult.recordset[0].MaSV;

            // Xóa sách khỏi giỏ
            await pool.request()
                .input('maSV', sql.Char(10), maSV)
                .input('bookId', sql.Int, bookId)
                .query(`
                    DELETE FROM GioSach
                    WHERE MaSV = @maSV AND MaSach = @bookId
                `);

            return true;
        } catch (error) {
            console.error('Error in removeFromCart:', error);
            throw error;
        }
    }

    // Cập nhật số lượng sách trong giỏ
    async updateCartItem(maSV, maSach, soLuong) {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);

        try {
            await transaction.begin();

            // Kiểm tra sách có tồn tại và còn hàng không
            const bookResult = await transaction.request()
                .input('maSach', sql.Int, maSach)
                .query('SELECT SoLuongTon FROM Sach WHERE MaSach = @maSach');

            if (bookResult.recordset.length === 0) {
                throw new Error('Sách không tồn tại');
            }

            const soLuongTon = bookResult.recordset[0].SoLuongTon;
            if (soLuongTon < soLuong) {
                throw new Error('Số lượng sách trong kho không đủ');
            }

            // Kiểm tra sách có trong giỏ không
            const cartResult = await transaction.request()
                .input('maSV', sql.Char(10), maSV)
                .input('maSach', sql.Int, maSach)
                .query('SELECT SoLuong FROM GioSach WHERE MaSV = @maSV AND MaSach = @maSach');

            if (cartResult.recordset.length === 0) {
                throw new Error('Không tìm thấy sách trong giỏ');
            }

            // Cập nhật số lượng trong giỏ
            await transaction.request()
                .input('maSV', sql.Char(10), maSV)
                .input('maSach', sql.Int, maSach)
                .input('soLuong', sql.Int, soLuong)
                .query(`
                    UPDATE GioSach 
                    SET SoLuong = @soLuong 
                    WHERE MaSV = @maSV AND MaSach = @maSach
                `);

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            console.error('Update cart item error:', error);
            throw error;
        }
    }

    // Lấy danh sách sách đang mượn của user
    async getMyBorrows(maSV) {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('maSV', sql.Char(10), maSV)
                .query(`
                    SELECT ms.*, s.TenSach, s.TacGia, s.URLAnh,
                           vt.TenViTri,
                           (SELECT STRING_AGG(tl.TenTheLoai, N', ')
                            FROM Sach_TheLoai st
                            JOIN TheLoai tl ON st.MaTheLoai = tl.MaTheLoai
                            WHERE st.MaSach = s.MaSach) as TheLoai
                    FROM MuonSach ms
                    JOIN Sach s ON ms.MaSach = s.MaSach
                    LEFT JOIN ViTriKho vt ON s.MaViTri = vt.MaViTri
                    WHERE ms.MaSV = @maSV
                    ORDER BY ms.NgayMuon DESC
                `);
            return result.recordset;
        } catch (error) {
            console.error('Error in getMyBorrows:', error);
            throw error;
        }
    }

    // Lấy tất cả phiếu mượn cho admin
    async getAllBorrows() {
        try {
            const pool = await poolPromise;
            const result = await pool.request().query(`
                SELECT ms.*, 
                    s.TenSach, s.TacGia,
                    sv.HoTen
                FROM MuonSach ms
                JOIN Sach s ON ms.MaSach = s.MaSach
                JOIN SinhVien sv ON ms.MaSV = sv.MaSV
                ORDER BY ms.NgayMuon DESC
            `);
            return result.recordset;
        } catch (error) {
            console.error('Error in getAllBorrows:', error);
            throw error;
        }
    }

    // Lấy giỏ sách của sinh viên
    async getCart(maSV) {
        const pool = await poolPromise;
        try {
            const result = await pool.request()
                .input('maSV', sql.Char(10), maSV)
                .query(`
                    SELECT g.MaSach, g.SoLuong, g.NgayThem,
                           s.TenSach, s.TacGia, s.NamXuatBan, s.SoLuongTon, s.URLAnh,
                           v.TenViTri
                    FROM GioSach g
                    JOIN Sach s ON g.MaSach = s.MaSach
                    JOIN ViTriKho v ON s.MaViTri = v.MaViTri
                    WHERE g.MaSV = @maSV
                    ORDER BY g.NgayThem DESC
                `);

            return result.recordset;
        } catch (error) {
            console.error('Error in getCart:', error);
            throw error;
        }
    }

    // Mượn sách từ giỏ
    async borrowFromCart(maSV, ngayTraDuKien) {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);

        try {
            await transaction.begin();

            // Lấy danh sách sách trong giỏ
            const cartResult = await transaction.request()
                .input('maSV', sql.Char(10), maSV)
                .query(`
                    SELECT gs.MaSach, gs.SoLuong, s.SoLuongTon
                    FROM GioSach gs
                    JOIN Sach s ON gs.MaSach = s.MaSach
                    WHERE gs.MaSV = @maSV
                `);

            if (!cartResult.recordset.length) {
                throw new Error('Giỏ sách trống');
            }

            // Kiểm tra số lượng tồn và thêm vào bảng MuonSach
            for (const item of cartResult.recordset) {
                if (item.SoLuongTon < item.SoLuong) {
                    throw new Error(`Sách ${item.MaSach} không đủ số lượng trong kho`);
                }

                // Thêm vào bảng MuonSach
                await transaction.request()
                    .input('maSV', sql.Char(10), maSV)
                    .input('maSach', sql.Int, item.MaSach)
                    .input('ngayTraDuKien', sql.Date, ngayTraDuKien)
                    .query(`
                        INSERT INTO MuonSach (MaSV, MaSach, NgayMuon, NgayTraDuKien, TrangThai)
                        VALUES (@maSV, @maSach, GETDATE(), @ngayTraDuKien, N'Đang mượn')
                    `);

                // Cập nhật số lượng tồn
                await transaction.request()
                    .input('maSach', sql.Int, item.MaSach)
                    .input('soLuong', sql.Int, item.SoLuong)
                    .query(`
                        UPDATE Sach 
                        SET SoLuongTon = SoLuongTon - @soLuong
                        WHERE MaSach = @maSach
                    `);
            }

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            console.error('Error in borrowFromCart:', error);
            throw error;
        }
    }

    // Xóa toàn bộ sách trong giỏ
    async clearCart(maSV) {
        try {
            const pool = await poolPromise;
            await pool.request()
                .input('maSV', sql.Char(10), maSV)
                .query('DELETE FROM GioSach WHERE MaSV = @maSV');
            return true;
        } catch (error) {
            console.error('Error in clearCart:', error);
            throw error;
        }
    }

    // Trả sách
    async returnBook(maMuon, maSV) {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);

        try {
            await transaction.begin();

            // Kiểm tra phiếu mượn có tồn tại không
            const borrowResult = await transaction.request()
                .input('maMuon', sql.Int, maMuon)
                .query(`
                    SELECT ms.MaMuon, ms.MaSach, ms.TrangThai
                    FROM MuonSach ms
                    WHERE ms.MaMuon = @maMuon
                `);

            if (!borrowResult.recordset[0]) {
                throw new Error('Không tìm thấy phiếu mượn');
            }

            // Kiểm tra trạng thái hiện tại
            if (borrowResult.recordset[0].TrangThai === 'Đã trả') {
                throw new Error('Sách đã được trả');
            }

            // Cập nhật trạng thái mượn sách
            await transaction.request()
                .input('maMuon', sql.Int, maMuon)
                .query(`
                    UPDATE MuonSach 
                    SET TrangThai = N'Đã trả',
                        NgayTraThucTe = GETDATE()
                    WHERE MaMuon = @maMuon
                `);

            // Cập nhật số lượng tồn (tăng lên 1 vì mỗi lần mượn chỉ mượn 1 cuốn)
            await transaction.request()
                .input('maSach', sql.Int, borrowResult.recordset[0].MaSach)
                .query(`
                    UPDATE Sach 
                    SET SoLuongTon = SoLuongTon + 1
                    WHERE MaSach = @maSach
                `);

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            console.error('Error in returnBook:', error);
            throw error;
        }
    }

    // Lấy danh sách phiếu phạt của sinh viên
    async getMyFines(maSV) {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('maSV', sql.Char(10), maSV)
                .query(`
                    SELECT pp.*, ms.NgayMuon, ms.NgayTraDuKien, ms.NgayTraThucTe, ms.TrangThai,
                           s.TenSach, s.TacGia, s.URLAnh
                    FROM PhieuPhat pp
                    JOIN MuonSach ms ON pp.MaMuon = ms.MaMuon
                    JOIN Sach s ON ms.MaSach = s.MaSach
                    WHERE ms.MaSV = @maSV
                    ORDER BY pp.NgayPhat DESC
                `);
            return result.recordset;
        } catch (error) {
            console.error('Error in getMyFines:', error);
            throw error;
        }
    }

    // Lấy tất cả phiếu phạt
    async getAllFines() {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .query(`
                    SELECT pp.*, ms.MaSV, sv.HoTen, s.TenSach, ms.NgayMuon, ms.NgayTraDuKien, ms.NgayTraThucTe
                    FROM PhieuPhat pp
                    JOIN MuonSach ms ON pp.MaMuon = ms.MaMuon
                    JOIN SinhVien sv ON ms.MaSV = sv.MaSV
                    JOIN Sach s ON ms.MaSach = s.MaSach
                    ORDER BY pp.NgayPhat DESC
                `);
            return result.recordset;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    // Lấy phiếu mượn theo ID
    async getBorrowById(maMuon) {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('maMuon', sql.Int, maMuon)
                .query('SELECT * FROM MuonSach WHERE MaMuon = @maMuon');
            return result.recordset[0];
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    // Tạo phiếu phạt mới
    async createFine(maMuon, lyDo, soTienPhat) {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);

        try {
            // Kiểm tra độ dài lý do phạt
            if (!lyDo || lyDo.length <= 10) {
                throw new Error('Lý do phạt phải có độ dài lớn hơn 10 ký tự');
            }

            await transaction.begin();
            
            // Kiểm tra phiếu mượn có tồn tại và đang quá hạn không
            const borrow = await transaction.request()
                .input('maMuon', sql.Int, maMuon)
                .query(`
                    SELECT * FROM MuonSach 
                    WHERE MaMuon = @maMuon 
                    AND (TrangThai = N'Quá hạn' OR (TrangThai = N'Đang mượn' AND NgayTraDuKien < GETDATE()))
                `);

            if (!borrow.recordset[0]) {
                throw new Error('Phiếu mượn không tồn tại hoặc chưa quá hạn');
            }

            // Tạo phiếu phạt
            await transaction.request()
                .input('maMuon', sql.Int, maMuon)
                .input('lyDo', sql.NVarChar, lyDo)
                .input('soTienPhat', sql.Decimal(10,2), soTienPhat)
                .query(`
                    INSERT INTO PhieuPhat (MaMuon, LyDo, SoTienPhat)
                    VALUES (@maMuon, @lyDo, @soTienPhat)
                `);

            // Cập nhật trạng thái phiếu mượn thành quá hạn nếu chưa
            if (borrow.recordset[0].TrangThai === 'Đang mượn') {
                await transaction.request()
                    .input('maMuon', sql.Int, maMuon)
                    .query(`
                        UPDATE MuonSach 
                        SET TrangThai = N'Quá hạn'
                        WHERE MaMuon = @maMuon
                    `);
            }

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            console.error('Error:', error);
            throw error;
        }
    }

    // Xóa phiếu phạt
    async deleteFine(maPhieuPhat) {
        try {
            const pool = await poolPromise;
            await pool.request()
                .input('maPhieuPhat', sql.Int, maPhieuPhat)
                .query('DELETE FROM PhieuPhat WHERE MaPhieuPhat = @maPhieuPhat');
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    // Lấy phiếu phạt theo ID
    async getFineById(maPhieuPhat) {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('maPhieuPhat', sql.Int, maPhieuPhat)
                .query(`
                    SELECT pp.*, ms.MaSV, sv.HoTen, s.TenSach, ms.NgayMuon, ms.NgayTraDuKien, ms.NgayTraThucTe
                    FROM PhieuPhat pp
                    JOIN MuonSach ms ON pp.MaMuon = ms.MaMuon
                    JOIN SinhVien sv ON ms.MaSV = sv.MaSV
                    JOIN Sach s ON ms.MaSach = s.MaSach
                    WHERE pp.MaPhieuPhat = @maPhieuPhat
                `);
            return result.recordset[0];
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    // Cập nhật phiếu phạt
    async updateFine(maPhieuPhat, lyDo, soTienPhat) {
        try {
            const pool = await poolPromise;
            await pool.request()
                .input('maPhieuPhat', sql.Int, maPhieuPhat)
                .input('lyDo', sql.NVarChar, lyDo)
                .input('soTienPhat', sql.Decimal(10,2), soTienPhat)
                .query(`
                    UPDATE PhieuPhat 
                    SET LyDo = @lyDo,
                        SoTienPhat = @soTienPhat
                    WHERE MaPhieuPhat = @maPhieuPhat
                `);
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    // Cập nhật trạng thái phiếu phạt thành đã đóng
    async markFineAsPaid(maPhieuPhat) {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);

        try {
            await transaction.begin();

            // Kiểm tra phiếu phạt có tồn tại không
            const fineResult = await transaction.request()
                .input('maPhieuPhat', sql.Int, maPhieuPhat)
                .query('SELECT * FROM PhieuPhat WHERE MaPhieuPhat = @maPhieuPhat');

            if (!fineResult.recordset[0]) {
                throw new Error('Không tìm thấy phiếu phạt');
            }

            // Cập nhật trạng thái thành đã đóng phạt
            await transaction.request()
                .input('maPhieuPhat', sql.Int, maPhieuPhat)
                .query(`
                    UPDATE PhieuPhat 
                    SET TrangThai = N'Đã đóng phạt'
                    WHERE MaPhieuPhat = @maPhieuPhat
                `);

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            console.error('Error in markFineAsPaid:', error);
            throw error;
        }
    }

    // Lấy thống kê cho dashboard
    async getDashboardStats() {
        const pool = await poolPromise;
        try {
            // Lấy tổng số sách
            const totalBooksResult = await pool.request()
                .query('SELECT COUNT(*) as total FROM Sach');

            // Lấy số sách đang mượn
            const borrowedBooksResult = await pool.request()
                .query(`
                    SELECT COUNT(*) as total 
                    FROM MuonSach 
                    WHERE TrangThai IN (N'Đang mượn', N'Quá hạn')
                `);

            // Lấy số phiếu phạt chưa đóng
            const unpaidFinesResult = await pool.request()
                .query(`
                    SELECT COUNT(*) as total 
                    FROM PhieuPhat 
                    WHERE TrangThai = N'Quá hạn'
                `);

            // Lấy tổng số sinh viên
            const totalStudentsResult = await pool.request()
                .query('SELECT COUNT(*) as total FROM SinhVien');

            // Lấy phiếu mượn gần đây
            const recentBorrowsResult = await pool.request()
                .query(`
                    SELECT TOP 5 m.*, s.TenSach, sv.HoTen
                    FROM MuonSach m
                    JOIN Sach s ON m.MaSach = s.MaSach
                    JOIN SinhVien sv ON m.MaSV = sv.MaSV
                    ORDER BY m.NgayMuon DESC
                `);

            // Lấy phiếu phạt gần đây
            const recentFinesResult = await pool.request()
                .query(`
                    SELECT TOP 5 p.*, s.TenSach, sv.HoTen
                    FROM PhieuPhat p
                    JOIN MuonSach m ON p.MaMuon = m.MaMuon
                    JOIN Sach s ON m.MaSach = s.MaSach
                    JOIN SinhVien sv ON m.MaSV = sv.MaSV
                    ORDER BY p.NgayPhat DESC
                `);

            return {
                stats: {
                    totalBooks: totalBooksResult.recordset[0].total,
                    borrowedBooks: borrowedBooksResult.recordset[0].total,
                    unpaidFines: unpaidFinesResult.recordset[0].total,
                    totalStudents: totalStudentsResult.recordset[0].total
                },
                recentBorrows: recentBorrowsResult.recordset,
                recentFines: recentFinesResult.recordset
            };
        } catch (error) {
            console.error('Error in getDashboardStats:', error);
            throw error;
        }
    }

    // Lấy danh sách sinh viên
    async getAllStudents() {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .query('SELECT * FROM SinhVien ORDER BY MaSV');
            return result.recordset;
        } catch (error) {
            console.error('Error in getAllStudents:', error);
            throw error;
        }
    }

    // Thêm sinh viên mới
    async addStudent(maSV, hoTen, email, ngayHetHan) {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);

        try {
            await transaction.begin();

            // Kiểm tra mã sinh viên đã tồn tại chưa
            const checkResult = await transaction.request()
                .input('maSV', sql.Char(10), maSV)
                .query('SELECT COUNT(*) as count FROM SinhVien WHERE MaSV = @maSV');

            if (checkResult.recordset[0].count > 0) {
                throw new Error('Mã sinh viên đã tồn tại');
            }

            // Thêm sinh viên mới
            await transaction.request()
                .input('maSV', sql.Char(10), maSV)
                .input('hoTen', sql.NVarChar, hoTen)
                .input('email', sql.NVarChar, email)
                .input('ngayHetHan', sql.Date, ngayHetHan)
                .query(`
                    INSERT INTO SinhVien (MaSV, HoTen, Email, NgayHetHan)
                    VALUES (@maSV, @hoTen, @email, @ngayHetHan)
                `);

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            console.error('Error in addStudent:', error);
            throw error;
        }
    }

    // Cập nhật thông tin sinh viên
    async updateStudent(maSV, hoTen, email, ngayHetHan) {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);

        try {
            await transaction.begin();

            // Kiểm tra sinh viên có tồn tại không và lấy ngày đăng ký
            const checkResult = await transaction.request()
                .input('maSV', sql.Char(10), maSV)
                .query(`
                    SELECT NgayDangKy 
                    FROM SinhVien 
                    WHERE MaSV = @maSV
                `);

            if (!checkResult.recordset[0]) {
                throw new Error('Không tìm thấy sinh viên');
            }

            const ngayDangKy = new Date(checkResult.recordset[0].NgayDangKy);
            const ngayHetHanDate = new Date(ngayHetHan);

            // Kiểm tra ngày hết hạn phải lớn hơn ngày đăng ký
            if (ngayHetHanDate <= ngayDangKy) {
                throw new Error('Ngày hết hạn phải lớn hơn ngày đăng ký');
            }

            // Kiểm tra khoảng cách không quá 4 năm
            const yearsDiff = ngayHetHanDate.getFullYear() - ngayDangKy.getFullYear();
            if (yearsDiff > 4) {
                throw new Error('Thời hạn thẻ không được quá 4 năm');
            }

            // Cập nhật thông tin sinh viên
            await transaction.request()
                .input('maSV', sql.Char(10), maSV)
                .input('hoTen', sql.NVarChar, hoTen)
                .input('email', sql.NVarChar, email)
                .input('ngayHetHan', sql.Date, ngayHetHan)
                .query(`
                    UPDATE SinhVien 
                    SET HoTen = @hoTen,
                        Email = @email,
                        NgayHetHan = @ngayHetHan
                    WHERE MaSV = @maSV
                `);

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            console.error('Error in updateStudent:', error);
            throw error;
        }
    }

    // Xóa sinh viên
    async deleteStudent(maSV) {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);

        try {
            await transaction.begin();

            // Kiểm tra sinh viên có tồn tại không
            const checkResult = await transaction.request()
                .input('maSV', sql.Char(10), maSV)
                .query('SELECT COUNT(*) as count FROM SinhVien WHERE MaSV = @maSV');

            if (checkResult.recordset[0].count === 0) {
                throw new Error('Không tìm thấy sinh viên');
            }

            // Kiểm tra sinh viên có đang mượn sách không
            const borrowCheck = await transaction.request()
                .input('maSV', sql.Char(10), maSV)
                .query(`
                    SELECT COUNT(*) as count 
                    FROM MuonSach 
                    WHERE MaSV = @maSV AND TrangThai IN (N'Đang mượn', N'Quá hạn')
                `);

            if (borrowCheck.recordset[0].count > 0) {
                throw new Error('Không thể xóa sinh viên đang mượn sách');
            }

            // Xóa sinh viên
            await transaction.request()
                .input('maSV', sql.Char(10), maSV)
                .query('DELETE FROM SinhVien WHERE MaSV = @maSV');

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            console.error('Error in deleteStudent:', error);
            throw error;
        }
    }

    // Lấy thống kê cho dashboard người dùng
    async getUserDashboardStats(maSV) {
        const pool = await poolPromise;
        try {
            // Lấy số sách đang mượn
            const borrowedBooksResult = await pool.request()
                .input('maSV', sql.Char(10), maSV)
                .query(`
                    SELECT COUNT(*) as total 
                    FROM MuonSach 
                    WHERE MaSV = @maSV AND TrangThai = N'Đang mượn'
                `);

            // Lấy số phiếu phạt chưa đóng
            const unpaidFinesResult = await pool.request()
                .input('maSV', sql.Char(10), maSV)
                .query(`
                    SELECT COUNT(*) as total 
                    FROM PhieuPhat pp
                    JOIN MuonSach ms ON pp.MaMuon = ms.MaMuon
                    WHERE ms.MaSV = @maSV AND pp.TrangThai = N'Quá hạn'
                `);

            // Lấy số sách đã trả
            const returnedBooksResult = await pool.request()
                .input('maSV', sql.Char(10), maSV)
                .query(`
                    SELECT COUNT(*) as total 
                    FROM MuonSach 
                    WHERE MaSV = @maSV AND TrangThai = N'Đã trả'
                `);

            // Lấy số sách quá hạn
            const overdueBooksResult = await pool.request()
                .input('maSV', sql.Char(10), maSV)
                .query(`
                    SELECT COUNT(*) as total 
                    FROM MuonSach 
                    WHERE MaSV = @maSV AND TrangThai = N'Quá hạn'
                `);

            // Lấy danh sách sách đang mượn
            const currentBorrowsResult = await pool.request()
                .input('maSV', sql.Char(10), maSV)
                .query(`
                    SELECT ms.*, s.TenSach
                    FROM MuonSach ms
                    JOIN Sach s ON ms.MaSach = s.MaSach
                    WHERE ms.MaSV = @maSV 
                    AND ms.TrangThai IN (N'Đang mượn', N'Quá hạn')
                    ORDER BY ms.NgayMuon DESC
                `);

            // Lấy danh sách phiếu phạt gần đây
            const recentFinesResult = await pool.request()
                .input('maSV', sql.Char(10), maSV)
                .query(`
                    SELECT pp.*, s.TenSach
                    FROM PhieuPhat pp
                    JOIN MuonSach ms ON pp.MaMuon = ms.MaMuon
                    JOIN Sach s ON ms.MaSach = s.MaSach
                    WHERE ms.MaSV = @maSV
                    ORDER BY pp.NgayPhat DESC
                    LIMIT 5
                `);

            return {
                stats: {
                    borrowedBooks: borrowedBooksResult.recordset[0].total,
                    unpaidFines: unpaidFinesResult.recordset[0].total,
                    returnedBooks: returnedBooksResult.recordset[0].total,
                    overdueBooks: overdueBooksResult.recordset[0].total
                },
                currentBorrows: currentBorrowsResult.recordset,
                recentFines: recentFinesResult.recordset
            };
        } catch (error) {
            console.error('Error in getUserDashboardStats:', error);
            throw error;
        }
    }
}

module.exports = new BookModel(); 