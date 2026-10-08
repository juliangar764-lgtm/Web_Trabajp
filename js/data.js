/* Datos de demostración. Este archivo sustituye una API únicamente en las vistas. */
(() => {
  "use strict";
  const KEY = "caberti-vistas-fotos-v1";
  const seed = {
    categories: [
      "Regalos y detalles",
      "Personalizados",
      "Accesorios y joyería",
      "Juguetes",
      "Productos especiales",
    ],
    products: [
      {
        id: 1,
        name: "Caja de regalo",
        category: "Regalos y detalles",
        price: 450,
        photo: "box",
        stock: 8,
        min: 3,
        custom: true,
        featured: true,
        active: true,
        description:
          "Una caja llena de pequeños detalles para celebrar a esa persona especial. Cuéntanos la ocasión y prepararemos una propuesta para ti.",
      },
      {
        id: 2,
        name: "Termo personalizado",
        category: "Personalizados",
        price: 280,
        photo: "tumbler",
        stock: 12,
        min: 5,
        custom: true,
        featured: true,
        active: true,
        description:
          "Un detalle práctico con un toque personal. Elige el color y agrega un nombre. Confirmaremos contigo el diseño antes de prepararlo.",
      },
      {
        id: 3,
        name: "Collar corazón",
        category: "Accesorios y joyería",
        price: 180,
        photo: "necklace",
        stock: 2,
        min: 5,
        custom: false,
        featured: true,
        active: true,
        description:
          "Un accesorio delicado para acompañar los momentos cotidianos. Un pequeño regalo para decir algo grande.",
      },
      {
        id: 4,
        name: "Oso de peluche",
        category: "Regalos y detalles",
        price: 250,
        photo: "bear",
        stock: 1,
        min: 3,
        custom: false,
        featured: true,
        active: true,
        description:
          "Un abrazo que se puede regalar. Un compañero suave para acompañar una dedicatoria o completar tu caja de regalo.",
      },
      {
        id: 5,
        name: "Carrito de colección",
        category: "Juguetes",
        price: 65,
        photo: "car",
        stock: 10,
        min: 3,
        custom: false,
        featured: false,
        active: true,
        description:
          "Un detalle para quienes disfrutan los pequeños grandes autos. Consulta los modelos disponibles antes de confirmar tu pedido.",
      },
      {
        id: 6,
        name: "Llavero personalizado",
        category: "Personalizados",
        price: 90,
        photo: "keyring",
        stock: 3,
        min: 5,
        custom: true,
        featured: false,
        active: true,
        description:
          "Lleva un nombre o una palabra especial a todas partes. Personaliza este pequeño detalle para regalar o para ti.",
      },
    ],
    cart: [],
    movements: [
      {
        id: 1,
        productId: 2,
        delta: 10,
        reason: "Reposición de mercancía",
        date: "2026-10-08T10:00:00",
        user: "Administrador",
      },
      {
        id: 2,
        productId: 3,
        delta: -1,
        reason: "Venta de ejemplo",
        date: "2026-10-07T12:00:00",
        user: "Administrador",
      },
    ],
    orders: [
      {
        id: 104,
        customer: "Mariana López",
        phone: "",
        address: "Dirección pendiente de confirmar",
        delivery: "domicilio",
        notes: "Confirmar horario con el cliente.",
        date: "2026-10-08T10:30:00",
        status: "Pendiente",
        shipping: null,
        applied: false,
        items: [
          {
            productId: 2,
            name: "Termo personalizado",
            qty: 1,
            price: 280,
            photo: "tumbler",
            custom: "Nombre: Sofía · Color: crema",
          },
          {
            productId: 3,
            name: "Collar corazón",
            qty: 1,
            price: 180,
            photo: "necklace",
            custom: "",
          },
        ],
      },
      {
        id: 103,
        customer: "Luis Pérez",
        phone: "",
        address: "Punto de entrega por acordar",
        delivery: "recoger",
        notes: "",
        date: "2026-10-08T09:00:00",
        status: "Confirmado",
        shipping: 0,
        applied: true,
        items: [
          {
            productId: 1,
            name: "Caja de regalo",
            qty: 1,
            price: 450,
            photo: "box",
            custom: "Cumpleaños · Tarjeta con dedicatoria",
          },
        ],
      },
      {
        id: 102,
        customer: "Ana Ruiz",
        phone: "",
        address: "Dirección de ejemplo",
        delivery: "domicilio",
        notes: "",
        date: "2026-10-07T13:00:00",
        status: "En preparación",
        shipping: 0,
        applied: true,
        items: [
          {
            productId: 2,
            name: "Termo personalizado",
            qty: 1,
            price: 280,
            photo: "tumbler",
            custom: "Nombre: Ana",
          },
        ],
      },
    ],
  };
  // Fotografías entregadas por el usuario. Nombres, precios y existencias son demostrativos.
  const galleries = {
    1: ["13"],
    2: ["05"],
    3: ["09", "22"],
    4: ["20"],
    5: ["16"],
    6: ["02", "21"],
  };
  seed.products.forEach((p) => {
    p.images = galleries[p.id].map((n) => `assets/productos/${n}.jpg`);
  });
  seed.products[2].name = "Dije personalizado";
  seed.products[2].custom = true;
  seed.products[3].name = "Peluche de perrito";
  seed.products[4].name = "Auto Hot Wheels";
  seed.products.push(
    ...[
      [7, "Cartera grabada león", "Personalizados", 320, ["03", "04"], true],
      [8, "Cartera Batman", "Accesorios y joyería", 290, ["06"], false],
      [9, "Lámpara corazón", "Regalos y detalles", 380, ["07", "08"], true],
      [10, "Vaso rosa personalizado", "Personalizados", 220, ["10"], true],
      [11, "Cartera con grabado", "Personalizados", 320, ["11"], true],
      [12, "Termo deportivo", "Personalizados", 300, ["12"], true],
      [13, "Lámpara con mensaje", "Regalos y detalles", 260, ["14"], true],
      [
        14,
        "Cartera con diseño personalizado",
        "Personalizados",
        350,
        ["15", "19", "23"],
        true,
      ],
      [15, "Lámpara esfera", "Regalos y detalles", 340, ["17"], false],
      [16, "Placa conmemorativa", "Personalizados", 190, ["01"], true],
    ].map(([id, name, category, price, images, custom]) => ({
      id,
      name,
      category,
      price,
      images: images.map((n) => `assets/productos/${n}.jpg`),
      custom,
      stock: 6,
      min: 3,
      featured: [7, 9].includes(id),
      active: true,
      description:
        "Un detalle para una ocasión especial. Consulta las opciones y disponibilidad con Caberti antes de confirmar tu pedido.",
    })),
  );
  seed.orders.forEach((o) =>
    o.items.forEach((i) => {
      const p = seed.products.find((p) => p.id === i.productId);
      if (p) {
        i.name = p.name;
        i.images = p.images;
      }
    }),
  );
  let state;
  try {
    state = JSON.parse(localStorage.getItem(KEY));
  } catch (_) {
    /* El almacenamiento puede estar bloqueado. */
  }
  if (
    !state ||
    !Array.isArray(state.products) ||
    !Array.isArray(state.cart) ||
    !Array.isArray(state.orders) ||
    !Array.isArray(state.categories) ||
    !Array.isArray(state.movements)
  )
    state = structuredClone(seed);
  const paths = {
    bow: "M12 12C5 2 0 5 3 9c2 3 6 3 9 3Zm0 0c7-10 12-7 9-3-2 3-6 3-9 3Zm0 0L7 22m5-10 5 10m-5-10v7",
    bag: "M5 7h14l2 14H3L5 7Zm3 0V5a4 4 0 0 1 8 0v2",
    search: "m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
    menu: "M3 6h18M3 12h18M3 18h18",
    gift: "M3 8h18v4H3zM5 12v9h14v-9M12 8v13M12 8C2 8 5-1 9 4l3 4Zm0 0c10 0 7-9 3-4l-3 4Z",
    truck:
      "M2 5h12v12H2zM14 9h4l4 5v3h-8M8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm12 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z",
    chat: "M21 11a9 9 0 0 1-13 8L2 21l2-6a9 9 0 1 1 17-4ZM8 9h8M8 13h5",
    box: "m3 6 9-4 9 4v12l-9 4-9-4V6Zm0 0 9 4 9-4M12 10v12M7 4l10 4",
    chart: "M4 21V11h3v10M10 21V3h3v18M16 21V7h3v14",
    tag: "M2 3h9l11 11-8 8L2 10V3ZM7 7h.01",
    list: "M6 2h12v20H6zM9 7h6M9 11h6M9 15h4",
    user: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2H4Z",
    exit: "M10 3H3v18h7M8 12h14m-5-5 5 5-5 5",
    arrow: "M3 12h18m-6-6 6 6-6 6",
    pin: "M19 9c0 6-7 13-7 13S5 15 5 9a7 7 0 1 1 14 0ZM15 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
    alert: "m12 2 10 19H2L12 2Zm0 6v6m0 3v1",
    plus: "M12 4v16M4 12h16",
    home: "m2 10 10-8 10 8M5 8v13h14V8M9 21v-8h6v8",
  };
  const escape = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  let toastTimer;
  window.Caberti = {
    get state() {
      return state;
    },
    escape,
    icon(name) {
      return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.box}"/></svg>`;
    },
    money(value) {
      return (
        new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: "MXN",
          maximumFractionDigits: 2,
        }).format(value) + " MXN"
      );
    },
    date(value) {
      return new Date(value).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
      });
    },
    price(p) {
      return p.sale > 0 ? p.sale : p.price;
    },
    product(id) {
      return state.products.find((p) => p.id === Number(id));
    },
    save() {
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
        return true;
      } catch (_) {
        this.toast(
          "Los cambios estarán disponibles solo durante esta página; el navegador no permitió guardarlos.",
        );
        return false;
      }
    },
    reset() {
      state = structuredClone(seed);
      this.save();
      location.reload();
    },
    toast(message) {
      let el = document.querySelector("#toast");
      if (!el) {
        el = document.createElement("div");
        el.id = "toast";
        el.className = "toast";
        el.setAttribute("role", "status");
        document.body.append(el);
      }
      el.textContent = message;
      el.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => (el.hidden = true), 4200);
    },
    photo(p, extra = "") {
      const prefix = document.body.dataset.admin === "true" ? "../" : "";
      const data =
        p.image &&
        /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(p.image)
          ? p.image
          : null;
      const path = p.images?.[0] || this.product(p.productId)?.images?.[0];
      const safePath =
        path && /^assets\/productos\/\d{2}\.jpg$/.test(path)
          ? prefix + path
          : null;
      const src = data || safePath;
      return `<span class="photo real-photo ${extra}">${src ? `<img src="${src}" alt="${escape(p.name)}" loading="lazy">` : this.icon("gift")}</span>`;
    },
    badge(status) {
      const cls =
        {
          Pendiente: "amber",
          Confirmado: "green",
          "En preparación": "",
          Entregado: "green",
          Cancelado: "gray",
        }[status] || "";
      return `<span class="badge ${cls}">${escape(status)}</span>`;
    },
    subtotal(order) {
      return order.items.reduce((sum, i) => sum + i.price * i.qty, 0);
    },
    nextId(list) {
      return Math.max(0, ...list.map((x) => x.id)) + 1;
    },
  };
})();
