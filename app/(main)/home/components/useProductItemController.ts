/* eslint-disable complexity */
'use client';

import type { ProductWithRelations } from '@/features/products/types/productTypes';
import { useParams, useRouter } from 'next/navigation';
import { useContext, useState } from 'react';
import { CartContext } from '../../../[slug]/storage/context/CartContext';
import { StorageContext } from '../../../[slug]/storage/context/StorageContext';
import type { Product } from '../../../[slug]/storage/data';
import {
  toggleLikeProductIsolated,
  toggleProductStatus,
  updateProductIsolated,
} from '../../../[slug]/storage/isolatedUpdateAction';
import { uploadProductImage } from '../../../[slug]/storage/services/storageService';
import { parsePriceValue } from '../../../[slug]/storage/utils/currency';

type AlertColor = 'success' | 'error';
type MediaItem = { type: 'url'; url: string } | { type: 'file'; file: File; preview: string };

interface SavePayload {
  name?: string;
  description?: string;
  price?: number | string;
  stock?: number | string;
  category?: string;
  status?: string;
  brand?: string;
  tags?: string[];
  shippingInfo?: string;
  secondPrice?: number | string;
  saleStatus?: string;
}

function isSavePayload(payload: unknown): payload is SavePayload {
  return typeof payload === 'object' && payload !== null;
}

function isMediaItemArray(media: unknown[]): media is MediaItem[] {
  return media.every((item) => typeof item === 'object' && item !== null && 'type' in item);
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function useProductItemController(product: ProductWithRelations, isOwner = false) {
  const params = useParams();
  const router = useRouter();
  const businessSlug = params.slug as string;
  const storageContext = useContext(StorageContext);
  const cartContext = useContext(CartContext);

  const deleteProduct =
    storageContext?.deleteProduct ??
    (async () => ({ success: false, error: 'Acción no permitida' }));
  const isInCart = cartContext?.isInCart ?? (() => false);
  const toggleCartItem = cartContext?.toggleCartItem ?? (() => {});

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [localImages, setLocalImages] = useState<string[] | null>(null);

  const [isLiking, setIsLiking] = useState(false);
  const [alert, setAlert] = useState<{
    open: boolean;
    description: string;
    color: AlertColor;
    icon: string;
  }>({
    open: false,
    description: '',
    color: 'success',
    icon: 'check_circle',
  });

  const showAlert = (description: string, color: AlertColor, icon: string) => {
    setAlert({ open: true, description, color, icon });
  };

  const categoryName = product.category?.name ?? null;

  // Pricing logic: If secondPrice exists, it's the current/offer price (shown first).
  // The first 'price' becomes the original/struck price.
  const hasOffer = product.secondPrice !== null && product.secondPrice !== undefined;
  const price = hasOffer ? Number(product.secondPrice) : Number(product.price);
  const originalPrice = hasOffer ? Number(product.price) : null;

  const discount =
    originalPrice && price < originalPrice
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null;

  const storageProduct: Product = {
    id: product.id,
    name: product.title,
    category: product.category?.name || 'Sin categoria',
    stock: product.stock,
    price: String(product.price),
    status: product.isAvailable ? 'ACTIVO' : 'NO ACTIVO',
    image: product.media?.[0]?.mediaUrl || '',
    images: product.media?.map((m) => m.mediaUrl) || [],
    description: product.description || '',
    brand: product.brand,
    tags: product.tags,
    shippingInfo: product.shippingInfo,
    saleStatus: product.saleStatus || 'NORMAL',
    secondPrice: product.secondPrice ? String(product.secondPrice) : null,
  };

  const allImages = localImages ?? (product.media?.map((m) => m.mediaUrl) || []);
  const mainImage = allImages[currentImgIndex] || null;
  const currencySymbol = product.currency === 'PEN' ? 'S/' : product.currency;

  const handleConfirmDelete = async (id: string) => {
    setIsDeleteOpen(false);
    setIsSaving(true);
    try {
      const result = await deleteProduct(id);
      if (result.success) {
        showAlert('Producto eliminado correctamente', 'success', 'check_circle');
      } else {
        showAlert(result.error || 'Error al eliminar el producto', 'error', 'error');
      }
    } catch (error: unknown) {
      showAlert(getErrorMessage(error, 'Error inesperado al eliminar'), 'error', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      const result = await toggleProductStatus(product.id, product.isAvailable, businessSlug);
      if (result.success) {
        showAlert(
          `Producto ${result.newStatus ? 'activado' : 'desactivado'} correctamente`,
          'success',
          'check_circle',
        );
        setTimeout(() => router.refresh(), 1000);
      } else {
        showAlert(result.error || 'Error al cambiar estado', 'error', 'error');
      }
    } catch (error: unknown) {
      showAlert(getErrorMessage(error, 'Error inesperado'), 'error', 'error');
    } finally {
      setIsToggling(false);
    }
  };

  const handleSaveProduct = async (
    _optimisticProduct: Product,
    payload: unknown,
    mediaFiles: unknown[],
    isEdit: boolean,
  ) => {
    if (!isEdit) return;
    if (!isSavePayload(payload) || !isMediaItemArray(mediaFiles)) {
      showAlert('Datos del formulario invalidos', 'error', 'error');
      return;
    }

    setIsSaving(true);
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      timeoutId = setTimeout(() => {
        setIsSaving(false);
      }, 15000);

      const finalImageUrls: string[] = [];
      for (const item of mediaFiles) {
        if (item.type === 'url') {
          finalImageUrls.push(item.url);
        } else {
          const url = await uploadProductImage(item.file);
          finalImageUrls.push(url);
        }
      }

      const priceNum =
        typeof payload.price === 'number'
          ? payload.price
          : parsePriceValue(String(payload.price ?? product.price));
      const stockNum =
        typeof payload.stock === 'number'
          ? payload.stock
          : parseInt(String(payload.stock ?? product.stock), 10);

      const updateData = {
        name: payload.name?.trim() ?? product.title,
        description: payload.description?.trim() ?? product.description ?? '',
        price: priceNum,
        stock: stockNum,
        category: payload.category?.trim() ?? product.category?.name ?? '',
        status: payload.status ?? (product.isAvailable ? 'ACTIVO' : 'NO ACTIVO'),
        images: finalImageUrls,
        brand: payload.brand?.trim(),
        tags: payload.tags,
        shippingInfo: payload.shippingInfo?.trim(),
        secondPrice: payload.secondPrice ? Number(payload.secondPrice) : undefined,
        saleStatus: payload.saleStatus,
      };

      const result = await updateProductIsolated(businessSlug, product.id, updateData);
      if (!result.success) {
        throw new Error(result.error || 'Error server response');
      }

      setLocalImages(finalImageUrls);
      setCurrentImgIndex(0);
      showAlert('Producto actualizado correctamente', 'success', 'check_circle');
      setTimeout(() => router.refresh(), 1000);
      setIsEditOpen(false);
    } catch (error: unknown) {
      showAlert(getErrorMessage(error, 'Error inesperado al guardar'), 'error', 'error');
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setIsSaving(false);
    }
  };

  const handleLike = async () => {
    if (isOwner || isLiking) return;
    setIsLiking(true);
    try {
      const result = await toggleLikeProductIsolated(product.id, businessSlug);
      if (result.success) {
        if (result.alreadyLiked) {
          showAlert('Ya has dado me gusta a este producto', 'success', 'star');
        } else {
          showAlert('¡Gracias por tu me gusta!', 'success', 'star');
          setTimeout(() => router.refresh(), 1000);
        }
      } else {
        showAlert(result.error || 'Error al dar like', 'error', 'error');
      }
    } catch (error: unknown) {
      showAlert(getErrorMessage(error, 'Error inesperado'), 'error', 'error');
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddToCart = () => {
    toggleCartItem(storageProduct);
  };

  const isProductInCart = isInCart(product.id);
  const handleBuyNow = () => setIsPaymentModalOpen(true);
  const handlePaymentModalClose = () => setIsPaymentModalOpen(false);

  return {
    alert,
    businessSlug,
    categoryName,
    currencySymbol,
    currentImgIndex,
    discount,
    handleConfirmDelete,
    handleSaveProduct,
    handleToggleStatus,
    isDeleteOpen,
    isEditOpen,
    isSaving,
    isToggling,
    mainImage,
    originalPrice,
    price,
    setAlert,
    setCurrentImgIndex,
    setIsDeleteOpen,
    setIsEditOpen,
    setIsSaving,
    storageProduct,
    allImages,
    handleAddToCart,
    isProductInCart,
    handleLike,
    isLiking,
    isPaymentModalOpen,
    handleBuyNow,
    handlePaymentModalClose,
  };
}
