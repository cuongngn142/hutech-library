-- Tạo cơ sở dữ liệu
CREATE DATABASE library_db;
GO
USE library_db;
GO

-- Bảng Vị Trí Kho Sách
CREATE TABLE ViTriKho (
    MaViTri INT PRIMARY KEY IDENTITY(1,1),
    TenViTri NVARCHAR(50) NOT NULL UNIQUE CHECK (LEN(TenViTri) >= 3),
    MoTa NVARCHAR(255)
);

-- Bảng Thể Loại
CREATE TABLE TheLoai (
    MaTheLoai INT PRIMARY KEY IDENTITY(1,1),
    TenTheLoai NVARCHAR(50) NOT NULL UNIQUE CHECK (LEN(TenTheLoai) > 2),
    MoTa NVARCHAR(255)
);

-- Bảng Sách
CREATE TABLE Sach (
    MaSach INT PRIMARY KEY IDENTITY(1,1),
    TenSach NVARCHAR(255) NOT NULL CHECK (LEN(TenSach) > 5),
    TacGia NVARCHAR(100) NOT NULL CHECK (LEN(TacGia) > 3),
    NamXuatBan INT NOT NULL CHECK (NamXuatBan BETWEEN 1900 AND YEAR(GETDATE())),
    SoLuongTon INT NOT NULL CHECK (SoLuongTon >= 0),
    MaViTri INT NOT NULL,
    URLAnh NVARCHAR(500),
    FilePDF NVARCHAR(500),
    CONSTRAINT UQ_Sach UNIQUE (TenSach, TacGia, NamXuatBan), -- Đảm bảo không trùng sách
    FOREIGN KEY (MaViTri) REFERENCES ViTriKho(MaViTri) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Bảng trung gian Sach_TheLoai (Quan hệ nhiều-nhiều giữa Sach và TheLoai)
CREATE TABLE Sach_TheLoai (
    MaSach INT NOT NULL,
    MaTheLoai INT NOT NULL,
    PRIMARY KEY (MaSach, MaTheLoai), -- Khóa chính composite
    FOREIGN KEY (MaSach) REFERENCES Sach(MaSach) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (MaTheLoai) REFERENCES TheLoai(MaTheLoai) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Bảng Sinh Viên
CREATE TABLE SinhVien (
    MaSV CHAR(10) PRIMARY KEY CHECK (MaSV LIKE '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'), -- Định dạng mã SV HUTECH (10 số)
    HoTen NVARCHAR(100) NOT NULL CHECK (LEN(HoTen) > 5),
    NgayDangKy DATE NOT NULL DEFAULT GETDATE(),
    NgayHetHan DATE NOT NULL,
    Email NVARCHAR(100) UNIQUE CHECK (Email LIKE '%@%.%'), -- Đảm bảo định dạng email cơ bản
    CONSTRAINT CHK_NgayHetHan CHECK (NgayHetHan > NgayDangKy AND DATEDIFF(YEAR, NgayDangKy, NgayHetHan) <= 4)
);

-- Bảng Mượn Sách
CREATE TABLE MuonSach (
    MaMuon INT PRIMARY KEY IDENTITY(1,1),
    MaSV CHAR(10) NOT NULL,
    MaSach INT NOT NULL,
    NgayMuon DATE NOT NULL DEFAULT GETDATE() CHECK (NgayMuon <= GETDATE()),
    NgayTraDuKien DATE NOT NULL,
    NgayTraThucTe DATE,
    TrangThai NVARCHAR(20) NOT NULL CHECK (TrangThai IN (N'Đang mượn', N'Đã trả', N'Quá hạn')) DEFAULT N'Đang mượn',
    FOREIGN KEY (MaSV) REFERENCES SinhVien(MaSV) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (MaSach) REFERENCES Sach(MaSach) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT CHK_NgayTra CHECK (NgayTraDuKien > NgayMuon AND DATEDIFF(DAY, NgayMuon, NgayTraDuKien) <= 30 
        AND (NgayTraThucTe IS NULL OR NgayTraThucTe >= NgayMuon))
);

-- Bảng Phiếu Phạt
CREATE TABLE PhieuPhat (
    MaPhieuPhat INT PRIMARY KEY IDENTITY(1,1),
    MaMuon INT NOT NULL,
    LyDo NVARCHAR(100) NOT NULL CHECK (LEN(LyDo) > 10),
    SoTienPhat DECIMAL(10,2) NOT NULL CHECK (SoTienPhat > 0),
    NgayPhat DATE NOT NULL DEFAULT GETDATE(),
    TrangThai NVARCHAR(20) NOT NULL CHECK (TrangThai IN (N'Quá hạn', N'Đã đóng phạt')) DEFAULT N'Quá hạn',
    FOREIGN KEY (MaMuon) REFERENCES MuonSach(MaMuon) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Bảng Vai Trò
CREATE TABLE VaiTro (
    MaVaiTro INT PRIMARY KEY IDENTITY(1,1),
    TenVaiTro NVARCHAR(20) NOT NULL UNIQUE CHECK (TenVaiTro IN ('Admin', 'SinhVien')),
    MoTa NVARCHAR(255)
);

-- Bảng Tài Khoản
CREATE TABLE TaiKhoan (
    MaTaiKhoan INT PRIMARY KEY IDENTITY(1,1),
    TenDangNhap NVARCHAR(50) NOT NULL UNIQUE CHECK (LEN(TenDangNhap) >= 6),
    MatKhau NVARCHAR(255) NOT NULL CHECK (LEN(MatKhau) >= 8),
    MaVaiTro INT NOT NULL,
    MaSV CHAR(10),
    FOREIGN KEY (MaVaiTro) REFERENCES VaiTro(MaVaiTro) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (MaSV) REFERENCES SinhVien(MaSV) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Bảng Giỏ Sách
CREATE TABLE GioSach (
    MaGio INT PRIMARY KEY IDENTITY(1,1),
    MaSV CHAR(10) NOT NULL,
    MaSach INT NOT NULL,
    SoLuong INT NOT NULL CHECK (SoLuong > 0),
    NgayThem DATE NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (MaSV) REFERENCES SinhVien(MaSV) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (MaSach) REFERENCES Sach(MaSach) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Thêm chỉ mục (index) để tối ưu hóa truy vấn
CREATE INDEX IDX_Sach_MaViTri ON Sach(MaViTri);
CREATE INDEX IDX_Sach_TheLoai_MaSach ON Sach_TheLoai(MaSach);
CREATE INDEX IDX_Sach_TheLoai_MaTheLoai ON Sach_TheLoai(MaTheLoai);
CREATE INDEX IDX_MuonSach_MaSV ON MuonSach(MaSV);
CREATE INDEX IDX_MuonSach_MaSach ON MuonSach(MaSach);
CREATE INDEX IDX_PhieuPhat_MaMuon ON PhieuPhat(MaMuon);
CREATE INDEX IDX_TaiKhoan_MaVaiTro ON TaiKhoan(MaVaiTro);
CREATE INDEX IDX_GioSach_MaSV ON GioSach(MaSV);
CREATE INDEX IDX_GioSach_MaSach ON GioSach(MaSach);