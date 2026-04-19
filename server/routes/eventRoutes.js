import express from 'express';
import { requireAuth, requireOrganizer } from '../middlewares/authMiddleware.js';
import { getAllEvents, createEvent, updateEvent, deleteEvent, buyTicket, addCoOrganizer, removeCoOrganizer, toggleFavorite, scanTicket } from '../controllers/eventController.js';
import { authorize } from '../utils/rbac.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.get('/', getAllEvents);
router.post('/', requireAuth, authorize('event:create'), upload.single('image'), createEvent);
router.put('/:id', requireAuth, authorize('event:edit_own'), upload.single('image'), updateEvent);
router.delete('/:id', requireAuth, authorize('event:delete_own'), deleteEvent);
router.post('/:id/buy', requireAuth, authorize('event:buy_ticket'), buyTicket);
router.post('/:id/coorganizers', requireAuth, authorize('event:manage_coorganizers'), addCoOrganizer);
router.delete('/:id/coorganizers', requireAuth, authorize('event:manage_coorganizers'), removeCoOrganizer);

router.post('/:id/favorite', requireAuth, toggleFavorite);
router.post('/:id/scan', requireAuth, scanTicket);

export default router;
