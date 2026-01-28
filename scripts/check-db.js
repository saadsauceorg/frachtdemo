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
 * Résultat attendu : 0 designs sans image_thumb_url
 */
async function checkDB() {
  console.log('🔍 Vérification DB: thumbnails manquants...\n');
  
  try {
    // Compter les designs sans thumbnail (avec image_original_url mais sans image_thumb_url)
    const { count, error } = await supabase
      .from('designs')
      .select('*', { count: 'exact', head: true })
      .not('image_original_url', 'is', null)
      .is('image_thumb_url', null);
    
    if (error) {
      throw new Error(`Erreur DB: ${error.message}`);
    }
    
    const missingCount = count || 0;
    
    console.log('='.repeat(50));
    console.log(`📊 Designs sans image_thumb_url: ${missingCount}`);
    console.log('='.repeat(50));
    
    if (missingCount === 0) {
      console.log('\n✅ SUCCÈS: Tous les designs ont leur thumbnail');
      console.log('   Résultat attendu: 0 ✓');
      process.exit(0);
    } else {
      console.log(`\n❌ ÉCHEC: ${missingCount} design(s) sans thumbnail`);
      console.log('   Résultat attendu: 0 ✗');
      console.log('\n💡 Exécutez: npm run backfill-thumbnails');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkDB().catch(console.error);
