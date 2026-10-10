/* Estado compartido y utilidades. Los datos vienen de la API; solo el carrito vive en el navegador. */
(() => {
  "use strict";
  const CART_KEY = "caberti-carrito-v1";

  function loadCart() {
    try {
      const cart = JSON.parse(localStorage.getItem(CART_KEY));
      return Array.isArray(cart) ? cart : [];
    } catch (_) {
      return []; // el almacenamiento puede estar bloqueado o el contenido dañado
    }
  }

  const state = {
    products: [],
    categories: [], // nombres, para los filtros
    categoryList: [], // {id, name}
    cart: loadCart(),
    user: null,
    config: { whatsappNumber: null },
  };

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

  /** Llama a la API (`/api` + ruta) y devuelve el JSON. Lanza Error con el mensaje del servidor. */
  async function api(path, { method = "GET", body, raw, contentType } = {}) {
    let response;
    try {
      response = await fetch("/api" + path, {
        method,
        credentials: "same-origin",
        headers: raw ? { "Content-Type": contentType } : body ? { "Content-Type": "application/json" } : undefined,
        body: raw ?? (body ? JSON.stringify(body) : undefined),
      });
    } catch (_) {
      throw new Error("No hay conexión con el servidor. Inténtalo de nuevo.");
    }
    if (response.status === 204) return null;
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(data?.error || "No se pudo completar la solicitud.");
      error.status = response.status;
      throw error;
    }
    return data;
  }

  const isAdminPage = document.body.dataset.admin === "true";

  // Carga lo necesario al abrir la página. El panel carga sus propios datos (con productos inactivos).
  const ready = (async () => {
    const [config, session] = await Promise.all([api("/config"), api("/auth/me")]);
    state.config = config;
    state.user = session.user;
    if (isAdminPage) return;
    const [products, categories] = await Promise.all([api("/products"), api("/categories")]);
    state.products = products;
    state.categoryList = categories;
    state.categories = categories.map((c) => c.name);
  })();

  let toastTimer;
  window.Caberti = {
    state,
    ready,
    api,
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
    /** Guarda el carrito en este navegador. */
    saveCart() {
      try {
        localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
        return true;
      } catch (_) {
        this.toast("Tu pedido estará disponible solo mientras no cierres esta página.");
        return false;
      }
    },
    save() {
      return this.saveCart();
    },
    /** Enlace wa.me al número de Caberti, o null si todavía no está configurado. */
    whatsappUrl(text) {
      const number = state.config.whatsappNumber;
      return number ? `https://wa.me/${number}?text=${encodeURIComponent(text)}` : null;
    },
    async logout() {
      await api("/auth/logout", { method: "POST" });
      location.href = "/index.html";
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
    /** Ruta absoluta de una fotografía; solo acepta las que el servidor puede entregar. */
    assetUrl(path) {
      return /^\/?(assets\/productos\/\d{2}\.jpg|api\/images\/\d+)$/.test(path || "")
        ? "/" + path.replace(/^\//, "")
        : null;
    },
    photo(p, extra = "") {
      const path = p.images?.[0] || this.product(p.productId)?.images?.[0];
      const src = this.assetUrl(path);
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
  };
})();
