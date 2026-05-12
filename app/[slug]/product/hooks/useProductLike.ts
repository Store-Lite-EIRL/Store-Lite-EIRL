'use client';

import { useCallback, useState } from 'react';
import { toggleLikeProductIsolated } from '../../storage/isolatedUpdateAction';

interface UseProductLikeOptions {
  productId: string;
  businessSlug: string;
  initialLikesCount: number;
  initialHasLiked: boolean;
}

interface UseProductLikeReturn {
  likesCount: number;
  hasLiked: boolean;
  isToggling: boolean;
  toggleLike: () => Promise<void>;
}

/**
 * Hook reutilizable para manejar el estado de "like" de un producto
 * con actualización optimista.
 */
export function useProductLike({
  productId,
  businessSlug,
  initialLikesCount,
  initialHasLiked,
}: UseProductLikeOptions): UseProductLikeReturn {
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [isToggling, setIsToggling] = useState(false);

  const toggleLike = useCallback(async () => {
    if (isToggling) return;
    setIsToggling(true);

    const optimisticHasLiked = !hasLiked;
    setHasLiked(optimisticHasLiked);
    setLikesCount((prev) => (optimisticHasLiked ? prev + 1 : prev - 1));

    try {
      const result = await toggleLikeProductIsolated(productId, businessSlug);
      if (!result.success) {
        setHasLiked(initialHasLiked);
        setLikesCount(initialLikesCount);
      }
    } catch {
      setHasLiked(initialHasLiked);
      setLikesCount(initialLikesCount);
    } finally {
      setIsToggling(false);
    }
  }, [productId, businessSlug, hasLiked, initialLikesCount, initialHasLiked, isToggling]);

  return { likesCount, hasLiked, isToggling, toggleLike };
}
