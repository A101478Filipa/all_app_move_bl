import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendPasswordResetEmail = async (email: string, otp: string): Promise<void> => {
  await transporter.sendMail({
    from: `"Move+" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Recuperação de Palavra-Passe – Move+',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a2e;">Recuperação de Palavra-Passe</h2>
        <p>Recebemos um pedido para repor a sua palavra-passe no Move+.</p>
        <p>Use o seguinte código para criar uma nova palavra-passe:</p>
        <div style="background: #f4f4f4; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a2e;">${otp}</span>
        </div>
        <p style="color: #666; font-size: 14px;">Este código expira em <strong>1 hora</strong>.</p>
        <p style="color: #666; font-size: 14px;">Se não solicitou a recuperação da palavra-passe, ignore este email.</p>
      </div>
    `,
  });
};
