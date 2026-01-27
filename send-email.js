import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration de l'email
const EMAIL_CONFIG = {
  // Remplacez par votre adresse Gmail
  from: 'votre-email@gmail.com',
  to: 'faddouli.saad@gmail.com',
  subject: 'URAI - Invitation au questionnaire stratégique',
};

// Lire le template HTML
const templatePath = path.join(__dirname, 'email-template.html');
const htmlContent = fs.readFileSync(templatePath, 'utf-8');

// Remplacer le lien du bouton par le vrai lien du questionnaire
// Remplacez cette URL par votre URL réelle
const questionnaireUrl = 'https://votre-domaine.com/questionnaire';
const htmlWithLink = htmlContent.replace('href="#"', `href="${questionnaireUrl}"`);

// Configuration du transporteur (Gmail)
// Option 1: Utiliser un mot de passe d'application Gmail
// Allez dans votre compte Google > Sécurité > Mots de passe des applications
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'votre-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'votre-mot-de-passe-application',
  },
});

// Fonction pour envoyer l'email
async function sendEmail() {
  try {
    const mailOptions = {
      from: EMAIL_CONFIG.from,
      to: EMAIL_CONFIG.to,
      subject: EMAIL_CONFIG.subject,
      html: htmlWithLink,
    };

    console.log('Envoi de l\'email à', EMAIL_CONFIG.to, '...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email envoyé avec succès!');
    console.log('Message ID:', info.messageId);
    console.log('Réponse:', info.response);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
    process.exit(1);
  }
}

// Exécuter
sendEmail();



