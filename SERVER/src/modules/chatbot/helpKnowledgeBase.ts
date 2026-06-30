import { UserRole } from 'moveplus-shared';

/**
 * Help-only knowledge base for the in-app assistant (Phase 1).
 *
 * No patient data is read or sent anywhere. Each entry maps a list of
 * keyword variants (PT + EN) to a curated answer, optionally filtered
 * by the user's role so each professional / elderly sees content that
 * matches what they can actually do in the app.
 */

export type HelpLang = 'pt' | 'en';

export interface HelpEntry {
  id: string;
  keywords: string[];
  answer: Record<HelpLang, string>;
  /** If omitted, entry is visible to every role. */
  roles?: UserRole[];
}

export const HELP_ENTRIES: HelpEntry[] = [
  // ===================== Shared (everyone) =====================
  {
    id: 'forgot-password',
    keywords: [
      'esqueci password', 'esqueci palavra-passe', 'recuperar password', 'redefinir password', 'mudar password',
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
    id: 'change-language',
    keywords: [
      'mudar idioma', 'alterar lingua', 'mudar lingua', 'português', 'inglês',
      'change language', 'switch language', 'portuguese', 'english',
    ],
    answer: {
      pt: 'Pode alterar o idioma em Conta > Definições. A aplicação está disponível em Português e Inglês.',
      en: 'You can change the language in Account > Settings. The app is available in Portuguese and English.',
    },
  },
  {
    id: 'privacy-data',
    keywords: [
      'privacidade', 'dados clínicos', 'rgpd', 'chatbot vê', 'assistente vê',
      'privacy', 'data', 'gdpr', 'what does the bot see',
    ],
    answer: {
      pt: 'Este assistente só responde a perguntas sobre como usar a aplicação. Não acede a dados clínicos dos utentes nem envia informação pessoal para serviços externos. A sua pergunta não é guardada.',
      en: 'This assistant only answers questions about how to use the app. It does not access patient clinical data and does not send personal information to external services. Your question is not stored.',
    },
  },
  {
    id: 'logout',
    keywords: [
      'terminar sessão', 'logout', 'sair', 'sign out',
    ],
    answer: {
      pt: 'Para terminar sessão, abra o separador Conta e toque em "Terminar Sessão" no fim do menu.',
      en: 'To sign out, open the Account tab and tap "Logout" at the bottom of the menu.',
    },
  },

  // ===================== Elderly =====================
  {
    id: 'sos-button',
    roles: [UserRole.ELDERLY],
    keywords: [
      'sos', 'pedir ajuda', 'botão de emergência', 'alerta', 'cai',
      'help button', 'emergency', 'call for help',
    ],
    answer: {
      pt: 'Para pedir ajuda imediata, toque no botão SOS grande no seu ecrã principal. Os seus cuidadores são notificados de imediato. Se foi engano, tem alguns segundos para cancelar antes do alerta ser enviado.',
      en: 'To ask for immediate help, tap the big SOS button on your home screen. Your caregivers will be notified right away. If it was a mistake, you have a few seconds to cancel before the alert is sent.',
    },
  },
  {
    id: 'elderly-my-measurements',
    roles: [UserRole.ELDERLY],
    keywords: [
      'as minhas medições', 'meus dados', 'tensão', 'peso',
      'my measurements', 'my readings', 'blood pressure', 'weight',
    ],
    answer: {
      pt: 'Pode ver as suas medições no separador Perfil. Toque em cada medição para ver o valor e quando foi registado. Quem regista as medições é o seu cuidador ou clínico.',
      en: 'You can see your measurements in the Profile tab. Tap each measurement to see the value and when it was recorded. Measurements are entered by your caregiver or clinician.',
    },
  },
  {
    id: 'elderly-schedule',
    roles: [UserRole.ELDERLY],
    keywords: [
      'meus eventos', 'minha agenda', 'consultas', 'banho', 'refeição',
      'my events', 'my schedule', 'appointments', 'bath', 'meal',
    ],
    answer: {
      pt: 'No separador Perfil pode ver os seus eventos agendados (consultas, banho, fisioterapia, etc.). Os eventos são criados pela equipa da instituição.',
      en: 'In the Profile tab you can see your scheduled events (appointments, bath, physiotherapy, etc.). Events are created by the institution team.',
    },
  },

  // ===================== Caregiver + Clinician + Admin (work with elderly) =====================
  {
    id: 'register-fall',
    roles: [UserRole.CAREGIVER, UserRole.CLINICIAN, UserRole.INSTITUTION_ADMIN],
    keywords: [
      'registar queda', 'adicionar queda', 'inserir queda', 'reportar queda',
      'register fall', 'add fall', 'report fall', 'log fall',
    ],
    answer: {
      pt: 'Para registar uma queda manualmente: entre no perfil do utente, abra o separador "Quedas" e toque em "+". Preencha a data, descrição e se houve lesão. Se a queda foi detectada automaticamente pelo dispositivo, ela já aparece como ocorrência pendente — basta abrir e confirmar os dados.',
      en: 'To manually register a fall: open the elderly profile, go to the "Falls" tab and tap "+". Fill in date, description and whether there was injury. Falls detected automatically by the device already appear as pending occurrences — just open one and confirm the data.',
    },
  },
  {
    id: 'add-measurement',
    roles: [UserRole.CAREGIVER, UserRole.CLINICIAN, UserRole.INSTITUTION_ADMIN],
    keywords: [
      'adicionar medição', 'registar medição', 'tensão', 'peso', 'glicemia',
      'add measurement', 'record measurement', 'blood pressure', 'glucose',
    ],
    answer: {
      pt: 'Para adicionar uma medição: entre no perfil do utente, abra o separador "Medições" e toque em "+". Escolha o tipo (tensão, peso, glicemia, etc.), introduza o valor e guarde.',
      en: 'To add a measurement: open the elderly profile, go to the "Measurements" tab and tap "+". Pick the type (blood pressure, weight, glucose, etc.), enter the value and save.',
    },
  },
  {
    id: 'measurement-colors',
    roles: [UserRole.CAREGIVER, UserRole.CLINICIAN, UserRole.INSTITUTION_ADMIN, UserRole.ELDERLY],
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
    id: 'view-elderly-profile',
    roles: [UserRole.CAREGIVER, UserRole.CLINICIAN, UserRole.INSTITUTION_ADMIN],
    keywords: [
      'ver utente', 'abrir utente', 'ficha do utente', 'cronograma',
      'open elderly', 'view elderly', 'elderly profile', 'timeline',
    ],
    answer: {
      pt: 'Em Membros abra a lista de utentes e toque sobre o nome para abrir a ficha. Lá tem separadores para Medições, Medicação, Patologias, Quedas, Eventos e o Cronograma com todos os acontecimentos recentes.',
      en: 'In Members open the elderly list and tap a name to open the profile. There you have tabs for Measurements, Medication, Pathologies, Falls, Events and a Timeline with all recent activity.',
    },
  },
  {
    id: 'wound-tracking',
    roles: [UserRole.CAREGIVER, UserRole.CLINICIAN],
    keywords: [
      'ferida', 'tratamento de feridas', 'foto da ferida',
      'wound', 'wound tracking', 'wound photo',
    ],
    answer: {
      pt: 'Para acompanhar uma ferida abra a ocorrência de queda ou SOS associada e use a opção "Acompanhamento de feridas" para adicionar fotos e notas ao longo do tempo.',
      en: 'To follow up on a wound open the related fall or SOS occurrence and use the "Wound tracking" option to add photos and notes over time.',
    },
  },
  {
    id: 'fall-detection-setup',
    roles: [UserRole.CAREGIVER, UserRole.CLINICIAN, UserRole.INSTITUTION_ADMIN, UserRole.ELDERLY],
    keywords: [
      'deteção de quedas', 'detecção de quedas', 'fall detection', 'sensor de quedas',
      'enable fall detection',
    ],
    answer: {
      pt: 'A deteção automática de quedas usa os sensores do dispositivo do utente. Verifique nas Definições do utente se a opção "Deteção de quedas" está activa e se o dispositivo tem permissões de sensores e notificações concedidas.',
      en: 'Automatic fall detection uses the elderly device sensors. In the elderly Settings, make sure "Fall detection" is enabled and the device has sensor and notification permissions granted.',
    },
  },

  // ===================== Clinician-specific =====================
  {
    id: 'add-pathology',
    roles: [UserRole.CLINICIAN],
    keywords: [
      'adicionar patologia', 'patologia', 'diagnóstico', 'doença crónica',
      'add pathology', 'diagnosis', 'chronic disease',
    ],
    answer: {
      pt: 'Para adicionar uma patologia: abra o perfil do utente, vá ao separador "Patologias" e toque em "+". Indique o nome, estado (ativa, crónica, monitorizada, etc.) e notas relevantes.',
      en: 'To add a pathology: open the elderly profile, go to the "Pathologies" tab and tap "+". Set the name, status (active, chronic, monitoring, etc.) and any relevant notes.',
    },
  },
  {
    id: 'add-medication',
    roles: [UserRole.CLINICIAN],
    keywords: [
      'adicionar medicação', 'prescrever', 'medicamento',
      'add medication', 'prescribe', 'medication',
    ],
    answer: {
      pt: 'Para registar medicação: abra o perfil do utente, vá ao separador "Medicação" e toque em "+". Pode definir o estado da medicação (ativa, pausada, descontinuada, etc.) para acompanhar o histórico terapêutico.',
      en: 'To record medication: open the elderly profile, go to the "Medication" tab and tap "+". You can set the medication status (active, paused, discontinued, etc.) to keep the treatment history.',
    },
  },
  {
    id: 'assessments',
    roles: [UserRole.CLINICIAN],
    keywords: [
      'avaliação', 'avaliações', 'assessment', 'assessments', 'escalas',
    ],
    answer: {
      pt: 'As avaliações clínicas estão na ficha do utente. Cada avaliação agrupa medições (equilíbrio, mobilidade, cognição, sinais vitais) e fica associada a quem a realizou e a quem a registou.',
      en: 'Clinical assessments are in the elderly profile. Each assessment groups measurements (balance, mobility, cognition, vital signs) and keeps the link to who performed and who registered it.',
    },
  },

  // ===================== Caregiver + Clinician (staff scheduling) =====================
  {
    id: 'schedule',
    roles: [UserRole.CLINICIAN, UserRole.CAREGIVER, UserRole.INSTITUTION_ADMIN],
    keywords: [
      'horário', 'meu horário', 'turno', 'escala', 'gerir horário',
      'my schedule', 'shifts', 'roster',
    ],
    answer: {
      pt: 'O seu horário está em Conta > O Meu Horário. Os administradores da instituição podem editar horários de todos os profissionais a partir da ficha de cada membro.',
      en: 'Your schedule is under Account > My Schedule. Institution admins can edit schedules of all professionals from each member profile.',
    },
  },
  {
    id: 'time-off',
    roles: [UserRole.CLINICIAN, UserRole.CAREGIVER],
    keywords: [
      'férias', 'pedir folga', 'baixa médica', 'ausência',
      'time off', 'vacation', 'request day off', 'sick leave',
    ],
    answer: {
      pt: 'Para pedir férias, folga ou baixa, abra Conta > O Meu Horário e toque em "Pedir ausência". O pedido fica pendente até o administrador aprovar ou rejeitar.',
      en: 'To request vacation, day off or sick leave, open Account > My Schedule and tap "Request time off". The request stays pending until an admin approves or denies it.',
    },
  },

  // ===================== Admin =====================
  {
    id: 'add-elderly',
    roles: [UserRole.INSTITUTION_ADMIN],
    keywords: [
      'adicionar utente', 'novo utente', 'criar utente', 'registar utente', 'convidar utente',
      'add elderly', 'new elderly', 'register elderly', 'invite elderly',
    ],
    answer: {
      pt: 'Para adicionar um utente: abra o separador Membros, toque em "+" e escolha "Convidar utente". Preencha email/telefone e envie o convite. O utente recebe um link para concluir o registo.',
      en: 'To add an elderly: open the Members tab, tap "+" and choose "Invite elderly". Fill in email/phone and send the invitation. The elderly receives a link to finish the registration.',
    },
  },
  {
    id: 'add-staff',
    roles: [UserRole.INSTITUTION_ADMIN],
    keywords: [
      'adicionar cuidador', 'adicionar clinico', 'adicionar clínico', 'convidar funcionário', 'novo membro',
      'add caregiver', 'add clinician', 'invite staff', 'new member',
    ],
    answer: {
      pt: 'Para adicionar um cuidador, clínico ou outro administrador: separador Membros > botão "+" > escolha o tipo de profissional e envie o convite por email.',
      en: 'To add a caregiver, clinician or another admin: Members tab > "+" button > pick the professional type and send the email invitation.',
    },
  },
  {
    id: 'invitations',
    roles: [UserRole.INSTITUTION_ADMIN],
    keywords: [
      'convite', 'convidar', 'reenviar convite', 'convite expirou', 'gerir convites',
      'invitation', 'invite', 'resend invitation', 'invite expired', 'manage invitations',
    ],
    answer: {
      pt: 'Os convites são geridos em Conta > Ver convites. Pode reenviar, cancelar ou ver o estado (pendente, aceite, expirado). Se um convite expirar, cancele-o e crie um novo.',
      en: 'Invitations are managed under Account > View invitations. You can resend, cancel or check status (pending, accepted, expired). If one expires, cancel it and create a new one.',
    },
  },
  {
    id: 'external-professionals',
    roles: [UserRole.INSTITUTION_ADMIN],
    keywords: [
      'profissionais externos', 'externos', 'acesso externo',
      'external professionals', 'external access',
    ],
    answer: {
      pt: 'Em Conta > Profissionais Externos pode dar acesso temporário a profissionais que não pertencem à instituição (ex.: médico de família, fisioterapeuta externo) para consultarem a ficha de um utente específico.',
      en: 'Under Account > External Professionals you can grant temporary access to professionals outside the institution (e.g. family doctor, external physiotherapist) to view a specific elderly profile.',
    },
  },
  {
    id: 'approve-time-off',
    roles: [UserRole.INSTITUTION_ADMIN],
    keywords: [
      'aprovar férias', 'aprovar ausência', 'gerir pedidos', 'time off requests',
      'approve vacation', 'approve time off', 'manage requests',
    ],
    answer: {
      pt: 'Os pedidos de ausência do pessoal aparecem na ficha de cada membro, no separador de horário. Pode aprovar ou recusar — o profissional recebe uma notificação.',
      en: 'Staff time off requests appear inside each member profile, in the schedule tab. You can approve or deny — the professional is notified.',
    },
  },
  {
    id: 'institution-vacation-policy',
    roles: [UserRole.INSTITUTION_ADMIN],
    keywords: [
      'política de férias', 'dias de férias', 'vacation policy',
    ],
    answer: {
      pt: 'A política de férias da instituição define o número de dias anuais por profissional. Pode ajustá-la em Detalhes da Instituição.',
      en: 'The institution vacation policy sets the yearly days per professional. You can adjust it in Institution Details.',
    },
  },

  // ===================== Programmer =====================
  {
    id: 'manage-institutions',
    roles: [UserRole.PROGRAMMER],
    keywords: [
      'gerir instituições', 'criar instituição', 'lista de instituições',
      'manage institutions', 'create institution',
    ],
    answer: {
      pt: 'No separador Instituições pode criar novas instituições, editar dados existentes e atribuir o primeiro administrador.',
      en: 'In the Institutions tab you can create new institutions, edit existing ones and assign their first admin.',
    },
  },
];

// ============================================================
// Per-role configuration: welcome message + suggestion order
// ============================================================

interface RoleConfig {
  welcome: Record<HelpLang, string>;
  suggestionIds: string[];
}

const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
  [UserRole.ELDERLY]: {
    welcome: {
      pt: 'Olá! Sou o assistente da aplicação. Posso ajudar a explicar como pedir ajuda, ver as suas medições e os seus eventos. Não tenho acesso aos seus dados clínicos.',
      en: 'Hi! I am the app assistant. I can help you ask for help, see your measurements and your events. I do not have access to your clinical data.',
    },
    suggestionIds: ['sos-button', 'elderly-my-measurements', 'elderly-schedule', 'notifications', 'change-language', 'privacy-data'],
  },
  [UserRole.CAREGIVER]: {
    welcome: {
      pt: 'Olá! Sou o assistente da aplicação. Posso ajudar a registar quedas, adicionar medições, abrir a ficha de um utente e gerir o seu horário. Não tenho acesso aos dados clínicos dos utentes.',
      en: 'Hi! I am the app assistant. I can help you register falls, add measurements, open elderly profiles and manage your schedule. I do not have access to elderly clinical data.',
    },
    suggestionIds: ['register-fall', 'add-measurement', 'view-elderly-profile', 'schedule', 'time-off', 'measurement-colors'],
  },
  [UserRole.CLINICIAN]: {
    welcome: {
      pt: 'Olá! Sou o assistente da aplicação. Posso ajudar a registar avaliações, patologias, medicação, quedas e medições. Não tenho acesso aos dados clínicos dos utentes.',
      en: 'Hi! I am the app assistant. I can help with assessments, pathologies, medication, falls and measurements. I do not have access to elderly clinical data.',
    },
    suggestionIds: ['view-elderly-profile', 'add-pathology', 'add-medication', 'assessments', 'register-fall', 'measurement-colors', 'schedule'],
  },
  [UserRole.INSTITUTION_ADMIN]: {
    welcome: {
      pt: 'Olá! Sou o assistente da aplicação. Posso ajudar a convidar membros, gerir convites, profissionais externos, horários e pedidos de ausência. Não tenho acesso aos dados clínicos dos utentes.',
      en: 'Hi! I am the app assistant. I can help invite members, manage invitations, external professionals, schedules and time off. I do not have access to elderly clinical data.',
    },
    suggestionIds: ['add-elderly', 'add-staff', 'invitations', 'external-professionals', 'approve-time-off', 'institution-vacation-policy'],
  },
  [UserRole.PROGRAMMER]: {
    welcome: {
      pt: 'Olá! Modo programador. Posso ajudar com a gestão de instituições e a navegação geral da aplicação.',
      en: 'Hi! Programmer mode. I can help with institution management and general app navigation.',
    },
    suggestionIds: ['manage-institutions', 'notifications', 'change-language'],
  },
  [UserRole.UNKNOWN]: {
    welcome: {
      pt: 'Olá! Sou o assistente da aplicação. Como posso ajudar?',
      en: 'Hi! I am the app assistant. How can I help?',
    },
    suggestionIds: ['forgot-password', 'change-language', 'privacy-data'],
  },
};

const FALLBACK: Record<HelpLang, string> = {
  pt: 'Ainda não tenho uma resposta para isso. Tente reformular ou escolha uma das sugestões abaixo. Lembre-se que de momento só respondo a perguntas sobre como usar a aplicação, não tenho acesso a dados de utentes.',
  en: 'I don\'t have an answer for that yet. Try rephrasing or pick one of the suggestions below. For now I can only answer questions about how to use the app — I do not have access to patient data.',
};

const stripDiacritics = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const normalize = (s: string) =>
  stripDiacritics(s.toLowerCase()).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

export interface MatchResult {
  entryId: string | null;
  answer: string;
  matched: boolean;
}

export interface Suggestion {
  id: string;
  question: string;
}

function entryIsVisibleTo(entry: HelpEntry, role?: UserRole): boolean {
  if (!entry.roles) return true;
  if (!role) return true;
  return entry.roles.includes(role);
}

export function matchHelpEntry(question: string, lang: HelpLang, role?: UserRole): MatchResult {
  const q = normalize(question);
  if (!q) {
    return { entryId: null, answer: FALLBACK[lang], matched: false };
  }

  let best: { entry: HelpEntry; score: number } | null = null;

  for (const entry of HELP_ENTRIES) {
    if (!entryIsVisibleTo(entry, role)) continue;

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

// Short, role-appropriate label shown as a suggestion chip per entry.
const SUGGESTION_LABELS: Record<string, Record<HelpLang, string>> = {
  'sos-button': { pt: 'Como peço ajuda (SOS)?', en: 'How do I ask for help (SOS)?' },
  'elderly-my-measurements': { pt: 'Onde vejo as minhas medições?', en: 'Where do I see my measurements?' },
  'elderly-schedule': { pt: 'Onde vejo os meus eventos?', en: 'Where do I see my events?' },
  'register-fall': { pt: 'Como registo uma queda?', en: 'How do I register a fall?' },
  'add-measurement': { pt: 'Como adiciono uma medição?', en: 'How do I add a measurement?' },
  'view-elderly-profile': { pt: 'Como abro a ficha de um utente?', en: 'How do I open an elderly profile?' },
  'measurement-colors': { pt: 'O que significam as cores das medições?', en: 'What do measurement colors mean?' },
  'fall-detection-setup': { pt: 'Como activar a deteção de quedas?', en: 'How to enable fall detection?' },
  'wound-tracking': { pt: 'Como acompanhar uma ferida?', en: 'How to follow a wound?' },
  'add-pathology': { pt: 'Como adicionar uma patologia?', en: 'How to add a pathology?' },
  'add-medication': { pt: 'Como registar medicação?', en: 'How to record medication?' },
  'assessments': { pt: 'O que são as avaliações?', en: 'What are assessments?' },
  'schedule': { pt: 'Onde vejo o meu horário?', en: 'Where do I see my schedule?' },
  'time-off': { pt: 'Como peço férias ou folga?', en: 'How do I request time off?' },
  'add-elderly': { pt: 'Como adiciono um utente?', en: 'How do I add an elderly?' },
  'add-staff': { pt: 'Como adiciono um cuidador ou clínico?', en: 'How do I add a caregiver or clinician?' },
  'invitations': { pt: 'Como gerir convites?', en: 'How do I manage invitations?' },
  'external-professionals': { pt: 'Como dar acesso a profissionais externos?', en: 'How to grant external access?' },
  'approve-time-off': { pt: 'Como aprovar ausências do pessoal?', en: 'How do I approve staff time off?' },
  'institution-vacation-policy': { pt: 'O que é a política de férias?', en: 'What is the vacation policy?' },
  'manage-institutions': { pt: 'Como gerir instituições?', en: 'How to manage institutions?' },
  'notifications': { pt: 'Não recebo notificações', en: 'I am not getting notifications' },
  'change-language': { pt: 'Como mudo o idioma?', en: 'How do I change language?' },
  'forgot-password': { pt: 'Esqueci-me da palavra-passe', en: 'I forgot my password' },
  'privacy-data': { pt: 'Que dados vê este assistente?', en: 'What data does this assistant see?' },
  'logout': { pt: 'Como termino sessão?', en: 'How do I sign out?' },
};

export function getSuggestions(lang: HelpLang, role?: UserRole): Suggestion[] {
  const cfg = ROLE_CONFIG[role ?? UserRole.UNKNOWN] ?? ROLE_CONFIG[UserRole.UNKNOWN];
  return cfg.suggestionIds
    .map(id => {
      const entry = HELP_ENTRIES.find(e => e.id === id);
      if (!entry || !entryIsVisibleTo(entry, role)) return null;
      const label = SUGGESTION_LABELS[id]?.[lang];
      if (!label) return null;
      return { id, question: label };
    })
    .filter((s): s is Suggestion => s !== null);
}

export function getWelcome(lang: HelpLang, role?: UserRole): string {
  const cfg = ROLE_CONFIG[role ?? UserRole.UNKNOWN] ?? ROLE_CONFIG[UserRole.UNKNOWN];
  return cfg.welcome[lang];
}
