# ADR 0002: Uso de Material Design 3 (MD3)

**Status**: Accepted

## Contexto

Necesitábamos un sistema de diseño que fuera moderno, permitiera una personalización profunda (temas dinámicos) y fuera accesible.

## Decisión

Elegimos Material Design 3 (MD3) en lugar de TailwindCSS o Bootstrap para aprovechar el sistema de tokens dinámicos impulsado por Google. Esto permite que cada negocio en el SaaS tenga su propia identidad visual basada en colores semilla.

## Consecuencias

- **Positivas**: Interfaz premium, soporte nativo para Dynamic Color, jerarquía visual clara.
- **Negativas**: Mayor curva de aprendizaje que CSS tradicional, dependencia de la implementación de @material/web.
