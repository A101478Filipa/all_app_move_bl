import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import express from 'express';
import cookieParser from 'cookie-parser';
import apiRoutes from './apiRoutes';
import { logRequest } from './middleware/logMiddleware';
import { TokenCleanupService } from './services/tokenCleanupService';
import externalAccessRoutes from './modules/externalAccess/externalAccessRoutes';
import { authenticate } from './middleware/authMiddleware';

// Initialize express app
const app = express();
// Railway injects PORT; fall back to SERVER_PORT for local dev, then 3000
const port = process.env.PORT || process.env.SERVER_PORT || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(logRequest); // ! Used for debug. Remove later

app.use('/api/external-access', externalAccessRoutes);

// Routes
app.use('/api', authenticate, apiRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../../public/uploads')));
app.use('/default', express.static(path.join(__dirname, '../../public/default')));

// Start Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);

  TokenCleanupService.startPeriodicCleanup(24);
});