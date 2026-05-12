'use client';

import { Icon } from '@/shared/components/ui/data-display/Icon';
import { useProductLike } from '../../hooks/useProductLike';
import styles from './ProductDetail.module.css';

interface LikeSectionProps {
  productId: string;
  businessSlug: string;
  initialLikesCount: number;
  initialHasLiked: boolean;
}

export default function LikeSection({
  productId,
  businessSlug,
  initialLikesCount,
  initialHasLiked,
}: LikeSectionProps) {
  const { likesCount, hasLiked, isToggling, toggleLike } = useProductLike({
    productId,
    businessSlug,
    initialLikesCount,
    initialHasLiked,
  });

  return (
    <button
      type="button"
      className={styles.likeSection}
      onClick={toggleLike}
      disabled={isToggling}
      aria-label={hasLiked ? 'Quitar like' : 'Dar like'}
    >
      <Icon size={20} className={hasLiked ? styles.likeHeartActive : styles.likeHeartInactive}>
        {isToggling ? 'hourglass_empty' : hasLiked ? 'favorite' : 'favorite_border'}
      </Icon>
      <span className={styles.likeCount}>{likesCount}</span>
    </button>
  );
}
