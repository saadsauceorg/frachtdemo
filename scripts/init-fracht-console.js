import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, '../.env.local') });
config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = 'https://ibvmkhmjgpwwxkngllti.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlidm1raG1qZ3B3d3hrbmdsbHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzc3NzgsImV4cCI6MjA3NTcxMzc3OH0.yEPftdwsZV4OXWnwERWcUvk_rZReVGe4q9iQTcRRtdc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DESIGNS_DIR = path.join(__dirname, '../public/designs');

// Créer les tags de base
async function createDefaultTags() {
  console.log('📋 Création des tags par défaut...\n');
  
  const defaultTags = [
    { name: 'Branding', color: '#0B3C5D' },
    { name: 'Mur intérieur', color: '#4A90E2' },
    { name: 'Affiche', color: '#E94B3C' },
    { name: 'Vitrine', color: '#9B59B6' },
    { name: 'Hall', color: '#27AE60' },
    { name: 'Bureau', color: '#F5A623' },
    { name: 'Décoration', color: '#E94B3C' },
    { name: 'Transport', color: '#16A085' },
    { name: 'Logistique', color: '#E67E22' },
  ];

  for (const tag of defaultTags) {
    try {
      const { data, error } = await supabase
        .from('tags')
        .upsert({ name: tag.name, color: tag.color }, { onConflict: 'name' })
        .select()
        .single();

      if (error && error.code !== '23505') { // Ignore duplicate key error
        console.error(`❌ Erreur pour tag ${tag.name}:`, error.message);
      } else {
        console.log(`✅ Tag: ${tag.name}`);
      }
    } catch (error) {
      console.error(`❌ Erreur pour tag ${tag.name}:`, error.message);
    }
  }
}

// Fonction pour obtenir les dimensions d'une image
function getImageDimensions(imagePath) {
  return new Promise((resolve) => {
    // Estimation basée sur le nom ou valeur par défaut
    // En production, utiliser sharp ou jimp
    const ext = path.extname(imagePath).toLowerCase();
    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
      // Valeur par défaut raisonnable
      resolve({ width: 1200, height: 800 });
    } else {
      resolve({ width: 1200, height: 800 });
    }
  });
}

// Importer les images existantes
async function importExistingImages() {
  console.log('\n📸 Import des images existantes...\n');

  const files = fs.readdirSync(DESIGNS_DIR)
    .filter(file => /\.(png|jpg|jpeg)$/i.test(file))
    .filter(file => !file.includes('README'));

  console.log(`${files.length} images trouvées\n`);

  for (const file of files) {
    try {
      const imagePath = path.join(DESIGNS_DIR, file);
      const dimensions = await getImageDimensions(imagePath);
      const aspectRatio = dimensions.width / dimensions.height;

      // Générer un titre depuis le nom de fichier
      let title = file
        .replace(/\.(png|jpg|jpeg)$/i, '')
        .replace(/^freepik__/gi, '')
        .replace(/[_-]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      if (title.length > 60) title = title.substring(0, 57) + '...';
      if (!title.toLowerCase().includes('design') && !title.toLowerCase().includes('mural')) {
        title = `Design mural - ${title}`;
      }

      // Créer le design dans Supabase
      const { data: design, error } = await supabase
        .from('designs')
        .insert({
          title,
          image_url: `/designs/${file}`, // Utiliser le chemin local pour l'instant
          aspect_ratio: aspectRatio,
          status: 'draft',
          project: 'Projet Fracht',
          location: 'France',
          client: 'Fracht Group',
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Erreur pour ${file}:`, error.message);
        continue;
      }

      console.log(`✅ ${file} → ${title}`);

      // Ajouter quelques tags si le nom contient des mots-clés
      if (file.toLowerCase().includes('logo') || file.toLowerCase().includes('branding')) {
        const { data: tag } = await supabase.from('tags').select('id').eq('name', 'Branding').single();
        if (tag) {
          await supabase.from('design_tags').insert({ design_id: design.id, tag_id: tag.id });
        }
      }
    } catch (error) {
      console.error(`❌ Erreur pour ${file}:`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 Initialisation de Fracht Console...\n');
  
  await createDefaultTags();
  await importExistingImages();
  
  console.log('\n🎉 Initialisation terminée!');
  console.log('💡 Vous pouvez maintenant utiliser Fracht Console avec les données Supabase');
}

main().catch(console.error);
