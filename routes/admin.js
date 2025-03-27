const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const adminController = require('../controllers/adminController');
const { isAdmin, isLoggedIn } = require('../middleware/auth');
const multer = require('multer');
const upload = multer();

// Đảm bảo tất cả các route đều được bảo vệ bởi middleware isAdmin
router.use(isAdmin);

// Dashboard
router.get('/', adminController.getDashboardPage);

// Quản lý sách
router.get('/books', bookController.getAdminBooksPage);
router.get('/books/add', bookController.getAddBookPage);
router.post('/books/add', upload.none(), bookController.addBook);
router.get('/books/edit/:id', bookController.getEditBookPage);
router.post('/books/edit/:id', upload.none(), bookController.updateBook);
router.post('/books/delete/:id', bookController.deleteBook);

// Quản lý mượn sách
router.get('/borrows', bookController.getAdminBorrowsPage);
router.post('/borrows/approve/:id', bookController.approveBorrow);
router.post('/borrows/reject/:id', bookController.rejectBorrow);
router.post('/borrows/return', adminController.returnBook);

// Quản lý phiếu phạt
router.get('/fines', adminController.getFinesPage);
router.post('/fines/create', adminController.createFine);
router.delete('/fines/:id', adminController.deleteFine);
router.post('/fines/:id/mark-paid', adminController.markFineAsPaid);

// Quản lý sinh viên
router.get('/students', adminController.getStudentsPage);
router.post('/students/add', adminController.addStudent);
router.post('/students/edit/:maSV', adminController.updateStudent);
router.post('/students/delete/:maSV', adminController.deleteStudent);

module.exports = router; 