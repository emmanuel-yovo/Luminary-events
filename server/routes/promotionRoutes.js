import express from 'express';
import { requireAuth, requireAdmin } from '../middlewares/authMiddleware.js';
import { requestPromotion, getMyRequestStatus, getAllRequests, approveRequest, rejectRequest } from '../controllers/promotionController.js';

const router = express.Router();

// User routes (authenticated)
router.post('/request', requireAuth, requestPromotion);
router.get('/my-status', requireAuth, getMyRequestStatus);

// Admin routes
router.get('/all', requireAuth, requireAdmin, getAllRequests);
router.put('/:id/approve', requireAuth, requireAdmin, approveRequest);
router.put('/:id/reject', requireAuth, requireAdmin, rejectRequest);

export default router;
