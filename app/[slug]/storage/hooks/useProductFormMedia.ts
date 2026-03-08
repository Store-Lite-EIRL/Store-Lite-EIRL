import { useState } from 'react';
import { MAX_IMAGES } from '../components/createProduct/types';
import type { SaveProductMediaItem } from '../types';

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
      if (!file.type.startsWith('image/')) {
        imageError = 'Solo se permiten imágenes';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        imageError = 'Cada imagen debe pesar menos de 5MB';
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
  };

  const handleRemoveImage = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
    setMediaError(undefined);
  };

  return { media, setMedia, mediaError, setMediaError, handleImageChange, handleRemoveImage };
};
