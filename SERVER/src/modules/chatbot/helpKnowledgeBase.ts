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

/**
 * Stable identifiers the client knows how to deep-link to.
 * The server only emits these strings; the app maps them to navigation calls.
 */
export type HelpActionId =
  | 'account.settings'
  | 'account.notifications'
  | 'account.invitations'
  | 'account.external-professionals'
  | 'account.my-schedule'
  | 'institution.details'
  | 'tab.members'
  | 'tab.dashboard'
  | 'tab.profile';

export interface HelpAction {
  id: HelpActionId;
  label: Record<HelpLang, string>;
}

export interface HelpEntry {
  id: string;
  keywords: string[];
  answer: Record<HelpLang, string>;
  /** If omitted, entry is visible to every role. */
  roles?: UserRole[];
  /** Optional deep-link button shown under the answer. */
  action?: HelpAction;
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
    action: {
      id: 'account.settings',
      label: { pt: 'Abrir Definições', en: 'Open Settings' },
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
    action: {
      id: 'account.notifications',
      label: { pt: 'Abrir notificações', en: 'Open notifications' },
    },
  },
  {
    id: 'change-language',
    keywords: [
      'mudar idioma', 'alterar lingua', 'mudar lingua', 'mudo idioma', 'mudar o idioma', 'trocar idioma', 'idioma', 'lingua', 'português', 'inglês',
      'change language', 'switch language', 'set language', 'language', 'portuguese', 'english',
    ],
    answer: {
      pt: 'Pode alterar o idioma em Conta > Definições. A aplicação está disponível em Português e Inglês.',
      en: 'You can change the language in Account > Settings. The app is available in Portuguese and English.',
    },
    action: {
      id: 'account.settings',
      label: { pt: 'Abrir Definições', en: 'Open Settings' },
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
    action: {
      id: 'tab.profile',
      label: { pt: 'Abrir o meu perfil', en: 'Open my profile' },
    },
  },

  // ===================== Caregiver + Clinician + Admin (work with elderly) =====================
  {
    id: 'register-fall',
    roles: [UserRole.CAREGIVER, UserRole.CLINICIAN, UserRole.INSTITUTION_ADMIN],
    keywords: [
      'registar queda', 'registo queda', 'adicionar queda', 'adiciono queda', 'inserir queda', 'reportar queda', 'queda',
      'register fall', 'add fall', 'report fall', 'log fall', 'fall',
    ],
    answer: {
      pt: 'Para registar uma queda manualmente: entre no perfil do utente, abra o separador "Quedas" e toque em "+". Preencha a data, descrição e se houve lesão. Se a queda foi detectada automaticamente pelo dispositivo, ela já aparece como ocorrência pendente — basta abrir e confirmar os dados.',
      en: 'To manually register a fall: open the elderly profile, go to the "Falls" tab and tap "+". Fill in date, description and whether there was injury. Falls detected automatically by the device already appear as pending occurrences — just open one and confirm the data.',
    },
    action: {
      id: 'tab.members',
      label: { pt: 'Abrir lista de utentes', en: 'Open elderly list' },
    },
  },
  {
    id: 'add-measurement',
    roles: [UserRole.CAREGIVER, UserRole.CLINICIAN, UserRole.INSTITUTION_ADMIN],
    keywords: [
      'adicionar medição', 'adiciono medição', 'registar medição', 'inserir medição', 'nova medição', 'medição', 'medições', 'tensão', 'peso', 'glicemia',
      'add measurement', 'record measurement', 'new measurement', 'measurement', 'measurements', 'blood pressure', 'glucose',
    ],
    answer: {
      pt: 'Para adicionar uma medição: entre no perfil do utente, abra o separador "Medições" e toque em "+". Escolha o tipo (tensão, peso, glicemia, etc.), introduza o valor e guarde.',
      en: 'To add a measurement: open the elderly profile, go to the "Measurements" tab and tap "+". Pick the type (blood pressure, weight, glucose, etc.), enter the value and save.',
    },
    action: {
      id: 'tab.members',
      label: { pt: 'Abrir lista de utentes', en: 'Open elderly list' },
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
      'ver utente', 'vejo utente', 'vejo informacoes utente', 'ver informacoes utente',
      'informacoes do utente', 'informacoes utente', 'informacao utente', 'dados do utente', 'dados utente',
      'abrir utente', 'abro utente', 'abrir ficha', 'ficha do utente', 'ficha utente',
      'perfil utente', 'perfil do utente', 'consultar utente', 'consultar ficha', 'cronograma',
      'open elderly', 'view elderly', 'see elderly', 'elderly profile', 'elderly info', 'patient profile',
      'open profile', 'patient info', 'patient information', 'timeline',
    ],
    answer: {
      pt: 'Em Membros abra a lista de utentes e toque sobre o nome para abrir a ficha. Lá tem separadores para Medições, Medicação, Patologias, Quedas, Eventos e o Cronograma com todos os acontecimentos recentes.',
      en: 'In Members open the elderly list and tap a name to open the profile. There you have tabs for Measurements, Medication, Pathologies, Falls, Events and a Timeline with all recent activity.',
    },
    action: {
      id: 'tab.members',
      label: { pt: 'Abrir Membros', en: 'Open Members' },
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
      'adicionar patologia', 'adiciono patologia', 'registar patologia', 'patologia', 'patologias', 'diagnóstico', 'doença crónica',
      'add pathology', 'pathology', 'diagnosis', 'chronic disease',
    ],
    answer: {
      pt: 'Para adicionar uma patologia: abra o perfil do utente, vá ao separador "Patologias" e toque em "+". Indique o nome, estado (ativa, crónica, monitorizada, etc.) e notas relevantes.',
      en: 'To add a pathology: open the elderly profile, go to the "Pathologies" tab and tap "+". Set the name, status (active, chronic, monitoring, etc.) and any relevant notes.',
    },
    action: {
      id: 'tab.members',
      label: { pt: 'Abrir lista de utentes', en: 'Open elderly list' },
    },
  },
  {
    id: 'add-medication',
    roles: [UserRole.CLINICIAN],
    keywords: [
      'adicionar medicação', 'registar medicação', 'prescrever', 'medicamento', 'medicação',
      'add medication', 'record medication', 'prescribe', 'medication',
    ],
    answer: {
      pt: 'Para registar medicação: abra o perfil do utente, vá ao separador "Medicação" e toque em "+". Pode definir o estado da medicação (ativa, pausada, descontinuada, etc.) para acompanhar o histórico terapêutico.',
      en: 'To record medication: open the elderly profile, go to the "Medication" tab and tap "+". You can set the medication status (active, paused, discontinued, etc.) to keep the treatment history.',
    },
    action: {
      id: 'tab.members',
      label: { pt: 'Abrir lista de utentes', en: 'Open elderly list' },
    },
  },
  {
    id: 'assessments',
    roles: [UserRole.CLINICIAN],
    keywords: [
      'avaliação', 'avaliações', 'avaliar', 'fazer avaliação', 'nova avaliação', 'escalas', 'mini mental',
      'assessment', 'assessments', 'evaluate', 'new assessment', 'scales',
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
      'horário', 'meu horário', 'o meu horário', 'turno', 'turnos', 'escala', 'gerir horário', 'ver horário',
      'my schedule', 'schedule', 'shifts', 'roster',
    ],
    answer: {
      pt: 'O seu horário está em Conta > O Meu Horário. Os administradores da instituição podem editar horários de todos os profissionais a partir da ficha de cada membro.',
      en: 'Your schedule is under Account > My Schedule. Institution admins can edit schedules of all professionals from each member profile.',
    },
    action: {
      id: 'account.my-schedule',
      label: { pt: 'Abrir o meu horário', en: 'Open my schedule' },
    },
  },
  {
    id: 'time-off',
    roles: [UserRole.CLINICIAN, UserRole.CAREGIVER],
    keywords: [
      'férias', 'pedir férias', 'pedir folga', 'folga', 'baixa médica', 'baixa', 'ausência',
      'time off', 'vacation', 'request day off', 'day off', 'sick leave', 'absence',
    ],
    answer: {
      pt: 'Para pedir férias, folga ou baixa, abra Conta > O Meu Horário e toque em "Pedir ausência". O pedido fica pendente até o administrador aprovar ou rejeitar.',
      en: 'To request vacation, day off or sick leave, open Account > My Schedule and tap "Request time off". The request stays pending until an admin approves or denies it.',
    },
    action: {
      id: 'account.my-schedule',
      label: { pt: 'Abrir o meu horário', en: 'Open my schedule' },
    },
  },

  // ===================== Admin =====================
  {
    id: 'add-elderly',
    roles: [UserRole.INSTITUTION_ADMIN],
    keywords: [
      'adicionar utente', 'adiciono utente', 'novo utente', 'criar utente', 'registar utente', 'convidar utente', 'utente novo',
      'add elderly', 'new elderly', 'register elderly', 'invite elderly', 'create elderly',
    ],
    answer: {
      pt: 'Para adicionar um utente: abra o separador Membros, toque em "+" e escolha "Convidar utente". Preencha email/telefone e envie o convite. O utente recebe um link para concluir o registo.',
      en: 'To add an elderly: open the Members tab, tap "+" and choose "Invite elderly". Fill in email/phone and send the invitation. The elderly receives a link to finish the registration.',
    },
    action: {
      id: 'tab.members',
      label: { pt: 'Abrir Membros', en: 'Open Members' },
    },
  },
  {
    id: 'add-staff',
    roles: [UserRole.INSTITUTION_ADMIN],
    keywords: [
      'adicionar cuidador', 'adicionar clinico', 'adicionar clínico', 'adiciono cuidador', 'adiciono clinico', 'convidar funcionário', 'convidar cuidador', 'convidar clinico', 'novo membro', 'novo funcionário',
      'add caregiver', 'add clinician', 'invite staff', 'invite caregiver', 'invite clinician', 'new member',
    ],
    answer: {
      pt: 'Para adicionar um cuidador, clínico ou outro administrador: separador Membros > botão "+" > escolha o tipo de profissional e envie o convite por email.',
      en: 'To add a caregiver, clinician or another admin: Members tab > "+" button > pick the professional type and send the email invitation.',
    },
    action: {
      id: 'tab.members',
      label: { pt: 'Abrir Membros', en: 'Open Members' },
    },
  },
  {
    id: 'invitations',
    roles: [UserRole.INSTITUTION_ADMIN],
    keywords: [
      'convite', 'convites', 'convidar', 'reenviar convite', 'reenviar', 'convite expirou', 'gerir convites', 'ver convites',
      'invitation', 'invitations', 'invite', 'resend invitation', 'resend', 'invite expired', 'manage invitations', 'view invitations',
    ],
    answer: {
      pt: 'Os convites são geridos em Conta > Ver convites. Pode reenviar, cancelar ou ver o estado (pendente, aceite, expirado). Se um convite expirar, cancele-o e crie um novo.',
      en: 'Invitations are managed under Account > View invitations. You can resend, cancel or check status (pending, accepted, expired). If one expires, cancel it and create a new one.',
    },
    action: {
      id: 'account.invitations',
      label: { pt: 'Ver convites', en: 'View invitations' },
    },
  },
  {
    id: 'external-professionals',
    roles: [UserRole.INSTITUTION_ADMIN],
    keywords: [
      'profissionais externos', 'profissional externo', 'externos', 'acesso externo', 'acesso a externos', 'dar acesso',
      'external professionals', 'external professional', 'external access', 'grant access', 'grant external',
    ],
    answer: {
      pt: 'Em Conta > Profissionais Externos pode dar acesso temporário a profissionais que não pertencem à instituição (ex.: médico de família, fisioterapeuta externo) para consultarem a ficha de um utente específico.',
      en: 'Under Account > External Professionals you can grant temporary access to professionals outside the institution (e.g. family doctor, external physiotherapist) to view a specific elderly profile.',
    },
    action: {
      id: 'account.external-professionals',
      label: { pt: 'Abrir Profissionais Externos', en: 'Open External Professionals' },
    },
  },
  {
    id: 'approve-time-off',
    roles: [UserRole.INSTITUTION_ADMIN],
    keywords: [
      'aprovar férias', 'aprovar ausência', 'aprovar ausências', 'aprovar pedidos', 'gerir pedidos', 'pedidos de férias', 'pedidos de ausência', 'time off requests',
      'approve vacation', 'approve time off', 'approve absence', 'manage requests', 'absence requests',
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
      'política de férias', 'dias de férias', 'limite de férias', 'configurar férias',
      'vacation policy', 'vacation days', 'configure vacation',
    ],
    answer: {
      pt: 'A política de férias da instituição define o número de dias anuais por profissional. Pode ajustá-la em Detalhes da Instituição.',
      en: 'The institution vacation policy sets the yearly days per professional. You can adjust it in Institution Details.',
    },
    action: {
      id: 'institution.details',
      label: { pt: 'Abrir Detalhes da Instituição', en: 'Open Institution Details' },
    },
  },

  // ===================== Programmer =====================
  {
    id: 'manage-institutions',
    roles: [UserRole.PROGRAMMER],
    keywords: [
      'gerir instituições', 'gerir instituição', 'criar instituição', 'nova instituição', 'lista de instituições', 'instituições', 'instituição',
      'manage institutions', 'create institution', 'new institution', 'institutions list', 'institutions',
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

/** Iterative Levenshtein distance with a small early-exit cap. */
function levenshtein(a: string, b: string, max: number): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = new Array(b.length + 1);
  let curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost,
      );
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > max) return max + 1;
    const tmp = prev; prev = curr; curr = tmp;
  }
  return prev[b.length];
}

/** Tolerance: allow 1 edit for 4-6 char tokens, 2 edits for 7+. */
function fuzzyMatchesToken(qToken: string, kwToken: string): boolean {
  if (qToken === kwToken) return true;
  if (qToken.length < 4 || kwToken.length < 4) return false;
  const max = kwToken.length >= 7 ? 2 : 1;
  return levenshtein(qToken, kwToken, max) <= max;
}

/** Words that carry no useful signal for matching (PT + EN). */
const STOPWORDS = new Set<string>([
  // PT
  'a', 'o', 'as', 'os', 'um', 'uma', 'uns', 'umas',
  'de', 'do', 'da', 'dos', 'das', 'no', 'na', 'nos', 'nas',
  'em', 'por', 'para', 'com', 'sem', 'sobre',
  'e', 'ou', 'que', 'se', 'qual', 'quais',
  'como', 'onde', 'quando', 'porque', 'porqu\u00ea',
  'eu', 'tu', 'ele', 'ela', 'meu', 'minha', 'meus', 'minhas',
  'isto', 'isso', 'aquilo', 'esta', 'este',
  'ser', 'estar', 'ter', 'fazer', 'pode', 'posso', 'devo',
  'mais', 'menos', 'muito', 'pouco', 'algum',
  // PT verbs commonly used in questions but not informative
  'ver', 'vejo', 'sei', 'quero', 'preciso', 'gostaria',
  // EN
  'a', 'an', 'the', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'without',
  'and', 'or', 'is', 'are', 'be', 'do', 'does', 'did',
  'how', 'what', 'where', 'when', 'why', 'who',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'me',
  'can', 'should', 'would', 'need', 'want',
  'see', 'view', 'get', 'show',
]);

/** Precomputed token -> number of entries that contain it.
 *  Used by the loose (TF-IDF) fallback so common tokens like "utente"
 *  don't dominate the score. */
interface EntryIndex {
  entry: HelpEntry;
  tokens: Set<string>;
}

let _entryIndex: EntryIndex[] | null = null;
let _docFreq: Map<string, number> | null = null;

function buildIndex(): { index: EntryIndex[]; df: Map<string, number> } {
  if (_entryIndex && _docFreq) return { index: _entryIndex, df: _docFreq };
  const index: EntryIndex[] = [];
  const df = new Map<string, number>();
  for (const entry of HELP_ENTRIES) {
    const tokens = new Set<string>();
    for (const kw of entry.keywords) {
      const nk = normalize(kw);
      if (!nk) continue;
      for (const t of nk.split(' ')) {
        if (t.length < 3) continue;
        if (STOPWORDS.has(t)) continue;
        tokens.add(t);
      }
    }
    index.push({ entry, tokens });
    for (const t of tokens) {
      df.set(t, (df.get(t) ?? 0) + 1);
    }
  }
  _entryIndex = index;
  _docFreq = df;
  return { index, df };
}

/** Loose fallback: score each entry by the sum of inverse-frequency weights
 *  of query tokens that appear in the entry's keyword token bag (with light
 *  fuzzy tolerance). Returns null if no entry collects any meaningful weight. */
function looseMatch(qTokens: string[], role?: UserRole): { entry: HelpEntry; score: number } | null {
  const { index, df } = buildIndex();
  const totalDocs = index.length || 1;

  const filteredQ = qTokens.filter(t => t.length >= 3 && !STOPWORDS.has(t));
  if (filteredQ.length === 0) return null;

  let best: { entry: HelpEntry; score: number } | null = null;

  for (const { entry, tokens } of index) {
    if (!entryIsVisibleTo(entry, role)) continue;
    if (tokens.size === 0) continue;

    let score = 0;
    let matchedCount = 0;
    for (const qt of filteredQ) {
      let matchedToken: string | null = null;
      if (tokens.has(qt)) {
        matchedToken = qt;
      } else {
        for (const et of tokens) {
          if (fuzzyMatchesToken(qt, et)) { matchedToken = et; break; }
        }
      }
      if (!matchedToken) continue;
      matchedCount += 1;
      const freq = df.get(matchedToken) ?? 1;
      // IDF-like weight; rarer tokens contribute much more.
      score += Math.log(1 + totalDocs / freq);
    }

    if (matchedCount === 0) continue;
    if (!best || score > best.score) {
      best = { entry, score };
    }
  }

  // Require at least one meaningful match AND a minimum score to avoid noise.
  if (!best || best.score < 0.6) return null;
  return best;
}

export interface MatchResult {
  entryId: string | null;
  answer: string;
  matched: boolean;
  action?: HelpAction | null;
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

/** Direct entry lookup, used when the client taps a suggestion chip
 *  (so we bypass keyword matching entirely and never return a fallback). */
export function getEntryById(entryId: string, lang: HelpLang, role?: UserRole): MatchResult | null {
  const entry = HELP_ENTRIES.find(e => e.id === entryId);
  if (!entry) return null;
  if (!entryIsVisibleTo(entry, role)) return null;
  return {
    entryId: entry.id,
    answer: entry.answer[lang],
    matched: true,
    action: entry.action ?? null,
  };
}

export function matchHelpEntry(question: string, lang: HelpLang, role?: UserRole): MatchResult {
  const q = normalize(question);
  if (!q) {
    return { entryId: null, answer: FALLBACK[lang], matched: false, action: null };
  }

  const qTokens = q.split(' ').filter(Boolean);
  let best: { entry: HelpEntry; score: number } | null = null;

  for (const entry of HELP_ENTRIES) {
    if (!entryIsVisibleTo(entry, role)) continue;

    let score = 0;
    for (const kw of entry.keywords) {
      const nk = normalize(kw);
      if (!nk) continue;

      // Exact substring match (strong signal: whole phrase appears literally).
      if (q.includes(nk)) {
        score += nk.split(' ').length * 2;
        continue;
      }

      const kwTokens = nk.split(' ').filter(t => t.length > 2);
      if (kwTokens.length === 0) continue;

      let hits = 0;
      let fuzzyHits = 0;
      for (const kt of kwTokens) {
        if (qTokens.includes(kt)) {
          hits += 1;
        } else if (qTokens.some(qt => fuzzyMatchesToken(qt, kt))) {
          fuzzyHits += 1;
        }
      }

      if (hits + fuzzyHits === kwTokens.length) {
        // Fuzzy hits count slightly less than exact ones.
        score += hits + fuzzyHits * 0.7;
      }
    }

    if (score > 0 && (!best || score > best.score)) {
      best = { entry, score };
    }
  }

  if (!best) {
    const loose = looseMatch(qTokens, role);
    if (!loose) {
      return { entryId: null, answer: FALLBACK[lang], matched: false, action: null };
    }
    return {
      entryId: loose.entry.id,
      answer: loose.entry.answer[lang],
      matched: true,
      action: loose.entry.action ?? null,
    };
  }

  return {
    entryId: best.entry.id,
    answer: best.entry.answer[lang],
    matched: true,
    action: best.entry.action ?? null,
  };
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
