# Instructions pour envoyer des emails URAI

## Configuration rapide

### 1. Installer Resend
```bash
npm install resend
```

### 2. Configuration

**Clé API Resend** (déjà configurée dans le projet) :
```
re_cd6XYx2X_8oGe2Wst29M8WMiwZ8L1f6Dw
```

**Adresse email expéditeur** :
```
noreply@gesparc360.com
```

**URL du questionnaire** :
```
https://urai-questionnaire.netlify.app/
```

### 3. Envoyer un email

```bash
npm run send-email
```

Ou directement :
```bash
node send-email-resend.js
```

## Utilisation dans un autre projet

### Installation
```bash
npm install resend
```

### Code minimal

```javascript
import { Resend } from 'resend';

const resend = new Resend('re_cd6XYx2X_8oGe2Wst29M8WMiwZ8L1f6Dw');

const { data, error } = await resend.emails.send({
  from: 'URAI <noreply@gesparc360.com>',
  to: ['destinataire@example.com'],
  subject: 'URAI - Invitation au questionnaire stratégique',
  html: '<html>...</html>', // Votre template HTML
});
```

## Fichiers du projet

- `send-email-resend.js` - Script principal d'envoi
- `email-template.html` - Template HTML de l'email
- `services/email.ts` - Service réutilisable TypeScript
- `supabase/functions/send-email/index.ts` - Edge Function Supabase

## Notes importantes

- Le domaine `gesparc360.com` est vérifié sur Resend
- Les emails sont envoyés depuis `noreply@gesparc360.com`
- Le lien du questionnaire pointe vers `https://urai-questionnaire.netlify.app/`
- Pour modifier le destinataire, éditez `send-email-resend.js` (ligne 30)
