import { createClient } from '@/lib/supabase/client';

export const uploadProductImage = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
  const filePath = `products/${fileName}`;

  console.warn('[uploadProductImage] Iniciando subida:', filePath);

  const supabase = createClient();

  // Convert File to Uint8Array - more robust than ArrayBuffer in some polyfills/environments
  const fileBuffer = new Uint8Array(await file.arrayBuffer());

  try {
    const { error } = await supabase.storage.from('products').upload(filePath, fileBuffer, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
      duplex: 'half',
    });

    if (error) {
      console.error('[uploadProductImage] Error devuelto por Supabase:', error);
      throw error;
    }

    const { data } = supabase.storage.from('products').getPublicUrl(filePath);
    console.warn('[uploadProductImage] Completado:', data.publicUrl);
    return data.publicUrl;
  } catch (err) {
    console.error('[uploadProductImage] Excepción capturada:', err);

    if (err instanceof Error && err.message?.includes('aborted')) {
      throw new Error(
        'La subida fue cancelada por el navegador o el entorno. Intenta con un archivo más pequeño o revisa tu conexión. (Signal Aborted)',
      );
    }

    throw new Error(
      (err instanceof Error ? err.message : String(err)) || 'Error al subir la imagen del producto',
    );
  }
};

export const uploadCategoryImage = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const uuid = crypto.randomUUID();
  const fileName = `${Date.now()}-${uuid}.${fileExt}`;
  const filePath = `categories/${fileName}`;

  const supabase = createClient();

  const fileBuffer = new Uint8Array(await file.arrayBuffer());

  try {
    const { error } = await supabase.storage.from('products').upload(filePath, fileBuffer, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
      duplex: 'half',
    });

    if (error) {
      console.error('[uploadCategoryImage] Error:', error);
      throw error;
    }

    const { data } = supabase.storage.from('products').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error('[uploadCategoryImage] Exception:', err);
    throw new Error(
      err instanceof Error ? err.message : 'Error al subir la imagen de la categoría',
    );
  }
};
