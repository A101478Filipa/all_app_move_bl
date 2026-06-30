import express from 'express';
import { askHelp, getHelpSuggestions, getHelpInit } from './chatbotController';
import { authenticate } from '../../middleware/authMiddleware';

const router = express.Router();

router.post('/ask', authenticate, askHelp);
router.get('/suggestions', authenticate, getHelpSuggestions);
router.get('/init', authenticate, getHelpInit);

export default router;
