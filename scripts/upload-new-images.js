import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://ibvmkhmjgpwwxkngllti.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlidm1raG1qZ3B3d3hrbmdsbHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzc3NzgsImV4cCI6MjA3NTcxMzc3OH0.yEPftdwsZV4OXWnwERWcUvk_rZReVGe4q9iQTcRRtdc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const NEW_ONES_DIR = path.join(__dirname, '../public/NEW-ONES');

// Fonction pour extraire le titre depuis le nom de fichier
function extractTitle(filename) {
  // Enlever l'extension
  let title = filename.replace(/\.[^/.]+$/, '');
  
  // Remplacer les tirets et underscores par des espaces
  title = title.replace(/[-_]/g, ' ');
  
  // Capitaliser chaque mot
  title = title.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  return title;
}

// Fonction pour extraire le projet depuis le nom
function extractProject(filename) {
  const lower = filename.toLowerCase();
  
  if (lower.includes('casablanca')) return 'Casablanca';
  if (lower.includes('bateau') || lower.includes('ship')) return 'Transport Maritime';
  if (lower.includes('avion') || lower.includes('plane')) return 'Transport Aérien';
  if (lower.includes('package') || lower.includes('colis')) return 'Logistique';
  
  return 'Projet Fracht';
}

// Fonction pour déterminer la localisation
function extractLocation(filename) {
  const lower = filename.toLowerCase();
  
  if (lower.includes('casablanca')) return 'Casablanca, Maroc';
  if (lower.includes('paris')) return 'Paris, France';
  if (lower.includes('lyon')) return 'Lyon, France';
  if (lower.includes('marseille')) return 'Marseille, France';
  
  return 'France';
}

// Fonction pour obtenir les dimensions de l'image
async function getImageDimensions(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      aspectRatio: (metadata.width || 1) / (metadata.height || 1),
    };
  } catch (error) {
    console.error(`Erreur lors de la lecture des dimensions pour ${filePath}:`, error);
    // Valeurs par défaut
    return {
      width: 1920,
      height: 1080,
      aspectRatio: 1.78,
    };
  }
}

// Fonction pour obtenir le dernier order_index
async function getNextOrderIndex() {
  const { data: lastDesign } = await supabase
    .from('designs')
    .select('order_index')
    .order('order_index', { ascending: false })
    .limit(1)
    .single();

  return lastDesign?.order_index ? lastDesign.order_index + 1 : 0;
}

async function uploadAndCreateDesign(file) {
  try {
    const filePath = path.join(NEW_ONES_DIR, file);
    const fileExt = file.split('.').pop()?.toLowerCase();
    const contentType = fileExt === 'png' ? 'image/png' : 'image/jpeg';
    
    console.log(`\n📸 Traitement de ${file}...`);
    
    // Lire le fichier
    const fileBuffer = fs.readFileSync(filePath);
    
    // Obtenir les dimensions
    const { width, height, aspectRatio } = await getImageDimensions(filePath);
    console.log(`   Dimensions: ${width}x${height} (ratio: ${aspectRatio.toFixed(2)})`);
    
    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const fileName = `${timestamp}-${randomStr}.${fileExt}`;
    
    // Upload vers Supabase Storage
    console.log(`   📤 Upload vers Supabase Storage...`);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('files')
      .upload(`designs/${fileName}`, fileBuffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Erreur upload: ${uploadError.message}`);
    }

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('files')
      .getPublicUrl(`designs/${fileName}`);

    console.log(`   ✅ Image uploadée: ${publicUrl}`);
    
    // Extraire les métadonnées
    const title = extractTitle(file);
    const project = extractProject(file);
    const location = extractLocation(file);
    
    console.log(`   📝 Métadonnées: "${title}" - ${project} - ${location}`);
    
    // Obtenir le prochain order_index
    const orderIndex = await getNextOrderIndex();
    
    // Créer le design dans la base de données
    console.log(`   💾 Création du design dans la base de données...`);
    const { data: designData, error: designError } = await supabase
      .from('designs')
      .insert({
        title,
        image_url: publicUrl,
        aspect_ratio: aspectRatio,
        status: 'draft',
        project,
        location,
        client: 'Fracht Group',
        order_index: orderIndex,
      })
      .select()
      .single();

    if (designError) {
      throw new Error(`Erreur création design: ${designError.message}`);
    }

    console.log(`   ✅ Design créé avec l'ID: ${designData.id}`);
    
    return { success: true, design: designData };
  } catch (error) {
    console.error(`   ❌ Erreur pour ${file}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Upload des nouvelles images vers Supabase...\n');
  
  // Lister les fichiers dans NEW-ONES
  if (!fs.existsSync(NEW_ONES_DIR)) {
    console.error(`❌ Le dossier ${NEW_ONES_DIR} n'existe pas!`);
    process.exit(1);
  }

  const files = fs.readdirSync(NEW_ONES_DIR)
    .filter(file => /\.(png|jpg|jpeg)$/i.test(file));

  if (files.length === 0) {
    console.log('⚠️  Aucune image trouvée dans NEW-ONES');
    process.exit(0);
  }

  console.log(`📸 ${files.length} image(s) trouvée(s)\n`);

  const results = [];
  for (const file of files) {
    const result = await uploadAndCreateDesign(file);
    results.push({ file, ...result });
  }

  // Résumé
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Réussis: ${successful}`);
  console.log(`❌ Échoués: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Échecs:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.file}: ${r.error}`);
    });
  }
  
  console.log('\n🎉 Traitement terminé!');
}

main().catch(console.error);
