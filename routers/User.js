import express from 'express';
import { addTask, deleteTask, forgetPassword, getMyProfile, login, logout, register, resetPassword, updatePassword, updateProfile, updateTask, verify } from '../controllers/user.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

router.route('/register').post(register);
router.route('/verify').post(isAuthenticated, verify);
router.route('/login').post(login);
router.route("/logout").get(logout);

router.route('/me').get(isAuthenticated, getMyProfile);
router.route('/updateProfile').put(isAuthenticated, updateProfile);
router.route('/updatePassword').put(isAuthenticated, updatePassword);
router.route('/resetPassword').put(resetPassword);
router.route('/forgetPassword').post(forgetPassword);


router.route('/newTask').post(isAuthenticated, addTask);
router.route('/task/:taskId').get(isAuthenticated, updateTask)
router.route('/task/:taskId').delete(isAuthenticated, deleteTask)

export default  router;