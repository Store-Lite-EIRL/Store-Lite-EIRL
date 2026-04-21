'use client';

import { Icon } from '@/shared/components/ui';
import { IconButton } from '@/shared/components/ui/buttons';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import type { CartItem } from '../storage/context/CartContext';
import { useCart } from '../storage/context/CartContext';
import { formatPrice } from '../storage/utils/currency';
import styles from './CartDrawer.module.css';
import Checkout from './Checkout';

interface CartDrawerProps {
  hasPaymentGateway?: boolean;
  culqiPublicKey?: string;
  businessId: string;
  businessName?: string;
  businessAddress?: string;
  businessCity?: string;
  businessLogoUrl?: string;
  onContactClick?: () => void;
}

export function CartDrawer({
  hasPaymentGateway = true,
  culqiPublicKey,
  businessId,
  businessName,
  businessAddress,
  businessCity,
  businessLogoUrl,
  onContactClick,
}: CartDrawerProps) {
  const { cartItems, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, totalPrice } =
    useCart();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const params = useParams();
  const slug = params.slug as string;
  const checkoutItems = cartItems.length > 0 ? (cartItems as [CartItem, ...CartItem[]]) : null;

  if (!isCartOpen) return null;

  return (
    <div className={styles.overlay} onClick={() => setIsCartOpen(false)}>
      {!isCheckoutOpen && (
        <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <Icon size={21}>shopping_cart</Icon>
              <h2>Tu Carrito</h2>
            </div>
            <IconButton variant="standard" onClick={() => setIsCartOpen(false)}>
              <Icon>close</Icon>
            </IconButton>
          </div>

          <div className={styles.content}>
            {cartItems.length === 0 ? (
              <div className={styles.emptyState}>
                <Icon size={50} className={styles.emptyIcon}>
                  shopping_basket
                </Icon>
                <p>Tu carrito está vacío</p>
                <button className={styles.continueBtn} onClick={() => setIsCartOpen(false)}>
                  Continuar comprando
                </button>
              </div>
            ) : (
              <div className={styles.itemList}>
                {cartItems.map((item) => (
                  <div key={item.id} className={styles.item}>
                    <Link
                      href={`/${slug}/product/${item.id}`}
                      className={styles.itemImage}
                      onClick={() => setIsCartOpen(false)}
                    >
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={80}
                          height={80}
                          className={styles.img}
                        />
                      ) : (
                        <div className={styles.noImage}>
                          <Icon>image_not_supported</Icon>
                        </div>
                      )}
                    </Link>

                    <div className={styles.itemInfo}>
                      <Link
                        href={`/${slug}/product/${item.id}`}
                        className={styles.itemName}
                        onClick={() => setIsCartOpen(false)}
                      >
                        {item.name}
                      </Link>
                        <div className={styles.itemPrices}>
                          {item.secondPrice ? (
                            <>
                              <span className={styles.itemPrice}>S/ {item.secondPrice}</span>
                              <span className={styles.oldPrice}>S/ {item.price}</span>
                            </>
                          ) : (
                            <span className={styles.itemPrice}>S/ {item.price}</span>
                          )}
                        </div>
                         <span className={styles.itemStock}>Stock: {item.stock === 0 ? 'AGOTADO' : item.stock}</span>
                        <div className={styles.quantityControls}>
                          <button
                            className={styles.qtyBtn}
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Icon>remove</Icon>
                          </button>
                          <span className={styles.itemQty}>{item.quantity}</span>
                          <button
                            className={styles.qtyBtn}
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                          >
                            <Icon>add</Icon>
                          </button>
                        </div>
                        {item.quantity >= item.stock && (
                          <span className={styles.stockWarning}>¡Límite de stock alcanzado!</span>
                        )}
                    </div>

                    <IconButton
                      variant="standard"
                      className={styles.removeBtn}
                      onClick={() => removeFromCart(item.id)}
                      aria-label="Eliminar producto"
                    >
                      <Icon>delete_outline</Icon>
                    </IconButton>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cartItems.length > 0 && (
            <div className={styles.footer}>
              <div className={styles.totalRow}>
                <span>Total</span>
                <span className={styles.totalPrice}>{formatPrice(totalPrice, 'S/')}</span>
              </div>
              <button
                className={styles.checkoutBtn}
                onClick={() => {
                  if (hasPaymentGateway) {
                    setIsCheckoutOpen(true);
                  } else {
                    setIsCartOpen(false);
                    onContactClick?.();
                  }
                }}
              >
                {hasPaymentGateway ? 'Comprar Todo' : 'Contactar Negocio'}
              </button>
            </div>
          )}
        </div>
      )}

      {isCheckoutOpen && checkoutItems && (
        <Checkout
          totalAmount={totalPrice}
          cartItems={checkoutItems}
          culqiPublicKey={culqiPublicKey}
          businessId={businessId}
          businessName={businessName}
          businessAddress={businessAddress}
          businessCity={businessCity}
          businessLogoUrl={businessLogoUrl}
          onSuccess={() => {
            setIsCheckoutOpen(false);
            setIsCartOpen(false);
          }}
          onCancel={() => setIsCheckoutOpen(false)}
        />
      )}
    </div>  );
}
