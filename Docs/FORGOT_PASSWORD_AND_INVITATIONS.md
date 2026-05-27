# Recuperação de Palavra-Passe & Convites por Identificador

## Índice

1. [Recuperação de Palavra-Passe](#recuperação-de-palavra-passe)
2. [Convites por Telemóvel ou Nº Utente](#convites-por-telemóvel-ou-nº-utente)

---

## Recuperação de Palavra-Passe

### Como funciona

O fluxo usa um **OTP (código de 6 dígitos)** com validade de **1 hora**.

```
[Ecrã ForgotPassword]
  └─ Utilizador insere o email
  └─ POST /api/auth/forgot-password
        ├─ Gera OTP aleatório (6 dígitos)
        ├─ Guarda hash do OTP na base de dados (passwordResetToken + passwordResetExpiry)
        ├─ Tenta enviar email com o código (falha silenciosa se email não configurado)
        └─ Devolve { otp } na resposta ← modo desenvolvimento

[Ecrã CreateNewPassword]
  └─ OTP já vem pré-preenchido (passado via navigation params)
  └─ Utilizador insere nova palavra-passe + confirmação
  └─ POST /api/auth/reset-password
        ├─ Valida o OTP contra o hash na DB
        ├─ Verifica se o código ainda não expirou
        ├─ Atualiza a palavra-passe (bcrypt)
        └─ Limpa passwordResetToken e passwordResetExpiry
```

### Campos adicionados ao modelo `User` (Prisma)

```prisma
passwordResetToken  String?
passwordResetExpiry DateTime?
```

### Endpoints

| Método | Rota                        | Body                                      | Resposta                         |
|--------|-----------------------------|-------------------------------------------|----------------------------------|
| POST   | `/api/auth/forgot-password` | `{ email: string }`                       | `{ otp: string }` *(dev)*        |
| POST   | `/api/auth/reset-password`  | `{ email, otp, newPassword: string }`     | `{}` (sucesso)                   |

### Ficheiros relevantes

| Ficheiro | Descrição |
|---|---|
| `SERVER/src/modules/auth/authController.ts` | Handlers `forgotPassword` e `resetPassword` |
| `SERVER/src/modules/auth/authRoutes.ts` | Rotas `POST /forgot-password` e `POST /reset-password` |
| `SERVER/src/services/emailService.ts` | Envio de email com nodemailer (opcional) |
| `APP/src/screens/authentication/ForgotPassword.tsx` | Ecrã onde o utilizador insere o email |
| `APP/src/screens/authentication/CreateNewPassword.tsx` | Ecrã onde insere o código e a nova password |
| `APP/src/navigation/LoginNavigator.tsx` | `ForgotPassword` e `CreateNewPassword` adicionados ao stack |
| `shared/src/rest/requests/PasswordResetRequests.ts` | Tipos `ForgotPasswordRequest` e `ResetPasswordRequest` |

---

### Modo Desenvolvimento vs Produção

#### Desenvolvimento (atual)
O OTP é devolvido **diretamente na resposta da API** e pré-preenchido no ecrã.  
Não é necessário configurar nenhum servidor de email.

#### Produção (emails reais)
Quando os utilizadores tiverem emails reais, basta:

1. Configurar as variáveis de ambiente no Railway:

   | Variável       | Exemplo                        |
   |----------------|--------------------------------|
   | `EMAIL_HOST`   | `smtp.gmail.com`               |
   | `EMAIL_PORT`   | `587`                          |
   | `EMAIL_SECURE` | `false`                        |
   | `EMAIL_USER`   | `noreply@tuaapp.com`           |
   | `EMAIL_PASS`   | `password_da_conta_de_envio`   |

2. Em `authController.ts`, remover o `otp` da resposta:

   ```ts
   // Antes (dev):
   return sendSuccess(res, { otp }, successMessage);

   // Depois (prod):
   return sendSuccess(res, {}, successMessage);
   ```

3. Em `ForgotPassword.tsx`, remover a passagem do OTP via params (o utilizador irá recebê-lo por email):

   ```ts
   // Antes (dev):
   navigation.navigate('CreateNewPassword', { email: trimmedEmail, otp: response.data?.otp });

   // Depois (prod):
   navigation.navigate('CreateNewPassword', { email: trimmedEmail });
   ```

> **Nota de segurança:** Em produção, nunca devolva o OTP na resposta HTTP — isso anularia completamente a segurança do código.

---

## Convites por Telemóvel ou Nº Utente

### Como funciona

Os convites passaram a suportar **três tipos de identificador**:

| Tipo        | Campo        | Exemplo         |
|-------------|--------------|-----------------|
| Email       | `email`      | `joao@mail.com` |
| Telemóvel   | `phone`      | `+351912345678` |
| Nº Utente   | `utenteId`   | `123456789`     |

Pelo menos **um** dos três campos deve estar preenchido no convite.

### Fluxo de criação (GerarConvite)

1. O utilizador com permissão (ex: admin) abre o ecrã `GenerateInvitationScreen`
2. Seleciona o tipo de identificador (tab: Email / Telemóvel / Nº Utente)
3. Preenche o valor correspondente
4. O servidor valida duplicados por tipo e cria o registo

### Fluxo de aceitação (Registo por convite)

1. O convidado abre a app e escolhe "Tenho um convite"
2. Insere o código do convite → o servidor valida e devolve os dados
3. Se o convite **não tiver email**, o ecrã pede ao utilizador que insira o email (necessário para criar conta)
4. Registo completo com os dados do convite

### Campos adicionados ao modelo `Invitation` (Prisma)

```prisma
email    String?   // era obrigatório, agora opcional
phone    String?
utenteId String?

@@index([phone])
@@index([utenteId])
```

### Ficheiros relevantes

| Ficheiro | Descrição |
|---|---|
| `SERVER/src/modules/invitation/invitationController.ts` | `createInvitation`, `validateInvitation`, `acceptInvitation`, `getInvitations` atualizados |
| `APP/src/screens/invitation/GenerateInvitationScreen.tsx` | Tabs de seleção de tipo (Email / Telemóvel / Nº Utente) |
| `APP/src/screens/authentication/InvitationRegistrationScreen.tsx` | Lida com convites sem email (pede email ao utilizador) |
| `APP/src/screens/invitation/InstitutionInvitationsScreen.tsx` | Lista convites mostrando o identificador disponível |
| `shared/src/rest/requests/CreateInvitationRequest.ts` | `email?`, `phone?`, `utenteId?` (todos opcionais, mínimo um) |
| `shared/src/rest/responses/ValidateInvitationResponse.ts` | Devolve `phone` e `utenteId` para a app |

### Migration SQL

Ficheiro: `SERVER/prisma/migrations/20260527000000_add_password_reset_and_invite_identifiers/migration.sql`

```sql
-- Recuperação de palavra-passe
ALTER TABLE "User" ADD COLUMN "passwordResetToken" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordResetExpiry" TIMESTAMP(3);

-- Convites com identificadores alternativos
ALTER TABLE "invitations" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "invitations" ADD COLUMN "phone" TEXT;
ALTER TABLE "invitations" ADD COLUMN "utenteId" TEXT;
CREATE INDEX "invitations_phone_idx" ON "invitations"("phone");
CREATE INDEX "invitations_utenteId_idx" ON "invitations"("utenteId");
```

> A migration é aplicada automaticamente no Railway via `prisma migrate deploy` no arranque do servidor.
