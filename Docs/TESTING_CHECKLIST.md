# Testing Checklist — appMove

> Guia de teste completo para 2 dispositivos / 2 contas diferentes.
> Marcar cada item após validação.

---

## Autenticação & Sessão

- [ ] Login com email/password (nos 2 dispositivos com contas diferentes)
- [ ] Refresh automático do token JWT
- [ ] Logout numa sessão não afeta a outra
- [ ] Logout-all termina as 2 sessões em simultâneo
- [ ] Esqueci password → OTP → nova password → login
- [ ] Registo via convite (gerar convite num telemóvel, aceitar no outro)
- [ ] Completar perfil após convite

---

## Push Notifications *(ótimo para 2 dispositivos)*

- [ ] Registo do push token num dispositivo
- [ ] Trigger de fall alert num dispositivo → notificação aparece no outro (caregiver)
- [ ] Inactivity alert chega ao caregiver
- [ ] SOS alert chega ao caregiver
- [ ] Notification center: marcar como lida / não lida / apagar
- [ ] Marcar todas como lidas
- [ ] Contador de não lidas atualiza em tempo real
- [ ] Login com conta diferente no mesmo telemóvel → token anterior não recebe notificações erradas

---

## Dashboard da Instituição

- [ ] Falls overview mostra quedas recentes (incluindo não tratadas)
- [ ] SOS overview correto
- [ ] Wound overview reflete feridas ativas
- [ ] Próximos aniversários aparecem
- [ ] Data access requests pendentes visíveis
- [ ] Timeline de atividade atualiza

---

## Gestão de Idosos

- [ ] Registar novo idoso
- [ ] Editar perfil do idoso
- [ ] Pesquisar idoso por ID médico (Clinician)
- [ ] Dashboard do idoso mostra todos os widgets (quedas, SOS, medicação, medições, feridas, calendário, patologias)

---

## Fall Occurrences

- [ ] Criar queda para idoso
- [ ] Preencher detalhes (descrição, recovery, atividade pré/pós, direção, ambiente, lesão, localização no corpo)
- [ ] Upload foto do incidente
- [ ] Marcar como falso alarme
- [ ] Marcar como tratado (handler)
- [ ] Adicionar wound tracking a partir da queda

---

## SOS Occurrences

- [ ] Criar SOS para idoso
- [ ] Preencher detalhes (mesmos campos + `wasActualFall`)
- [ ] Upload foto
- [ ] Adicionar wound tracking a partir do SOS

---

## Wound Tracking

- [ ] Adicionar ferida standalone a idoso
- [ ] Adicionar ferida a partir de queda
- [ ] Adicionar ferida a partir de SOS
- [ ] Body location picker funciona corretamente
- [ ] Upload foto da ferida
- [ ] Ferida aparece como ativa / resolvida
- [ ] Wound overview na instituição reflete corretamente
- [ ] Apagar entrada de wound tracking

---

## Medicações

- [ ] Prescrever medicação nova
- [ ] Editar medicação existente
- [ ] Ver detalhe da medicação
- [ ] Alterar status (ACTIVE / PAUSED / DISCONTINUED / COMPLETED)

---

## Medições / Sinais Vitais

- [ ] Registar medição (tensão sistólica/diastólica, FC, peso, altura, temperatura, glicemia, SpO2, balance score, mobility score, cognitive score)
- [ ] Ver histórico em gráfico por tipo
- [ ] Cor de status (verde/amarelo/laranja/vermelho) correta conforme valores

---

## Patologias

- [ ] Adicionar patologia
- [ ] Editar patologia
- [ ] Alterar status (ACTIVE / CHRONIC / RESOLVED / UNDER_TREATMENT / MONITORING / INACTIVE)

---

## Calendário & Eventos

- [ ] Criar evento de calendário para idoso (tipo: APPOINTMENT, PHYSIOTHERAPY, NURSING_CARE, BATH, MEAL, ACTIVITY, OTHER)
- [ ] Atribuir evento a membro do staff interno
- [ ] Criar evento com profissional externo novo (inline)
- [ ] Criar evento selecionando profissional externo já guardado
- [ ] `CalendarEventCard` mostra "(Externo) Nome · Especialidade"
- [ ] Editar evento existente
- [ ] Apagar evento
- [ ] Vista de calendário do profissional mostra apenas os seus eventos
- [ ] Vista de calendário institucional mostra todos os eventos

---

## Profissionais Externos (CRUD)

- [ ] Listar profissionais externos guardados
- [ ] Criar perfil de profissional externo (nome, especialidade, telefone, email, notas)
- [ ] Editar perfil
- [ ] Apagar perfil
- [ ] Perfil apagado não aparece no picker do calendário

---

## Convites

- [ ] Gerar convite para caregiver (Admin)
- [ ] Token/link válido para aceitar registo
- [ ] Aceitar convite num segundo dispositivo → conta criada com sucesso
- [ ] Convite expirado não funciona
- [ ] Cancelar convite pendente

---

## Data Access Requests *(Clinician ↔ Idoso — ideal para 2 dispositivos)*

- [ ] Clinician pede acesso a dados de um idoso (dispositivo 1)
- [ ] Idoso / caregiver recebe notificação e aprova/rejeita (dispositivo 2)
- [ ] Clinician com acesso aprovado consegue ver dados do idoso
- [ ] Clinician sem acesso não consegue ver dados
- [ ] Revogar acesso funciona

---

## Escalas de Pessoal & Ausências

- [ ] Admin define horário semanal de trabalho para um staff (dias + hora início/fim)
- [ ] Staff vê o seu próprio horário
- [ ] Admin regista time off (VACATION / DAY_OFF / SICK_LEAVE)
- [ ] Ausência do idoso registada e visível na instituição

---

## Perfis & Avatar

- [ ] Upload de foto de perfil (até 25 MB)
- [ ] Remoção de foto de perfil
- [ ] Editar dados do perfil (nome, email, etc.)
- [ ] Alterações refletem imediatamente na UI

---

## Permissões / Controlo de Acesso *(crítico)*

| Ação | ELDERLY | CAREGIVER | CLINICIAN | ADMIN | PROGRAMMER |
|---|:---:|:---:|:---:|:---:|:---:|
| Ver dados de outro idoso sem acesso | ✗ | ✗ | ✗* | ✓ | ✓ |
| Criar/gerir instituição | ✗ | ✗ | ✗ | ✗ | ✓ |
| Registar caregiver | ✗ | ✗ | ✗ | ✓ | ✓ |
| Registar clinician | ✗ | ✗ | ✗ | ✗ | ✓ |
| Gerir horários de staff | ✗ | ✗ | ✗ | ✓ | ✓ |
| Responder data access request | ✓ | ✓** | ✗ | ✓** | ✓ |

> *Clinician precisa de acesso aprovado via Data Access Request
> **Caregiver/Admin podem responder em nome do idoso

- [ ] ELDERLY não consegue chamar endpoints de admin
- [ ] CAREGIVER não consegue criar instituições
- [ ] CLINICIAN só vê dados de idosos com acesso aprovado
- [ ] PROGRAMMER consegue ver todas as instituições, outros roles não

---

## Notas de Teste com 2 Dispositivos

Os cenários mais valiosos com 2 dispositivos simultâneos:

1. **Notificações** — queda/SOS disparado no dispositivo 1, notificação chega no dispositivo 2 (caregiver)
2. **Data Access Requests** — pedido no dispositivo 1 (clinician), resposta no dispositivo 2 (idoso/caregiver)
3. **Convites** — gerado no dispositivo 1 (admin), aceite no dispositivo 2 (novo utilizador)
4. **Logout-all** — sessão terminada no dispositivo 1 invalida sessão no dispositivo 2
5. **Push token exclusivo** — mesmo telemovel com conta diferente não recebe notificações da conta anterior
