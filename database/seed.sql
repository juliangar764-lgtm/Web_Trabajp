-- Datos de demostración (tomados de la versión anterior de js/data.js).
-- Los precios, existencias y pedidos son ejemplos, no datos reales del negocio.

-- No se tocan las cuentas (clientes) ni las sesiones.
TRUNCATE imagenes_producto, detalle_pedido, pedidos, movimientos_inventario, productos, categorias RESTART IDENTITY CASCADE;

INSERT INTO categorias (nombre) VALUES
  ('Regalos y detalles'),
  ('Personalizados'),
  ('Accesorios y joyería'),
  ('Juguetes'),
  ('Productos especiales');

INSERT INTO productos (id, nombre, categoria_id, precio, existencias, minimo, personalizable, destacado, descripcion, imagenes) OVERRIDING SYSTEM VALUE VALUES
  (1, 'Caja de regalo', 1, 450, 8, 3, TRUE, TRUE, 'Una caja llena de pequeños detalles para celebrar a esa persona especial. Cuéntanos la ocasión y prepararemos una propuesta para ti.', ARRAY['assets/productos/13.jpg']),
  (2, 'Termo personalizado', 2, 280, 12, 5, TRUE, TRUE, 'Un detalle práctico con un toque personal. Elige el color y agrega un nombre. Confirmaremos contigo el diseño antes de prepararlo.', ARRAY['assets/productos/05.jpg']),
  (3, 'Dije personalizado', 3, 180, 2, 5, TRUE, TRUE, 'Un accesorio delicado para acompañar los momentos cotidianos. Un pequeño regalo para decir algo grande.', ARRAY['assets/productos/09.jpg', 'assets/productos/22.jpg']),
  (4, 'Peluche de perrito', 1, 250, 1, 3, FALSE, TRUE, 'Un abrazo que se puede regalar. Un compañero suave para acompañar una dedicatoria o completar tu caja de regalo.', ARRAY['assets/productos/20.jpg']),
  (5, 'Auto Hot Wheels', 4, 65, 10, 3, FALSE, FALSE, 'Un detalle para quienes disfrutan los pequeños grandes autos. Consulta los modelos disponibles antes de confirmar tu pedido.', ARRAY['assets/productos/16.jpg']),
  (6, 'Llavero personalizado', 2, 90, 3, 5, TRUE, FALSE, 'Lleva un nombre o una palabra especial a todas partes. Personaliza este pequeño detalle para regalar o para ti.', ARRAY['assets/productos/02.jpg', 'assets/productos/21.jpg']),
  (7, 'Cartera grabada león', 2, 320, 6, 3, TRUE, TRUE, 'Un detalle para una ocasión especial. Consulta las opciones y disponibilidad con Caberti antes de confirmar tu pedido.', ARRAY['assets/productos/03.jpg', 'assets/productos/04.jpg']),
  (8, 'Cartera Batman', 3, 290, 6, 3, FALSE, FALSE, 'Un detalle para una ocasión especial. Consulta las opciones y disponibilidad con Caberti antes de confirmar tu pedido.', ARRAY['assets/productos/06.jpg']),
  (9, 'Lámpara corazón', 1, 380, 6, 3, TRUE, TRUE, 'Un detalle para una ocasión especial. Consulta las opciones y disponibilidad con Caberti antes de confirmar tu pedido.', ARRAY['assets/productos/07.jpg', 'assets/productos/08.jpg']),
  (10, 'Vaso rosa personalizado', 2, 220, 6, 3, TRUE, FALSE, 'Un detalle para una ocasión especial. Consulta las opciones y disponibilidad con Caberti antes de confirmar tu pedido.', ARRAY['assets/productos/10.jpg']),
  (11, 'Cartera con grabado', 2, 320, 6, 3, TRUE, FALSE, 'Un detalle para una ocasión especial. Consulta las opciones y disponibilidad con Caberti antes de confirmar tu pedido.', ARRAY['assets/productos/11.jpg']),
  (12, 'Termo deportivo', 2, 300, 6, 3, TRUE, FALSE, 'Un detalle para una ocasión especial. Consulta las opciones y disponibilidad con Caberti antes de confirmar tu pedido.', ARRAY['assets/productos/12.jpg']),
  (13, 'Lámpara con mensaje', 1, 260, 6, 3, TRUE, FALSE, 'Un detalle para una ocasión especial. Consulta las opciones y disponibilidad con Caberti antes de confirmar tu pedido.', ARRAY['assets/productos/14.jpg']),
  (14, 'Cartera con diseño personalizado', 2, 350, 6, 3, TRUE, FALSE, 'Un detalle para una ocasión especial. Consulta las opciones y disponibilidad con Caberti antes de confirmar tu pedido.', ARRAY['assets/productos/15.jpg', 'assets/productos/19.jpg', 'assets/productos/23.jpg']),
  (15, 'Lámpara esfera', 1, 340, 6, 3, FALSE, FALSE, 'Un detalle para una ocasión especial. Consulta las opciones y disponibilidad con Caberti antes de confirmar tu pedido.', ARRAY['assets/productos/17.jpg']),
  (16, 'Placa conmemorativa', 2, 190, 6, 3, TRUE, FALSE, 'Un detalle para una ocasión especial. Consulta las opciones y disponibilidad con Caberti antes de confirmar tu pedido.', ARRAY['assets/productos/01.jpg']);
SELECT setval(pg_get_serial_sequence('productos', 'id'), (SELECT MAX(id) FROM productos));

INSERT INTO movimientos_inventario (producto_id, cantidad, motivo, creado_en) VALUES
  (2, 10, 'Reposición de mercancía', '2026-10-08 10:00'),
  (3, -1, 'Venta de ejemplo', '2026-10-07 12:00');

INSERT INTO pedidos (id, cliente, direccion, entrega, notas, estado, envio, aplicado, creado_en) OVERRIDING SYSTEM VALUE VALUES
  (104, 'Mariana López', 'Dirección pendiente de confirmar', 'domicilio', 'Confirmar horario con el cliente.', 'Pendiente', NULL, FALSE, '2026-10-08 10:30'),
  (103, 'Luis Pérez', 'Punto de entrega por acordar', 'recoger', '', 'Confirmado', 0, TRUE, '2026-10-08 09:00'),
  (102, 'Ana Ruiz', 'Dirección de ejemplo', 'domicilio', '', 'En preparación', 0, TRUE, '2026-10-07 13:00');
SELECT setval(pg_get_serial_sequence('pedidos', 'id'), (SELECT MAX(id) FROM pedidos));

INSERT INTO detalle_pedido (pedido_id, producto_id, nombre, cantidad, precio, personalizacion) VALUES
  (104, 2, 'Termo personalizado', 1, 280, 'Nombre: Sofía · Color: crema'),
  (104, 3, 'Dije personalizado', 1, 180, ''),
  (103, 1, 'Caja de regalo', 1, 450, 'Cumpleaños · Tarjeta con dedicatoria'),
  (102, 2, 'Termo personalizado', 1, 280, 'Nombre: Ana');
