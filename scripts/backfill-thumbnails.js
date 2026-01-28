import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, '../.env.local') });
config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = 'https://ibvmkhmjgpwwxkngllti.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlidm1raG1qZ3B3d3hrbmdsbHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzc3NzgsImV4cCI6MjA3NTcxMzc3OH0.yEPftdwsZV4OXWnwERWcUvk_rZReVGe4q9iQTcRRtdc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const BUCKET_NAME = 'files';
const THUMB_MAX_WIDTH = 800;
const THUMB_QUALITY = 0.8;

/**
 * Télécharge une image depuis une URL
 */
async function downloadImage(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    throw new Error(`Erreur téléchargement image: ${error.message}`);
  }
}

/**
 * Génère un thumbnail à partir d'un buffer d'image
 */
async function generateThumbnail(imageBuffer) {
  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    
    // Calculer les dimensions du thumbnail
    const width = metadata.width;
    const height = metadata.height;
    const scale = Math.min(THUMB_MAX_WIDTH / width, 1);
    const thumbWidth = Math.round(width * scale);
    const thumbHeight = Math.round(height * scale);
    
    // Générer le thumbnail
    const thumbBuffer = await image
      .resize(thumbWidth, thumbHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: Math.round(THUMB_QUALITY * 100) })
      .toBuffer();
    
    return thumbBuffer;
  } catch (error) {
    throw new Error(`Erreur génération thumbnail: ${error.message}`);
  }
}

/**
 * Upload le thumbnail vers Supabase Storage
 */
async function uploadThumbnail(thumbBuffer, originalUrl) {
  try {
    // Extraire le nom de fichier de l'URL originale
    const urlParts = originalUrl.split('/');
    const originalFileName = urlParts[urlParts.length - 1];
    const fileExt = originalFileName.split('.').pop()?.toLowerCase() || 'jpg';
    const baseFileName = originalFileName.replace(`.${fileExt}`, '');
    
    // Générer un nom de fichier pour le thumbnail
    const thumbFileName = `${baseFileName}_thumb.${fileExt}`;
    
    // Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(thumbFileName, thumbBuffer, {
        contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
        upsert: true, // Remplacer si existe déjà
        cacheControl: '31536000', // 1 an cache
      });
    
    if (uploadError) {
      throw new Error(`Erreur upload: ${uploadError.message}`);
    }
    
    if (!uploadData?.path) {
      throw new Error('Aucun chemin retourné après upload');
    }
    
    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(uploadData.path);
    
    if (!publicUrl) {
      throw new Error('Impossible d\'obtenir l\'URL publique');
    }
    
    return publicUrl;
  } catch (error) {
    throw new Error(`Erreur upload thumbnail: ${error.message}`);
  }
}

/**
 * Met à jour le design avec l'URL du thumbnail
 */
async function updateDesignThumbnail(designId, thumbUrl) {
  const { error } = await supabase
    .from('designs')
    .update({ image_thumb_url: thumbUrl })
    .eq('id', designId);
  
  if (error) {
    throw new Error(`Erreur mise à jour DB: ${error.message}`);
  }
}

/**
 * Traite un design : génère et upload le thumbnail
 */
async function processDesign(design) {
  try {
    console.log(`\n📸 Traitement design #${design.id} - ${design.title}`);
    console.log(`   Original: ${design.image_original_url}`);
    
    // Télécharger l'image originale
    console.log(`   ⬇️  Téléchargement...`);
    const imageBuffer = await downloadImage(design.image_original_url);
    const sizeKB = (imageBuffer.length / 1024).toFixed(2);
    console.log(`   ✅ Téléchargé (${sizeKB} KB)`);
    
    // Générer le thumbnail
    console.log(`   🎨 Génération thumbnail...`);
    const thumbBuffer = await generateThumbnail(imageBuffer);
    const thumbSizeKB = (thumbBuffer.length / 1024).toFixed(2);
    console.log(`   ✅ Thumbnail généré (${thumbSizeKB} KB)`);
    
    // Upload le thumbnail
    console.log(`   📤 Upload thumbnail...`);
    const thumbUrl = await uploadThumbnail(thumbBuffer, design.image_original_url);
    console.log(`   ✅ Uploadé: ${thumbUrl}`);
    
    // Mettre à jour la DB
    console.log(`   💾 Mise à jour DB...`);
    await updateDesignThumbnail(design.id, thumbUrl);
    console.log(`   ✅ Design mis à jour`);
    
    return { success: true, designId: design.id };
  } catch (error) {
    console.error(`   ❌ Erreur: ${error.message}`);
    return { success: false, designId: design.id, error: error.message };
  }
}

/**
 * Script principal de backfill
 */
async function backfillThumbnails() {
  console.log('🚀 Démarrage du backfill des thumbnails...\n');
  
  try {
    // Récupérer tous les designs avec image_original_url mais sans image_thumb_url
    const { data: designs, error: fetchError } = await supabase
      .from('designs')
      .select('id, title, image_original_url, image_thumb_url')
      .not('image_original_url', 'is', null)
      .is('image_thumb_url', null);
    
    if (fetchError) {
      throw new Error(`Erreur récupération designs: ${fetchError.message}`);
    }
    
    if (!designs || designs.length === 0) {
      console.log('✅ Aucun design à traiter. Tous les designs ont déjà leur thumbnail.');
      return;
    }
    
    console.log(`📊 ${designs.length} design(s) à traiter\n`);
    
    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };
    
    // Traiter chaque design (séquentiellement pour éviter la surcharge)
    for (let i = 0; i < designs.length; i++) {
      const design = designs[i];
      console.log(`\n[${i + 1}/${designs.length}]`);
      
      const result = await processDesign(design);
      
      if (result.success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push({
          designId: result.designId,
          error: result.error,
        });
      }
      
      // Petit délai entre chaque traitement pour éviter la surcharge
      if (i < designs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DU BACKFILL');
    console.log('='.repeat(60));
    console.log(`✅ Succès: ${results.success}`);
    console.log(`❌ Échecs: ${results.failed}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Erreurs détaillées:');
      results.errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. Design ${err.designId}: ${err.error}`);
      });
    }
    
    console.log('\n🎉 Backfill terminé!');
    
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    process.exit(1);
  }
}

// Exécuter le script
backfillThumbnails().catch(console.error);
