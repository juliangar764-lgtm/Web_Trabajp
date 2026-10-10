# Caberti

Tienda con catálogo, cuentas de cliente, pedidos por WhatsApp y panel de administración. Backend en **Node.js + Express** y base de datos **PostgreSQL**, organizado con el patrón **MVC**.

## Estructura

```text
├── src/
│   ├── server.js              Arranque del servidor (cierre ordenado)
│   ├── app.js                 Configuración de Express, seguridad y rutas
│   ├── config/                db.js (PostgreSQL) y env.js (variables de entorno)
│   ├── models/                M: consultas SQL y reglas de datos
│   ├── controllers/           C: validan la petición y llaman a los modelos
│   ├── routes/                api.routes.js (JSON) y page.routes.js (vistas)
│   ├── middlewares/           auth (sesiones), security (cabeceras, CSRF, límite de intentos), errores
│   ├── utils/                 Validaciones, contraseñas (scrypt) y HttpError
│   └── views/                 V: páginas HTML (públicas y admin/)
├── public/                    Archivos estáticos: css/, js/ y assets/ (fotos)
├── database/                  schema.sql, seed.sql, init.js y crear-admin.js
└── docs/                      Diagramas MER
```

## Puesta en marcha (local)

1. Instala Node.js 20.6 o superior y PostgreSQL.
2. Crea la base de datos: `createdb -U postgres caberti`
3. Copia `.env.example` a `.env` y completa `DATABASE_URL` (usuario y contraseña) y `WHATSAPP_NUMBER`.
4. `npm install`
5. `npm run db:init -- --seed` crea las tablas y carga datos de demostración. Sin `--seed` solo crea las tablas; **`--seed` reemplaza productos, categorías, pedidos e inventario** (no toca las cuentas). `npm run db:reset` borra todo, incluidas las cuentas, y vuelve a crear con datos de demostración.
6. Crea tu cuenta de administrador: `npm run admin:crear -- correo@dominio.com "Tu nombre"` (pide la contraseña sin mostrarla; si el correo ya existe, lo convierte en administrador y cambia su contraseña).
7. `npm run dev` y abre http://localhost:3000

## Cómo funciona la compra

1. El cliente explora el catálogo y arma su pedido (el carrito se guarda en su navegador).
2. Para enviarlo necesita una cuenta (`registro.html`) o iniciar sesión (`acceso.html`).
3. Al enviar, el pedido **se guarda en la base de datos** con los precios reales del catálogo y aparece en el panel.
4. Se abre un enlace `wa.me` al número `WHATSAPP_NUMBER` con el resumen ya escrito.
5. En el panel (`/admin`), el administrador confirma envío y estado; al confirmar se descuentan las existencias y al cancelar se devuelven.

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión de PostgreSQL (obligatoria) |
| `DATABASE_SSL` | `true` si el hosting exige SSL para la base de datos |
| `WHATSAPP_NUMBER` | Número de Caberti con lada, solo dígitos (p. ej. `529621234567`). Sin él, los botones de WhatsApp quedan desactivados |
| `NODE_ENV` | `production` en el hosting (cookies solo por HTTPS, HSTS, caché) |
| `PORT` | Lo asigna el hosting; por defecto 3000 |
| `SESSION_DAYS` | Duración de la sesión (7 por defecto) |
| `TRUST_PROXY` | Proxies delante de la app; 1 por defecto en producción |

## Publicar en un hosting

Necesitas un hosting que ejecute **Node.js** y ofrezca **PostgreSQL** (Render, Railway, Fly.io, un VPS, etc.). Un hosting compartido básico normalmente no sirve.

1. Sube el repositorio (el archivo `.env` **no** se sube: está en `.gitignore`).
2. Crea la base PostgreSQL y define las variables de la tabla anterior en el panel del hosting (`NODE_ENV=production`, `DATABASE_URL`, `DATABASE_SSL=true` si lo exige, `WHATSAPP_NUMBER`).
3. Comando de instalación `npm install` y de arranque `npm start`.
4. Una sola vez, desde la consola del hosting: `node database/init.js --seed` (o sin `--seed` para empezar vacío) y `ADMIN_PASSWORD=tu-clave node database/crear-admin.js correo@dominio.com "Tu nombre"`.
5. Configura la ruta de salud `/health` si el hosting la pide, y usa siempre HTTPS (el hosting lo suele dar).

Seguridad incluida: contraseñas con scrypt, sesiones con token aleatorio guardado como hash, cookie `HttpOnly` + `SameSite`, límite de intentos de acceso, verificación de origen en peticiones que modifican datos, cabeceras (CSP, nosniff, HSTS), consultas SQL parametrizadas y validación de todos los datos. Las fotos subidas desde el panel se guardan en la base de datos, así que no dependen del disco del hosting.

## API

| Recurso | Rutas | Acceso |
| --- | --- | --- |
| Config | `GET /api/config` | Público |
| Cuenta | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` | Público |
| Categorías | `GET /api/categories` · `POST/PUT/DELETE` | Lectura pública, escritura admin |
| Productos | `GET /api/products`, `GET /api/products/:id` · `POST/PUT` · `POST /api/products/:id/images` | Lectura pública (activos), escritura admin (`?all=1` solo admin) |
| Inventario | `GET/POST /api/inventory/movements` | Admin |
| Pedidos | `POST /api/orders`, `GET /api/orders/mine`, `GET /api/orders/:id` | Cliente con sesión (solo ve los suyos) |
| Pedidos | `GET /api/orders`, `PATCH /api/orders/:id/status` | Admin |

## Pendiente

- Los productos, precios y existencias que carga `--seed` son de ejemplo: hay que reemplazarlos con los datos reales de Caberti desde el panel de administración.
- No hay recuperación de contraseña ni verificación de correo.
- No hay pagos en línea ni correos automáticos.
