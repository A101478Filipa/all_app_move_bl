import { UserRole } from 'moveplus-shared';

/**
 * Help-only knowledge base for the in-app assistant (Phase 1).
 *
 * No patient data is read or sent anywhere. Each entry maps a list of
 * keyword variants (PT + EN) to a curated answer the assistant can return.
 *
 * To add a new answer:
 *  1. Add an entry to HELP_ENTRIES with id, keywords (lowercase), answer (PT/EN)
 *     and optional `roles` filter.
 *  2. Optionally add it to SUGGESTED_QUESTIONS so users can tap it directly.
 */

export type HelpLang = 'pt' | 'en';

export interface HelpEntry {
  id: string;
  keywords: string[];
  answer: Record<HelpLang, string>;
  roles?: UserRole[];
}

export const HELP_ENTRIES: HelpEntry[] = [
  {
    id: 'add-elderly',
    keywords: [
      'adicionar utente', 'novo utente', 'criar utente', 'registar utente',
      'add elderly', 'new elderly', 'register elderly', 'add patient',
    ],
    roles: [UserRole.INSTITUTION_ADMIN, UserRole.CAREGIVER, UserRole.CLINICIAN],
    answer: {
      pt: 'Para adicionar um utente: abra o separador "Membros" da instituição, toque no botão "+" no canto superior direito e escolha "Convidar utente". Preencha o email/telefone e a função "Utente" e envie o convite. O utente recebe um link para concluir o registo.',
      en: 'To add an elderly: open the institution "Members" tab, tap the "+" button in the top right and pick "Invite elderly". Fill in the email/phone and the "Elderly" role and send the invitation. The elderly will receive a link to finish the registration.',
    },
  },
  {
    id: 'register-fall',
    keywords: [
      'registar queda', 'adicionar queda', 'inserir queda', 'reportar queda',
      'register fall', 'add fall', 'report fall', 'log fall',
    ],
    answer: {
      pt: 'Para registar uma queda manualmente: entre no perfil do utente, abra o separador "Quedas" e toque em "+". Preencha a data, descrição e se houve lesão. Se a queda foi detectada automaticamente pelo dispositivo, ela já aparece como ocorrência pendente, basta abrir e confirmar os dados.',
      en: 'To manually register a fall: open the elderly profile, go to the "Falls" tab and tap "+". Fill in date, description and whether there was injury. Falls detected automatically by the device already appear as pending occurrences — just open one and confirm the data.',
    },
  },
  {
    id: 'measurement-colors',
    keywords: [
      'cor da medição', 'cores das medições', 'verde amarelo vermelho', 'o que significa o vermelho',
      'measurement color', 'color meaning', 'red yellow green', 'status colors',
    ],
    answer: {
      pt: 'As cores indicam o estado de uma medição face aos valores de referência: verde = dentro do normal, amarelo = atenção, laranja = alerta, vermelho = crítico (sugere intervenção). Toque sobre a medição para ver o valor exacto e o intervalo de referência.',
      en: 'Measurement colors show how a reading compares to reference ranges: green = normal, yellow = caution, orange = warning, red = critical (suggests intervention). Tap a measurement to see the exact value and the reference range.',
    },
  },
  {
    id: 'fall-detection-setup',
    keywords: [
      'deteção de quedas', 'detecção de quedas', 'fall detection', 'activar deteção', 'sensor de quedas',
      'enable fall detection', 'sos button',
    ],
    answer: {
      pt: 'A deteção automática de quedas usa os sensores do dispositivo do utente. Verifique nas Definições do utente se a opção "Deteção de quedas" está activa e se o dispositivo tem permissões de sensores e notificações. Consulte o documento FALL_DETECTION_README para detalhes técnicos.',
      en: 'Automatic fall detection uses the elderly device sensors. In the elderly Settings, make sure "Fall detection" is enabled and the device has sensor and notification permissions granted. See FALL_DETECTION_README for technical details.',
    },
  },
  {
    id: 'invitations',
    keywords: [
      'convite', 'convidar', 'reenviar convite', 'convite expirou',
      'invitation', 'invite', 'resend invitation', 'invite expired',
    ],
    roles: [UserRole.INSTITUTION_ADMIN, UserRole.CAREGIVER, UserRole.CLINICIAN],
    answer: {
      pt: 'Os convites são geridos em "Conta > Ver convites". Pode reenviar, cancelar ou ver o estado (pendente, aceite, expirado). Um convite expira ao fim de alguns dias; se isso acontecer, basta cancelar e criar um novo.',
      en: 'Invitations are managed under "Account > View invitations". You can resend, cancel or check status (pending, accepted, expired). An invitation expires after a few days — if it does, just cancel it and create a new one.',
    },
  },
  {
    id: 'forgot-password',
    keywords: [
      'esqueci password', 'esqueci palavra-passe', 'recuperar password', 'redefinir password',
      'forgot password', 'reset password', 'change password',
    ],
    answer: {
      pt: 'No ecrã de login toque em "Esqueceu a palavra-passe?", introduza o seu email e siga o link enviado para definir uma nova. Se já tem sessão iniciada, pode mudar a palavra-passe em Conta > Definições.',
      en: 'On the login screen tap "Forgot password?", enter your email and follow the link sent to set a new one. If you are already signed in, you can change your password in Account > Settings.',
    },
  },
  {
    id: 'notifications',
    keywords: [
      'notificações', 'centro de notificações', 'não recebo notificações', 'push',
      'notifications', 'notification center', 'not receiving notifications',
    ],
    answer: {
      pt: 'Veja todas as notificações em Conta > Notificações. Se não está a receber notificações push, confirme nas definições do telemóvel que a app tem permissão e que iniciou sessão pelo menos uma vez com o dispositivo ligado à internet.',
      en: 'See all notifications under Account > Notifications. If you are not getting push notifications, check in your phone settings that the app has permission and that you have signed in at least once with the device online.',
    },
  },
  {
    id: 'schedule',
    keywords: [
      'horário', 'meu horário', 'turno', 'escala', 'gerir horário',
      'my schedule', 'shifts', 'roster',
    ],
    roles: [UserRole.CLINICIAN, UserRole.CAREGIVER, UserRole.INSTITUTION_ADMIN],
    answer: {
      pt: 'O seu horário está em Conta > O Meu Horário. Os administradores da instituição podem editar horários de todos os profissionais a partir da ficha de cada membro.',
      en: 'Your schedule is under Account > My Schedule. Institution admins can edit schedules of all professionals from each member profile.',
    },
  },
  {
    id: 'time-off',
    keywords: [
      'férias', 'pedir folga', 'baixa médica', 'ausência',
      'time off', 'vacation', 'request day off', 'sick leave',
    ],
    answer: {
      pt: 'Para pedir férias, folga ou baixa, abra Conta > O Meu Horário e toque em "Pedir ausência". O pedido fica pendente até o administrador aprovar ou rejeitar.',
      en: 'To request vacation, day off or sick leave, open Account > My Schedule and tap "Request time off". The request stays pending until an admin approves or denies it.',
    },
  },
  {
    id: 'privacy-data',
    keywords: [
      'privacidade', 'dados clínicos', 'rgpd', 'chatbot',
      'privacy', 'data', 'gdpr',
    ],
    answer: {
      pt: 'Este assistente só responde a perguntas sobre como usar a aplicação. Não acede a dados clínicos dos utentes nem envia informação pessoal para serviços externos.',
      en: 'This assistant only answers questions about how to use the app. It does not access patient clinical data and does not send personal information to external services.',
    },
  },
];

export const SUGGESTED_QUESTIONS: Record<HelpLang, { id: string; question: string }[]> = {
  pt: [
    { id: 'add-elderly', question: 'Como adiciono um utente?' },
    { id: 'register-fall', question: 'Como registo uma queda?' },
    { id: 'measurement-colors', question: 'O que significam as cores das medições?' },
    { id: 'invitations', question: 'Como gerir convites?' },
    { id: 'forgot-password', question: 'Esqueci-me da palavra-passe' },
    { id: 'privacy-data', question: 'Que dados é que este assistente vê?' },
  ],
  en: [
    { id: 'add-elderly', question: 'How do I add an elderly?' },
    { id: 'register-fall', question: 'How do I register a fall?' },
    { id: 'measurement-colors', question: 'What do measurement colors mean?' },
    { id: 'invitations', question: 'How do I manage invitations?' },
    { id: 'forgot-password', question: 'I forgot my password' },
    { id: 'privacy-data', question: 'What data does this assistant see?' },
  ],
};

const FALLBACK: Record<HelpLang, string> = {
  pt: 'Ainda não tenho uma resposta para isso. Tente reformular ou escolha uma das sugestões abaixo. Lembre-se que de momento só respondo a perguntas sobre como usar a aplicação, não tenho acesso a dados de utentes.',
  en: 'I don\'t have an answer for that yet. Try rephrasing or pick one of the suggestions below. For now I can only answer questions about how to use the app — I do not have access to patient data.',
};

const stripDiacritics = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const normalize = (s: string) => stripDiacritics(s.toLowerCase()).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

export interface MatchResult {
  entryId: string | null;
  answer: string;
  matched: boolean;
}

export function matchHelpEntry(question: string, lang: HelpLang, role?: UserRole): MatchResult {
  const q = normalize(question);
  if (!q) {
    return { entryId: null, answer: FALLBACK[lang], matched: false };
  }

  let best: { entry: HelpEntry; score: number } | null = null;

  for (const entry of HELP_ENTRIES) {
    if (entry.roles && role && !entry.roles.includes(role)) continue;

    let score = 0;
    for (const kw of entry.keywords) {
      const nk = normalize(kw);
      if (!nk) continue;
      if (q.includes(nk)) {
        score += nk.split(' ').length * 2;
        continue;
      }
      const tokens = nk.split(' ').filter(t => t.length > 2);
      const hits = tokens.filter(t => q.includes(t)).length;
      if (hits > 0 && hits === tokens.length) {
        score += hits;
      }
    }

    if (score > 0 && (!best || score > best.score)) {
      best = { entry, score };
    }
  }

  if (!best) {
    return { entryId: null, answer: FALLBACK[lang], matched: false };
  }

  return { entryId: best.entry.id, answer: best.entry.answer[lang], matched: true };
}

export function getSuggestions(lang: HelpLang, role?: UserRole): { id: string; question: string }[] {
  const list = SUGGESTED_QUESTIONS[lang];
  if (!role) return list;
  return list.filter(s => {
    const entry = HELP_ENTRIES.find(e => e.id === s.id);
    if (!entry || !entry.roles) return true;
    return entry.roles.includes(role);
  });
}
