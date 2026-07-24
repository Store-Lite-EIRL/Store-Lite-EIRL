import { validateProductImageFile } from '@/features/storage/utils/productImageValidation';
import { describe, expect, test } from 'vitest';

function createFile(name: string, type: string, content = 'image-content') {
  return new File([content], name, { type });
}

describe('validateProductImageFile', () => {
  test('allows JFIF files when the browser reports image/jpeg', () => {
    const file = createFile('product.jfif', 'image/jpeg');

    expect(validateProductImageFile(file)).toBeNull();
  });

  test('rejects unsupported image formats before upload', () => {
    const file = createFile('product.gif', 'image/gif');

    expect(validateProductImageFile(file)).toContain('Formato de imagen no permitido');
  });

  test('requires a valid MIME type and extension pair', () => {
    const file = createFile('product.jfif', 'image/gif');

    expect(validateProductImageFile(file)).toContain('Formato de imagen no permitido');
  });
});
