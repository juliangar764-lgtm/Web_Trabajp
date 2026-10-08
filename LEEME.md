# Caberti — vistas del proyecto

Proyecto de frontend con HTML, CSS y JavaScript separados, sin backend, base de datos, dependencias de npm ni servicios externos.

## Abrir el proyecto

1. Descomprime el ZIP.
2. Abre la carpeta `caberti-frontend` en Visual Studio Code.
3. Abre `index.html` con Live Server para navegar y probar las vistas.

También puedes abrir `index.html` directamente en un navegador. Para que los cambios locales se compartan de forma consistente entre todas las páginas, se recomienda Live Server. No necesitas MySQL, Node.js ni instalar paquetes.

Si ya tienes Python, otra opción es ejecutar desde esta carpeta:

```bash
python3 -m http.server 5500
```

Después abre `http://localhost:5500`. Ese comando solo sirve los archivos estáticos; no es un backend de la aplicación.

## Archivos

```text
caberti-frontend/
├── index.html                Inicio
├── catalogo.html             Catálogo, filtros y búsqueda
├── producto.html             Producto, galería y personalización
├── pedido.html               Lista de pedido y solicitud de ejemplo
├── personalizados.html       Formulario para armar un detalle
├── contacto.html             Sobre Caberti, contacto y preguntas
├── acceso.html               Vista de acceso al panel
├── admin/
│   ├── index.html            Resumen
│   ├── productos.html        Lista y formulario de productos
│   ├── categorias.html       Lista y formulario de categorías
│   ├── inventario.html       Existencias y movimientos
│   ├── pedidos.html          Lista y registro de pedidos de ejemplo
│   └── pedido.html           Detalle y estado de un pedido
├── css/styles.css            Diseño y adaptación a celular
├── js/data.js                Datos y funciones compartidas de demostración
├── js/app.js                 Interacciones del cliente
├── js/admin.js               Interacciones del administrador
└── assets/productos/         Fotografías proporcionadas por el usuario
```

## Qué se puede probar

- Navegación adaptable a celular, búsqueda por nombre y descripción, filtros por categoría, precio y disponibilidad.
- Galerías, opciones de personalización, cantidades, lista de pedido, eliminación de artículos y cálculo del subtotal.
- Vista previa y copia del mensaje de consulta. No se envía a WhatsApp: el número comercial no ha sido proporcionado.
- Formularios de personalización y contacto.
- Panel con productos, categorías, existencias, movimientos y estados de pedidos de ejemplo.
- Carga de una fotografía local para un producto de demostración (JPG, PNG o WebP, hasta 1 MB).

## Datos de demostración

Se incorporaron 23 fotografías únicas del ZIP recibido; se omitió un archivo que era duplicado exacto. Se agruparon las fotografías en 16 productos y una imagen del espacio de Caberti. Los nombres son descriptivos provisionales y deben revisarse; los precios, cantidades disponibles y pedidos son ejemplos, no datos reales del negocio. Las fotografías se conservan sin edición.

Los datos se guardan mediante `localStorage` del navegador bajo la clave `caberti-vistas-fotos-v1`. No se comparten entre equipos. Si el navegador bloquea el almacenamiento, la interfaz avisa. El botón **Restablecer demo** recupera el catálogo original, vacía el pedido y elimina las modificaciones locales.

El acceso del administrador es solo una vista: cualquier visitante puede entrar. Los campos de acceso no comprueban ni guardan credenciales. No escribas contraseñas reales.

Los pedidos preparados por el cliente solo se muestran como mensaje, no se registran automáticamente en el panel. El panel usa sus propios pedidos de ejemplo. Las entradas y salidas del inventario son simulaciones locales; los ejemplos iniciales no representan un historial contable completo.

## Personalizar el proyecto

- Colores y tipografías: variables al principio de `css/styles.css`.
- Contenido y estructura: cada archivo `.html`.
- Productos, precios y fotos iniciales: `js/data.js`. Después de editarlo, usa **Restablecer demo** para cargar la nueva información en un navegador que ya haya abierto el proyecto.
- Fotos: carpeta `assets/productos`. Las rutas se indican en los datos de cada producto. Las imágenes originales de WhatsApp pueden contener franjas negras; se han preservado tal como se recibieron.

No hay pagos, autenticación, correos, base de datos, llamadas a API ni envíos automáticos. El proyecto está pensado para revisar las interfaces y continuar su desarrollo posteriormente.
