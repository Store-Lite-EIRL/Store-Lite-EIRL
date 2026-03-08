'use client';

import type { Product, ProductCategory } from '@/core/database/schema';
import { Button, IconButton } from '@/shared/components/ui/buttons';
import { Icon } from '@/shared/components/ui/data-display';
import Image from 'next/image';

interface ProductCardProps {
  product: Product & {
    media?: { mediaUrl: string; displayOrder: number }[];
    category?: ProductCategory | null;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const mainImage = product.media?.[0]?.mediaUrl || 'https://via.placeholder.com/220';
  const categoryName = product.category?.name || 'Producto';

  // Pricing logic
  const price = Number(product.price);
  const metadata = (product.metadata as Record<string, unknown>) || {};
  const originalPrice = metadata.originalPrice ? Number(metadata.originalPrice) : null;
  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : null;

  return (
    <article
      className="relative w-full max-w-[320px] bg-white rounded-[32px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] h-full"
      data-purpose="product-card"
    >
      {/* Action Buttons (Floating) - Sliding interaction */}
      <div
        className="absolute top-4 right-4 flex flex-col gap-2 z-10 translate-x-12 group-hover:translate-x-0 transition-transform duration-300"
        data-purpose="action-buttons"
      >
        <IconButton
          variant="standard"
          aria-label="Add to wishlist"
          className="bg-[#fff8ef] rounded-full text-[#f59e0b] hover:bg-[#ffecd1]"
        >
          <Icon>favorite</Icon>
        </IconButton>
        <IconButton
          variant="standard"
          aria-label="Compare product"
          className="bg-[#f0f4ff] rounded-full text-[#4a5568] hover:bg-[#e2e8f0]"
        >
          <Icon>compare_arrows</Icon>
        </IconButton>
      </div>

      {/* Product Image Container - Fixed size to avoid "enormous" look */}
      <div
        className="w-full flex justify-center mb-6 pt-4 relative aspect-square max-h-[180px]"
        data-purpose="image-container"
      >
        <div className="relative w-[180px] h-[180px]">
          <Image
            src={mainImage}
            alt={product.title}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-300"
            sizes="180px"
          />
        </div>
        {/* Pagination Dots */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-1.5 pb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
        </div>
      </div>

      {/* Product Info - Using Project Typography */}
      <div className="grow space-y-2">
        <span className="inline-block bg-slate-100 text-slate-500 label-small font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mb-1">
          {categoryName}
        </span>
        <h2
          className="text-[#1a202c] body-large font-bold leading-tight line-clamp-2"
          data-purpose="product-title"
        >
          {product.title}
        </h2>
        <p
          className="text-[#718096] body-small leading-normal line-clamp-2"
          data-purpose="product-description"
        >
          {product.description || 'Sin descripción disponible'}
        </p>
      </div>

      {/* Pricing and CTA */}
      <div className="mt-6 flex flex-col gap-4" data-purpose="pricing-footer">
        <div className="flex flex-col">
          {originalPrice && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#a0aec0] line-through body-small">
                ${originalPrice.toLocaleString()}
              </span>
              {discount && (
                <span className="bg-[#ebf4ff] text-[#2b6cb0] label-small font-bold px-1.5 py-0.5 rounded uppercase">
                  -{discount}%
                </span>
              )}
            </div>
          )}
          <span className="text-3xl font-bold text-[#1a202c]">${price.toLocaleString()}</span>
        </div>

        <div className="flex gap-3">
          <Button
            className="grow h-[60px] rounded-[18px]! bg-[#22c55e] text-white font-bold transition-all active:scale-95 shadow-md uppercase text-sm tracking-wide"
            style={{ '--md-filled-button-container-color': '#22c55e' } as React.CSSProperties}
          >
            Comprar
          </Button>
          <Button
            className="w-[60px]! h-[60px] rounded-[18px]! bg-[#2563eb] text-white flex items-center justify-center transition-transform active:scale-95 shadow-md p-0"
            style={{ '--md-filled-button-container-color': '#2563eb' } as React.CSSProperties}
            aria-label="Add to cart"
          >
            <Icon>shopping_cart</Icon>
          </Button>
        </div>
      </div>
    </article>
  );
}
