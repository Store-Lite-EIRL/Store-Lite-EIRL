import { env } from '@/config/env';
import { resolveBusinessSlug } from '@/core/business/slug';
import { db } from '@/core/database/client';
import { products as productsTable } from '@/core/database/schema';
import { getBusinessEntitlements } from '@/core/entitlements/getBusinessEntitlements';
import { createServerClient } from '@supabase/ssr';
import { and, eq, or } from 'drizzle-orm';
import { cookies } from 'next/headers';

import { notFound } from 'next/navigation';
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
  isPaymentConfigured?: boolean;
  culqiPublicKey?: string;
}

export default async function ProductDetailContent({
  slug,
  productId,
  isModal = false,
  isPaymentConfigured = false,
  culqiPublicKey,
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

  const businessDetail = (await resolveBusinessSlug(slug))?.business;

  if (!businessDetail) {
    return notFound();
  }

  const rawProduct = await db.query.products.findFirst({
    where: and(
      eq(productsTable.businessId, businessDetail.id),
      or(eq(productsTable.id, productId), eq(productsTable.slug, productId)),
    ),
    with: {
      category: {
        columns: {
          name: true,
        },
      },
      media: {
        orderBy: (media, { asc }) => [asc(media.displayOrder)],
        columns: {
          mediaUrl: true,
          displayOrder: true,
        },
      },
    },
  });

  if (!rawProduct) {
    return notFound();
  }

  // Obtenemos los entitlements centrales para este negocio
  const entitlements = await getBusinessEntitlements(businessDetail.id);
  const { hasPaymentGateway } = entitlements;

  const isOwner = Boolean(user?.id && businessDetail?.ownerId === user.id);

  const product = {
    id: rawProduct.id,
    name: rawProduct.title,
    category: rawProduct.category?.name || 'Sin categoria',
    stock: rawProduct.stock,
    price: String(rawProduct.price),
    status: rawProduct.isAvailable ? 'ACTIVO' : 'NO ACTIVO',
    slug: rawProduct.slug,
    seoTitle: rawProduct.seoTitle,
    seoDescription: rawProduct.seoDescription,
    image: rawProduct.media[0]?.mediaUrl || '',
    images: rawProduct.media.map((m) => m.mediaUrl),
    description: rawProduct.description || '',
    currency: rawProduct.currency,
    displayOrder: rawProduct.displayOrder,
    createdAt: rawProduct.createdAt,
    brand: rawProduct.brand,
    tags: rawProduct.tags,
    shippingInfo: rawProduct.shippingInfo,
    saleStatus: rawProduct.saleStatus,
    secondPrice: rawProduct.secondPrice ? String(rawProduct.secondPrice) : null,
  };

  // Deny access to inactive products for non-owners
  if (product.status === 'NO ACTIVO' && !isOwner) {
    return notFound();
  }

  const numericPrice = parsePriceValue(product.price);
  const currencyInfo = getCurrencyByCountry(product.currency);

  const mappedSymbol = product.currency === 'PEN' ? 'S/ ' : `${currencyInfo.symbol} `;
  const finalPrice = formatPrice(numericPrice, mappedSymbol);

  // Consideramos pagos habilitados solo si el plan lo permite Y las llaves están configuradas
  const paymentsEnabled = hasPaymentGateway && isPaymentConfigured;

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
             {product.stock === 0 && (
               <p className={styles.stockStatusOutOfStock}>AGOTADO*</p>
             )}
             {product.stock > 0 && product.stock <= 5 && (
               <p className={styles.stockStatusLowStock}>Quedan {product.stock} unidades</p>
             )}
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
            hasPaymentGateway={paymentsEnabled}
            culqiPublicKey={culqiPublicKey || entitlements.culqiPublicKey}
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
      <section className={styles.purchaseProcessSection}>
        <h2 className={styles.purchaseProcessTitle}>¿Cómo comprar?</h2>
        <div className={styles.processSteps}>
          {paymentsEnabled ? (
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
