'use client';

import type { Business } from '@/core/database/schema';
import { Button } from '@/shared/components/ui/buttons/Button';
import posthog from 'posthog-js';
import { useState } from 'react';
import { BasicContactDialog } from '../../../components/BasicContactDialog';
import Checkout from '../../../components/Checkout';
import { useCart } from '../../../storage/context/CartContext';
import type { Product } from '../../../storage/data';
import styles from './ProductDetail.module.css';

interface PurchaseActionsProps {
  product: Product;
  business: Business;
  hasPaymentGateway: boolean;
}

export default function PurchaseActions({
  product,
  business,
  hasPaymentGateway,
}: PurchaseActionsProps) {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      currency: product.currency,
      image: product.image,
      category: product.category,
      stock: product.stock,
      status: product.status,
    });
    posthog.capture('product_added_to_cart', {
      product_id: product.id,
      category: product.category,
      price: product.price,
      currency: product.currency,
      business_slug: business.slug,
    });
    setIsAdding(false);
  };

  const handleBuyNow = () => {
    posthog.capture('product_buy_now_clicked', {
      product_id: product.id,
      category: product.category,
      price: product.price,
      currency: product.currency,
      business_slug: business.slug,
      has_payment_gateway: hasPaymentGateway,
    });
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

  let buyNowText = hasPaymentGateway ? 'Comprar ahora' : 'Contactar Negocio';
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
          style={{ width: '100%' }}
        >
          {addToCartText}
        </Button>
        <Button
          variant="filled"
          className={styles.buyNowButton}
          onClick={handleBuyNow}
          disabled={isOutOfStock}
          style={{ width: '100%' }}
        >
          {buyNowText}
        </Button>
      </div>

      {isPaymentModalOpen && (
        <Checkout
          totalAmount={Number(product.price)}
          cartItems={[{ ...product, quantity: 1 }]}
          onSuccess={() => setIsPaymentModalOpen(false)}
          onCancel={() => setIsPaymentModalOpen(false)}
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
