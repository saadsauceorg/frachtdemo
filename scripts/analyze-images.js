import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
config({ path: path.join(__dirname, '../.env.local') });
config({ path: path.join(__dirname, '../.env') });

// Configuration
const DESIGNS_DIR = path.join(__dirname, '../public/designs');
const OUTPUT_FILE = path.join(__dirname, '../data/mockData.ts');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ Erreur: GEMINI_API_KEY n\'est pas définie dans les variables d\'environnement');
  console.log('💡 Créez un fichier .env.local avec: GEMINI_API_KEY=votre_cle');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Fonction pour convertir image en base64
function imageToBase64(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  return imageBuffer.toString('base64');
}

// Fonction pour analyser une image avec Gemini
async function analyzeImage(imagePath, imageName) {
  try {
    console.log(`🔍 Analyse de: ${imageName}...`);
    
    const imageBase64 = imageToBase64(imagePath);
    const ext = path.extname(imagePath).toLowerCase().replace('.', '');
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

    const prompt = `Analyse cette image de design mural/branding corporate et génère un titre professionnel en français et un contexte court.

Réponds UNIQUEMENT avec un JSON valide dans ce format exact:
{
  "title": "Titre descriptif du design",
  "description": "Description courte",
  "tags": ["tag1", "tag2"],
  "project": "Nom du projet",
  "location": "Localisation",
  "status": "draft"
}

Le titre doit être professionnel et descriptif (ex: "Mur de marque - Siège social", "Affiche branding - Showroom").`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType,
        },
      },
    ]);

    const response = result.response;
    let text = response.text();
    
    // Nettoyer la réponse pour extraire le JSON
    text = text.trim();
    
    // Si la réponse contient des markdown code blocks, les enlever
    if (text.includes('```')) {
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }
    
    // Extraire le JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Réponse JSON non trouvée: ' + text.substring(0, 100));
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    // Validation et valeurs par défaut
    if (!analysis.title) analysis.title = `Design mural - ${imageName.replace(/\.(png|jpg|jpeg)$/i, '')}`;
    if (!analysis.tags || !Array.isArray(analysis.tags)) analysis.tags = ['Branding', 'Mur intérieur'];
    if (!analysis.project) analysis.project = 'Projet Fracht';
    if (!analysis.location) analysis.location = 'France';
    if (!analysis.status) analysis.status = 'draft';
    
    console.log(`✅ ${imageName}: ${analysis.title}`);
    return analysis;
  } catch (error) {
    console.error(`❌ Erreur pour ${imageName}:`, error.message);
    // Valeurs par défaut en cas d'erreur
    const cleanName = imageName.replace(/freepik__|\.(png|jpg|jpeg)$/gi, '').replace(/_/g, ' ').substring(0, 50);
    return {
      title: `Design mural - ${cleanName || 'Nouveau design'}`,
      description: 'Design mural corporate',
      tags: ['Branding', 'Mur intérieur'],
      project: 'Projet Fracht',
      location: 'France',
      status: 'draft',
    };
  }
}

// Fonction principale
async function main() {
  console.log('🚀 Démarrage de l\'analyse des images...\n');

  // Lister toutes les images (exclure les anciennes images de démo)
  const files = fs.readdirSync(DESIGNS_DIR)
    .filter(file => /\.(png|jpg|jpeg)$/i.test(file))
    .filter(file => !file.includes('README'))
    .filter(file => !file.match(/^(bureau-lyon|espace-detente|facade|hall-paris|mur-lyon|mur-paris|salle-reunion|showroom-marseille)-1\.jpg$/));

  console.log(`📸 ${files.length} images trouvées\n`);

  if (files.length === 0) {
    console.log('⚠️  Aucune nouvelle image trouvée. Vérifiez le dossier public/designs/');
    return;
  }

  const designItems = [];
  let idCounter = 1;

  // Traiter chaque image
  for (const file of files) {
    const imagePath = path.join(DESIGNS_DIR, file);
    
    // Analyser l'image
    const analysis = await analyzeImage(imagePath, file);
    
    // Estimation du ratio d'aspect (par défaut pour designs muraux)
    // Vous pouvez ajuster selon vos besoins
    const aspectRatio = 1.2; // Format paysage typique pour designs muraux

    // Générer les tags avec couleurs
    const tagColors = ['#0B3C5D', '#4A90E2', '#E94B3C', '#F5A623', '#9B59B6', '#27AE60', '#16A085', '#E67E22', '#3498DB'];
    const tags = analysis.tags.slice(0, 3).map((tag, idx) => ({
      id: `tag${idCounter}_${idx}`,
      label: tag,
      color: tagColors[idx % tagColors.length],
    }));

    // Créer l'objet DesignItem
    const designItem = {
      id: String(idCounter),
      title: analysis.title,
      imageUrl: `/designs/${file}`,
      aspectRatio: aspectRatio,
      project: analysis.project,
      location: analysis.location,
      client: 'Fracht Group',
      status: analysis.status || 'draft',
      tags: tags,
      versionHistory: [
        {
          id: `v${idCounter}`,
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
    idCounter++;

    // Petite pause pour éviter de surcharger l'API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

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

// Note: Ce fichier a été généré automatiquement par le script analyze-images.js
// Pour régénérer: npm run analyze-images
`;

  fs.writeFileSync(OUTPUT_FILE, content);

  console.log(`\n✅ ${designItems.length} designs générés dans ${OUTPUT_FILE}`);
  console.log('🎉 Analyse terminée!');
  console.log('\n💡 Pour voir les résultats, relancez l\'application: npm run dev');
}

main().catch(console.error);
