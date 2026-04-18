import express from 'express';
import * as controller from './authController';
import registerRoutes from './register/registerRoutes';

const authRoutes = express.Router();

// Define routes
authRoutes.get('/check-username', controller.checkUsername);
authRoutes.get('/check-email', controller.checkEmail);
authRoutes.post('/login', controller.login);
authRoutes.post('/refresh-token', controller.refreshToken);
authRoutes.post('/logout', controller.logout);
authRoutes.post('/logout-all', controller.logoutAll);
authRoutes.post('/complete-profile', controller.completeProfile);

// Define nested routes
authRoutes.use('/register', registerRoutes);

export default authRoutes;