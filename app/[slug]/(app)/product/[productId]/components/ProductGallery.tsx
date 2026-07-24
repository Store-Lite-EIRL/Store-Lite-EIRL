'use client';

import Image from 'next/image';
import { useState } from 'react';
import styles from './ProductDetail.module.css';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  // Use a fallback placeholder if no images exist
  const defaultImage =
    images.length > 0
      ? images[0]
      : 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=1000&auto=format&fit=crop';

  const [mainImage, setMainImage] = useState(defaultImage);

  // Fallback array for thumbnails if less than 1 image is provided,
  // matching the design which showed multiple thumbnails even for one image.
  // But if real images are passed in array, use them directly.

  return (
    <div className={styles.galleryContainer}>
      {/* Main Large Image */}
      <div className={styles.mainImageContainer}>
        <Image
          alt={`${productName} main view`}
          src={mainImage}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className={styles.mainImage}
          priority
        />
      </div>

      {/* Thumbnail Row */}
      {images.length > 1 && (
        <div className={styles.thumbnails}>
          {images.map((thumb, i) => (
            <div
              key={i}
              className={styles.thumbnailContainer}
              onClick={() => setMainImage(thumb)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setMainImage(thumb);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`View image ${i + 1}`}
              style={{
                border: mainImage === thumb ? '2px solid #000' : '2px solid transparent',
                position: 'relative',
              }}
            >
              <Image
                alt={`Thumbnail ${i + 1}`}
                src={thumb}
                fill
                sizes="(max-width: 768px) 33vw, 150px"
                className={styles.thumbnailImage}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
