const express = require('express');
const onlyVerified = require('../middleware/onlyVerified');
const isAdmin = require('../middleware/isAdmin');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

//Sign,login

router.post('/signup', authController.userSignup);
router.post('/login', authController.login);

// verify,resendVerify

router.get('/verifyEmail/:token', authController.verifyEmail);
router.post('/resendVerifyEmail', authController.resendVerifyEmail);

//password

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.post('/recoverAccount', authController.recoverAccount);
router.patch('/resetAccount/:token', authController.resetAccountToken);

// protect All

router.use(authController.protect);

// Me Controller
router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUserID);
router.patch('/updateMe', onlyVerified, userController.updateMe);
router.delete('/deleteMe', onlyVerified, userController.deleteMe);

// Admin => Users
router.use(authController.restrictTo('admin'));
router.post('/createAdmin', onlyVerified, authController.creatAdmin);
router.route('/').get(userController.getAllUsers).post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUserID)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);
module.exports = router;
