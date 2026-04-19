/**
 * =====================================================
 * API: POST /api/payment/charge
 * Backend: Crear cargo (charge) en Culqi y guardar payment
 * =====================================================
 */

import { NextResponse } from 'next/server';

import { db } from '@/core/database/client';
import { businesses, businessSettings, payments, products } from '@/core/database/schema';
import { eq } from 'drizzle-orm';

interface ChargeRequestBody {
  // Token generado por Culqi Checkout (frontend)
  token: string; // e.g., "ype_test_xxx" o "tkn_test_xxx"
  
  // Datos del pedido
  amount: number; // En céntimos (ej: 610 = S/ 6.10)
  currency?: string;
  email: string;
  phone?: string;
  
  // Referencias
  businessId: string;
  productId: string;
  
  // Metadata opcional
  metadata?: Record<string, unknown>;
}

interface CulqiChargeResponse {
  object: string;
  id: string;
  amount: number;
  currency_code: string;
  email: string;
  status: string;
  description?: string;
  reference_code?: string;
  metadata?: Record<string, unknown>;
  creation_date?: number;
}

export async function POST(request: Request) {
  try {
    const body: ChargeRequestBody = await request.json();
    
    console.log('[payment/charge] Received body:', JSON.stringify(body, null, 2));
    
    // Validar campos requeridos
    const { token, amount, email, businessId, productId, currency = 'PEN', phone, metadata } = body;
    
    console.log('[payment/charge] Validating - token:', token, 'amount:', amount, 'email:', email, 'businessId:', businessId, 'productId:', productId);
    
    // Email es opcional para Yape pero requerido para tarjeta
    if (!token || !amount || !businessId || !productId) {
      console.error('[payment/charge] Missing fields:', { token: !!token, amount: !!amount, businessId: !!businessId, productId: !!productId });
      return NextResponse.json(
        { error: 'Faltan campos requeridos: token, amount, businessId, productId', received: { token, amount, email, businessId, productId } },
        { status: 400 }
      );
    }

    // Si es payment con tarjeta y no hay email, usar email del token de Culqi
    const finalEmail = email || 'cliente@culqi.com';

    // 1. Obtener las credenciales de Culqi del negocio
    const settings = await db.query.businessSettings.findFirst({
      where: eq(businessSettings.businessId, businessId),
      columns: { culqiSecretKey: true },
    });

    console.log('[payment/charge] Settings for business:', businessId, settings ? 'found' : 'not found');

    if (!settings?.culqiSecretKey) {
      return NextResponse.json(
        { error: 'El negocio no tiene configurada la pasarela de pagos' },
        { status: 400 }
      );
    }

    const culqiSecretKey = settings.culqiSecretKey;

    // 2. Obtener info del producto y el owner del negocio
    const [product, business] = await Promise.all([
      db.query.products.findFirst({
        where: eq(products.id, productId),
        columns: { title: true, businessId: true },
      }),
      db.query.businesses.findFirst({
        where: eq(businesses.id, businessId),
        columns: { ownerId: true },
      }),
    ]);

    console.log('[payment/charge] Product:', product);
    console.log('[payment/charge] Business owner:', business?.ownerId);

    if (!business?.ownerId) {
      return NextResponse.json(
        { error: 'No se pudo obtener el propietario del negocio' },
        { status: 400 }
      );
    }

    // 3. Crear el cargo en Culqi
    const culqiResponse = await fetch('https://api.culqi.com/v2/charges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${culqiSecretKey}`,
      },
      body: JSON.stringify({
        amount: amount,
        currency_code: currency,
        email: finalEmail,
        source_id: token, // El token generado en el frontend
        description: `Compra: ${product?.title || 'Producto'} - Tienda Online`,
        metadata: {
          ...metadata,
          businessId,
          productId,
          platform: 'store-lite',
        },
      }),
    });

    const culqiData: CulqiChargeResponse = await culqiResponse.json();

    if (!culqiResponse.ok) {
      console.error('[payment/charge] Culqi error status:', culqiResponse.status);
      console.error('[payment/charge] Culqi error data:', JSON.stringify(culqiData, null, 2));
      return NextResponse.json(
        { 
          error: 'Error al procesar el pago en Culqi',
          details: culqiData?.message || culqiData?.user_message || 'Error desconocido de Culqi',
          raw: culqiData
        },
        { status: culqiResponse.status }
      );
    }

    // 4. Determinar método de pago basado en el token
    const paymentMethod = token.startsWith('ype_') ? 'yape' : token.startsWith('tkn_') ? 'card' : 'card';
    
     // 5. Guardar el payment en la base de datos
     const metadata = body.metadata || {};
     const shippingInfo = (metadata.shippingInfo as any) || {};
     
     // Mapear courier a shippingType enum
     const shippingType = shippingInfo.courier === 'urbano_domicilio' ? 'domicilio' : 'agencia';

     const payment = await db.insert(payments).values({
       businessId,
       productId,
       sellerUserId: business.ownerId, 
       amount: String(amount / 100), 
       currency,
       paymentMethod,
       culqiChargeId: culqiData.id,
       culqiReferenceCode: culqiData.reference_code || null,
       buyerEmail: finalEmail,
       buyerPhone: phone || null,
       status: culqiData.status === 'paid' ? 'paid' : 'pending',
       // Nuevos campos estructurados
       orderNumber: metadata.orderNumber as string,
       shippingType,
       shippingDepartment: shippingInfo.department,
       shippingProvince: shippingInfo.province,
       shippingDistrict: shippingInfo.district,
       shippingAddress: shippingInfo.address,
       shippingAgency: shippingInfo.agency,
       shippingReference: shippingInfo.reference,
       shippingPhone: shippingInfo.phone || phone,
       shippingCost: String(shippingInfo.cost || 0),
       metadata: {
         ...metadata,
         culqiResponse: {
           id: culqiData.id,
           createdAt: culqiData.creation_date,
         },
       },
     }).returning();

     console.log('[payment/charge] Payment created:', payment[0]?.id);

     // 6. Actualizar el stock del producto (decrementar en 1) si el pago fue exitoso
     if (culqiData.status === 'paid') {
       try {
         const result = await db
           .update(products)
           .set({ stock: products.stock - 1 })
           .where(eq(products.id, productId))
           .returning();
         
         console.log('[payment/charge] Stock updated for product:', productId, 'New stock:', result[0]?.stock);
       } catch (error) {
         console.error('[payment/charge] Error updating stock:', error);
         // No fallamos el pago por un error en la actualización de stock
         // Pero al menos lo loggeamos
       }
     } else {
       console.log('[payment/charge] Payment not successful, skipping stock update. Status:', culqiData.status);
     }

     return NextResponse.json({
       success: true,
       payment: payment[0],
       charge: {
         id: culqiData.id,
         status: culqiData.status,
         referenceCode: culqiData.reference_code,
       },
     });

  } catch (error) {
    console.error('[payment/charge] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}