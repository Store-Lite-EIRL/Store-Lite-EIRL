# Taskt - Colaboración de Equipo (Team Collaboration)

## Objetivo
Implementar la funcionalidad de equipo que permita a dueños de negocios (Plan Business Pro o superior) invitar a 2 usuarios adicionales a su espacio de trabajo mediante un código de invitación y el slug de la tienda.

## Plan de Acción

### Fase 1: Estructura de Datos
- [ ] Modificar `src/core/database/schema.ts` para agregar la tabla `business_team_members`.
- [ ] Agregar columna `join_code` a la tabla `businesses`.
- [ ] Ejecutar migraciones para reflejar los cambios en la base de datos.

### Fase 2: Lógica de Servidor (Server Actions)
- [ ] Crear `app/actions/team.ts` con las siguientes funciones:
    - [ ] `generateBusinessJoinCode`: Generar y guardar código aleatorio.
    - [ ] `joinBusinessTeam`: Lógica para validar slug + código e ingresar al equipo.
    - [ ] `getBusinessTeamMembers`: Obtener lista de integrantes activos.
    - [ ] `removeTeamMember`: Eliminar un integrante del equipo.

### Fase 3: Interfaz de Gestión (Settings)
- [ ] En `SettingsClient.tsx`, agregar la sección de "Equipo".
- [ ] Mostrar lista de miembros actuales.
- [ ] Mostrar y permitir regenerar el código de invitación.
- [ ] Restringir acceso según los `maxTeamMembers` del plan.

### Fase 4: Experiencia de Unión (Join Flow)
- [ ] Crear un componente/modal en el dashboard central para usuarios invitados.
- [ ] Formulario simple de 2 campos: Slug y Código.
- [ ] Feedback visual de éxito/error al unirse.

---

## Reglas de Oro
- Solo el dueño puede ver el código de invitación.
- Solo el dueño puede eliminar a otros miembros.
- El servidor siempre debe revalidar el límite de miembros del plan antes de aceptar una unión.
- El usuario invitado debe registrarse con Google previamente.

## Criticas y Refinamientos (Analisis)
- **Seguridad**: El código será regenerable. Si el dueño detecta algo sospechoso, genera uno nuevo y el anterior queda invalidado.
- **Flujo de Usuario**: En lugar de un botón en el login, usaremos un flujo post-login (onboarding) para mayor estabilidad con Supabase Auth.
