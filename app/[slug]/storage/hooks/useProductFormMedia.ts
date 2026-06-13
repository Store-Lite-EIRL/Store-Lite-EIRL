import type { SaveProductMediaItem } from '@/types/storage';
import { useState } from 'react';
import { MAX_IMAGES } from '../components/createProduct/types';
import { validateProductImageFile } from '../utils/productImageValidation';

export type MediaItem = SaveProductMediaItem;

export const useProductFormMedia = () => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [mediaError, setMediaError] = useState<string | undefined>();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remainingSlots = MAX_IMAGES - media.length;
    const toProcess = files.slice(0, remainingSlots);

    let imageError: string | undefined;

    toProcess.forEach((file) => {
      const validationError = validateProductImageFile(file);
      if (validationError) {
        imageError = validationError;
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setMedia((prev) => [...prev, { type: 'file', file, preview: result }]);
      };
      reader.readAsDataURL(file);
    });

    setMediaError(imageError);
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
    setMediaError(undefined);
  };

  return { media, setMedia, mediaError, setMediaError, handleImageChange, handleRemoveImage };
};
