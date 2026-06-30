import { UserRole } from 'moveplus-shared';
import { HELP_ENTRIES, HelpLang } from './helpKnowledgeBase';

/**
 * Optional free-tier LLM fallback for the in-app assistant.
 *
 * Calls Groq's OpenAI-compatible Chat Completions endpoint with a tight
 * system prompt that:
 *   - confines answers to "how to use the app"
 *   - forbids clinical advice or any mention of specific patient data
 *   - responds in the user's language and stays short
 *
 * No patient data is ever sent. The request body only contains the user's
 * question, their role name, and a static summary of the knowledge base
 * topics so the model can suggest existing features.
 *
 * If GROQ_API_KEY is not set, askLlm() returns null and the caller falls
 * back to the static "I don't know" message.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Free, fast, instruction-tuned model. Free tier: ~30 req/min.
const GROQ_MODEL = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile';
const REQUEST_TIMEOUT_MS = 8000;
const MAX_OUTPUT_TOKENS = 220;

const ROLE_DESCRIPTIONS: Record<UserRole, { pt: string; en: string }> = {
  [UserRole.ELDERLY]: {
    pt: 'um utente idoso que usa a aplicação',
    en: 'an elderly patient using the app',
  },
  [UserRole.CAREGIVER]: {
    pt: 'um cuidador que acompanha utentes da instituição',
    en: 'a caregiver who looks after elderly residents',
  },
  [UserRole.CLINICIAN]: {
    pt: 'um clínico (médico, fisioterapeuta, enfermeiro) da instituição',
    en: 'a clinician (doctor, physiotherapist, nurse) of the institution',
  },
  [UserRole.INSTITUTION_ADMIN]: {
    pt: 'um administrador da instituição',
    en: 'an institution administrator',
  },
  [UserRole.PROGRAMMER]: {
    pt: 'um administrador técnico da plataforma',
    en: 'a platform technical administrator',
  },
  [UserRole.UNKNOWN]: {
    pt: 'um utilizador da aplicação',
    en: 'an app user',
  },
};

/** Compact list of KB topics the LLM can refer the user to. */
function buildTopicsBlock(): string {
  return HELP_ENTRIES
    .map(e => `- ${e.id}: ${e.answer.pt.slice(0, 80).replace(/\s+/g, ' ')}`)
    .join('\n');
}

let _cachedTopics: string | null = null;
function getTopicsBlock(): string {
  if (!_cachedTopics) _cachedTopics = buildTopicsBlock();
  return _cachedTopics;
}

function buildSystemPrompt(lang: HelpLang, role: UserRole | undefined): string {
  const r = role ?? UserRole.UNKNOWN;
  const roleDesc = ROLE_DESCRIPTIONS[r]?.[lang] ?? ROLE_DESCRIPTIONS[UserRole.UNKNOWN][lang];

  if (lang === 'pt') {
    return [
      'És o assistente da aplicação móvel "appMove", uma plataforma de monitorização de utentes idosos em instituições.',
      `O utilizador é ${roleDesc}.`,
      '',
      'Regras OBRIGATÓRIAS:',
      '1. Só respondes a perguntas sobre COMO USAR a aplicação (navegação, funcionalidades, ecrãs, definições).',
      '2. NUNCA dás conselhos clínicos, doses, diagnósticos ou interpretações médicas. Se te perguntarem isso, recusa educadamente e sugere consultar um profissional.',
      '3. NUNCA inventes funcionalidades que não existem. Se não tens a certeza, diz que não tens essa informação e sugere contactar a equipa da instituição.',
      '4. NUNCA referes nomes, dados pessoais ou clínicos de utentes específicos — não tens acesso a esses dados.',
      '5. NUNCA respondas com NÚMEROS, CONTAGENS, LISTAS, MÉDIAS ou QUALQUER VALOR sobre utentes, quedas, medições, eventos ou outros registos reais. Se a pergunta for "quantos/quantas", "lista de", "média de", "esta semana/mês", etc., RECUSA com: "Não tenho acesso a esses valores em tempo real — só ajudo com dúvidas sobre a app." e indica o ecrã onde o utilizador pode consultá-los.',
      '6. Responde sempre em Português, em texto simples (sem markdown), no máximo 4 frases curtas.',
      '7. Adapta a resposta ao papel do utilizador.',
      '',
      'Funcionalidades existentes na app (usa estes tópicos como referência do que existe):',
      getTopicsBlock(),
    ].join('\n');
  }

  return [
    'You are the assistant for the mobile app "appMove", a platform that monitors elderly residents in care institutions.',
    `The user is ${roleDesc}.`,
    '',
    'MANDATORY rules:',
    '1. Only answer questions about HOW TO USE the app (navigation, features, screens, settings).',
    '2. NEVER give clinical advice, dosages, diagnoses or medical interpretation. If asked, politely refuse and suggest consulting a professional.',
    '3. NEVER invent features that do not exist. If unsure, say you do not have that information and suggest contacting the institution team.',
    '4. NEVER refer to specific patient names or personal/clinical data — you do not have access to such data.',
    '5. NEVER answer with NUMBERS, COUNTS, LISTS, AVERAGES or ANY VALUE about residents, falls, measurements, events or other live records. If the question is "how many", "list of", "average of", "this week/month", etc., REFUSE with: "I do not have access to those live values — I only help with app usage." and point the user to the screen where they can check them.',
    '6. Always answer in English, plain text (no markdown), at most 4 short sentences.',
    '7. Tailor the answer to the user role.',
    '',
    'Existing app features (use these topics as the source of truth for what exists):',
    getTopicsBlock(),
  ].join('\n');
}

interface GroqMessage { role: 'system' | 'user' | 'assistant'; content: string; }
interface GroqResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

/**
 * Asks the LLM and returns the answer text, or null if the LLM is
 * unavailable / fails / produces an empty response.
 */
export async function askLlm(
  question: string,
  lang: HelpLang,
  role: UserRole | undefined,
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const messages: GroqMessage[] = [
    { role: 'system', content: buildSystemPrompt(lang, role) },
    { role: 'user', content: question },
  ];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const resp = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.2,
        max_tokens: MAX_OUTPUT_TOKENS,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!resp.ok) {
      console.warn('[chatbot] LLM request failed', resp.status, await resp.text().catch(() => ''));
      return null;
    }

    const data = (await resp.json()) as GroqResponse;
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return null;

    // Strip any accidental markdown the model might still emit.
    return text.replace(/^[*#>\-\s]+/, '').slice(0, 1200);
  } catch (err) {
    if ((err as { name?: string }).name === 'AbortError') {
      console.warn('[chatbot] LLM request timed out');
    } else {
      console.warn('[chatbot] LLM request error', err);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export const llmEnabled = (): boolean => !!process.env.GROQ_API_KEY;
