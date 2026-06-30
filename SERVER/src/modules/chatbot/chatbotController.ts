import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../constants/AuthenticatedRequest';
import { sendSuccess, sendError, sendInputValidationError } from '../../utils/apiResponse';
import {
  matchHelpEntry,
  getEntryById,
  getSuggestions,
  getWelcome,
  detectDataQuery,
  HelpLang,
} from './helpKnowledgeBase';
import { askLlm, llmEnabled } from './llmService';

const askSchema = z.object({
  question: z.string().min(1).max(500),
  lang: z.enum(['pt', 'en']).optional(),
  /** When set, returns the entry with this id directly (used by suggestion chips). */
  entryId: z.string().min(1).max(64).optional(),
});

const parseLang = (raw: unknown): HelpLang => (raw === 'en' ? 'en' : 'pt');

/**
 * In-app assistant endpoint.
 *
 * 1) If `entryId` is passed (suggestion chip), returns that KB entry directly.
 * 2) Otherwise runs the deterministic matcher over the curated KB.
 * 3) If the matcher misses and the LLM fallback is configured (GROQ_API_KEY),
 *    asks the LLM. The LLM only receives the user's question, language and
 *    role label — never patient data.
 * 4) If everything fails, returns the static "I don't know" answer + suggestions.
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

  // If the user is asking for live data (counts, lists, averages over real
  // records), short-circuit with a clear refusal — we have no DB access
  // here and we don't want the LLM inventing numbers.
  if (!parsed.data.entryId) {
    const dataQuery = detectDataQuery(parsed.data.question, lang, role);
    if (dataQuery) {
      const action = dataQuery.action
        ? { id: dataQuery.action.id, label: dataQuery.action.label[lang] }
        : null;
      return sendSuccess(res, {
        answer: dataQuery.answer,
        matched: true,
        entryId: null,
        action,
        source: 'kb',
        suggestions: [],
      }, 'OK');
    }
  }

  const result = parsed.data.entryId
    ? getEntryById(parsed.data.entryId, lang, role) ?? matchHelpEntry(parsed.data.question, lang, role)
    : matchHelpEntry(parsed.data.question, lang, role);

  // KB hit (deterministic) — return as-is.
  if (result.matched) {
    const action = result.action
      ? { id: result.action.id, label: result.action.label[lang] }
      : null;
    return sendSuccess(res, {
      answer: result.answer,
      matched: true,
      entryId: result.entryId,
      action,
      source: 'kb',
      suggestions: [],
    }, 'OK');
  }

  // KB miss — try the LLM fallback.
  if (llmEnabled()) {
    const llmAnswer = await askLlm(parsed.data.question, lang, role);
    if (llmAnswer) {
      return sendSuccess(res, {
        answer: llmAnswer,
        matched: true,
        entryId: null,
        action: null,
        source: 'llm',
        suggestions: [],
      }, 'OK');
    }
  }

  // Nothing worked — static fallback + suggestions to help the user retry.
  return sendSuccess(res, {
    answer: result.answer,
    matched: false,
    entryId: null,
    action: null,
    source: 'fallback',
    suggestions: getSuggestions(lang, role),
  }, 'OK');
};

export const getHelpSuggestions = async (req: AuthenticatedRequest, res: Response) => {
  const lang = parseLang(req.query.lang);
  const role = req.user?.role;
  return sendSuccess(res, { suggestions: getSuggestions(lang, role) }, 'OK');
};

/**
 * Returns role-aware welcome message + initial suggestions used when the
 * chat is first opened. Keeps role logic on the server side.
 */
export const getHelpInit = async (req: AuthenticatedRequest, res: Response) => {
  const lang = parseLang(req.query.lang);
  const role = req.user?.role;
  return sendSuccess(res, {
    welcome: getWelcome(lang, role),
    suggestions: getSuggestions(lang, role),
  }, 'OK');
};
