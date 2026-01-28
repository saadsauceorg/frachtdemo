import { createClient } from '@supabase/supabase-js';
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

/**
 * Vérifie l'état des thumbnails dans la base de données
 */
async function checkThumbnails() {
  console.log('🔍 Vérification de l\'état des thumbnails dans la DB...\n');
  
  try {
    // Compter les designs sans thumbnail
    const { count: missingThumbCount, error: countError } = await supabase
      .from('designs')
      .select('*', { count: 'exact', head: true })
      .not('image_original_url', 'is', null)
      .is('image_thumb_url', null);
    
    if (countError) {
      throw new Error(`Erreur comptage: ${countError.message}`);
    }
    
    // Compter le total des designs avec image_original_url
    const { count: totalWithOriginal, error: totalError } = await supabase
      .from('designs')
      .select('*', { count: 'exact', head: true })
      .not('image_original_url', 'is', null);
    
    if (totalError) {
      throw new Error(`Erreur comptage total: ${totalError.message}`);
    }
    
    // Compter les designs avec thumbnail
    const { count: withThumbCount, error: withThumbError } = await supabase
      .from('designs')
      .select('*', { count: 'exact', head: true })
      .not('image_thumb_url', 'is', null);
    
    if (withThumbError) {
      throw new Error(`Erreur comptage avec thumb: ${withThumbError.message}`);
    }
    
    // Afficher les résultats
    console.log('='.repeat(60));
    console.log('📊 RÉSULTATS DE LA VÉRIFICATION');
    console.log('='.repeat(60));
    console.log(`📸 Designs avec image_original_url: ${totalWithOriginal || 0}`);
    console.log(`✅ Designs avec image_thumb_url: ${withThumbCount || 0}`);
    console.log(`❌ Designs SANS image_thumb_url: ${missingThumbCount || 0}`);
    console.log('='.repeat(60));
    
    // Vérifier le critère de succès
    if (missingThumbCount === 0) {
      console.log('\n✅ SUCCÈS: Tous les designs ont leur thumbnail!');
      console.log('   Résultat attendu: 0 ✓');
      return true;
    } else {
      console.log(`\n❌ ÉCHEC: ${missingThumbCount} design(s) sans thumbnail`);
      console.log('   Résultat attendu: 0 ✗');
      
      // Afficher les IDs des designs manquants
      const { data: missingDesigns, error: listError } = await supabase
        .from('designs')
        .select('id, title, image_original_url')
        .not('image_original_url', 'is', null)
        .is('image_thumb_url', null)
        .limit(10);
      
      if (!listError && missingDesigns && missingDesigns.length > 0) {
        console.log('\n📋 Exemples de designs sans thumbnail (max 10):');
        missingDesigns.forEach((design, idx) => {
          console.log(`   ${idx + 1}. ${design.title} (ID: ${design.id})`);
          console.log(`      Original: ${design.image_original_url}`);
        });
      }
      
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la vérification:', error.message);
    process.exit(1);
  }
}

// Exécuter le script
checkThumbnails().catch(console.error);
