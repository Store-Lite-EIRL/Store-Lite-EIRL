# Interface Patterns

## Direction and Feel
- Product area: owner-facing business management interface.
- Navigation should prioritize fast access to operational tools from the sidebar.

## Depth Strategy
- Keep existing project depth strategy and visual language (no forced restyle).

## Spacing Base Unit
- Keep current spacing scale already used by the navbar and app layout.

## Key Component Patterns
- Owner navbar items order:
  1. Inicio
  2. Mensajes
  3. Almacén
  4. Dashboard
  5. Ajustes
- Dashboard route is owner-only and lives at `/{slug}/dashboard`.
- Initial dashboard content can start minimal and iterate from there.
