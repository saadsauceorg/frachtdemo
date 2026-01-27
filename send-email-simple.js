// Script simple pour envoyer l'email via fetch vers l'Edge Function Supabase
// Usage: node send-email-simple.js

const SUPABASE_URL = 'https://ibvmkhmjgpwwxkngllti.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlidm1raG1qZ3B3d3hrbmdsbHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzc3NzgsImV4cCI6MjA3NTcxMzc3OH0.yEPftdwsZV4OXWnwERWcUvk_rZReVGe4q9iQTcRRtdc';

async function sendEmail() {
  try {
    console.log('📧 Envoi de l\'email à faddouli.saad@gmail.com...');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        to: 'faddouli.saad@gmail.com',
        questionnaireUrl: 'https://urai-questionnaire.netlify.app/', // URL du questionnaire
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erreur lors de l\'envoi');
    }

    console.log('✅ Email envoyé avec succès!');
    console.log('Message ID:', result.messageId);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n💡 Note: Assurez-vous que:');
    console.log('   1. L\'Edge Function "send-email" est déployée sur Supabase');
    console.log('   2. La variable RESEND_API_KEY est configurée dans Supabase');
    console.log('   3. Votre domaine email est vérifié sur Resend');
  }
}

sendEmail();

