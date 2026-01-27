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

async function migrateImages() {
  console.log('🚀 Migration des images vers Supabase...\n');

  const files = fs.readdirSync(DESIGNS_DIR)
    .filter(file => /\.(png|jpg|jpeg)$/i.test(file))
    .filter(file => !file.includes('README'));

  console.log(`📸 ${files.length} images à migrer\n`);

  for (const file of files) {
    try {
      const filePath = path.join(DESIGNS_DIR, file);
      const fileBuffer = fs.readFileSync(filePath);
      const fileExt = file.split('.').pop();
      
      // Upload vers Supabase Storage
      const { data, error } = await supabase.storage
        .from('designs')
        .upload(`migrated/${file}`, fileBuffer, {
          contentType: fileExt === 'png' ? 'image/png' : 'image/jpeg',
          upsert: true,
        });

      if (error) {
        console.error(`❌ Erreur pour ${file}:`, error.message);
        continue;
      }

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('designs')
        .getPublicUrl(`migrated/${file}`);

      console.log(`✅ ${file} → ${publicUrl}`);
    } catch (error) {
      console.error(`❌ Erreur pour ${file}:`, error.message);
    }
  }

  console.log('\n🎉 Migration terminée!');
}

migrateImages().catch(console.error);
