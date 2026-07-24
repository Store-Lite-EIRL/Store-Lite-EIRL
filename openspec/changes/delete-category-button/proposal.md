# Proposal: Delete Category Button

## Intent

Sellers currently have no way to delete individual categories from the storage panel. The only path is bulk-sync (remove from list and sync), which is unintuitive and error-prone. A dedicated delete button with confirmation gives sellers direct control over category cleanup.

## Scope

### In Scope

- New `deleteCategory(slug, categoryId)` server action
- Delete button in CategorySection (seller panel), shown when a category is selected
- Confirmation dialog before deletion
- Category removed from dropdowns, filters, and context after deletion
- Authorization via existing `categories.delete` permission

### Out of Scope

- DB schema changes (none needed — `onDelete: 'set null'` already on `products.categoryId`)
- Storefront category deletion (home page)
- Bulk delete operations
- Category management page / dedicated settings UI

## Capabilities

### New Capabilities

- `product-categories`: Add `delete` operation to the existing CRUD surface for categories in the seller panel

### Modified Capabilities

- None

## Approach

**Server** — Add `deleteCategory(slug, categoryId)` in `app/[slug]/storage/actions/categories.ts`:

- `requireAccess(slug, 'categories.delete')` (permission already defined)
- `db.delete(productCategories).where(and(eq(id, categoryId), eq(businessId, id)))`
- `revalidatePath` for both `/{slug}` and `/{slug}/storage`
- Returns `{ success, error }`

**Client data** — Extend `getProductCategories` to return `{ id, name }[]` instead of `string[]`. Update `StorageContext.categories` type and `useStorageProducts` state accordingly. This gives the frontend stable IDs for deletion.

**UI** — In `CategorySection.tsx`:

- Add a delete (trash) icon button next to the existing add button, visible only when a category is selected
- Click opens a confirmation dialog (lightweight, inline or md-dialog)
- On confirm → call `deleteCategory` → `refreshCategories()` → reset selection if deleted

## Affected Areas

| Area                                                              | Impact   | Description                                                 |
| ----------------------------------------------------------------- | -------- | ----------------------------------------------------------- |
| `app/[slug]/storage/actions/categories.ts`                        | Modified | Add `deleteCategory` action                                 |
| `app/[slug]/storage/hooks/useStorageProducts.ts`                  | Modified | Extend categories type to `{id, name}[]`, add delete helper |
| `app/[slug]/storage/context/StorageContext.tsx`                   | Modified | Update `categories` type, expose `deleteCategory`           |
| `app/[slug]/storage/components/createProduct/CategorySection.tsx` | Modified | Add delete button + confirmation                            |
| Storage filter dropdown (products table)                          | Modified | Adapt to `{id, name}[]` categories                          |

## Risks

| Risk                             | Likelihood | Mitigation                                                |
| -------------------------------- | ---------- | --------------------------------------------------------- |
| Products lose category reference | Low        | DB already has `onDelete: 'set null'` — expected behavior |
| Accidental deletion              | Low        | Confirmation dialog before action                         |
| Permission mismatch              | Low        | `categories.delete` already defined in permission set     |

## Rollback Plan

1. Remove `deleteCategory` from actions file
2. Revert categories type back to `string[]` in context/hook
3. Remove delete button from CategorySection

## Dependencies

- None (no new packages, no migrations)

## Success Criteria

- [ ] Seller can delete a category with 2 clicks (select → trash → confirm)
- [ ] Deleted category disappears from dropdowns and filters immediately
- [ ] Products with that category show null category after refresh
- [ ] User without `categories.delete` permission gets auth error
