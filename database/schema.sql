-- Esquema de Caberti (PostgreSQL 14+). Es idempotente: se puede ejecutar varias veces.
-- Convenciones: nombres en español, snake_case y sin acentos; identity en lugar de serial,
-- text + CHECK en lugar de varchar(n), timestamptz para fechas e índice en cada clave foránea.

CREATE TABLE IF NOT EXISTS clientes (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre          text NOT NULL CHECK (length(nombre) BETWEEN 1 AND 120),
  correo          text NOT NULL CHECK (length(correo) BETWEEN 3 AND 254),
  telefono        text NOT NULL DEFAULT '' CHECK (length(telefono) <= 30),
  contrasena_hash text NOT NULL,
  rol             text NOT NULL DEFAULT 'cliente' CHECK (rol IN ('cliente', 'admin')),
  creado_en       timestamptz NOT NULL DEFAULT now()
);
-- El correo es único sin distinguir mayúsculas.
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_correo_lower ON clientes (lower(correo));

-- Solo se guarda el hash (SHA-256) del token de sesión, nunca el token.
CREATE TABLE IF NOT EXISTS sesiones (
  token_hash text PRIMARY KEY,
  cliente_id bigint NOT NULL REFERENCES clientes (id) ON DELETE CASCADE,
  expira_en  timestamptz NOT NULL,
  creado_en  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sesiones_cliente_id ON sesiones (cliente_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_expira_en ON sesiones (expira_en);

CREATE TABLE IF NOT EXISTS categorias (
  id     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre text NOT NULL CHECK (length(nombre) BETWEEN 1 AND 80)
);
-- Evita "Juguetes" y "juguetes" como categorías distintas.
CREATE UNIQUE INDEX IF NOT EXISTS idx_categorias_nombre_lower ON categorias (lower(nombre));

CREATE TABLE IF NOT EXISTS productos (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre         text NOT NULL CHECK (length(nombre) BETWEEN 1 AND 120),
  categoria_id   bigint NOT NULL REFERENCES categorias (id) ON DELETE RESTRICT,
  precio         numeric(10,2) NOT NULL CHECK (precio > 0),
  oferta         numeric(10,2) CHECK (oferta > 0 AND oferta < precio),
  existencias    integer NOT NULL DEFAULT 0 CHECK (existencias >= 0),
  minimo         integer NOT NULL DEFAULT 0 CHECK (minimo >= 0),
  personalizable boolean NOT NULL DEFAULT false,
  destacado      boolean NOT NULL DEFAULT false,
  activo         boolean NOT NULL DEFAULT true,
  descripcion    text NOT NULL DEFAULT '' CHECK (length(descripcion) <= 1000),
  imagenes       text[] NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_productos_categoria_id ON productos (categoria_id);
-- El catálogo público solo consulta productos activos.
CREATE INDEX IF NOT EXISTS idx_productos_activos ON productos (id) WHERE activo;

CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  producto_id bigint NOT NULL REFERENCES productos (id) ON DELETE CASCADE,
  cantidad    integer NOT NULL CHECK (cantidad <> 0), -- positiva = entrada, negativa = salida
  motivo      text NOT NULL CHECK (length(motivo) BETWEEN 1 AND 200),
  usuario     text NOT NULL DEFAULT 'Administrador',
  creado_en   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_movimientos_producto_id ON movimientos_inventario (producto_id);
-- Respalda el listado "más recientes primero".
CREATE INDEX IF NOT EXISTS idx_movimientos_recientes ON movimientos_inventario (creado_en DESC, id DESC);

CREATE TABLE IF NOT EXISTS pedidos (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cliente_id bigint REFERENCES clientes (id) ON DELETE SET NULL,
  cliente   text NOT NULL CHECK (length(cliente) BETWEEN 1 AND 120),
  telefono  text NOT NULL DEFAULT '' CHECK (length(telefono) <= 30),
  direccion text NOT NULL DEFAULT '' CHECK (length(direccion) <= 255),
  entrega   text NOT NULL CHECK (entrega IN ('domicilio', 'recoger')),
  notas     text NOT NULL DEFAULT '' CHECK (length(notas) <= 500),
  estado    text NOT NULL DEFAULT 'Pendiente'
            CHECK (estado IN ('Pendiente', 'Confirmado', 'En preparación', 'Entregado', 'Cancelado')),
  envio     numeric(10,2) CHECK (envio >= 0),
  aplicado  boolean NOT NULL DEFAULT false, -- true si el pedido ya descontó existencias
  creado_en timestamptz NOT NULL DEFAULT now()
);
-- Para bases creadas antes de existir la cuenta de cliente.
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cliente_id bigint REFERENCES clientes (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos (estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id ON pedidos (cliente_id);

CREATE TABLE IF NOT EXISTS detalle_pedido (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pedido_id       bigint NOT NULL REFERENCES pedidos (id) ON DELETE CASCADE,
  producto_id     bigint NOT NULL REFERENCES productos (id) ON DELETE RESTRICT,
  nombre          text NOT NULL,                              -- copia del nombre al momento de pedir
  cantidad        integer NOT NULL CHECK (cantidad > 0),
  precio          numeric(10,2) NOT NULL CHECK (precio >= 0), -- precio unitario congelado
  personalizacion text NOT NULL DEFAULT '' CHECK (length(personalizacion) <= 300)
);
CREATE INDEX IF NOT EXISTS idx_detalle_pedido_pedido_id ON detalle_pedido (pedido_id);
CREATE INDEX IF NOT EXISTS idx_detalle_pedido_producto_id ON detalle_pedido (producto_id);

-- Fotografías subidas desde el panel. Se guardan en la base para no depender del disco del hosting.
CREATE TABLE IF NOT EXISTS imagenes_producto (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  producto_id bigint NOT NULL REFERENCES productos (id) ON DELETE CASCADE,
  tipo        text NOT NULL CHECK (tipo IN ('image/jpeg', 'image/png', 'image/webp')),
  datos       bytea NOT NULL,
  creado_en   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_imagenes_producto_producto_id ON imagenes_producto (producto_id);
