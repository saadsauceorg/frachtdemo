// Utiliser l'API Management Supabase pour créer le bucket
const PROJECT_REF = 'ibvmkhmjgpwwxkngllti';
const ACCESS_TOKEN = 'sbp_25fb62533c75769e937a50947b3d2a3b878113f2';

async function createBucketViaAPI() {
  console.log('🔧 Création du bucket via API Management Supabase...\n');
  
  const bucketName = 'designs';
  
  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/storage/buckets`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: bucketName,
          public: true,
          file_size_limit: 52428800, // 50MB
          allowed_mime_types: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur API:', response.status, response.statusText);
      console.error('Détails:', errorText);
      
      // Essayer de lister les buckets existants
      console.log('\n🔍 Tentative de liste des buckets existants...');
      const listResponse = await fetch(
        `https://api.supabase.com/v1/projects/${PROJECT_REF}/storage/buckets`,
        {
          headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
          },
        }
      );
      
      if (listResponse.ok) {
        const buckets = await listResponse.json();
        console.log('\n📦 Buckets existants:');
        if (buckets && buckets.length > 0) {
          buckets.forEach(bucket => {
            console.log(`   - "${bucket.name}" (public: ${bucket.public})`);
          });
        } else {
          console.log('   Aucun bucket trouvé');
        }
      }
      
      return;
    }

    const data = await response.json();
    console.log('✅ Bucket créé avec succès!');
    console.log('📦 Détails:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

createBucketViaAPI().catch(console.error);
