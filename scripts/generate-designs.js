import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DESIGNS_DIR = path.join(__dirname, '../public/designs');
const OUTPUT_FILE = path.join(__dirname, '../data/mockData.ts');

// Fonction pour nettoyer le nom de fichier et générer un titre
function generateTitleFromFilename(filename) {
  // Enlever l'extension
  let name = filename.replace(/\.(png|jpg|jpeg)$/i, '');
  
  // Enlever les préfixes freepik et numéros
  name = name.replace(/^freepik__/gi, '');
  name = name.replace(/__\d+$/g, ''); // Enlever les numéros à la fin
  name = name.replace(/_\d+$/g, ''); // Enlever les numéros simples
  
  // Détecter des mots-clés importants
  const keywords = {
    'affiche': 'Affiche',
    'avion': 'Affiche avion',
    'cargo': 'Affiche cargo',
    'logo': 'Logo',
    'rebrand': 'Rebranding',
    'modifier': 'Modification',
    'supprimer': 'Nettoyage',
    'mural': 'Mur',
    'wall': 'Mur',
    'hall': 'Hall',
    'bureau': 'Bureau',
    'showroom': 'Showroom',
    'vitrine': 'Vitrine',
  };
  
  // Chercher des mots-clés dans le nom
  let detectedType = null;
  for (const [key, value] of Object.entries(keywords)) {
    if (name.toLowerCase().includes(key)) {
      detectedType = value;
      break;
    }
  }
  
  // Si on trouve "affiche avion" ou similaire, créer un titre spécifique
  if (name.toLowerCase().includes('affiche') && name.toLowerCase().includes('avion')) {
    if (name.toLowerCase().includes('dhl')) {
      return 'Affiche branding - Avion DHL';
    }
    return 'Affiche branding - Avion cargo';
  }
  
  if (name.toLowerCase().includes('affiche') && name.toLowerCase().includes('cargo')) {
    return 'Affiche branding - Avion cargo';
  }
  
  // Si on trouve "logo" ou "rebrand"
  if (name.toLowerCase().includes('logo') || name.toLowerCase().includes('rebrand')) {
    if (name.toLowerCase().includes('cube')) {
      return 'Rebranding logo - Cube';
    }
    if (name.toLowerCase().includes('sac')) {
      return 'Rebranding logo - Sac';
    }
    return 'Rebranding logo corporate';
  }
  
  // Si on trouve "supprimer" ou "modifier"
  if (name.toLowerCase().includes('supprimer')) {
    if (name.toLowerCase().includes('texte')) {
      return 'Nettoyage design - Suppression textes';
    }
    if (name.toLowerCase().includes('logo')) {
      return 'Nettoyage design - Suppression logos';
    }
    if (name.toLowerCase().includes('footer')) {
      return 'Nettoyage design - Footer';
    }
    return 'Nettoyage design';
  }
  
  if (name.toLowerCase().includes('modifier')) {
    return 'Modification design';
  }
  
  // Titre générique basé sur le type détecté
  if (detectedType) {
    return `${detectedType} - Design Fracht`;
  }
  
  // Sinon, créer un titre générique avec numéro
  const match = filename.match(/(\d+)\.(png|jpg|jpeg)$/i);
  const number = match ? match[1] : Math.floor(Math.random() * 1000);
  return `Design mural ${number} - Fracht`;
}

// Fonction pour extraire des tags du nom de fichier
function extractTags(filename) {
  const tags = [];
  const lower = filename.toLowerCase();
  
  if (lower.includes('mur') || lower.includes('wall')) tags.push('Mur intérieur');
  if (lower.includes('logo') || lower.includes('branding')) tags.push('Branding');
  if (lower.includes('affiche') || lower.includes('poster')) tags.push('Affiche');
  if (lower.includes('vitrine') || lower.includes('showroom')) tags.push('Vitrine');
  if (lower.includes('hall') || lower.includes('entrée')) tags.push('Hall');
  if (lower.includes('bureau') || lower.includes('office')) tags.push('Bureau');
  if (lower.includes('avion') || lower.includes('plane')) tags.push('Transport');
  if (lower.includes('cargo') || lower.includes('logistique')) tags.push('Logistique');
  
  // Tags par défaut si aucun trouvé
  if (tags.length === 0) {
    tags.push('Branding', 'Design mural');
  }
  
  return tags.slice(0, 3);
}

// Fonction pour déterminer le projet depuis le nom
function extractProject(filename) {
  const lower = filename.toLowerCase();
  
  if (lower.includes('paris')) return 'Siège Social Paris';
  if (lower.includes('lyon')) return 'Bureau Lyon';
  if (lower.includes('marseille')) return 'Showroom Marseille';
  
  return 'Projet Fracht';
}

// Fonction pour déterminer la localisation
function extractLocation(filename) {
  const lower = filename.toLowerCase();
  
  if (lower.includes('paris')) return 'Paris, France';
  if (lower.includes('lyon')) return 'Lyon, France';
  if (lower.includes('marseille')) return 'Marseille, France';
  
  return 'France';
}

// Fonction principale
function main() {
  console.log('🚀 Génération des designs depuis les images...\n');

  // Lister toutes les images (exclure les anciennes images de démo)
  const files = fs.readdirSync(DESIGNS_DIR)
    .filter(file => /\.(png|jpg|jpeg)$/i.test(file))
    .filter(file => !file.includes('README'));

  console.log(`📸 ${files.length} images trouvées\n`);

  if (files.length === 0) {
    console.log('⚠️  Aucune image trouvée. Vérifiez le dossier public/designs/');
    return;
  }

  const designItems = [];
  const tagColors = ['#0B3C5D', '#4A90E2', '#E94B3C', '#F5A623', '#9B59B6', '#27AE60', '#16A085', '#E67E22', '#3498DB'];

  // Traiter chaque image
  files.forEach((file, index) => {
    const title = generateTitleFromFilename(file);
    const tags = extractTags(file);
    const project = extractProject(file);
    const location = extractLocation(file);
    
    // Générer les tags avec couleurs
    const tagObjects = tags.map((tag, idx) => ({
      id: `tag${index + 1}_${idx}`,
      label: tag,
      color: tagColors[idx % tagColors.length],
    }));

    // Estimation du ratio d'aspect (par défaut pour designs muraux)
    const aspectRatio = 1.2; // Format paysage typique

    // Créer l'objet DesignItem
    const designItem = {
      id: String(index + 1),
      title: title,
      imageUrl: `/designs/${file}`,
      aspectRatio: aspectRatio,
      project: project,
      location: location,
      client: 'Fracht Group',
      status: 'draft',
      tags: tagObjects,
      versionHistory: [
        {
          id: `v${index + 1}`,
          version: '1.0',
          timestamp: new Date().toISOString().split('T')[0],
          author: 'Système',
          changes: 'Import automatique',
        },
      ],
      feedback: [],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    designItems.push(designItem);
    console.log(`✅ ${file} → ${title}`);
  });

  // Générer le contenu TypeScript
  const imports = `import { DesignItem } from '../types/fracht';

`;
  
  const itemsString = JSON.stringify(designItems, null, 2)
    .replace(/"(\w+)":/g, '$1:')
    .replace(/:"/g, ': "')
    .replace(/",/g, '",')
    .replace(/\["/g, '["')
    .replace(/"\]/g, '"]');

  const content = `${imports}export const mockDesignItems: DesignItem[] = ${itemsString};

// Note: Ce fichier a été généré automatiquement par le script generate-designs.js
// Pour régénérer: npm run generate-designs
`;

  fs.writeFileSync(OUTPUT_FILE, content);

  console.log(`\n✅ ${designItems.length} designs générés dans ${OUTPUT_FILE}`);
  console.log('🎉 Génération terminée!');
  console.log('\n💡 Pour voir les résultats, relancez l\'application: npm run dev');
}

main();
