# Dossier Designs

Ce dossier contient toutes les images de design mural pour la Fracht Console.

## Comment ajouter vos images

1. **Placez vos images** dans ce dossier (`public/designs/`)

2. **Nommez-les** de manière claire, par exemple :
   - `mur-paris-siege-social.jpg`
   - `bureau-lyon-open-space.png`
   - `showroom-marseille-vitrine.jpg`

3. **Mettez à jour** le fichier `data/mockData.ts` :
   - Remplacez `imageUrl: '/designs/nom-image.jpg'`
   - Ajustez `aspectRatio` selon les dimensions de votre image (largeur / hauteur)

## Formats supportés

- `.jpg` / `.jpeg`
- `.png`
- `.webp`

## Exemple

```typescript
{
  id: '1',
  title: 'Mon design mural',
  imageUrl: '/designs/mon-design.jpg',  // ← Votre image ici
  aspectRatio: 1200 / 800,  // ← Largeur / Hauteur
  // ... reste des données
}
```

## Note

Les images dans `public/` sont servies directement par Vite, donc utilisez toujours le chemin `/designs/nom-image.jpg` (avec le `/` au début).
