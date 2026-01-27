// Script alternatif utilisant Resend (plus simple, service moderne)
// Installation: npm install resend

import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialiser Resend avec votre clé API
const RESEND_API_KEY = 're_cd6XYx2X_8oGe2Wst29M8WMiwZ8L1f6Dw';
const resend = new Resend(RESEND_API_KEY);

// Lire le template HTML
const templatePath = path.join(__dirname, 'email-template.html');
const htmlContent = fs.readFileSync(templatePath, 'utf-8');

// Remplacer le lien du bouton
const questionnaireUrl = 'https://urai-questionnaire.netlify.app/';
const htmlWithLink = htmlContent.replace('href="https://urai-questionnaire.netlify.app/"', `href="${questionnaireUrl}"`).replace('href="#"', `href="${questionnaireUrl}"`);

async function sendEmail() {
  try {
    console.log('Envoi de l\'email à faddouli.saad@gmail.com...');
    
    const { data, error } = await resend.emails.send({
      from: 'URAI <noreply@gesparc360.com>',
      to: ['faddouli.saad@gmail.com'],
      subject: 'URAI - Invitation au questionnaire stratégique',
      html: htmlWithLink,
    });

    if (error) {
      console.error('❌ Erreur:', JSON.stringify(error, null, 2));
      return;
    }

    console.log('✅ Email envoyé avec succès!');
    console.log('Email ID:', data.id);
    console.log('\n📧 Détails:');
    console.log('   Destinataire: faddouli.saad@gmail.com');
    console.log('   Expéditeur: URAI <noreply@gesparc360.com>');
    console.log('   Lien questionnaire: https://urai-questionnaire.netlify.app/');
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi:', error);
  }
}

sendEmail();

