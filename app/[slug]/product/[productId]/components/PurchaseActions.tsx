'use client';

import type { Business } from '@/core/database/schema';
import { Button } from '@/shared/components/ui/buttons/Button';
import { useState } from 'react';
import { BasicContactDialog } from '../../../components/BasicContactDialog';
import Checkout from '../../../components/Checkout';
import { useCart } from '../../../storage/context/CartContext';
import type { Product } from '../../../storage/data';
import LikeSection from './LikeSection';
import styles from './ProductDetail.module.css';

interface PurchaseActionsProps {
  product: Product;
  business: Business;
  hasPaymentGateway: boolean;
  culqiPublicKey?: string;
  // LikeSection props — se renderiza inline con el botón principal
  likesCount: number;
  hasLiked: boolean;
  productId: string;
  businessSlug: string;
}

export default function PurchaseActions({
  product,
  business,
  hasPaymentGateway,
  culqiPublicKey,
  likesCount,
  hasLiked,
  productId,
  businessSlug,
}: PurchaseActionsProps) {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    addToCart(product);
    setIsAdding(false);
  };

  const handleBuyNow = () => {
    if (hasPaymentGateway) {
      setIsPaymentModalOpen(true);
    } else {
      setIsContactDialogOpen(true);
    }
  };

  const isOutOfStock = product.stock <= 0;

  let addToCartText = 'Al carrito';
  if (isAdding) {
    addToCartText = 'Añadiendo...';
  } else if (isOutOfStock) {
    addToCartText = 'Sin stock';
  }

  let buyNowText = hasPaymentGateway ? 'Comprar' : 'Contactar Negocio';
  if (isOutOfStock) {
    buyNowText = 'Agotado';
  }

  return (
    <>
      <div className={styles.purchaseActions}>
        <Button
          variant="tonal"
          className={styles.addToCartButton}
          onClick={handleAddToCart}
          disabled={isAdding || isOutOfStock}
        >
          {addToCartText}
        </Button>
        <div className={styles.mainActionRow}>
          <Button
            variant="filled"
            className={styles.buyNowButton}
            onClick={handleBuyNow}
            disabled={isOutOfStock}
          >
            {buyNowText}
          </Button>
          <LikeSection
            productId={productId}
            businessSlug={businessSlug}
            initialLikesCount={likesCount}
            initialHasLiked={hasLiked}
          />
        </div>
      </div>

      {isPaymentModalOpen && (
        <Checkout
          totalAmount={Number(product.secondPrice || product.price)}
          cartItems={[{ ...product, quantity: 1 }]}
          culqiPublicKey={culqiPublicKey}
          onSuccess={() => setIsPaymentModalOpen(false)}
          onCancel={() => setIsPaymentModalOpen(false)}
          businessName={business.name}
          businessAddress={business.address ?? undefined}
          businessCity={business.city ?? undefined}
          businessLogoUrl={business.logoUrl ?? undefined}
          businessId={business.id}
        />
      )}

      {isContactDialogOpen && (
        <BasicContactDialog
          business={business}
          isOpen={isContactDialogOpen}
          onClose={() => setIsContactDialogOpen(false)}
        />
      )}
    </>
  );
}
