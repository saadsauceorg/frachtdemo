// Web Worker pour générer le thumbnail et compresser l'original si nécessaire
self.onmessage = async function(e: MessageEvent<{ 
  requestId: string;
  fileData: ArrayBuffer;
  fileName: string;
  mimeType: string;
  maxWidth: number;
  compressOriginal: boolean;
  originalMaxSize: number; // en bytes (8MB = 8 * 1024 * 1024)
}>) {
  const { requestId, fileData, fileName, mimeType, maxWidth, compressOriginal, originalMaxSize } = e.data;

  try {
    // Créer un Blob à partir de l'ArrayBuffer transféré
    const blob = new Blob([fileData], { type: mimeType });
    
    // Utiliser createImageBitmap pour charger l'image
    const imageBitmap = await createImageBitmap(blob);
    
    const width = imageBitmap.width;
    const height = imageBitmap.height;
    
    // Calculer les dimensions du thumbnail (arrondir pour éviter le blur)
    const scale = Math.min(maxWidth / width, 1);
    const thumbWidth = Math.round(width * scale);
    const thumbHeight = Math.round(height * scale);

    // Créer le canvas pour le thumbnail
    const thumbCanvas = new OffscreenCanvas(thumbWidth, thumbHeight);
    const thumbCtx = thumbCanvas.getContext('2d');
    
    if (!thumbCtx) {
      imageBitmap.close();
      self.postMessage({ 
        requestId,
        error: 'Impossible de créer le contexte canvas' 
      });
      return;
    }

    // Dessiner l'image redimensionnée pour le thumbnail
    thumbCtx.drawImage(imageBitmap, 0, 0, thumbWidth, thumbHeight);
    
    // Utiliser le mimeType directement (plus fiable que dériver depuis le nom)
    const outputMimeType = mimeType || 'image/jpeg';
    
    // Générer le thumbnail
    const thumbBlob = await thumbCanvas.convertToBlob({ 
      type: outputMimeType, 
      quality: 0.8 
    });

    // Compression de l'original si nécessaire
    let originalBlob: Blob = blob;
    if (compressOriginal && blob.size > originalMaxSize) {
      // Recompresser en JPEG 90% si > 8MB
      const originalCanvas = new OffscreenCanvas(width, height);
      const originalCtx = originalCanvas.getContext('2d');
      
      if (originalCtx) {
        originalCtx.drawImage(imageBitmap, 0, 0, width, height);
        originalBlob = await originalCanvas.convertToBlob({
          type: 'image/jpeg',
          quality: 0.9
        });
      }
    }
    
    // Nettoyer l'image bitmap
    imageBitmap.close();
    
    self.postMessage({ 
      requestId,
      blob: thumbBlob,
      originalBlob: originalBlob,
      width,
      height,
      aspectRatio: width / height,
      thumbSize: thumbBlob.size,
      originalSize: originalBlob.size
    });
  } catch (error: any) {
    self.postMessage({ 
      requestId,
      error: error.message || 'Erreur inconnue' 
    });
  }
};
