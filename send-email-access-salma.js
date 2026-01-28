// Envoi de l'email d'accès Salma via Resend API
// Utilise la variable d'environnement "resend" (clé API) - minuscule comme dans Netlify
// En local : créez un .env avec resend=re_xxx ou exportez resend
// Sur Netlify : la variable "resend" est lue automatiquement

import 'dotenv/config';
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESEND_API_KEY = process.env.resend || process.env.RESEND;
if (!RESEND_API_KEY) {
  console.error('❌ Variable d\'environnement "resend" ou "RESEND" manquante.');
  console.error('   Définissez "resend" avec votre clé API Resend (ex: dans .env ou Netlify).');
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

const templatePath = path.join(__dirname, 'email-access-salma.html');
const htmlContent = fs.readFileSync(templatePath, 'utf-8');

const toEmail = 'faddouli.saad@gmail.com';
// Resend n'autorise pas l'envoi depuis @gmail.com (domaine non vérifiable).
// On utilise le domaine de test Resend avec ton nom en affichage.
const fromEmail = 'Faddouli Saad <onboarding@resend.dev>';

async function sendEmail() {
  try {
    console.log('Envoi de l\'email d\'accès Salma...');
    console.log('  De:', fromEmail);
    console.log('  À:', toEmail);

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: 'Accès Fracht Assets - Salma El Kasri',
      html: htmlContent,
    });

    if (error) {
      console.error('❌ Erreur Resend:', JSON.stringify(error, null, 2));
      if (error.message && error.message.includes('domain')) {
        console.error('\n💡 Astuce: Resend n\'autorise pas l\'envoi depuis @gmail.com.');
        console.error('   Utilisez un domaine vérifié sur resend.com ou, pour test: onboarding@resend.dev');
      }
      process.exit(1);
    }

    console.log('✅ Email envoyé avec succès.');
    console.log('   ID:', data.id);
    console.log('   Vérifiez la boîte de réception (et les spams) de', toEmail);
  } catch (err) {
    console.error('❌ Erreur:', err);
    process.exit(1);
  }
}

sendEmail();
