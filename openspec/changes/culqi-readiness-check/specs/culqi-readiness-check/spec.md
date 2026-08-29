# Culqi Readiness Check Specification

## Purpose

Validate that a seller's store meets all 9 Culqi production requirements before requesting approval. Replaces the static HTML checklist in `PaymentsConfig.tsx` with real-time server-side validation.

## Requirements

### Requirement: Readiness Validation

The system MUST evaluate 9 Culqi production requirements against business data and return a structured readiness result with per-check status, labels, and actionable failure messages.

#### Check Definitions

| # | `id` | `label` | Pass Condition | Fail Message |
|---|------|---------|----------------|--------------|
| 1 | `product_count` | Mínimo 5 productos | `COUNT(products WHERE available=true) >= 5` | "Tenés {n} productos. Subí al menos {remaining} más." |
| 2 | `product_images` | Productos con imagen | Every available product has ≥1 row in `product_media` | "{n} producto(s) sin imagen." |
| 3 | `product_descriptions` | Productos con descripción | Every product: `description IS NOT NULL AND TRIM(description) != ''` | "{n} producto(s) sin descripción." |
| 4 | `product_prices` | Productos con precio | Every product: `price IS NOT NULL AND price > 0` | "{n} producto(s) sin precio válido." |
| 5 | `terms` | Términos y Condiciones publicados | `preferences->'terms' IS NOT NULL AND != ''` | "Publicá tus Términos y Condiciones en Configuración → Páginas legales." |
| 6 | `returns` | Políticas de Devoluciones publicadas | `preferences->'returns' IS NOT NULL AND != ''` | "Publicá tus Políticas de Devoluciones en Configuración → Páginas legales." |
| 7 | `complaints_book` | Libro de Reclamaciones activo | `complaintsEnabled = true OR complaintBookEnabled = true` | "Activá el Libro de Reclamaciones en Configuración → Páginas legales." |
| 8 | `contact_info` | Datos de contacto configurados | `email IS NOT NULL AND address IS NOT NULL` | "Completá email y dirección en Configuración → Datos del negocio." |
| 9 | `social_media` | Redes sociales configuradas | `social_links IS NOT NULL AND jsonb_object_length(social_links) > 0` | "Agregá al menos una red social en Configuración → Datos del negocio." |

#### Scenario: All 9 checks pass

- GIVEN a business meeting every requirement in the check table
- WHEN readiness validation runs
- THEN `ready = true`, `passedCount = 9`, all checks show `passed = true`

#### Scenario: Checks fail with zero products

- GIVEN a business with no products
- WHEN readiness validation runs
- THEN `product_count` fails with count=0 and message indicating 5 products needed

### Requirement: API Contract

The system SHALL expose a server action `getCulqiReadiness(businessId: string)`.

**Input**: `{ businessId: string }`

**Output**:
```typescript
{
  ready: boolean;
  passedCount: number;  // 0..9
  checks: {
    id: string;
    passed: boolean;
    label: string;
    message: string;
  }[];
}
```

#### Scenario: Valid businessId

- GIVEN a business exists with the given ID
- WHEN getCulqiReadiness is called
- THEN it returns the readiness object with 9 checks

### Requirement: UI Rendering

The PaymentsConfig component SHALL replace the static HTML checklist (lines 216–290) with a dynamic readiness component.

**States**:
- **Loading**: Skeleton/placeholder while validation runs
- **Results**: Each check shows ✅ (pass) or ❌ (fail) with label and message
- **Progress bar**: `"X de 9 requisitos cumplidos"` with visual fill
- **Button**: "Solicitar aprobación Culqi" — enabled only when `ready = true`; disabled otherwise with a message listing missing requirements

#### Scenario: Loading state

- GIVEN the component mounts
- WHEN getCulqiReadiness is in-flight
- THEN a loading indicator is shown instead of the checklist

#### Scenario: Mixed results

- GIVEN readiness result has `passedCount = 7`
- WHEN the checklist renders
- THEN 7 checks show ✅, 2 show ❌, progress bar shows "7 de 9"

#### Scenario: Button disabled when not ready

- GIVEN readiness result has `ready = false`
- WHEN the checklist renders
- THEN the button is disabled and a summary lists what's missing

**Data Model**: No changes. All required data exists in `businesses`, `business_settings`, `products`, `product_media`.
