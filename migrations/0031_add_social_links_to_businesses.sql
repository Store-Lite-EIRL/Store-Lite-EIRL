-- Migration: 0031_add_social_links_to_businesses
-- Description: Agrega columna social_links (jsonb) para redes sociales del negocio

ALTER TABLE businesses
  ADD COLUMN social_links jsonb DEFAULT '{}';
