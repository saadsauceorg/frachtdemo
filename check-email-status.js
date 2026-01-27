// Script pour vérifier le statut d'un email envoyé via Resend
import { Resend } from 'resend';

const RESEND_API_KEY = 're_cd6XYx2X_8oGe2Wst29M8WMiwZ8L1f6Dw';
const resend = new Resend(RESEND_API_KEY);

// Dernier Email ID envoyé
const emailId = '81c200df-1b0f-4e50-8e50-7781826fa14e';

async function checkEmailStatus() {
  try {
    console.log('🔍 Vérification du statut de l\'email...');
    console.log('Email ID:', emailId);
    console.log('\n📋 Pour vérifier manuellement:');
    console.log('   1. Allez sur https://resend.com/emails');
    console.log('   2. Connectez-vous avec votre compte Resend');
    console.log('   3. Cherchez l\'email ID:', emailId);
    console.log('\n💡 Note importante:');
    console.log('   - Le domaine "onboarding@resend.dev" est un domaine de test');
    console.log('   - Les emails peuvent être limités ou aller en spam');
    console.log('   - Pour la production, vérifiez votre domaine sur Resend');
    console.log('   - Vérifiez aussi votre dossier SPAM dans Gmail');
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

checkEmailStatus();



