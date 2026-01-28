/**
 * Script pour nettoyer les noms de designs dans Supabase
 * Supprime les noms étranges générés automatiquement et les remplace par des noms simples
 * 
 * Usage: npm run clean-names
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ibvmkhmjgpwwxkngllti.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlidm1raG1qZ3B3d3hrbmdsbHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzc3NzgsImV4cCI6MjA3NTcxMzc3OH0.yEPftdwsZV4OXWnwERWcUvk_rZReVGe4q9iQTcRRtdc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Détecte si un nom est un nom généré automatiquement étrange
 */
function isStrangeName(name) {
  if (!name) return false;
  
  const lowerName = name.toLowerCase();
  
  // Patterns à détecter :
  // - "Design mural - ..." suivi de texte long
  // - Noms contenant des instructions comme "Supprimer", "Rebrander", etc.
  // - Noms avec des numéros à la fin comme "... 13254"
  // - Noms très longs (> 50 caractères)
  
  const patterns = [
    /^design mural\s*-\s*.{20,}/i, // "Design mural - " suivi de texte long
    /supprimer|rebrander|recréer|modifier/i, // Instructions
    /\s+\d{4,}$/, // Numéros à la fin (4+ chiffres)
    /.{60,}/, // Très long
  ];
  
  return patterns.some(pattern => pattern.test(name));
}

/**
 * Nettoie un nom en le remplaçant par un nom simple basé sur l'order_index
 */
function generateCleanName(orderIndex) {
  return `Design #${orderIndex + 1}`;
}

async function cleanDesignNames() {
  console.log('🧹 Début du nettoyage des noms de designs...\n');
  
  try {
    // Récupérer tous les designs
    const { data: designs, error: fetchError } = await supabase
      .from('designs')
      .select('id, title, order_index')
      .order('order_index', { ascending: true });
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (!designs || designs.length === 0) {
      console.log('✅ Aucun design trouvé.');
      return;
    }
    
    console.log(`📊 ${designs.length} designs trouvés.\n`);
    
    // Identifier les designs avec des noms étranges
    const designsToClean = designs.filter(design => isStrangeName(design.title));
    
    if (designsToClean.length === 0) {
      console.log('✅ Aucun nom étrange détecté. Tous les noms sont propres !');
      return;
    }
    
    console.log(`🔍 ${designsToClean.length} designs avec des noms étranges détectés :\n`);
    designsToClean.forEach(design => {
      console.log(`  - #${design.order_index + 1}: "${design.title}"`);
    });
    console.log('');
    
    // Demander confirmation (en mode interactif)
    // Pour l'instant, on nettoie automatiquement
    
    // Nettoyer les noms
    let cleaned = 0;
    let errors = 0;
    
    for (const design of designsToClean) {
      const cleanName = generateCleanName(design.order_index);
      
      try {
        const { error: updateError } = await supabase
          .from('designs')
          .update({ title: cleanName })
          .eq('id', design.id);
        
        if (updateError) {
          console.error(`❌ Erreur pour design #${design.order_index + 1}:`, updateError.message);
          errors++;
        } else {
          console.log(`✅ "${design.title}" → "${cleanName}"`);
          cleaned++;
        }
      } catch (error) {
        console.error(`❌ Erreur pour design #${design.order_index + 1}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n📊 Résumé :');
    console.log(`  ✅ ${cleaned} noms nettoyés`);
    if (errors > 0) {
      console.log(`  ❌ ${errors} erreurs`);
    }
    console.log('\n✨ Nettoyage terminé !');
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage :', error);
    process.exit(1);
  }
}

// Exécuter le script
cleanDesignNames()
  .then(() => {
    console.log('\n🎉 Script terminé avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale :', error);
    process.exit(1);
  });
