# Service d'Email URAI

Service d'envoi d'emails intégré avec Resend pour envoyer les invitations au questionnaire.

## ✅ Configuration terminée

- ✅ Resend installé et configuré
- ✅ Clé API intégrée : `re_cd6XYx2X_8oGe2Wst29M8WMiwZ8L1f6Dw`
- ✅ Service d'email créé : `services/email.ts`
- ✅ Edge Function Supabase déployée
- ✅ Script d'envoi prêt : `send-email-resend.js`

## 📧 Envoyer un email

### Méthode 1 : Script simple (Recommandé)

```bash
npm run send-email
```

Ou directement :
```bash
node send-email-resend.js
```

### Méthode 2 : Utiliser le service TypeScript

```typescript
import { sendQuestionnaireEmail } from './services/email';

await sendQuestionnaireEmail({
  to: 'email@example.com',
  questionnaireUrl: 'https://votre-domaine.com/questionnaire',
  subject: 'URAI - Invitation au questionnaire stratégique'
});
```

### Méthode 3 : Via Supabase Edge Function

```bash
node send-email-simple.js
```

Ou via fetch :
```javascript
const response = await fetch('https://ibvmkhmjgpwwxkngllti.supabase.co/functions/v1/send-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  },
  body: JSON.stringify({
    to: 'email@example.com',
    questionnaireUrl: 'https://votre-domaine.com/questionnaire'
  }),
});
```

## 📝 Modifier le template

Le template HTML se trouve dans `email-template.html`. Il utilise le même style que l'application URAI.

## 🔧 Configuration

### Changer l'URL du questionnaire

Modifiez la variable `questionnaireUrl` dans :
- `send-email-resend.js` (ligne 21)
- `services/email.ts` (ligne 24)
- `send-email-simple.js` (ligne 19)

### Changer l'adresse email "from"

Pour utiliser votre propre domaine :
1. Vérifiez votre domaine sur Resend : https://resend.com/domains
2. Modifiez `from` dans `services/email.ts` :
   ```typescript
   from: 'URAI <noreply@votre-domaine.com>'
   ```

## 📦 Fichiers créés

- `services/email.ts` - Service d'email réutilisable
- `send-email-resend.js` - Script d'envoi simple
- `send-email-simple.js` - Script pour Supabase Edge Function
- `email-template.html` - Template HTML de l'email
- `supabase/functions/send-email/index.ts` - Edge Function Supabase

## ✅ Test réussi

Email envoyé avec succès à `faddouli.saad@gmail.com` !
Message ID: `757cbb81-7366-4769-81fd-8088d2fb7331`



