# Sistema de Autenticación con Google OAuth

Este proyecto implementa un sistema de autenticación completo utilizando Supabase con Google OAuth.

## 🛠️ Configuración Requerida

### 1. Variables de Entorno

Asegúrate de tener las siguientes variables en tu archivo `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=tu_supabase_publishable_key
```

### 2. Configuración en Supabase Dashboard

1. Ve a **Authentication** -> **Providers**
2. Habilita **Google**
3. Configura el **Client ID** y **Client Secret** (obtenidos de Google Cloud Console)
4. En Google Cloud Console, añade la URL de redirección: `https://<tu-proyecto>.supabase.co/auth/v1/callback`

## 📦 Componentes Principales

### AuthProvider

El proveedor de contexto que maneja el estado global de la autenticación. Envuelve la aplicación en `app/layout.tsx`.

```tsx
// app/layout.tsx
import { AuthProvider } from '@/features/auth';

export default function RootLayout({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
```

### useAuth Hook

Hook personalizado para acceder al usuario y controlar la sesión.

```tsx
import { useAuth } from '@/features/auth';

export function MyComponent() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  if (loading) return <div>Cargando...</div>;

  if (user) {
    return (
      <div>
        Hola, {user.email}
        <button onClick={signOut}>Cerrar Sesión</button>
      </div>
    );
  }

  return <button onClick={signInWithGoogle}>Iniciar Sesión</button>;
}
```

### GoogleSignInButton

Componente pre-estilizado con Material Design 3 para el inicio de sesión.

```tsx
import { GoogleSignInButton } from '@/features/auth';

export function LoginPage() {
  return <GoogleSignInButton />;
}
```

## 🔒 Protección de Rutas

El sistema utiliza Middleware de Next.js para proteger rutas automáticamente.

- **Rutas Públicas**: `/auth`, `/auth/*`, archivos estáticos, imágenes
- **Rutas Protegidas**: Todas las demás rutas

Si un usuario no autenticado intenta acceder a una ruta protegida, será redirigido a `/auth`.
Si un usuario autenticado intenta acceder a `/auth`, será redirigido a `/`.

## 🗄️ Base de Datos

El sistema sincroniza automáticamente los usuarios de `auth.users` con una tabla pública `profiles`.

### Tabla `profiles`

| Campo         | Tipo | Descripción                     |
| ------------- | ---- | ------------------------------- |
| `id`          | uuid | FK a `auth.users.id`            |
| `email`       | text | Email del usuario               |
| `full_name`   | text | Nombre completo                 |
| `avatar_url`  | text | URL de la foto de perfil        |
| `provider_id` | text | Proveedor de identidad (google) |

## 🚀 Flujo de Autenticación

1. Usuario hace clic en "Continuar con Google"
2. Redirección a Google para consentimiento
3. Google redirige a `/auth/callback` con un código
4. Route Handler intercambia código por sesión
5. Route Handler crea/actualiza el perfil en base de datos
6. Redirección a la página principal `/`

## ⚠️ Solución de Problemas

### Error: "Missing Supabase environment variables"

Asegúrate de que `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` están definidos correctamente. Reinicia el servidor de desarrollo después de cambiar `.env`.

### Bucle de Redirección

Si experimentas un bucle de redirección entre `/` y `/auth`:

1. Borra las cookies del navegador (específicamente las de Supabase)
2. Verifica que las credenciales de Supabase sean correctas
3. Revisa los logs del middleware

### El usuario no se guarda en `profiles`

El trigger automático o el código en `/auth/callback` podría estar fallando. Revisa los logs de Supabase o la consola del servidor.
