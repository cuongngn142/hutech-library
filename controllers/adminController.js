const db = require('../config/db');
const BookModel = require('../models/bookModel');

// Hiển thị trang quản lý phiếu phạt
exports.getFinesPage = async (req, res) => {
    try {
        const fines = await BookModel.getAllFines();
        res.render('admin/fines', {
            title: 'Quản lý Phiếu Phạt',
            user: req.session.user,
            fines: fines,
            path: '/admin/fines'
        });
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/admin/books?error=Có lỗi xảy ra khi tải trang quản lý phiếu phạt');
    }
};

// Tạo phiếu phạt mới
exports.createFine = async (req, res) => {
    try {
        const { maMuon, lyDo, soTienPhat } = req.body;
        
        // Kiểm tra phiếu mượn tồn tại
        const borrow = await BookModel.getBorrowById(maMuon);
        if (!borrow) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu mượn' });
        }

        // Tạo phiếu phạt
        await BookModel.createFine(maMuon, lyDo, soTienPhat);
        
        res.json({ success: true, message: 'Tạo phiếu phạt thành công' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi tạo phiếu phạt' });
    }
};

// Xóa phiếu phạt
exports.deleteFine = async (req, res) => {
    try {
        const { id } = req.params;
        await BookModel.deleteFine(id);
        res.json({ success: true, message: 'Xóa phiếu phạt thành công' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi xóa phiếu phạt' });
    }
};

// Xử lý trả sách
exports.returnBook = async (req, res) => {
    try {
        const { maMuon, maSV } = req.body;
        
        // Kiểm tra phiếu mượn tồn tại
        const borrow = await BookModel.getBorrowById(maMuon);
        if (!borrow) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu mượn' });
        }

        // Trả sách
        await BookModel.returnBook(maMuon, maSV);
        
        res.json({ success: true, message: 'Cập nhật trạng thái trả sách thành công' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi cập nhật trạng thái trả sách' });
    }
};

// Cập nhật phiếu phạt
exports.updateFine = async (req, res) => {
    try {
        const { id } = req.params;
        const { lyDo, soTienPhat } = req.body;
        
        // Kiểm tra phiếu phạt tồn tại
        const fine = await BookModel.getFineById(id);
        if (!fine) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu phạt' });
        }

        // Cập nhật phiếu phạt
        await BookModel.updateFine(id, lyDo, soTienPhat);
        
        res.json({ success: true, message: 'Cập nhật phiếu phạt thành công' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi cập nhật phiếu phạt' });
    }
};

// Xác nhận đóng phạt
exports.markFineAsPaid = async (req, res) => {
    try {
        const maPhieuPhat = parseInt(req.params.id);
        await BookModel.markFineAsPaid(maPhieuPhat);
        res.json({ success: true });
    } catch (error) {
        console.error('Error in markFineAsPaid:', error);
        res.status(500).json({ message: error.message });
    }
};

// Trang dashboard
exports.getDashboardPage = async (req, res) => {
    try {
        const dashboardData = await BookModel.getDashboardStats();
        res.render('admin/dashboard', {
            title: 'Dashboard',
            user: req.session.user,
            ...dashboardData
        });
    } catch (error) {
        console.error('Error in getDashboardPage:', error);
        res.redirect('/');
    }
};

// Trang quản lý sinh viên
exports.getStudentsPage = async (req, res) => {
    try {
        const students = await BookModel.getAllStudents();
        res.render('admin/students', {
            title: 'Quản lý sinh viên',
            user: req.session.user,
            students,
            success_msg: req.flash('success'),
            error_msg: req.flash('error')
        });
    } catch (error) {
        console.error('Error in getStudentsPage:', error);
        req.flash('error', 'Có lỗi xảy ra khi tải danh sách sinh viên');
        res.redirect('/admin');
    }
};

// Thêm sinh viên mới
exports.addStudent = async (req, res) => {
    try {
        const { maSV, hoTen, email, ngayHetHan } = req.body;
        await BookModel.addStudent(maSV, hoTen, email, ngayHetHan);
        req.flash('success', 'Thêm sinh viên thành công');
        res.redirect('/admin/students');
    } catch (error) {
        console.error('Error in addStudent:', error);
        req.flash('error', error.message || 'Có lỗi xảy ra khi thêm sinh viên');
        res.redirect('/admin/students');
    }
};

// Cập nhật thông tin sinh viên
exports.updateStudent = async (req, res) => {
    try {
        const { maSV } = req.params;
        const { hoTen, email, ngayHetHan } = req.body;
        await BookModel.updateStudent(maSV, hoTen, email, ngayHetHan);
        req.flash('success', 'Cập nhật thông tin sinh viên thành công');
        res.redirect('/admin/students');
    } catch (error) {
        console.error('Error in updateStudent:', error);
        req.flash('error', error.message || 'Có lỗi xảy ra khi cập nhật thông tin sinh viên');
        res.redirect('/admin/students');
    }
};

// Xóa sinh viên
exports.deleteStudent = async (req, res) => {
    try {
        const { maSV } = req.params;
        await BookModel.deleteStudent(maSV);
        res.json({ success: true });
    } catch (error) {
        console.error('Error in deleteStudent:', error);
        res.status(500).json({ message: error.message });
    }
}; 