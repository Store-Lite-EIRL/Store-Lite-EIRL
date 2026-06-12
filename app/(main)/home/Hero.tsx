'use client';

import type { StorefrontColorScheme } from '@/core/storefront';
import { Button, IconButton } from '@/shared/components/ui/buttons';
import { Icon } from '@/shared/components/ui/data-display';
import { AlertSnackbar } from '@/shared/components/ui/feedback/AlertSnackbar';
import { Dialog } from '@/shared/components/ui/surfaces/Dialog';
import Image from 'next/image';
import styles from './Hero.module.css';
import { useHeroController, type HeroBusiness } from './useHeroController';

interface HeroProps {
  business?: HeroBusiness | null;
  isOwner?: boolean;
  /** Current color scheme for the public toggle */
  effectiveScheme?: StorefrontColorScheme;
  /** Called when the public user clicks light or dark */
  onSchemeChange?: (scheme: StorefrontColorScheme) => void;
}

export default function Hero({
  business,
  isOwner = false,
  effectiveScheme,
  onSchemeChange,
}: HeroProps) {
  const {
    backgroundImage,
    backgroundPositionStyle,
    confirmDeleteBackground,
    cursorStyle,
    fileInputRef,
    goNext,
    goPrev,
    goToSlide,
    handleCancel,
    handleDeleteAllClick,
    handleDeleteClick,
    handleFileChange,
    handleMenuClick,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseEnter,
    handleMouseLeave,
    handleSave,
    handleTouchStart,
    handleTouchEnd,
    handleUploadClick,
    heroRef,
    imagesCount,
    activeSlide,
    isEditing,
    isPaused,
    isSaving,
    maxImagesReached,
    menuRef,
    setShowDeleteDialog,
    setSnackbar,
    showDeleteDialog,
    snackbar,
    hasMultipleImages,
  } = useHeroController({ business: business || null });

  return (
    <>
      <section
        ref={heroRef}
        className={styles.heroContainer}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          handleMouseUp();
          handleMouseLeave();
        }}
        onMouseEnter={handleMouseEnter}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          backgroundImage: backgroundImage ? `url('${backgroundImage}')` : undefined,
          backgroundPosition: backgroundPositionStyle,
          cursor: cursorStyle,
        }}
      >
        {isSaving && <md-linear-progress indeterminate className={styles.progressBar} />}

        {/* ─── Carrusel: Flechas ────────────────────────────── */}
        {!isEditing && hasMultipleImages && (
          <>
            <button
              className={`${styles.arrow} ${styles.arrowLeft}`}
              onClick={goPrev}
              aria-label="Imagen anterior"
              type="button"
            >
              <Icon>chevron_left</Icon>
            </button>
            <button
              className={`${styles.arrow} ${styles.arrowRight}`}
              onClick={goNext}
              aria-label="Siguiente imagen"
              type="button"
            >
              <Icon>chevron_right</Icon>
            </button>
          </>
        )}

        {/* ─── Owner Menu ───────────────────────────────────── */}
        {isOwner && !isEditing && business && (
          <div className={styles.menuContainer}>
            <IconButton id="hero-menu-trigger" onClick={handleMenuClick} suppressHydrationWarning>
              <md-icon suppressHydrationWarning>more_vert</md-icon>
            </IconButton>
            <md-menu
              ref={menuRef}
              id="hero-menu"
              anchor="hero-menu-trigger"
              anchor-corner="end-start"
              menu-corner="start-start"
              positioning="popover"
              suppressHydrationWarning
            >
              {/* Subir nueva imagen (solo si no llegó al límite) */}
              {!maxImagesReached && (
                <md-menu-item onClick={handleUploadClick} suppressHydrationWarning>
                  <div slot="headline">Subir publicidad (Portada)</div>
                  <Icon slot="icon" size={21}>
                    upload
                  </Icon>
                </md-menu-item>
              )}

              {/* Eliminar imagen actual */}
              {imagesCount > 0 && (
                <md-menu-item onClick={() => handleDeleteClick()} suppressHydrationWarning>
                  <div slot="headline">
                    {hasMultipleImages ? 'Eliminar imagen actual' : 'Eliminar imagen'}
                  </div>
                  <Icon slot="icon" size={21}>
                    delete
                  </Icon>
                </md-menu-item>
              )}

              {/* Eliminar todas (solo si hay más de 1) */}
              {hasMultipleImages && (
                <md-menu-item onClick={handleDeleteAllClick} suppressHydrationWarning>
                  <div slot="headline">Eliminar todas</div>
                  <Icon slot="icon" size={21}>
                    delete_forever
                  </Icon>
                </md-menu-item>
              )}
            </md-menu>
          </div>
        )}

        {/* ─── Public light/dark toggle ─────────────────────── */}
        {!isOwner && effectiveScheme && onSchemeChange && (
          <div className={styles.publicSchemeToggle}>
            <button
              className={`${styles.schemeBtn} ${effectiveScheme === 'light' ? styles.schemeBtnActive : ''}`}
              onClick={() => onSchemeChange('light')}
              aria-label="Tema claro"
              title="Tema claro"
            >
              <Icon>light_mode</Icon>
            </button>
            <button
              className={`${styles.schemeBtn} ${effectiveScheme === 'dark' ? styles.schemeBtnActive : ''}`}
              onClick={() => onSchemeChange('dark')}
              aria-label="Tema oscuro"
              title="Tema oscuro"
            >
              <Icon>dark_mode</Icon>
            </button>
          </div>
        )}

        {/* ─── Hero content (logo + name) ───────────────────── */}
        <div className={styles.heroContent}>
          <div className={styles.textContainer}>
            {business?.logoUrl && (
              <Image
                src={business.logoUrl}
                alt={business.name}
                width={88}
                height={88}
                className={styles.logo}
                priority
              />
            )}
            <h1 className={styles.title}>{business?.name || 'Mi Negocio'}</h1>
          </div>
        </div>

        {/* ─── Dots de navegación ───────────────────────────── */}
        {!isEditing && hasMultipleImages && (
          <div className={styles.dotsContainer}>
            {Array.from({ length: imagesCount }).map((_, index) => (
              <button
                key={index}
                className={`${styles.dot} ${index === activeSlide ? styles.dotActive : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Ir a imagen ${index + 1}`}
                type="button"
              />
            ))}
          </div>
        )}

        {/* ─── Indicador de slide (1/3 + pausa) ─────────────── */}
        {!isEditing && hasMultipleImages && (
          <div className={`${styles.slideIndicator} ${isPaused ? styles.slidePaused : ''}`}>
            {isPaused && <Icon>pause</Icon>}
            {activeSlide + 1}/{imagesCount}
          </div>
        )}

        {/* ─── Editing controls ─────────────────────────────── */}
        {isEditing && (
          <div className={styles.editControls}>
            <div className={styles.instructionText}>Arrastra para posicionar la publicidad</div>
            <div className={styles.buttonGroup}>
              <Button variant="outlined" onClick={handleCancel} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar Portada'}
              </Button>
            </div>
          </div>
        )}

        {/* ─── Hidden file input ────────────────────────────── */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            console.warn('[Hero] input onChange triggered');
            handleFileChange(e);
          }}
          accept="image/*"
          style={{ display: 'none' }}
          aria-label="Subir publicidad"
        />
      </section>

      {/* ─── Dialog eliminar todas ──────────────────────────── */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} type="alert">
        <div slot="headline">¿Eliminar todas las imágenes?</div>
        <div slot="content">
          ¿Estás seguro de que deseas eliminar todas las imágenes de publicidad de tu negocio?
        </div>
        <div slot="actions">
          <Button variant="text" onClick={() => setShowDeleteDialog(false)}>
            Cancelar
          </Button>
          <Button variant="text" onClick={confirmDeleteBackground}>
            Eliminar todas
          </Button>
        </div>
      </Dialog>

      <AlertSnackbar
        {...snackbar}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        position="bottom-center"
      />
    </>
  );
}
