# Apresentação da Aplicação Move+

> Aplicação móvel de monitorização e cuidados para idosos em instituições.  
> Plataforma multi-perfil: **Administrador · Cuidador · Idoso · Clínico**

---

## Setup para a Apresentação

- Aplicação desenvolvida em **React Native + Expo** (iOS & Android)
- Backend em **Node.js + TypeScript + Prisma** com base de dados PostgreSQL
- Suporte a **Português e Inglês** (mudança em runtime)
- Arquitetura monorepo: `APP` / `SERVER` / `shared`

### Dinâmica de 2 Telemóveis

Para tornar a demonstração mais impactante, usa **2 dispositivos em simultâneo**:

| 📱 Telemóvel A | 📱 Telemóvel B |
|:-:|:-:|
| **Admin / Cuidador** | **Idoso** |
| Recebe alertas e trata ocorrências | Dispara quedas, SOS e pedidos de acesso |

> As setas `📱A →` e `📱B →` ao longo do guia indicam qual o telemóvel a usar em cada passo.

---

## Roteiro da Apresentação (sugestão de ordem)

| # | Cena | Telemóveis |
|---|---|:-:|
| 1 | Login e navegação inicial | A + B |
| 2 | Queda automática (acelerómetro) | B → A |
| 3 | SOS Manual | B → A |
| 4 | Tratar ocorrência + PDF | A |
| 5 | Monitorização de feridas | A |
| 6 | Medições, medicamentos, patologias | A + B |
| 7 | Calendário + profissional externo | A |
| 8 | Pedido de acesso (Clínico) | A → B → A |
| 9 | Convites + gestão de membros | A |
| 10 | Timeline + notificações | A + B |

---

## 1. Administrador de Instituição

> 📱A — Entra com a conta de **Administrador**  
> O administrador gere a instituição, os seus membros e tem visibilidade total sobre o estado clínico e operacional.

### 1.1 Dashboard da Instituição
- Lista de **quedas não tratadas** agrupadas por data, com acesso direto a cada ocorrência
- Lista de **alertas SOS não tratados**
- **Widget de feridas ativas**: contagem de feridas abertas vs. resolvidas + gráfico sparkline dos últimos 6 meses
- **Próximos aniversários** dos residentes (janela de 30 dias, destaque para hoje e amanhã)
- **Pedidos de acesso a dados** pendentes de clínicos externos

### 1.2 Gestão de Membros
- Lista com três tabs: **Idosos / Cuidadores / Administradores**
- Pesquisa por nome e ordenação
- Registo de novos idosos e cuidadores diretamente na app
- Acesso ao perfil completo de cada membro

### 1.3 Sistema de Convites
- Gerar códigos de convite para qualquer papel: Idoso, Cuidador, Admin, Clínico
- O código pode ser copiado e enviado por qualquer meio
- Ecrã de convites pendentes com possibilidade de cancelamento
- Estados: **Pendente → Aceite / Perfil Incompleto / Expirado / Cancelado**

### 1.4 Timeline da Instituição
- Log cronológico de toda a atividade: quedas, medições adicionadas, medicamentos, patologias, utilizadores, eventos de calendário, SOS
- Agrupado por data, com navegação direta para cada detalhe

### 1.5 Ocorrências de Queda
- Ver detalhe completo: atividade pré e pós queda, direção, ambiente
- Descrição de lesões com **upload de fotografia**
- Marcar como **falso alarme**
- Registo das medidas tomadas
- **Exportar relatório PDF** com layout de cartões e cabeçalho gradiente

### 1.6 Ocorrências de SOS
- Ver detalhe: notas, timestamp, idoso em causa
- Marcar como falso alarme
- **Exportar relatório PDF**

### 1.7 Monitorização de Feridas
- Criar registos de feridas ligadas a quedas, SOS ou independentes
- **Seletor de localização corporal** interativo (diagrama frente/costas humanos, 40+ zonas nomeadas)
- Adicionar fotos ao longo do tratamento
- Filtrar: todas / ativas / resolvidas
- Marcar ferida como resolvida

### 1.8 Calendário por Idoso
- Vista mensal com: eventos, quedas (laranja), alertas SOS (vermelho), dias de ausência
- Tipos de evento: Consulta, Fisioterapia, Enfermagem, Banho, Refeição Especial, Atividade, Outro
- Atribuição de responsável: cuidador, clínico ou **profissional externo**
- **Profissionais Externos**: perfis guardados com nome, especialidade, telefone, email — não precisam de conta na app

### 1.9 Agenda de Banhos
- Grelha semanal com colunas por residente
- Vista rápida do estado de higiene programado

### 1.10 Notificações Push
- Recebe alertas de quedas, SOS e pedidos de acesso a dados
- Centro de notificações com estado lido/não lido, badge de contagem no ícone
- Navega diretamente para o ecrã relacionado ao tocar numa notificação

---

## 2. Cuidador

> 📱A — Faz logout e entra com a conta de **Cuidador** (ou mantém o Admin se não tiveres conta separada — o dashboard é igual)  
> O cuidador tem acesso ao mesmo dashboard da instituição e gere o dia-a-dia dos residentes.

### 2.1 Dashboard
- Idêntico ao do Administrador: quedas, SOS, feridas, aniversários, pedidos de acesso
- Acesso à timeline da instituição

### 2.2 Lista de Membros
- Ver idosos, cuidadores e admins da instituição
- Navegação para o perfil clínico completo de cada idoso

### 2.3 Registo de Medições
- Adicionar medição para qualquer idoso: selecionar idoso → selecionar tipo → introduzir valor
- **11 tipos de medição**: Pressão Arterial (sistólica/diastólica), Frequência Cardíaca, Peso, Altura, Temperatura Corporal, Glicemia, Saturação de Oxigénio (SpO2), Equilíbrio, Mobilidade, Score Cognitivo
- Badge colorido automático: **Verde / Amarelo / Laranja / Vermelho** por escalas de referência clínica
- Cálculo automático de IMC a partir de Peso + Altura
- Modal de conflito quando a avaliação manual difere do limiar automático

### 2.4 Registo de Medicamentos
- Adicionar/editar medicamento: nome, princípio ativo, dosagem, frequência, via de administração (oral, injeção, tópico, inalação), estado, datas, notas

### 2.5 Registo de Patologias
- Adicionar condição médica com: descrição, local de diagnóstico, data, estado (ativa/inativa/crónica/resolvida/em tratamento/monitorização)

### 2.6 Gestão de Quedas e SOS
- Tratar ocorrências não resolvidas
- Fotografar lesões, preencher relatório, exportar PDF

### 2.7 Agenda Pessoal do Profissional
- Ver todos os eventos do calendário atribuídos a si, em todos os residentes
- Gestão do próprio horário de trabalho (dias + horas por dia da semana)
- Registar ausências: **Férias, Folga, Baixa Médica** com datas e notas

### 2.8 Notificações Push
- Recebe alertas de quedas automáticas, SOS e inatividade dos residentes

---

## 3. Idoso

> 📱B — Este é o telemóvel do **Idoso** — tem estado ligado ao longo de toda a apresentação  
> O idoso usa a app para auto-monitorização e para pedir ajuda em caso de emergência.

### 3.1 Dashboard Pessoal
- Acesso rápido a: adicionar medição, ver timeline, calendário pessoal, próximos eventos
- Notificações não lidas com badge

### 3.2 Deteção Automática de Quedas ⚡ *Momento alto da demo*

> 📱B → agita/sacode o telemóvel com força → aparece o modal de confirmação  
> 📱A → observa a notificação push a chegar em tempo real ao Admin/Cuidador

- Algoritmo em background via **acelerómetro do dispositivo**
- Deteta: pico de força G > 2,5g (impacto) seguido de 3 segundos de imobilidade
- Ao detetar: aparece **modal de confirmação** com contagem decrescente de 30 segundos
  - **"Estou Bem"** → cancela o alerta
  - **"Preciso de Ajuda"** → envia notificação push imediata à instituição
  - Se ignorado → confirma automaticamente ao fim dos 30 segundos
- **Deteção de inatividade**: se não houver movimento por 2 horas, dispara alerta

> 💡 *Mostrar no 📱A: notificação chega, abrir o centro de notificações, tocar na notificação → navega diretamente para a ocorrência de queda*

### 3.3 Alerta SOS Manual ⚡ *Segunda demo em direto*

> 📱B → Botão SOS no dashboard → contagem decrescente → confirmar  
> 📱A → Notificação SOS chega ao Admin/Cuidador em tempo real

- Botão SOS no dashboard → contagem decrescente → alerta enviado à equipa

### 3.4 Perfil de Saúde Completo
- **Medições**: histórico por tipo com gráfico de evolução temporal
- **Medicamentos**: lista com estado e detalhes
- **Patologias**: condições médicas ativas e históricas
- **Quedas**: histórico de ocorrências
- **SOS**: histórico de alertas
- **Feridas**: monitorização com localização corporal e fotos
- **Cartão de IMC**: cálculo e classificação de risco

### 3.5 Calendário Pessoal
- Vista mensal com eventos agendados, quedas, SOS e ausências
- Ver detalhe de cada evento (tipo, profissional responsável, notas)

### 3.6 Perfil & Definições
- Editar dados pessoais: nome, telemóvel, email, morada, data de nascimento, género
- Upload de foto de perfil (câmara ou galeria)
- Mudar idioma (Português / Inglês)

### 3.7 Notificações
- Recebe notificações de pedidos de acesso a dados de clínicos
- Centro de notificações com lido/não lido

---

## 4. Clínico

> 📱A — Faz logout e entra com a conta de **Clínico** (ou usa um terceiro dispositivo/emulador)  
> O clínico é um profissional de saúde independente que solicita acesso aos dados clínicos de pacientes.

### 4.1 Dashboard do Clínico
- Widget de pedidos de acesso a dados pendentes
- Widget de próximos aniversários dos pacientes aprovados
- Acesso à timeline e calendário

### 4.2 Pesquisa e Pedido de Acesso ⚡ *Demo em direto com 2 telemóveis*

> 📱A (Clínico) → Pesquisar pelo ID Médico do idoso → Enviar pedido de acesso  
> 📱B (Idoso) → Notificação push chega → Abrir modal de confirmação → Aprovar  
> 📱A (Clínico) → Notificação de aprovação → Acesso ao perfil clínico completo desbloqueado

- Pesquisar paciente por **ID Médico**
- Enviar **pedido de acesso a dados** → estado: Pendente
- O idoso ou cuidador recebe notificação push + **modal de confirmação** com aviso de partilha de dados
- Fluxo: `PENDENTE → APROVADO / NEGADO / REVOGADO`
- Após aprovação: acesso ao perfil clínico completo do paciente

### 4.3 Acesso ao Perfil Clínico do Paciente (após aprovação)
- Medições com histórico e gráficos
- Medicamentos ativos e histórico
- Patologias
- Quedas e SOS
- Calendário

### 4.4 Gestão de Acessos
- Ecrã dedicado com todos os pedidos enviados e respetivos estados
- Possibilidade de revogar acessos aprovados

### 4.5 Agenda Pessoal
- Calendário com eventos atribuídos como profissional responsável
- Gestão de horário e ausências (igual ao Cuidador)

### 4.6 Notificações
- Recebe notificação quando um pedido de acesso é aprovado ou negado

---

## Resumo das Features Transversais

| Feature | 👔 Admin | 🧑‍⚕️ Cuidador | 👴 Idoso | 🩺 Clínico |
|---|:---:|:---:|:---:|:---:|
| Dashboard com quedas/SOS | ✅ | ✅ | — | — |
| Deteção automática de quedas | — | — | ✅ | — |
| Alerta SOS manual | — | — | ✅ | — |
| Medições com badge de saúde | ✅ | ✅ | ✅ | ✅ |
| Medicamentos & Patologias | ✅ | ✅ | 👁️ leitura | ✅ |
| Monitorização de feridas | ✅ | ✅ | ✅ | — |
| Calendário por residente | ✅ | ✅ | ✅ | ✅ |
| Profissionais externos | ✅ | ✅ | — | — |
| Relatórios PDF | ✅ | ✅ | — | — |
| Agenda pessoal + ausências | ✅ | ✅ | — | ✅ |
| Sistema de convites | ✅ | — | — | — |
| Pesquisa por ID médico | — | — | — | ✅ |
| Pedidos de acesso a dados | ✅ aprovar | ✅ aprovar | ✅ aprovar | ✅ pedir |
| Timeline da instituição | ✅ | ✅ | — | ✅ |
| Notificações push | ✅ | ✅ | ✅ | ✅ |
| Multilingue (PT / EN) | ✅ | ✅ | ✅ | ✅ |
