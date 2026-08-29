# Design: Culqi Readiness Check

## Technical Approach

Replace the static HTML checklist (lines 216–290 in `PaymentsConfig.tsx`) with a dynamic server-action-backed validation system. A new server action `checkCulqiReadiness` queries the database for 9 Culqi production requirements and returns a structured result. A new `CulqiReadinessCheck` client component fetches this result on mount, renders per-check status with icons, a progress bar, and conditionally enables the "Send to Culqi" button.

## Architecture Diagram

```
PaymentsConfig.tsx (Client)
  │
  ├─► CulqiReadinessCheck.tsx (Client)
  │     │
  │     ├─► checkCulqiReadiness() server action
  │     │     │
  │     │     ├─► businesses table (email, address, social_links)
  │     │     ├─► business_settings table (preferences JSONB)
  │     │     ├─► products table (COUNT, description, price)
  │     │     └─► product_media table (product images)
  │     │
  │     └─► renders: skeleton → progress bar + check list → button
  │
  └─► existing Culqi credentials dialog (unchanged)
```

## Architecture Decisions

### Decision: Server Action vs API Route

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Server Action (`'use server'`) | Zero config, RPC-style, auto-serialization, same pattern as `updateCulqiCredentials` | **Chosen** — matches existing `actions.ts` pattern exactly |
| API Route (`/api/culqi-readiness`) | Explicit HTTP contract, cacheable with `fetch`, more boilerplate | Rejected — unnecessary for internal-only validation |

### Decision: Validation Function Location

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Standalone file `src/features/settings/actions/culqiReadiness.ts` | Clean separation, testable independently, follows `src/features/*/actions.ts` pattern | **Chosen** |
| Inline in `app/[slug]/(app)/settings/actions.ts` | Fewer files, co-located with other settings actions | Rejected — file already 648 lines; adding 100+ more hurts readability |
| Shared utility `src/core/` | Reusable across features | Rejected — Culqi readiness is settings-specific, not core domain |

### Decision: Check Execution Strategy

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Independent checks (each runs even if others fail) | Full picture on every call; slightly more DB work | **Chosen** — spec requires "don't fail fast" |
| Fail-fast on first missing entity | Faster on empty businesses | Rejected — user needs ALL failing checks to fix them |

### Decision: Client Component Boundary

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `CulqiReadinessCheck` as separate client component | Encapsulated state, testable in isolation, composable | **Chosen** |
| Inline in `PaymentsConfig.tsx` | Fewer files | Rejected — `PaymentsConfig.tsx` is already 527 lines; separation improves maintainability |

## Data Flow

```
User opens Settings → Payments tab
  │
  ▼
PaymentsConfig mounts (server component passes business prop)
  │
  ▼
CulqiReadinessCheck mounts (useEffect triggers)
  │
  ▼
checkCulqiReadiness(business.id) server action called
  │
  ├──→ SELECT COUNT(*) FROM products WHERE business_id = ? AND is_available = true
  ├──→ SELECT product_id, COUNT(*) FROM product_media WHERE product_id IN (available products)
  ├──→ SELECT description, price FROM products WHERE business_id = ? AND is_available = true
  ├──→ SELECT email, address, social_links FROM businesses WHERE id = ?
  └──→ SELECT preferences->'terms', preferences->'returns', preferences->'complaintsEnabled' FROM business_settings WHERE business_id = ?
  │
  ▼
Returns { ready: boolean, passedCount: number, checks: CheckResult[] }
  │
  ▼
Component state updates → renders progress bar + check list + button
  │
  ▼
After credential save → router.refresh() → CulqiReadinessCheck re-fetches
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/features/settings/actions/culqiReadiness.ts` | **Create** | Server action with `checkCulqiReadiness(businessId)` — queries 9 checks independently, returns structured result |
| `app/[slug]/(app)/settings/components/CulqiReadinessCheck.tsx` | **Create** | Client component — calls server action on mount, renders skeleton → progress bar → check list → button |
| `app/[slug]/(app)/settings/components/PaymentsConfig.tsx` | **Modify** | Replace static checklist (lines 216–290) with `<CulqiReadinessCheck businessId={business.id} />`; add `router.refresh()` after credential save to trigger re-fetch |

## Interfaces / Contracts

### Server Action Return Type

```typescript
export interface CheckResult {
  id: string;
  label: string;
  passed: boolean;
  message: string;
}

export interface ReadinessResult {
  ready: boolean;
  passedCount: number;
  checks: CheckResult[];
}
```

### Server Action Signature

```typescript
'use server';

export async function checkCulqiReadiness(
  businessId: string,
): Promise<ReadinessResult>
```

### Component Props

> **Note (accepted deviation)**: Implementation passes only `businessId` instead of the full business object. The server action fetches all required data itself, so the component needs nothing else. This reduces prop drilling and keeps the client thin.

```typescript
interface CulqiReadinessCheckProps {
  businessId: string;
}
```

## Component Structure

```
CulqiReadinessCheck
├── Loading state: Skeleton (pulsing placeholders matching final layout)
├── Ready state:
│   ├── Progress bar ("X de 9 requisitos cumplidos")
│   ├── Check list (9 items):
│   │   ├── Icon (check_circle / cancel)
│   │   ├── Label
│   │   └── Message (shown only when failed, with action hint)
│   └── Button ("Solicitar aprobación Culqi")
│       ├── Enabled: ready === true
│       └── Disabled + tooltip: ready === false, shows missing count
└── Error state: Retry prompt (server action failed)
```

### UI Components Used (from `@/shared/components/ui`)

- `Icon` — `check_circle` (pass), `cancel` (fail), `hourglass_empty` (loading)
- `LinearProgress` — progress bar (value = passedCount / 9)
- `Button` — "Solicitar aprobación Culqi" (disabled when not ready)
- `Card` — container wrapper (consistent with existing PaymentsConfig)

## Error Handling

| Scenario | Handling |
|----------|----------|
| Server action throws (DB down, auth failure) | Component shows error state with retry button; does NOT crash PaymentsConfig |
| Business not found | Server action returns `{ ready: false, checks: [...] }` with all checks failing |
| Empty preferences object | Each preference check fails gracefully (null/undefined checks) |
| Missing products table data | `product_count` returns count=0; other product checks return failing with correct counts |

## Performance Considerations

| Concern | Approach |
|---------|----------|
| Query count | Single server action call; Drizzle queries are independent but run in parallel via `Promise.all` where possible |
| Caching | No explicit cache — `router.refresh()` after credential save triggers fresh fetch; component re-mount on tab switch is acceptable |
| Debouncing | Not needed — validation runs once on mount and after explicit mutations (credential save triggers `router.refresh`) |
| Bundle size | `CulqiReadinessCheck` is a client component — lazy-loaded only when Payments tab is active (existing code-splitting via dynamic imports) |
| DB indexes | All queried columns already indexed (`business_id` on products, product_media, business_settings) |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `checkCulqiReadiness` logic per check (mock DB) | Vitest — mock `db` queries, verify each check's pass/fail condition |
| Unit | `CulqiReadinessCheck` component rendering states | Vitest + @testing-library/react — mock server action, test loading/results/error states |
| Integration | Full flow: PaymentsConfig → CulqiReadinessCheck → server action | @testing-library/react — mock `checkCulqiReadiness`, verify UI updates |
| E2E | User sees accurate readiness status | Playwright — create business with partial data, verify check results |

## Migration / Rollout

No database migration required. All data already exists in `businesses`, `business_settings`, `products`, and `product_media` tables. Rollback is a code revert to restore the static HTML checklist.

## Plan Gating (Decision — follow-up)

- `CulqiReadinessCheck` is rendered for **all plans** (including non-premium), BEFORE the credentials section.
  - Non-premium: readiness panel + "Pasarela de pagos premium" upgrade banner. No credentials UI.
  - The approval button is disabled for non-premium via `interactive={false}` with tooltip "Disponible en planes Business Pro o superior."
- Credentials/tokens UI ("Configurar Culqi" dialog, keys list, connect status) is **premium-only** (`business_pro` / `enterprise_pro`).
- Fix: readiness panel was previously nested inside `isConfigured` — it now always renders, even before keys are set.

## Open Questions

- [x] Should the "Send to Culqi" button trigger a separate action or just open a link to Culqi panel? → **RESOLVED**: opens `https://afiliate.culqi.com` in a new tab (`noopener,noreferrer`) when `ready && interactive` (premium). Disabled with explanatory tooltip otherwise.
- [ ] Should `CulqiReadinessCheck` also re-validate when product count changes (e.g., after creating/deleting products from storage)?

## Disclosure (Decision — follow-up)

- `/pricing` shows a "Sobre los pagos con Culqi" note: what Culqi is, included in Business Pro/Enterprise Pro, and the independent validation warning (1–3 business days) so plan duration isn't misleading.
- Settings → Pagos shows a "¿Qué es Culqi?" card for all plans with the same validation warning.
- Next milestone (pending): validate Culqi readiness at plan purchase time so sellers prepare before subscribing.
