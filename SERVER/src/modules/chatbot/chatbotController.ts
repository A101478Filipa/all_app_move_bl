import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../constants/AuthenticatedRequest';
import { sendSuccess, sendError, sendInputValidationError } from '../../utils/apiResponse';
import {
  matchHelpEntry,
  getSuggestions,
  HelpLang,
} from './helpKnowledgeBase';

const askSchema = z.object({
  question: z.string().min(1).max(500),
  lang: z.enum(['pt', 'en']).optional(),
});

/**
 * Phase 1 of the in-app assistant.
 *
 * Receives a free-text question from an authenticated professional and
 * answers from a curated, deterministic help knowledge base. No patient
 * data is read here and nothing is sent to any external service.
 */
export const askHelp = async (req: AuthenticatedRequest, res: Response) => {
  const parsed = askSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendInputValidationError(res, 'Invalid request', parsed.error.flatten());
  }

  const userId = req.user?.userId;
  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  const lang: HelpLang = parsed.data.lang ?? 'pt';
  const role = req.user?.role;

  const result = matchHelpEntry(parsed.data.question, lang, role);

  return sendSuccess(res, {
    answer: result.answer,
    matched: result.matched,
    entryId: result.entryId,
    suggestions: result.matched ? [] : getSuggestions(lang, role),
  }, 'OK');
};

export const getHelpSuggestions = async (req: AuthenticatedRequest, res: Response) => {
  const lang: HelpLang = (req.query.lang === 'en' ? 'en' : 'pt');
  const role = req.user?.role;
  return sendSuccess(res, { suggestions: getSuggestions(lang, role) }, 'OK');
};
