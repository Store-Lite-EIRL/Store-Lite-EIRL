-- Seed: saas_issuer_config (singleton id = 1)
-- Datos fiscales del emisor SaaS (persona natural con negocio).
-- Aplica en DEV y PROD. Idempotente (ON CONFLICT DO NOTHING).
INSERT INTO "saas_issuer_config" (
	"id",
	"ruc",
	"razon_social",
	"direccion",
	"distrito",
	"provincia",
	"departamento",
	"ubigeo",
	"igv_rate",
	"updated_at"
) VALUES (
	1,
	'10741399852',
	'MAMANI TACORA ERNESTO ALONSO',
	'ASC. CIUDAD DE DIOS ZN. 4 COM',
	'YURA',
	'AREQUIPA',
	'AREQUIPA',
	'040128',
	0.18,
	now()
)
ON CONFLICT ("id") DO NOTHING;