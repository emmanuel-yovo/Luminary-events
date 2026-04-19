import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Centered Mailer Utility
 */
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * Send Reset Password Email
 */
export const sendResetEmail = async (email, token) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    
    const mailOptions = {
        from: process.env.SMTP_FROM || '"Luminary Events" <noreply@luminary.com>',
        to: email,
        subject: 'Réinitialisation de votre mot de passe - Luminary Events',
        html: `
            <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0f172a; color: #ffffff; border-radius: 40px; border: 1px solid #334155;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #6366f1; font-size: 32px; font-weight: 900; margin: 0; letter-spacing: -0.05em;">LUMINARY</h1>
                    <p style="color: #94a3b8; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; margin-top: 5px;">Events</p>
                </div>
                
                <h2 style="font-size: 24px; font-weight: 800; margin-bottom: 20px;">Réinitialisez votre mot de passe</h2>
                
                <p style="color: #cbd5e1; line-height: 1.6; font-size: 16px;">
                    Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Luminary Events. 
                    Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien est valable pendant 1 heure.
                </p>
                
                <div style="text-align: center; margin: 40px 0;">
                    <a href="${resetUrl}" style="background-color: #6366f1; color: #ffffff; padding: 18px 36px; border-radius: 20px; font-weight: 800; text-decoration: none; display: inline-block; box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);">
                        RÉINITIALISER MON MOT DE PASSE
                    </a>
                </div>
                
                <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
                    Si vous n'avez pas demandé ce changement, vous pouvez ignorer cet email en toute sécurité. 
                    Votre mot de passe restera inchangé.
                </p>
                
                <hr style="border: 0; border-top: 1px solid #1e293b; margin: 40px 0;">
                
                <p style="color: #64748b; font-size: 12px; text-align: center;">
                    © ${new Date().getFullYear()} Luminary Events. Conçu pour l'excellence.
                </p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email envoyé avec succès:', info.messageId);
        return { ok: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
        return { ok: false, error: error.message };
    }
};
