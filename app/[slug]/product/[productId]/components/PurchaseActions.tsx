'use client';

import { Button } from '@/shared/components/ui/buttons/Button';
import { useState } from 'react';
import { PaymentModal } from '../../../components/PaymentModal';
import { useCart } from '../../../storage/context/CartContext';
import type { Product } from '../../../storage/data';
import styles from './ProductDetail.module.css';

interface PurchaseActionsProps {
  product: Product;
  businessSlug: string;
}

export default function PurchaseActions({ product, businessSlug }: PurchaseActionsProps) {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

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
    setIsAdding(false);
  };

  const handleBuyNow = () => {
    setIsPaymentModalOpen(true);
  };

  const isOutOfStock = product.stock <= 0;

  let addToCartText = 'Al carrito';
  if (isAdding) {
    addToCartText = 'Añadiendo...';
  } else if (isOutOfStock) {
    addToCartText = 'Sin stock';
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
          {isOutOfStock ? 'Agotado' : 'Comprar ahora'}
        </Button>
      </div>

      <PaymentModal
        open={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        productId={product.id}
        productName={product.name}
        price={Number(product.price)}
        currency={product.currency}
        businessSlug={businessSlug}
      />
    </>
  );
}
