# Fracht Console - Guide d'utilisation

## 🚀 Démarrage rapide

### 1. Initialiser les données Supabase

```bash
npm run init-console
```

Ce script va :
- Créer les tags par défaut (Branding, Mur intérieur, Affiche, etc.)
- Importer toutes vos images du dossier `public/designs/` dans Supabase
- Générer automatiquement les titres depuis les noms de fichiers

### 2. Lancer l'application

```bash
npm run dev
```

## 📊 Structure Supabase

### Tables créées

- **designs** : Les designs muraux
- **tags** : Tags disponibles
- **design_tags** : Relation many-to-many designs ↔ tags
- **comments** : Commentaires texte + audio
- **versions** : Historique des versions (v1, v2, v3...)

## 🎨 Utilisation

### Dans le Drawer (panel latéral)

1. **Éditer le titre** : Cliquez sur le titre pour l'éditer inline
2. **Ajouter/Retirer des tags** : Cliquez sur les tags disponibles ou existants
3. **Ajouter un commentaire** :
   - Tapez dans le champ texte + Entrée ou bouton "Envoyer"
   - Ou cliquez sur le micro pour enregistrer un commentaire vocal
4. **Changer le statut** :
   - **Approuver** : Passe le design en statut "approved"
   - **Modifier** : Passe le design en statut "review"
5. **Upload nouvelle version** :
   - Glisser-déposer une image dans le drawer
   - Ou cliquer sur "Nouvelle version" et sélectionner un fichier
   - Le versioning est automatique (v1, v2, v3...)

### Galerie Masonry

- **Respecte les proportions réelles** : Portrait = plus haut, Landscape = plus large, Carré = normal
- **Hover** : Zoom léger + overlay bleu Fracht
- **Click** : Ouvre le drawer avec tous les détails

## 🔧 Scripts disponibles

- `npm run dev` : Lancer l'application
- `npm run init-console` : Initialiser les données Supabase
- `npm run generate-designs` : Régénérer mockData.ts depuis les images locales

## 📁 Où mettre mes images ?

Placez vos images dans `public/designs/` (PNG ou JPG).

Puis lancez :
```bash
npm run init-console
```

Les images seront automatiquement importées dans Supabase avec des titres générés.

## 🎯 Fonctionnalités

✅ CRUD complet avec Supabase
✅ Titre éditable inline
✅ Tags cliquables (add/remove)
✅ Commentaires texte + audio
✅ Upload de nouvelles versions (drag & drop)
✅ Versioning automatique
✅ Toasts notifications
✅ Masonry Pinterest avec proportions réelles
✅ Design aligné identité Fracht Group

## 🐛 Dépannage

### Les images ne s'affichent pas
- Vérifiez que les chemins dans Supabase sont corrects
- Les images dans `public/designs/` sont servies directement par Vite

### Erreur Supabase
- Vérifiez que les tables sont créées (migration appliquée)
- Vérifiez les clés API dans `.env.local`

### Masonry ne respecte pas les proportions
- Le masonry calcule automatiquement la hauteur réelle au chargement
- Attendez que les images soient chargées pour voir les vraies proportions
