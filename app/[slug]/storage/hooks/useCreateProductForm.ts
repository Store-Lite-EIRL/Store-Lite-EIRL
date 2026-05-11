import { useEffect, useRef, useState } from 'react';
import {
  EMPTY_FORM,
  PLACEHOLDER_IMAGE,
  type FormErrors,
  type FormState,
} from '../components/createProduct/types';
import type { Product } from '../data';
import type { SaveProductMediaItem, SaveProductPayload } from '../types';
import { formatPrice, parsePriceValue } from '../utils/currency';
import { useProductFormMedia } from './useProductFormMedia';
import { useProductFormValidation } from './useProductFormValidation';

function productToFormState(product: Product): FormState {
  const num = parsePriceValue(product.price);
  return {
    name: product.name,
    category: product.category,
    newCategoryInput: '',
    stock: String(product.stock),
    price: num > 0 ? String(num) : '',
    status: product.status,
    description: product.description ?? '',
    brand: product.brand ?? '',
    tags: product.tags ?? [],
    shippingInfo: product.shippingInfo ?? '',
    secondPrice: product.secondPrice ? String(parsePriceValue(product.secondPrice)) : '',
    saleStatus: product.saleStatus || 'NORMAL',
    seoTitle: product.seoTitle || '',
    seoDescription: product.seoDescription || '',
  };
}

interface UseCreateProductFormProps {
  nextId?: string;
  onSave: (
    optimisticProduct: Product,
    payload: SaveProductPayload,
    media: SaveProductMediaItem[],
    isEdit: boolean,
  ) => Promise<void>;
  onClose: () => void;
  initialProduct?: Product | null;
  currencySymbol: string;
  onSavingChange?: (saving: boolean) => void;
}

export const useCreateProductForm = ({
  onSave,
  onClose,
  initialProduct,
  currencySymbol,
  onSavingChange,
}: UseCreateProductFormProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(
    initialProduct ? productToFormState(initialProduct) : EMPTY_FORM,
  );
  const { media, setMedia, mediaError, handleImageChange, handleRemoveImage } =
    useProductFormMedia();
  const { errors, setErrors, validate, clearError } = useProductFormValidation();
  const [isSaving, setIsSaving] = useState(false);
  const [fileAlert, setFileAlert] = useState<string | null>(null);
  const lastSyncedProductIdRef = useRef<string | null>(null);

  useEffect(() => {
    onSavingChange?.(isSaving);
  }, [isSaving, onSavingChange]);

  // Sync form and media only when the product ID changes.
  useEffect(() => {
    const productId = initialProduct?.id ?? null;
    if (lastSyncedProductIdRef.current === productId) {
      return;
    }
    lastSyncedProductIdRef.current = productId;

    if (initialProduct) {
      setForm(productToFormState(initialProduct));
      let mediaItems: SaveProductMediaItem[] = [];
      if (initialProduct.images?.length) {
        mediaItems = initialProduct.images.map((url) => ({ type: 'url' as const, url }));
      } else if (initialProduct.image) {
        mediaItems = [{ type: 'url' as const, url: initialProduct.image }];
      }
      setMedia(mediaItems);
    } else {
      setForm(EMPTY_FORM);
      setMedia([]);
    }
  }, [initialProduct, setMedia]);

  useEffect(() => {
    if (!mediaError) {
      setErrors((prev) => (prev.images ? { ...prev, images: undefined } : prev));
      return;
    }

    setErrors((prev) => ({ ...prev, images: mediaError }));
    setFileAlert(mediaError);
  }, [mediaError, setErrors]);

  const handleSave = async () => {
    if (!validate(form) || isSaving) return;

    setIsSaving(true);
    try {
      const priceNum = parsePriceValue(form.price);
      const optimisticProduct: Product = {
        ...(initialProduct || {}),
        id: initialProduct?.id || `temp-${Date.now()}`,
        name: form.name.trim(),
        category: form.category.trim(),
        stock: parseInt(form.stock, 10),
        price: formatPrice(priceNum, currencySymbol),
        currency: initialProduct?.currency || 'USD',
        status: form.status,
        image: media[0]?.type === 'url' ? media[0].url : (media[0]?.preview ?? PLACEHOLDER_IMAGE),
        images: media.map((m) => (m.type === 'url' ? m.url : m.preview)),
        description: form.description,
        brand: form.brand,
        tags: form.tags,
        shippingInfo: form.shippingInfo,
        saleStatus: form.saleStatus,
        secondPrice: form.secondPrice
          ? formatPrice(parsePriceValue(form.secondPrice), currencySymbol)
          : null,
        seoTitle: form.seoTitle.trim() || null,
        seoDescription: form.seoDescription.trim() || null,
      };

      await onSave(
        optimisticProduct,
        {
          ...form,
          price: priceNum,
          secondPrice: form.secondPrice ? parsePriceValue(form.secondPrice) : undefined,
          stock: parseInt(form.stock, 10),
        },
        media,
        !!initialProduct,
      );

      setForm(EMPTY_FORM);
      setMedia([]);
      onClose();
    } catch (error) {
      console.error('Error in handleSave catch block:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    form,
    errors,
    images: media.map((m) => (m.type === 'url' ? m.url : m.preview)),
    fileAlert,
    clearFileAlert: () => setFileAlert(null),
    isSaving,
    fileInputRef,
    setField: <K extends keyof FormState>(k: K, v: FormState[K]) => {
      setForm((p) => ({ ...p, [k]: v }));
      if (errors[k as keyof FormErrors]) {
        clearError(k as keyof FormErrors);
      }
    },
    clearError,
    handleImageChange,
    handleRemoveImage,
    handleClose: () => {
      // Avoid closing if it is saving
      if (isSaving) return;
      // Do NOT clear form/media here.
      // If we clear it, and user re-opens the SAME product,
      // the sync useEffect(productId) won't re-run.
      onClose();
    },
    handleSave,
    descLen: form.description.length,
  };
};
