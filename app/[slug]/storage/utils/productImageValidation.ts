export const MAX_PRODUCT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_PRODUCT_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const ALLOWED_PRODUCT_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'jfif', 'png', 'webp']);

export const PRODUCT_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.jfif,.png,.webp';

export const PRODUCT_IMAGE_FORMATS_LABEL = 'JPG, JPEG, JFIF, PNG o WEBP';

export function validateProductImageFile(file: File): string | null {
  if (file.size === 0) {
    return 'Archivo no válido o vacío';
  }

  if (file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
    return 'La imagen excede el tamaño máximo permitido (5MB)';
  }

  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';

  if (
    !ALLOWED_PRODUCT_IMAGE_MIME_TYPES.has(file.type) ||
    !ALLOWED_PRODUCT_IMAGE_EXTENSIONS.has(extension)
  ) {
    return `Formato de imagen no permitido. Usá ${PRODUCT_IMAGE_FORMATS_LABEL}.`;
  }

  return null;
}
