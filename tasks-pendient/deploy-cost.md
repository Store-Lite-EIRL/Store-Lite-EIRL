# Deploy Cost Assessment

## Resumen ejecutivo

Costo base serio para llevar este proyecto a producci�n hoy:

- **Vercel Pro**: ~**S/ 68.4/mes**
- **Supabase Pro**: ~**S/ 85.5/mes**
- **Total fijo base**: **~S/ 154/mes**
- **Dominio**: aprox **S/ 40�70/a�o**
- **Culqi**: comisi�n variable por transacci�n

> Recomendaci�n pr�ctica inicial: **presupuestar entre S/ 160 y S/ 180 mensuales** para una primera producci�n razonable.

---

## Estado real del proyecto

El proyecto **todav�a no est� listo para producci�n comercial completa**, aunque s� tiene una base t�cnica seria.

### Hallazgos principales

1. **Las suscripciones SaaS siguen mockeadas**
   - Archivo: `app/pricing/actions.ts`
   - Se crean `mockSubscriptionId` y `mockCustomerId`
   - En producci�n devuelve: `La activacion requiere verificacion de pago`
   - Implicancia: todav�a no se pueden cobrar planes de negocio de forma real end-to-end.

2. **El cobro al comprador s� tiene integraci�n real con Culqi**
   - Archivo: `app/[slug]/payment/actions/paymentActions.ts`
   - Incluye reserva de stock, cargo real y registro del pago.

3. **La UI promete m�s de lo que el backend soporta hoy**
   - La UI muestra **Plin**
   - Pero el backend tipa `PaymentMethod = 'card' | 'yape'`
   - Implicancia: Plin no est� cerrado de punta a punta.

4. **Los entitlements por plan no est�n endurecidos en todos los flujos server-side**
   - Base central: `src/core/entitlements/plans.ts`
   - Hay l�mites/flags en UI y contexto, pero no todos los flujos cr�ticos est�n protegidos consistentemente desde server actions.

5. **No se observ� suite de tests automatizados ni observabilidad real**
   - En `package.json` no hay scripts de test
   - Eso aumenta el riesgo operativo en producci�n.

---

## Qu� tipo de producto es hoy

Este proyecto funciona como:

- **SaaS multi-tenant para negocios**
- **Storefront por negocio**
- **Cat�logo de productos**
- **Pagos con Culqi**
- **Chat con clientes**
- **Gesti�n de productos**
- **Planes de suscripci�n**

### Tipos de usuarios relevantes

1. **Due�os y equipos de negocios**
   - impactan auth, DB, panel y permisos

2. **Compradores invitados**
   - impactan tr�fico, im�genes, lectura de cat�logo y pagos

Esto importa porque el costo no escala solo por usuarios autenticados.

---

## Escenarios de inversi�n vs usuarios

### 1. MVP serio

**Costo estimado:** **S/ 155�160/mes**

Incluye:

- Vercel Pro
- Supabase Pro
- dominio aparte

Escala estimada razonable:

- **10�30 negocios activos**
- **3,000�15,000 visitantes/mes**
- cat�logos medianos
- pagos reales con volumen bajo/medio
- chat liviano

---

### 2. Crecimiento inicial

**Costo estimado:** **S/ 170�180/mes**

Incluye:

- Vercel Pro
- Supabase Pro
- upgrade de compute en Supabase a **Small** si empieza a crecer la carga

Escala estimada:

- **30�80 negocios**
- **15,000�50,000 visitantes/mes**
- m�s operaciones de panel, productos, chat y pagos

---

### 3. Escala media

**Costo estimado:** **S/ 325�500/mes**

Incluye:

- Vercel Pro
- Supabase con compute **Medium o Large**
- posibles overages de egress/storage

Escala estimada:

- **80�200 negocios**
- **50,000�150,000 visitantes/mes**
- tr�fico importante de im�genes
- m�s concurrencia y consultas pesadas

---

## �Hace falta pagar m�s memoria en Supabase desde el inicio?

**No.**

Recomendaci�n:

- empezar con **Supabase Pro**
- subir compute reci�n cuando haya se�ales reales de carga:
  - CPU alta sostenida
  - queries lentas
  - crecimiento real de negocios activos
  - m�s chat/pagos concurrentes

---

## Comisi�n variable por ventas

Referencia verificada de mercado para Culqi:

- alrededor de **3.44%** por transacci�n online
- **+ US$ 0.20 fijos por operaci�n**
- tarifas publicadas sin IGV

### Ejemplo aproximado

Venta de **S/ 100**:

- 3.44% = **S/ 3.44**
- fijo = **~S/ 0.68**
- subtotal = **S/ 4.12**
- m�s IGV sobre comisi�n

Resultado pr�ctico aproximado:

- costo total por venta de S/ 100: **~S/ 4.8�4.9**

---

## Presupuesto recomendado

### Para beta paga controlada

- **S/ 160�180/mes**

### Para producci�n comercial con margen operativo

- **S/ 180�350/mes**

---

## Riesgos antes de producci�n comercial

### Debe resolverse antes de vender seriamente

1. integrar cobro real de planes SaaS
2. endurecer entitlements server-side
3. alinear UI y backend en m�todos de pago
4. agregar observabilidad y alertas
5. incorporar testing m�nimo cr�tico
6. revisar manejo de fraude, reintentos y webhooks

---

## Veredicto final

- **Deployable:** s�
- **Listo para vender a escala comercial:** todav�a no
- **Costo m�nimo serio para arrancar:** **~S/ 160/mes**
- **Costo recomendado con margen:** **S/ 180�250/mes**

---

## Fuentes verificadas

- Vercel pricing: https://vercel.com/pricing
- Vercel Pro docs: https://vercel.com/docs/plans/pro-plan
- Supabase billing: https://supabase.com/docs/guides/platform/billing-on-supabase
- Supabase compute: https://supabase.com/docs/guides/platform/manage-your-usage/compute
- Supabase storage pricing: https://supabase.com/docs/guides/storage/pricing
- Culqi tarifas: https://culqi.com/
- Tipo de cambio USD/PEN: https://wise.com/us/currency-converter/usd-to-pen-rate
