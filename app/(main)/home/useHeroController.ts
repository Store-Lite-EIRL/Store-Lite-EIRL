/* eslint-disable max-lines-per-function */
'use client';

import { useEffect, useRef, useState } from 'react';
import { removeBusinessLogo, updateBusinessLogo } from '../../actions/business';

export interface HeroBusiness {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  whatsappNumber: string | null;
  coverImageUrl: string | null;
  logoUrl: string | null;
  storeType: string | null;
}

interface HeroControllerParams {
  business?: HeroBusiness;
}

interface MenuWithOpen extends HTMLElement {
  open: boolean;
}

interface DragLimits {
  maxDeltaX: number;
  maxDeltaY: number;
}

const MAX_FILE_SIZE = 1024 * 1024;

function getCursorStyle(isEditing: boolean, isDragging: boolean): 'default' | 'grab' | 'grabbing' {
  if (!isEditing) return 'default';
  return isDragging ? 'grabbing' : 'grab';
}

export function useHeroController({ business }: HeroControllerParams) {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(business?.logoUrl || null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    description: string;
    color: 'primary' | 'error' | 'success';
    icon?: string;
  }>({
    open: false,
    description: '',
    color: 'primary',
  });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<MenuWithOpen | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  const dragLimitsRef = useRef<DragLimits | null>(null);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setBackgroundImage(business?.logoUrl || null);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [business?.logoUrl]);

  const handleMenuClick = () => {
    const menu = menuRef.current;
    if (menu) {
      menu.open = !menu.open;
    }
  };

  const handleUploadClick = () => {
    const menu = menuRef.current;
    if (menu) {
      menu.open = false;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setSnackbar({
        open: true,
        description: 'La imagen excede el limite de 1MB.',
        color: 'error',
        icon: 'error',
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result !== 'string') return;
      setBackgroundImage(result);
      setIsEditing(true);
      setPosition({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  const confirmDeleteBackground = async () => {
    if (!business) return;
    setShowDeleteDialog(false);
    setIsSaving(true);
    try {
      const result = await removeBusinessLogo(business.id, business.slug);
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
      }
    } catch (error: unknown) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = () => {
    const menu = menuRef.current;
    if (menu) {
      menu.open = false;
    }
    setShowDeleteDialog(true);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditing || !heroRef.current || !backgroundImage) return;

    const img = new Image();
    img.src = backgroundImage;
    img.onload = () => {
      const heroElement = heroRef.current;
      if (!heroElement) return;

      const containerWidth = heroElement.offsetWidth;
      const containerHeight = heroElement.offsetHeight;
      const imgRatio = img.width / img.height;
      const containerRatio = containerWidth / containerHeight;

      let renderWidth = containerWidth;
      let renderHeight = containerHeight;
      if (containerRatio > imgRatio) {
        renderHeight = containerWidth / imgRatio;
      } else {
        renderWidth = containerHeight * imgRatio;
      }

      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      dragLimitsRef.current = {
        maxDeltaX: Math.max(0, (renderWidth - containerWidth) / 2),
        maxDeltaY: Math.max(0, (renderHeight - containerHeight) / 2),
      };
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isEditing) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    const limits = dragLimitsRef.current;

    if (!limits) {
      setPosition({ x: newX, y: newY });
      return;
    }

    setPosition({
      x: Math.max(-limits.maxDeltaX, Math.min(limits.maxDeltaX, newX)),
      y: Math.max(-limits.maxDeltaY, Math.min(limits.maxDeltaY, newY)),
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleCancel = () => {
    setIsEditing(false);
    setBackgroundImage(business?.logoUrl || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!business || !backgroundImage || !heroRef.current) return;

    setIsSaving(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = backgroundImage;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const containerWidth = heroRef.current.offsetWidth;
      const containerHeight = heroRef.current.offsetHeight;
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

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            setIsSaving(false);
            return;
          }

          const formData = new FormData();
          formData.append('file', blob, 'hero.jpg');
          const result = await updateBusinessLogo(business.id, business.slug, formData);
          if (result.success && result.url) {
            const uploadedUrl = result.url;
            const imgToPreload = new Image();
            imgToPreload.src = uploadedUrl;

            imgToPreload.onload = () => {
              setBackgroundImage(uploadedUrl);
              setIsEditing(false);
              setSnackbar({
                open: true,
                description: 'Publicidad guardada',
                color: 'success',
                icon: 'check_circle',
              });
              window.dispatchEvent(new CustomEvent('business-data-updated'));
              setIsSaving(false);
            };

            imgToPreload.onerror = () => {
              setBackgroundImage(uploadedUrl);
              setIsEditing(false);
              setIsSaving(false);
            };
          } else {
            setSnackbar({
              open: true,
              description: result.error || 'Error al guardar',
              color: 'error',
            });
            setIsSaving(false);
          }
        },
        'image/jpeg',
        0.9,
      );
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
