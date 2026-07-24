'use client';

import type { StorefrontColorScheme } from '@/core/storefront';
import { useHeroController, type HeroBusiness } from '@/features/products/hooks/useHeroController';
import { Button, IconButton } from '@/shared/components/ui/buttons';
import { Icon } from '@/shared/components/ui/data-display';
import { AlertSnackbar } from '@/shared/components/ui/feedback/AlertSnackbar';
import { Dialog } from '@/shared/components/ui/surfaces/Dialog';
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import Image from 'next/image';
import styles from './Hero.module.css';

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
    handleMouseEnter,
    handleMouseLeave,
    handleMouseMove,
    handleMouseUp,
    handleSave,
    handleTouchEnd,
    handleTouchStart,
    handleUploadClick,
    heroRef,
    images,
    activeSlide,
    imagesCount,
    hasMultipleImages,
    isEditing,
    isPaused,
    isSaving,
    maxImagesReached,
    menuRef,
    setShowDeleteDialog,
    setSnackbar,
    showDeleteDialog,
    snackbar,
  } = useHeroController({ business: business || null });

  return (
    <>
      <section
        ref={heroRef}
        className={`${styles.heroContainer} ${images.length === 0 ? styles.noImages : ''} ${isEditing ? styles.isEditing : ''}`}
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
          cursor: cursorStyle,
        }}
      >
        {/* ─── Slide layers con fade transition ────────────── */}
        {images.length > 0 && (
          <div className={styles.slidesLayer}>
            {images.map((img, i) => (
              <div
                key={i}
                className={styles.slide}
                style={{
                  backgroundImage: `url('${img}')`,
                  backgroundPosition: backgroundPositionStyle,
                  opacity: i === activeSlide ? 1 : 0,
                }}
              />
            ))}
          </div>
        )}

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

        {/* ─── Empty State CTA (owner, sin imágenes) ────────── */}
        {images.length === 0 && isOwner && (
          <div className={styles.emptyStateCTA}>
            <div className={styles.emptyStateContent}>
              <div className={styles.emptyStateIcon}>
                <Icon size={48}>add_photo_alternate</Icon>
              </div>
              <p className={styles.emptyStateTitle}>Agregá una portada</p>
              <p className={styles.emptyStateSubtitle}>
                Las portadas hacen que tu negocio se vea más profesional. Puedes subir hasta 3
                imágenes
              </p>
              <button className={styles.emptyStateButton} onClick={handleUploadClick} type="button">
                Subir portada
              </button>
            </div>
          </div>
        )}

        {/* ─── Owner Menu (solo si hay imágenes) ────────────── */}
        {isOwner && !isEditing && business && images.length > 0 && (
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

        {/* ─── Social links (right side) ──────────────────── */}
        {(business?.whatsappNumber ||
          (business?.socialLinks && Object.keys(business.socialLinks).length > 0)) && (
          <div className={styles.socialLinks}>
            {business.whatsappNumber && (
              <a
                href={`https://wa.me/${business.whatsappNumber.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="WhatsApp"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            )}
            {business?.socialLinks?.instagram && (
              <a
                href={business.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
            )}
            {business?.socialLinks?.facebook && (
              <a
                href={business.socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
            )}
            {business?.socialLinks?.twitter && (
              <a
                href={business.socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="X / Twitter"
              >
                <Twitter size={18} />
              </a>
            )}
            {business?.socialLinks?.tiktok && (
              <a
                href={business.socialLinks.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="TikTok"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                </svg>
              </a>
            )}
            {business?.socialLinks?.youtube && (
              <a
                href={business.socialLinks.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="YouTube"
              >
                <Youtube size={18} />
              </a>
            )}
          </div>
        )}

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
          onChange={(e) => handleFileChange(e)}
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
