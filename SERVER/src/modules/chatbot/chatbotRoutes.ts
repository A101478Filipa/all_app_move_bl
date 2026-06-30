import express from 'express';
import { askHelp, getHelpSuggestions } from './chatbotController';
import { authenticate } from '../../middleware/authMiddleware';

const router = express.Router();

router.post('/ask', authenticate, askHelp);
router.get('/suggestions', authenticate, getHelpSuggestions);

export default router;
