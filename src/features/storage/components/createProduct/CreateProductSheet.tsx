'use client';

import { Button } from '@/shared/components/ui/buttons/Button';
import { Icon } from '@/shared/components/ui/data-display/Icon';
import { AlertSnackbar } from '@/shared/components/ui/feedback/AlertSnackbar';
import type { SaveProductMediaItem, SaveProductPayload } from '@/types/storage';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCurrency } from '../../context/CurrencyContext';
import { useStorage } from '../../context/StorageContext';
import type { Product } from '../../data';
import { useCreateProductForm } from '../../hooks/useCreateProductForm';
import '../../styles/create-product-sheet.css';
import { BasicInfoSection } from './BasicInfoSection';
import { CategorySection } from './CategorySection';
import { ExtraInfoSection } from './ExtraInfoSection';
import { ImageUploadSection } from './ImageUploadSection';
import { StatusSection } from './StatusSection';
import { StockPriceSection } from './StockPriceSection';

interface CreateProductSheetProps {
  open: boolean;
  onClose: () => void;
  onSave: (
    optimisticProduct: Product,
    payload: SaveProductPayload,
    media: SaveProductMediaItem[],
    isEdit: boolean,
  ) => Promise<void>;
  nextId?: string;
  initialProduct?: Product | null;
  onSavingChange?: (isSaving: boolean) => void;
}

export const CreateProductSheet = ({
  open,
  onClose,
  onSave,
  nextId,
  initialProduct = null,
  onSavingChange,
}: CreateProductSheetProps) => {
  const isEditMode = Boolean(initialProduct);
  const { symbol: currencySymbol } = useCurrency();
  const { entitlements, totalProducts } = useStorage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const {
    form,
    errors,
    images,
    fileAlert,
    clearFileAlert,
    mediaBodyError,
    fileInputRef,
    setField,
    clearError,
    handleImageChange,
    handleRemoveImage,
    handleClose,
    handleSave,
    isSaving,
  } = useCreateProductForm({
    nextId,
    onSave,
    onClose,
    initialProduct,
    currencySymbol,
    onSavingChange,
  });

  if (!mounted) return null;

  const getSaveButtonContent = () => {
    if (isSaving) {
      return { icon: 'progress_activity', text: 'Guardando...' };
    }
    if (isEditMode) {
      return { icon: 'edit', text: 'Editar' };
    }
    return { icon: 'save', text: 'Guardar Producto' };
  };

  const { icon: saveIcon, text: saveText } = getSaveButtonContent();

  const requiredFieldsFilled = Boolean(
    form.name.trim() &&
    form.category.trim() &&
    form.stock.trim() &&
    form.price.trim() &&
    form.status,
  );

  const hasProductLimit =
    !isEditMode &&
    entitlements !== null &&
    totalProducts >= (entitlements?.maxProducts ?? Infinity);
  const canSave = requiredFieldsFilled && !mediaBodyError && !hasProductLimit;

  const content = (
    <>
      <div
        className={`create-sheet-scrim${open ? ' open' : ''}`}
        onClick={isSaving ? undefined : handleClose}
        aria-hidden="true"
      />

      <aside
        className={`create-product-sheet${open ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={isEditMode ? 'Editar Producto' : 'Crear Producto'}
      >
        {/* Header */}
        <div className="create-sheet-header">
          <div className="create-sheet-header-info">
            <div className="create-sheet-icon">
              <Icon>inventory_2</Icon>
            </div>
            <div>
              <h2 className="create-sheet-title">
                {isEditMode ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <p className="create-sheet-subtitle">
                {isEditMode
                  ? 'Modifica los campos y guarda los cambios'
                  : 'Completa los campos para agregar'}
              </p>
            </div>
          </div>
        </div>

        {/* Form Sections */}
        <div className="create-sheet-content">
          {entitlements && !isEditMode && totalProducts >= entitlements.maxProducts && (
            <div
              style={{
                margin: '0 24px 16px',
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'var(--md-sys-color-error-container)',
                color: 'var(--md-sys-color-on-error-container)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                border: '1px solid var(--md-sys-color-error)',
              }}
            >
              <Icon size={20}>warning</Icon>
              <span>
                Has alcanzado el límite de <strong>{entitlements.maxProducts} productos</strong> de
                tu plan. Sube de nivel para agregar más.
              </span>
            </div>
          )}

          <ImageUploadSection
            images={images}
            error={errors.images}
            sizeError={mediaBodyError}
            fileInputRef={fileInputRef}
            onRemove={handleRemoveImage}
            onChange={handleImageChange}
          />

          <BasicInfoSection
            name={form.name}
            description={form.description}
            brand={form.brand}
            nameError={errors.name}
            onNameChange={(v) => setField('name', v)}
            onDescriptionChange={(v) => setField('description', v)}
            onBrandChange={(v) => setField('brand', v)}
          />

          <ExtraInfoSection
            tags={form.tags}
            shippingInfo={form.shippingInfo}
            seoTitle={form.seoTitle}
            seoDescription={form.seoDescription}
            onTagsChange={(v) => setField('tags', v)}
            onShippingInfoChange={(v) => setField('shippingInfo', v)}
            onSeoTitleChange={(v) => setField('seoTitle', v)}
            onSeoDescriptionChange={(v) => setField('seoDescription', v)}
            seoEnabled={entitlements?.seoEnabled}
          />

          <CategorySection
            category={form.category}
            categoryError={errors.category}
            onCategoryChange={(v) => setField('category', v)}
          />

          <StockPriceSection
            stock={form.stock}
            price={form.price}
            secondPrice={form.secondPrice}
            currencySymbol={currencySymbol}
            stockError={errors.stock}
            priceError={errors.price}
            onStockChange={(v) => setField('stock', v)}
            onPriceChange={(v) => setField('price', v)}
            onSecondPriceChange={(v) => setField('secondPrice', v)}
          />

          <StatusSection
            status={form.status}
            saleStatus={form.saleStatus}
            statusError={errors.status}
            onStatusChange={(v) => {
              setField('status', v);
              clearError('status');
            }}
            onSaleStatusChange={(v) => setField('saleStatus', v)}
          />
        </div>

        {/* Footer */}
        <div className="create-sheet-footer">
          <Button variant="outlined" onClick={handleClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button variant="filled" onClick={handleSave} disabled={isSaving || !canSave}>
            <Icon slot="icon" size={21} className={isSaving ? 'spinner-mini' : ''}>
              {saveIcon}
            </Icon>
            {saveText}
          </Button>
        </div>
      </aside>

      <AlertSnackbar
        open={Boolean(fileAlert)}
        description={fileAlert ?? ''}
        color="error"
        icon="error"
        onClose={clearFileAlert}
      />
    </>
  );

  return createPortal(content, document.body);
};
