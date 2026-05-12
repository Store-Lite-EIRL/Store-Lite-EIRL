'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Product } from '../data';

export interface CartItem extends Product {
  quantity: number;
}

/** Datos frescos de un producto desde el servidor */
export interface CartServerItem {
  id: string;
  stock: number;
  price: string;
  secondPrice: string | null;
  currency: string;
  isAvailable: boolean;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  toggleCartItem: (product: Product) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  isInCart: (productId: string) => boolean;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  totalItems: number;
  totalPrice: number;
  /** Resultado de la última validación contra el servidor */
  cartValidation: Record<string, CartServerItem> | null;
  isCartValidating: boolean;
  /** Valida el carrito contra el servidor (productos eliminados, stock, precios) */
  validateCart: () => Promise<void>;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({
  children,
  businessSlug,
}: {
  children: React.ReactNode;
  businessSlug: string;
}) => {
  // Persistence Key
  const STORAGE_KEY = `cart_${businessSlug}`;

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [cartValidation, setCartValidation] = useState<Record<string, CartServerItem> | null>(null);
  const [isCartValidating, setIsCartValidating] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(STORAGE_KEY);
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Error loading cart from localStorage', e);
      }
    }
    setIsInitialized(true);
  }, [STORAGE_KEY]);

  // Save to localStorage
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
    }
  }, [cartItems, STORAGE_KEY, isInitialized]);

  const addToCart = (product: Product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      if (existingItem) {
        // Prevent adding more than available stock
        if (existingItem.quantity >= product.stock) {
          return prevItems;
        }
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      // If product has no stock, don't add
      if (product.stock <= 0) {
        return prevItems;
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  const toggleCartItem = (product: Product) => {
    if (isInCart(product.id)) {
      removeFromCart(product.id);
    } else {
      addToCart(product);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === productId) {
          // Cap quantity at stock limit
          const newQuantity = Math.min(quantity, item.stock);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }),
    );
  };

  const isInCart = (productId: string) => {
    return cartItems.some((item) => item.id === productId);
  };

  const clearCart = () => {
    setCartItems([]);
    setCartValidation(null);
  };

  const validateCart = useCallback(async () => {
    const ids = cartItems.map((item) => item.id);
    if (ids.length === 0) return;

    setIsCartValidating(true);
    try {
      const res = await fetch('/api/cart/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error('Validation request failed');
      const data = await res.json();

      const validationMap: Record<string, CartServerItem> = {};
      for (const item of data.items) {
        validationMap[item.id] = item;
      }
      setCartValidation(validationMap);
    } catch (e) {
      console.error('[CartContext] validate error:', e);
    } finally {
      setIsCartValidating(false);
    }
  }, [cartItems]);

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cartItems.reduce((acc, item) => {
    const activePrice = item.secondPrice ? Number(item.secondPrice) : Number(item.price);
    return acc + activePrice * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        toggleCartItem,
        updateQuantity,
        isInCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        totalItems,
        totalPrice,
        cartValidation,
        isCartValidating,
        validateCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
