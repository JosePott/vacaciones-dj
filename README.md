# Vacaciones DJ — gestión de vacaciones y turnos

Aplicación web para centralizar la gestión de vacaciones, días libres y turnos de un equipo, construida con Next.js, TypeScript, Prisma y PostgreSQL.

[Acceder a la aplicación](https://vacaciones-dj.vercel.app)

## Qué encontrarás

- Vistas para empleados, solicitudes, calendario y planificación de turnos.
- Acceso con sesión y flujos para empleados y recursos humanos.
- Notificaciones por correo configurables con Gmail SMTP o Resend.
- Persistencia con PostgreSQL y migraciones mediante Prisma.

## Recorrido del proyecto

El código se organiza alrededor de la consulta y gestión de solicitudes y turnos. Las páginas están en `app/`, las acciones del servidor en `app/actions/` y las utilidades compartidas en `lib/`.

Para explorar el proyecto con tu propia configuración, sigue la instalación local y crea el primer usuario HR con el seed descrito abajo. El acceso al despliegue puede requerir una cuenta.

## Tecnologías

Next.js · React · TypeScript · Tailwind CSS · Prisma · PostgreSQL · Vitest


## Requisitos

- Node 20+
- npm
- Una base PostgreSQL. Para deploy gratis se recomienda Neon.

## Setup local

1. Instala dependencias:

```bash
npm install
```

2. Copia `.env.example` a `.env` y define:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
SESSION_SECRET="cambia-esta-clave"
APP_BASE_URL="http://localhost:3000"
```

3. Aplica migraciones:

```bash
npx prisma migrate deploy --config ./prisma.config.ts
```

4. Opcionalmente crea el primer usuario HR definiendo estas variables en `.env`:

```env
INITIAL_HR_EMAIL="correo@empresa.cl"
INITIAL_HR_PASSWORD="una-contrasena-segura"
```

Luego ejecuta:

```bash
npm run prisma:seed
```

El seed tambien asegura que existan los turnos fijos T1, T2, T3, T4, T5 y T8.

## Correos

Para enviar correos con Gmail SMTP:

```env
MAIL_PROVIDER="gmail"
GMAIL_USER="tu-correo@gmail.com"
GMAIL_APP_PASSWORD="contrasena-de-aplicacion"
MAIL_FROM="Gestion de equipo DJ <tu-correo@gmail.com>"
HR_NOTIFICATION_EMAILS="correo-hr@ejemplo.com"
```

`HR_NOTIFICATION_EMAILS` acepta varios correos separados por coma. Si no existe, la app notifica a los usuarios con rol `HR`.

Tambien se puede usar Resend configurando:

```env
MAIL_PROVIDER="resend"
RESEND_API_KEY="..."
```

## Desarrollo

```bash
npm run dev
```

La app queda disponible en `http://localhost:3000`.

## Validacion

```bash
npm run lint
npm test
npm run build
```

El build ejecuta `prisma migrate deploy` antes de compilar Next.js, para que Vercel aplique las migraciones en produccion.

## Deploy gratis recomendado

1. Crear base de datos en Neon Free.
2. Importar este repositorio en Vercel.
3. Configurar las variables de entorno en Vercel.
4. Ejecutar deploy.
5. Correr `npm run prisma:seed` una vez con `INITIAL_HR_EMAIL` e `INITIAL_HR_PASSWORD` para crear el primer usuario HR.

## Carpetas principales

- `app/`: paginas y acciones del lado del servidor.
- `components/`: UI reutilizable.
- `lib/`: utilidades compartidas.
- `prisma/`: esquema, migraciones y seed.
- `public/`: assets estaticos.
