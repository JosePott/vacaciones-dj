# Vacaciones DJ

Pequena app de gestion de vacaciones, dias libres y turnos construida con Next.js + Prisma (SQLite). Este README resume el flujo de setup y los comandos claves.

## Requisitos rapidos
- Node 20+
- npm (usado en los scripts)  
- SQLite (se usa un archivo `dev.db` en la raiz)

## Setup y variables de entorno
1) Instala dependencias:
```bash
npm install
```
2) Copia `.env.example` a `.env` y define al menos:
```
SESSION_SECRET="cambia-esta-clave"
DATABASE_URL="file:./dev.db"
```
   El `prisma.config.ts` ya apunta a `dev.db` en la raiz para desarrollo.

Variables opcionales para correos con Gmail SMTP:
```
MAIL_PROVIDER="gmail"
GMAIL_USER="tu-correo@gmail.com"
GMAIL_APP_PASSWORD="contraseña-de-aplicacion"
MAIL_FROM="Gestion de equipo DJ <tu-correo@gmail.com>"
APP_BASE_URL="http://localhost:3000"
HR_NOTIFICATION_EMAILS="correo-hr@ejemplo.com"
```
`HR_NOTIFICATION_EMAILS` acepta varios correos separados por coma. Si esta variable existe, se usa como lista fija para HR; si no existe, la app notifica a los usuarios con rol `HR`.

Tambien se puede usar Resend configurando `MAIL_PROVIDER="resend"` y `RESEND_API_KEY`.

## Migrar base de datos
```bash
npx prisma migrate dev --config ./prisma.config.ts --name init
```
Esto genera el archivo `dev.db` (si no existe) y aplica las migraciones en `prisma/migrations`.

## Poblar datos de demo (seed)
```bash
npm run prisma:seed
```
Inserta usuarios de demostracion y algunas solicitudes para desarrollo local. Cambia estas credenciales antes de usar la app con datos reales.

## Correr en desarrollo
```bash
npm run dev
```
La app queda en http://localhost:3000. Usa el middleware para redirigir segun rol.

## Lint
```bash
npm run lint
```
Ejecuta eslint con la configuracion de Next. Debe pasar antes de subir cambios.

## Prisma Studio
```bash
npx prisma studio --config ./prisma.config.ts
```
Abre una UI web para revisar/editar datos en `dev.db`.

## Prueba manual anti-timezone
1) Ingresa como un usuario con rol EMPLOYEE.
2) Crea una solicitud en `/my-requests/new` seleccionando `09/03/2026` a `13/03/2026`.
3) Confirma que:
   - En la tabla de “Mis solicitudes” se muestre `09-03-2026 – 13-03-2026`.
   - En `/calendar` y `/requests` aparezca el mismo rango.
   - En la base `dev.db` (tabla `LeaveRequest`) los campos `startDate` y `endDate` queden exactamente como strings `2026-03-09` y `2026-03-13`.

## Estructura de carpetas
- `app/` paginas y acciones del lado del servidor.
- `components/` UI reutilizable.
- `lib/` utilidades compartidas (prisma, sesion, rbac, fechas).
- `schemas/` validaciones Zod centralizadas.
- `prisma/` esquema, migraciones y seed.
- `public/` assets estaticos.
