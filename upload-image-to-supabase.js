// Script pour télécharger l'image depuis imgbb et l'uploader dans Supabase Storage
// Usage: node upload-image-to-supabase.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://ibvmkhmjgpwwxkngllti.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlidm1raG1qZ3B3d3hrbmdsbHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzc3NzgsImV4cCI6MjA3NTcxMzc3OH0.yEPftdwsZV4OXWnwERWcUvk_rZReVGe4q9iQTcRRtdc';

const BUCKET_NAME = 'files';
const FILE_NAME = 'email-cover-urai.png';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function readLocalImage(filepath) {
  try {
    console.log('📥 Lecture de l\'image locale:', filepath);
    if (!fs.existsSync(filepath)) {
      throw new Error(`Le fichier n'existe pas: ${filepath}`);
    }
    const buffer = fs.readFileSync(filepath);
    console.log('✅ Image lue (taille:', buffer.length, 'bytes)');
    return buffer;
  } catch (error) {
    console.error('❌ Erreur lors de la lecture:', error);
    throw error;
  }
}

async function uploadToSupabase(buffer) {
  try {
    console.log(`📤 Upload de l'image vers Supabase Storage (bucket: ${BUCKET_NAME})...`);
    
    // Créer un Blob à partir du buffer
    const fileBlob = new Blob([buffer], { type: 'image/png' });
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(FILE_NAME, fileBlob, {
        contentType: 'image/png',
        upsert: true // Remplacer si le fichier existe déjà
      });

    if (error) {
      throw error;
    }

    console.log('✅ Image uploadée avec succès!');
    console.log('📁 Chemin:', data.path);

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(FILE_NAME);

    const publicUrl = urlData.publicUrl;
    console.log('🔗 URL publique:', publicUrl);
    
    return publicUrl;
  } catch (error) {
    console.error('❌ Erreur lors de l\'upload:', error);
    throw error;
  }
}

async function main() {
  try {
    // Récupérer le chemin du fichier depuis les arguments
    const imagePath = process.argv[2];
    
    if (!imagePath) {
      console.error('❌ Usage: node upload-image-to-supabase.js <chemin-vers-image>');
      console.log('   Exemple: node upload-image-to-supabase.js ./urai.png');
      process.exit(1);
    }
    
    // Lire l'image locale
    const imageBuffer = readLocalImage(imagePath);
    
    // Uploader dans Supabase
    const publicUrl = await uploadToSupabase(imageBuffer);
    
    console.log('\n✨ Terminé!');
    console.log('📝 URL à utiliser dans le template:', publicUrl);
    
    return publicUrl;
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();

