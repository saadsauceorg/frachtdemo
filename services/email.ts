import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Clé API Resend
const RESEND_API_KEY = 're_cd6XYx2X_8oGe2Wst29M8WMiwZ8L1f6Dw';
const resend = new Resend(RESEND_API_KEY);

// Lire le template HTML
const templatePath = path.join(__dirname, '../email-template.html');

export interface SendEmailOptions {
  to: string | string[];
  questionnaireUrl?: string;
  subject?: string;
}

export async function sendQuestionnaireEmail({ 
  to, 
  questionnaireUrl = 'https://urai-questionnaire.netlify.app/',
  subject = 'URAI - Invitation au questionnaire stratégique'
}: SendEmailOptions) {
  try {
    // Lire le template HTML
    const htmlContent = fs.readFileSync(templatePath, 'utf-8');
    
    // Remplacer le lien du bouton
    const htmlWithLink = htmlContent.replace('href="https://urai-questionnaire.netlify.app/"', `href="${questionnaireUrl}"`).replace('href="#"', `href="${questionnaireUrl}"`);

    const { data, error } = await resend.emails.send({
      from: 'URAI <noreply@gesparc360.com>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html: htmlWithLink,
    });

    if (error) {
      throw new Error(error.message || 'Erreur lors de l\'envoi de l\'email');
    }

    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    throw error;
  }
}

