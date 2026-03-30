import { env } from '@/config/env';
import { db } from '@/core/database/client';
import { businesses } from '@/core/database/schema';
import { getBusinessEntitlements } from '@/core/entitlements/getBusinessEntitlements';
import { createServerClient } from '@supabase/ssr';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

import { notFound } from 'next/navigation';
import { getProductById } from '../../../storage/actions';
import {
  formatPrice,
  getCurrencyByCountry,
  parsePriceValue,
} from '../../../storage/utils/currency';
import BackButton from './BackButton';
import styles from './ProductDetail.module.css';
import ProductGallery from './ProductGallery';
import PurchaseActions from './PurchaseActions';

interface ProductDetailContentProps {
  slug: string;
  productId: string;
  isModal?: boolean;
  hasPaymentGateway?: boolean;
}

export default async function ProductDetailContent({
  slug,
  productId,
  isModal = false,
}: ProductDetailContentProps) {
  const cookieStore = await cookies();
  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [productResult, businessDetail] = await Promise.all([
    getProductById(slug, productId),
    db.query.businesses.findFirst({ where: eq(businesses.slug, slug) }),
  ]);

  if (productResult.error || !productResult.product || !businessDetail) {
    return notFound();
  }

  // Obtenemos los entitlements centrales para este negocio
  const entitlements = await getBusinessEntitlements(businessDetail.id);
  const { hasPaymentGateway } = entitlements;

  const isOwner = Boolean(user?.id && businessDetail?.ownerId === user.id);

  if (productResult.error || !productResult.product || !businessDetail) {
    return notFound();
  }

  const { product } = productResult;

  // Deny access to inactive products for non-owners
  if (product.status === 'NO ACTIVO' && !isOwner) {
    return notFound();
  }

  const numericPrice = parsePriceValue(product.price);
  const currencyInfo = getCurrencyByCountry(product.currency);

  const mappedSymbol = product.currency === 'PEN' ? 'S/ ' : `${currencyInfo.symbol} `;
  const finalPrice = formatPrice(numericPrice, mappedSymbol);

  return (
    <div className={`${styles.pageContainer} ${isModal ? styles.modalContent : ''}`}>
      {!isModal && (
        <div className={styles.backButtonWrapper}>
          <BackButton
            href={isOwner ? `/${slug}/storage` : `/${slug}`}
            style={{ width: '56px', height: '56px' }}
          />
        </div>
      )}
      {/* BEGIN: Product Overview Section */}
      <section className={styles.productMain}>
        <ProductGallery images={product.images} productName={product.name} />

        <div className={styles.productInfoSidebar}>
          <div>
            <h1 className={styles.productTitle}>{product.name}</h1>
            <div className={styles.ratingCompact}>
              <div className={styles.ratingCompactStars}>
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span className={styles.starEmpty}>★</span>
              </div>
              <span className={styles.ratingCompactText}>5.0</span>
            </div>
          </div>

          <div>
            <p className={styles.productPrice}>{finalPrice}</p>
          </div>

          <div className={styles.accordion}>
            <div className={styles.accordionHeader}>
              <span className={styles.accordionHeaderTitle}>Description</span>
            </div>
            <p className={styles.accordionContentText}>
              {product.description || 'No description available for this product.'}
            </p>
          </div>

          <PurchaseActions
            product={product}
            business={businessDetail}
            hasPaymentGateway={hasPaymentGateway}
          />

          <div className={styles.accordion}>
            <div className={styles.accordionHeader}>
              <span className={styles.accordionHeaderTitle}>Shipping</span>
            </div>
            <div className={styles.shippingGrid}>
              <div className={styles.shippingItem}>
                <div className={styles.shippingIconContainer}>
                  <span className={styles.shippingIconText}>%</span>
                </div>
                <div>
                  <p className={styles.shippingInfoTitle}>Discount</p>
                  <p className={styles.shippingInfoValue}>Disc 50%</p>
                </div>
              </div>
              <div className={styles.shippingItem}>
                <div className={styles.shippingIconContainer}>
                  <span className={styles.shippingIconText}>%</span>
                </div>
                <div>
                  <p className={styles.shippingInfoTitle}>Package</p>
                  <p className={styles.shippingInfoValue}>Reg</p>
                </div>
              </div>
              <div className={styles.shippingItem}>
                <div className={styles.shippingIconContainer}>
                  <span className={styles.shippingIconText}>%</span>
                </div>
                <div>
                  <p className={styles.shippingInfoTitle}>Delivery Time</p>
                  <p className={styles.shippingInfoValue}>3-4 Working Days</p>
                </div>
              </div>
              <div className={styles.shippingItem}>
                <div className={styles.shippingIconContainer}>
                  <span className={styles.shippingIconText}>%</span>
                </div>
                <div>
                  <p className={styles.shippingInfoTitle}>Arrive</p>
                  <p className={styles.shippingInfoValue}>0 - 12 Oct 2024</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BEGIN: Related Products Section - Omitted in modal for brevity if needed, or keep for Pinterest feel */}
      {!isModal && (
        <section className={styles.relatedProductsSection}>
          <h2 className={styles.relatedProductsTitle}>Productos Relacionados</h2>
          <div className={styles.relatedProductsGrid}>
            {[
              {
                id: 1,
                name: 'Smart Watch Pro',
                price: 'S/ 299',
                img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400&auto=format&fit=crop',
              },
              {
                id: 2,
                name: 'Premium Headphones',
                price: 'S/ 450',
                img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400&auto=format&fit=crop',
              },
              {
                id: 3,
                name: 'Wireless Mouse',
                price: 'S/ 89',
                img: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=400&auto=format&fit=crop',
              },
              {
                id: 4,
                name: 'Mechanical Keyboard',
                price: 'S/ 320',
                img: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=400&auto=format&fit=crop',
              },
            ].map((p) => (
              <div key={p.id} className={styles.productCardMock}>
                <div
                  className={styles.cardImagePlaceholder}
                  style={{ backgroundImage: `url('${p.img}')` }}
                />
                <p className={styles.cardTitle}>{p.name}</p>
                <p className={styles.cardPrice}>{p.price}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* BEGIN: Rating & Reviews Section */}
      {/* <section className={styles.reviewsSection}>
        <h2 className={styles.reviewsTitle}>Rating &amp; Reviews</h2>
        <div className={styles.reviewsGrid}>
          <div className={styles.reviewsList}>
            {reviews.map((r, i) => (
              <div key={i} className={styles.featuredReview}>
                <div className={styles.reviewerHeader}>
                  <div>
                    <p className={styles.reviewerName}>{r.name}</p>
                    <div className={styles.reviewerStars}>
                      <span className={styles.reviewerStarIcon}>★★★★★</span>
                    </div>
                  </div>
                  <span className={styles.reviewDate}>{r.date}</span>
                </div>
                <p className={styles.reviewText}>{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}
      <section className={styles.purchaseProcessSection}>
        <h2 className={styles.purchaseProcessTitle}>¿Cómo comprar?</h2>
        <div className={styles.processSteps}>
          {hasPaymentGateway ? (
            <>
              <div className={styles.processStep}>
                <span className={styles.stepNumber}>1</span>
                <div>
                  <p className={styles.stepTitle}>Paga en línea</p>
                  <p className={styles.stepDesc}>Completa tu pago seguro con Culqi, Plin o Yape.</p>
                </div>
              </div>
              <div className={styles.processStep}>
                <span className={styles.stepNumber}>2</span>
                <div>
                  <p className={styles.stepTitle}>Confirmación</p>
                  <p className={styles.stepDesc}>Recibirás una confirmación inmediata por WhatsApp y Email.</p>
                </div>
              </div>
              <div className={styles.processStep}>
                <span className={styles.stepNumber}>3</span>
                <div>
                  <p className={styles.stepTitle}>Entrega</p>
                  <p className={styles.stepDesc}>Despachamos tu pedido en un plazo máximo de 24-48 horas.</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={styles.processStep}>
                <span className={styles.stepNumber}>1</span>
                <div>
                  <p className={styles.stepTitle}>Agrega al carrito</p>
                  <p className={styles.stepDesc}>Añade tus productos y presiona &quot;Contactar Vendedor&quot;.</p>
                </div>
              </div>
              <div className={styles.processStep}>
                <span className={styles.stepNumber}>2</span>
                <div>
                  <p className={styles.stepTitle}>Coordinación Directa</p>
                  <p className={styles.stepDesc}>Te atenderemos vía WhatsApp para definir el método de pago y entrega.</p>
                </div>
              </div>
              <div className={styles.processStep}>
                <span className={styles.stepNumber}>3</span>
                <div>
                  <p className={styles.stepTitle}>Pago y Envío</p>
                  <p className={styles.stepDesc}>Aceptamos transferencias y pago contra entrega según el vendedor.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* BEGIN: Business Contact Info Section */}
      <section className={styles.businessContactSection}>
        <h2 className={styles.businessContactTitle}>Atención al Cliente</h2>
        <div className={styles.businessContactGrid}>
          <div className={styles.contactCard}>
            <span className={styles.contactLabel}>Empresa</span>
            <span className={styles.contactValue}>{businessDetail.name}</span>
          </div>
          {businessDetail.address && (
            <div className={styles.contactCard}>
              <span className={styles.contactLabel}>Dirección</span>
              <span className={styles.contactValue}>{businessDetail.address}</span>
            </div>
          )}
          {businessDetail.email && (
            <div className={styles.contactCard}>
              <span className={styles.contactLabel}>Email</span>
              <span className={styles.contactValue}>{businessDetail.email}</span>
            </div>
          )}
          <div className={styles.contactCard}>
            <span className={styles.contactLabel}>Teléfono / WhatsApp</span>
            <span className={styles.contactValue}>
              {businessDetail.whatsappNumber || 'Consultar por chat'}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
