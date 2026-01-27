# Améliorer la délivrabilité des emails

## Problème actuel
Les emails arrivent dans la boîte de notifications Gmail au lieu de la boîte de réception principale. Cela est dû à l'utilisation du domaine de test `onboarding@resend.dev`.

## Solution : Vérifier votre domaine sur Resend

Pour que les emails arrivent directement dans la boîte de réception principale, vous devez :

### 1. Vérifier votre domaine sur Resend

1. Allez sur https://resend.com/domains
2. Cliquez sur "Add Domain"
3. Entrez votre domaine (ex: `urai-questionnaire.netlify.app` ou votre propre domaine)
4. Suivez les instructions pour ajouter les enregistrements DNS

### 2. Mettre à jour l'adresse "from"

Une fois votre domaine vérifié, modifiez l'adresse "from" dans :

**`send-email-resend.js`** (ligne 29) :
```javascript
from: 'URAI <noreply@votre-domaine.com>', // Remplacez par votre domaine vérifié
```

**`services/email.ts`** (ligne 35) :
```typescript
from: 'URAI <noreply@votre-domaine.com>', // Utilisez votre domaine vérifié
```

**`supabase/functions/send-email/index.ts`** (ligne 114) :
```typescript
from: "URAI <noreply@votre-domaine.com>", // Remplacez par votre domaine vérifié
```

### 3. Autres améliorations de délivrabilité

- **SPF** : Vérifiez que les enregistrements SPF sont correctement configurés
- **DKIM** : Activez DKIM dans les paramètres Resend
- **DMARC** : Configurez DMARC pour votre domaine
- **Réputation** : Évitez d'envoyer trop d'emails rapidement (rate limiting)

### 4. Test rapide

Pour tester avec votre domaine vérifié :
```bash
npm run send-email
```

## Note importante

Le domaine `onboarding@resend.dev` est uniquement pour les tests et peut avoir des limitations de délivrabilité. Pour la production, utilisez toujours un domaine vérifié.



