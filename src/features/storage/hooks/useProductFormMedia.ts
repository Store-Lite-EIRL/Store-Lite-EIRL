import type { SaveProductMediaItem } from '@/types/storage';
import { useEffect, useState } from 'react';
import { MAX_IMAGES } from '../components/createProduct/types';
import { estimatePayloadSize, validateProductImageFile } from '../utils/productImageValidation';

export type MediaItem = SaveProductMediaItem;

const BODY_LIMIT_BYTES = 1 * 1024 * 1024;
const PAYLOAD_ERROR_MSG = 'El tamaño total del formulario supera el límite del servidor (1MB)';

export const useProductFormMedia = () => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [mediaError, setMediaError] = useState<string | undefined>();
  const [mediaBodyError, setMediaBodyError] = useState<string | undefined>();

  // Recalculate body size every time media changes
  useEffect(() => {
    const size = estimatePayloadSize(media);
    if (size > BODY_LIMIT_BYTES) {
      setMediaBodyError(PAYLOAD_ERROR_MSG);
    } else {
      setMediaBodyError(undefined);
    }
  }, [media]);

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
    const updated = media.filter((_, i) => i !== index);
    setMedia(updated);
    setMediaError(undefined);
  };

  return {
    media,
    setMedia,
    mediaError,
    setMediaError,
    mediaBodyError,
    setMediaBodyError,
    handleImageChange,
    handleRemoveImage,
  };
};
