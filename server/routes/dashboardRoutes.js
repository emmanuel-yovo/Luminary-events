import express from 'express';
import { requireAuth, requireOrganizer } from '../middlewares/authMiddleware.js';
import { getDashboardStats } from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/', requireAuth, requireOrganizer, getDashboardStats);

export default router;
