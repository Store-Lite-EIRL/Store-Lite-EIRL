'use client';

import { useEffect, useRef, useState } from 'react';

import type { Business } from '@/core/database/schema';

import { removeBusinessCover, updateBusinessCover } from '@app/actions/business';

interface HeroControllerParams {
  business: Business | null;
}

interface MenuElement extends HTMLElement {
  anchorElement?: HTMLElement;
  open?: boolean;
}

export type HeroBusiness = Business;

interface SnackbarState {
  open: boolean;
  description: string;
  color: 'success' | 'error' | 'warning' | 'primary';
  icon?: string;
}

const DEFAULT_SNACKBAR: SnackbarState = {
  open: false,
  description: '',
  color: 'primary',
};

function getCursorStyle(isEditing: boolean, isDragging: boolean) {
  if (!isEditing) return 'default';
  return isDragging ? 'grabbing' : 'grab';
}

async function processHeroImage(
  backgroundImage: string,
  heroRef: HTMLDivElement,
  position: { x: number; y: number },
): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.src = backgroundImage;
  await new Promise((resolve) => {
    img.onload = resolve;
  });

  const containerWidth = heroRef.offsetWidth;
  const containerHeight = heroRef.offsetHeight;
  const targetWidth = 1920;
  const scaleFactor = targetWidth / containerWidth;
  const targetHeight = containerHeight * scaleFactor;
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const imgRatio = img.width / img.height;
  const containerRatio = containerWidth / containerHeight;
  let renderWidth = containerWidth;
  let renderHeight = containerHeight;
  if (containerRatio > imgRatio) {
    renderHeight = containerWidth / imgRatio;
  } else {
    renderWidth = containerHeight * imgRatio;
  }

  if (ctx) {
    const centerOffsetX = (containerWidth - renderWidth) / 2;
    const centerOffsetY = (containerHeight - renderHeight) / 2;
    ctx.drawImage(
      img,
      (centerOffsetX + position.x) * scaleFactor,
      (centerOffsetY + position.y) * scaleFactor,
      renderWidth * scaleFactor,
      renderHeight * scaleFactor,
    );
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
  });
}

export function useHeroController({ business }: HeroControllerParams) {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(
    business?.coverImageUrl || null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [snackbar, setSnackbar] = useState<SnackbarState>(DEFAULT_SNACKBAR);

  const heroRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isManuallyUpdating = useRef(false);

  useEffect(() => {
    // Only update from props if we are not in the middle of a manual update
    if (!isManuallyUpdating.current) {
      if (business?.coverImageUrl !== backgroundImage) {
        console.warn('[Hero] Syncing state from props:', business?.coverImageUrl);
        const frameId = window.requestAnimationFrame(() => {
          setBackgroundImage(business?.coverImageUrl || null);
        });
        return () => window.cancelAnimationFrame(frameId);
      }
    } else {
      console.warn('[Hero] Skipping sync: Manual update in progress');
    }
  }, [business?.coverImageUrl]);

  const handleUploadClick = () => {
    if (menuRef.current) {
      (menuRef.current as unknown as MenuElement).open = false;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBackgroundImage(url);
      setIsEditing(true);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditing) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setBackgroundImage(business?.coverImageUrl || null);
    setPosition({ x: 0, y: 0 });
  };

  const handleMenuClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (menuRef.current) {
      const menu = menuRef.current as unknown as MenuElement;
      menu.open = !menu.open;
    }
  };

  const handleDeleteClick = () => {
    if (menuRef.current) {
      (menuRef.current as unknown as MenuElement).open = false;
    }
    setShowDeleteDialog(true);
  };

  const confirmDeleteBackground = async () => {
    if (!business) return;

    setShowDeleteDialog(false);
    isManuallyUpdating.current = true;

    try {
      const result = await removeBusinessCover(business.id, business.slug);
      if (result.success) {
        setBackgroundImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setSnackbar({
          open: true,
          description: 'Publicidad eliminada',
          color: 'success',
          icon: 'delete',
        });

        window.dispatchEvent(new CustomEvent('business-data-updated'));

        setTimeout(() => {
          isManuallyUpdating.current = false;
        }, 1000);
      } else {
        isManuallyUpdating.current = false;
      }
    } catch (error: unknown) {
      console.error(error);
      isManuallyUpdating.current = false;
      setSnackbar({
        open: true,
        description: 'Error al eliminar',
        color: 'error',
        icon: 'error',
      });
    }
  };

  const uploadCover = async (blob: Blob, localUrl: string, originalImage: string | null) => {
    if (!business) return;

    try {
      console.warn('[Hero] Uploading Blob:', {
        size: blob.size,
        type: blob.type,
        businessId: business.id,
        slug: business.slug,
      });
      const formData = new FormData();
      formData.append('file', blob, 'hero.jpg');
      const result = await updateBusinessCover(business.id, business.slug, formData);
      console.warn('[Hero] Upload result:', result);

      if (result.success && result.url) {
        const uploadedUrl = result.url;
        const img = new Image();
        img.src = uploadedUrl;
        img.onload = () => {
          console.warn('[Hero] New background image loaded successfully:', uploadedUrl);
          setBackgroundImage(uploadedUrl);
          window.dispatchEvent(new CustomEvent('business-data-updated'));
          URL.revokeObjectURL(localUrl);
          // Wait a bit longer to ensure Next.js revalidation completes before releasing the lock
          setTimeout(() => {
            isManuallyUpdating.current = false;
            console.warn('[Hero] Manual update lock released');
          }, 3000);
        };
        img.onerror = () => {
          console.error('[Hero] Failed to load the uploaded image URL:', uploadedUrl);
          img.onload?.(new Event('error'));
        };
      } else {
        throw new Error(result.error || 'Error al subir');
      }
    } catch (error: unknown) {
      console.error('[Hero] Error:', error);
      setBackgroundImage(originalImage);
      setIsEditing(true);
      setSnackbar({
        open: true,
        description: error instanceof Error ? error.message : 'Error al guardar.',
        color: 'error',
        icon: 'error',
      });
      isManuallyUpdating.current = false;
      URL.revokeObjectURL(localUrl);
    }
  };

  const handleSave = async () => {
    if (!business || !backgroundImage || !heroRef.current) return;

    setIsSaving(true);
    try {
      const blob = await processHeroImage(backgroundImage, heroRef.current, position);
      if (!blob) {
        setIsSaving(false);
        return;
      }

      const localUrl = URL.createObjectURL(blob);
      const originalImage = backgroundImage;
      setBackgroundImage(localUrl);
      setIsEditing(false);
      setSnackbar({
        open: true,
        description: 'Publicidad guardada exitosamente.',
        color: 'success',
        icon: 'check_circle',
      });
      setIsSaving(false);
      isManuallyUpdating.current = true;

      uploadCover(blob, localUrl, originalImage);
    } catch (error: unknown) {
      console.error(error);
      setIsSaving(false);
    }
  };

  return {
    backgroundImage,
    backgroundPositionStyle: isEditing
      ? `calc(50% + ${position.x}px) calc(50% + ${position.y}px)`
      : 'center',
    confirmDeleteBackground,
    cursorStyle: getCursorStyle(isEditing, isDragging),
    fileInputRef,
    handleCancel,
    handleDeleteClick,
    handleFileChange,
    handleMenuClick,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleSave,
    handleUploadClick,
    heroRef,
    isDragging,
    isEditing,
    isSaving,
    menuRef,
    setShowDeleteDialog,
    setSnackbar,
    showDeleteDialog,
    snackbar,
  };
}
