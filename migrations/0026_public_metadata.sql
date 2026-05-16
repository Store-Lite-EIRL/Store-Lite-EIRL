-- =====================================================
-- MIGRATION: 0026_public_metadata
-- =====================================================
-- Description: No schema changes. Documents the _public
-- convention used inside products.metadata JSONB to
-- control visibility of extra fields on the storefront.
-- =====================================================
--
-- The products.metadata JSONB column now supports a reserved
-- key "_public" that is an array of metadata key names
-- visible to the public (storefront).
--
-- Example:
--   {
--     "color": "rojo",
--     "talle": "M",
--     "_public": ["color", "talle"]
--   }
--
-- Backward compatibility: if _public is not present, all
-- metadata keys are considered public.
--
-- No DDL changes needed — the metadata column is already
-- JSONB (see schema.ts line 402).
--
-- =====================================================

COMMENT ON COLUMN products.metadata IS 'Almacena campos extra del producto como JSONB. La clave reservada _public contiene un array de keys visibles al público en el storefront.';

-- =====================================================
