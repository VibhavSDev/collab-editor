import { Router } from 'express';
import { createDocument, getUserDocuments } from '../controllers/documentController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.post('/', createDocument);
router.get('/', getUserDocuments);

export default router;