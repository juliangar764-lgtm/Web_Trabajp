/* Interacciones públicas de las vistas. No realiza solicitudes a un servidor. */
(() => {
  "use strict";
  const C = window.Caberti,
    e = C.escape,
    money = C.money,
    page = document.body.dataset.page;
  const $ = (s) => document.querySelector(s);
  document
    .querySelectorAll("[data-icon]")
    .forEach((el) => (el.innerHTML = C.icon(el.dataset.icon)));
  const menu = $("#menu-toggle");
  menu?.addEventListener("click", () => {
    const open = $("#main-nav").classList.toggle("open");
    menu.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && menu) {
      $("#main-nav").classList.remove("open");
      menu.setAttribute("aria-expanded", "false");
    }
  });
  function count() {
    document
      .querySelectorAll("[data-cart-count]")
      .forEach(
        (el) => (el.textContent = C.state.cart.reduce((n, i) => n + i.qty, 0)),
      );
  }
  count();
  function card(p) {
    return `<article class="product-card"><a href="producto.html?id=${p.id}" aria-label="Ver ${e(p.name)}">${C.photo(p)}</a><div class="product-info">${p.custom ? '<span class="badge">Personalizable</span>' : ""}<h3><a href="producto.html?id=${p.id}">${e(p.name)}</a></h3><p class="price">${p.sale ? `<del>${money(p.price)}</del>` : ""}${money(C.price(p))}</p><a class="text-link" href="producto.html?id=${p.id}">Ver producto &nbsp; →</a></div></article>`;
  }
  function preview(text, title = "Tu solicitud de ejemplo") {
    $("#request-title").textContent = title;
    $("#request-message").value = text;
    $("#request-dialog").showModal();
  }
  $("[data-close-dialog]")?.addEventListener("click", () =>
    $("#request-dialog").close(),
  );
  $("#copy-request")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText($("#request-message").value);
      C.toast("Mensaje copiado.");
    } catch (_) {
      $("#request-message").select();
      C.toast(
        "Selecciona y copia el mensaje con Ctrl+C o desde el menú de tu dispositivo.",
      );
    }
  });
  if (page === "inicio")
    $("#featured").innerHTML = C.state.products
      .filter((p) => p.active && p.featured)
      .slice(0, 4)
      .map(card)
      .join("");
  if (page === "catalogo") {
    const fromURL = new URLSearchParams(location.search).get("categoria");
    $("#category-filters").innerHTML = ["Todos", ...C.state.categories]
      .map(
        (name, i) =>
          `<label><input type="radio" name="category" value="${e(name)}" ${name === fromURL || (!fromURL && i === 0) ? "checked" : ""}> ${e(name)}</label>`,
      )
      .join("");
    function render() {
      const category = $("input[name=category]:checked")?.value || "Todos",
        query = $("#search-products").value.trim().toLocaleLowerCase("es"),
        max = Number($("#max-price").value) || Infinity,
        only = $("#available-only").checked;
      let products = C.state.products.filter(
        (p) =>
          p.active &&
          (category === "Todos" || p.category === category) &&
          (!query ||
            (p.name + " " + p.description + " " + p.category)
              .toLocaleLowerCase("es")
              .includes(query)) &&
          C.price(p) <= max &&
          (!only || p.stock > 0),
      );
      const sort = $("#sort-products").value;
      products.sort((a, b) =>
        sort === "low"
          ? C.price(a) - C.price(b)
          : sort === "high"
            ? C.price(b) - C.price(a)
            : sort === "name"
              ? a.name.localeCompare(b.name, "es")
              : Number(b.featured) - Number(a.featured),
      );
      $("#result-count").textContent =
        `${products.length} ${products.length === 1 ? "producto" : "productos"}`;
      $("#catalog-grid").innerHTML = products.length
        ? products.map(card).join("")
        : '<div class="empty"><h2>No encontramos ese detalle</h2><p>Prueba otra búsqueda o elimina algunos filtros.</p></div>';
    }
    $("#search-products").addEventListener("input", render);
    $("#filters").addEventListener("change", render);
    $("#sort-products").addEventListener("change", render);
    $("#clear-filters").addEventListener("click", () => {
      $("#filters").reset();
      $("input[name=category][value=Todos]").checked = true;
      $("#search-products").value = "";
      $("#sort-products").value = "recommended";
      render();
    });
    render();
  }
  if (page === "producto") {
    const id = Number(new URLSearchParams(location.search).get("id") || 2),
      p = C.product(id);
    if (!p || !p.active) {
      $("#product-content").innerHTML =
        '<div class="empty"><h1>Producto no disponible</h1><p>Explora otros detalles en nuestro catálogo.</p><a class="btn" href="catalogo.html">Volver al catálogo</a></div>';
      return;
    }
    document.title = p.name + " | Caberti";
    $("#product-breadcrumb").textContent = p.name;
    const pics = p.image ? [p.image] : p.images || [];
    let color = "Crema";
    $("#product-content").innerHTML =
      `<div class="detail-layout"><div><div class="gallery-main"><img id="gallery-image" src="${e(pics[0] || "assets/productos/02.jpg")}" alt="${e(p.name)}"></div><div class="thumbs">${pics.map((src, i) => `<button type="button" class="thumb ${i === 0 ? "selected" : ""}" data-picture="${i}" aria-label="Ver fotografía ${i + 1}" aria-pressed="${i === 0}"><img src="${e(src)}" alt=""></button>`).join("")}</div><p class="note">Fotografías proporcionadas por Caberti.</p></div><div class="detail-info"><p class="eyebrow">${e(p.category)}</p><h1>${e(p.name)}</h1><div class="row"><p class="price">${money(C.price(p))}</p><span class="badge ${p.stock > 0 ? "green" : "gray"}">${p.stock > 0 ? "Disponible · demo" : "Agotado · demo"}</span></div><p class="muted">${e(p.description)}</p><hr class="divider"><form id="product-form">${p.id === 2 ? '<span class="small">Color de ejemplo</span><div class="swatches"><button type="button" class="swatch" data-color="Crema" aria-pressed="true"><i class="color-cream"></i>Crema</button><button type="button" class="swatch" data-color="Rosa" aria-pressed="false"><i class="color-rose"></i>Rosa</button><button type="button" class="swatch" data-color="Negro" aria-pressed="false"><i class="color-black"></i>Negro</button></div>' : ""}${p.custom ? '<label class="field">¿Cómo lo personalizamos?<textarea id="custom-text" maxlength="250" placeholder="Nombre, frase, ocasión o idea para tu regalo"></textarea><small>Opcional. Confirmaremos contigo las opciones y el diseño.</small></label>' : ""}<div class="quantity-row"><span class="small">Cantidad</span><div class="qty"><button type="button" id="qty-down" aria-label="Disminuir cantidad">−</button><input id="product-qty" type="number" min="1" max="${Math.max(1, p.stock)}" value="1" aria-label="Cantidad"><button type="button" id="qty-up" aria-label="Aumentar cantidad">+</button></div></div><div class="actions"><button class="btn" ${p.stock < 1 ? "disabled" : ""}>${C.icon("bag")} Agregar a mi pedido</button><button type="button" class="btn btn-outline" id="consult-product">Consultar</button></div><p class="note">Precio y disponibilidad de demostración. El diseño y la entrega se confirman con Caberti.</p></form><hr class="divider"><div class="row"><span class="small">${C.icon("gift")} Un detalle a tu estilo</span><span class="small">${C.icon("truck")} Entrega en Tapachula</span></div></div></div><section class="section"><div class="section-heading"><h2>También puede gustarte</h2><a class="text-link" href="catalogo.html">Ver catálogo →</a></div><div class="product-grid">${C.state.products
        .filter((x) => x.active && x.id !== id)
        .slice(0, 4)
        .map(card)
        .join("")}</div></section>`;
    document.querySelectorAll("[data-picture]").forEach((b) =>
      b.addEventListener("click", () => {
        $("#gallery-image").src = pics[Number(b.dataset.picture)];
        document.querySelectorAll("[data-picture]").forEach((t) => {
          t.classList.toggle("selected", t === b);
          t.setAttribute("aria-pressed", String(t === b));
        });
      }),
    );
    document.querySelectorAll("[data-color]").forEach((b) =>
      b.addEventListener("click", () => {
        color = b.dataset.color;
        document
          .querySelectorAll("[data-color]")
          .forEach((t) => t.setAttribute("aria-pressed", String(t === b)));
      }),
    );
    $("#qty-down").addEventListener(
      "click",
      () =>
        ($("#product-qty").value = Math.max(
          1,
          Number($("#product-qty").value) - 1,
        )),
    );
    $("#qty-up").addEventListener(
      "click",
      () =>
        ($("#product-qty").value = Math.min(
          Math.max(1, p.stock),
          Number($("#product-qty").value) + 1,
        )),
    );
    $("#product-form").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const qty = Number($("#product-qty").value),
        custom = [
          $("#custom-text")?.value.trim(),
          p.id === 2 ? "Color: " + color : "",
        ]
          .filter(Boolean)
          .join(" · ");
      if (!Number.isInteger(qty) || qty < 1 || qty > p.stock) {
        C.toast("Revisa la cantidad seleccionada.");
        return;
      }
      const used = C.state.cart
        .filter((i) => i.productId === p.id)
        .reduce((n, i) => n + i.qty, 0);
      if (used + qty > p.stock) {
        C.toast("La cantidad supera las existencias de demostración.");
        return;
      }
      const existing = C.state.cart.find(
        (i) => i.productId === p.id && i.custom === custom,
      );
      if (existing) existing.qty += qty;
      else
        C.state.cart.push({
          key: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          productId: p.id,
          qty,
          custom,
        });
      C.save();
      count();
      C.toast("Agregado a tu pedido. Puedes seguir explorando.");
    });
    $("#consult-product").addEventListener("click", () =>
      preview(
        `Hola, Caberti. Quisiera información sobre ${p.name}.\nPersonalización: ${$("#custom-text")?.value.trim() || "Por acordar"}.`,
      ),
    );
  }
  if (page === "pedido") {
    function render() {
      const items = C.state.cart
        .map((i) => ({ ...i, p: C.product(i.productId) }))
        .filter((i) => i.p);
      if (!items.length) {
        $("#cart-content").hidden = true;
        $("#cart-empty").hidden = false;
        count();
        return;
      }
      $("#cart-content").hidden = false;
      $("#cart-empty").hidden = true;
      $("#cart-items").innerHTML = items
        .map(
          (i) =>
            `<article class="cart-row">${C.photo(i.p)}<div><h3><a href="producto.html?id=${i.p.id}">${e(i.p.name)}</a></h3><p class="muted">${e(i.custom || "Sin personalización")}</p><button class="text-link" type="button" data-remove="${e(i.key)}">Eliminar</button></div><div><div class="qty"><button type="button" data-change="-1" data-key="${e(i.key)}" aria-label="Disminuir ${e(i.p.name)}">−</button><input type="text" value="${i.qty}" readonly aria-label="Cantidad de ${e(i.p.name)}"><button type="button" data-change="1" data-key="${e(i.key)}" aria-label="Aumentar ${e(i.p.name)}">+</button></div><p class="price">${money(C.price(i.p) * i.qty)}</p></div></article>`,
        )
        .join("");
      const total = items.reduce((sum, i) => sum + C.price(i.p) * i.qty, 0);
      $("#cart-subtotal").textContent = money(total);
      $("#cart-total").textContent = money(total);
      $("#cart-article-count").textContent =
        items.reduce((sum, i) => sum + i.qty, 0) + " artículos";
      count();
    }
    $("#cart-items").addEventListener("click", (ev) => {
      const remove = ev.target.closest("[data-remove]"),
        change = ev.target.closest("[data-change]");
      if (remove)
        C.state.cart = C.state.cart.filter(
          (i) => i.key !== remove.dataset.remove,
        );
      if (change) {
        const item = C.state.cart.find((i) => i.key === change.dataset.key);
        if (!item) return;
        const p = C.product(item.productId),
          amount = Number(change.dataset.change),
          used = C.state.cart
            .filter((i) => i.productId === p.id)
            .reduce((sum, i) => sum + i.qty, 0);
        if (amount > 0 && used >= p.stock) {
          C.toast("No hay más existencias de demostración.");
          return;
        }
        item.qty = Math.max(1, item.qty + amount);
      }
      if (remove || change) {
        C.save();
        render();
      }
    });
    document.querySelectorAll("[name=delivery]").forEach((input) =>
      input.addEventListener("change", () => {
        const home = $("[name=delivery]:checked").value === "domicilio";
        $("#address-field").hidden = !home;
        $("#customer-address").required = home;
      }),
    );
    $("#checkout-form").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const name = $("#customer-name").value.trim(),
        phone = $("#customer-phone").value.trim(),
        delivery = $("[name=delivery]:checked").value,
        address = $("#customer-address").value.trim();
      if (!name || phone.replace(/\D/g, "").length < 10) {
        C.toast("Escribe un nombre y un número de contacto válido.");
        return;
      }
      const items = C.state.cart.map((i) => ({ i, p: C.product(i.productId) }));
      if (items.some(({ i, p }) => !p || !p.active || i.qty > p.stock)) {
        C.toast("Hay un producto sin disponibilidad. Revisa tu pedido.");
        return;
      }
      const total = items.reduce(
        (sum, { i, p }) => sum + i.qty * C.price(p),
        0,
      );
      const text = `Hola, Caberti. Soy ${name}. Me gustaría consultar este pedido:\n\n${items.map(({ i, p }) => `• ${i.qty} × ${p.name} — ${money(C.price(p) * i.qty)}${i.custom ? "\n  " + i.custom : ""}`).join("\n")}\n\nSubtotal de ejemplo: ${money(total)}\nEntrega: ${delivery === "domicilio" ? "A domicilio: " + address : "Recoger en punto por acordar"}\nMi contacto: ${phone}\nNotas: ${$("#customer-notes").value.trim() || "Ninguna"}\n\nFavor de confirmar precios reales, disponibilidad, envío y fecha de entrega.`;
      preview(text, "Vista previa de tu solicitud");
    });
    render();
  }
  $("#custom-request-form")?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const data = new FormData(ev.currentTarget);
    preview(
      `Hola, Caberti. Quiero armar un detalle personalizado.\nOcasión: ${data.get("occasion")}\nPresupuesto aproximado: ${data.get("budget") || "Por acordar"}\nMi idea: ${data.get("idea")}\nNombre: ${data.get("name")}\nContacto: ${data.get("phone")}`,
      "Tu idea para Caberti",
    );
  });
  $("[data-contact-preview]")?.addEventListener("click", () =>
    preview(
      "Hola, Caberti. Me gustaría conocer más sobre sus productos y entregas en Tapachula.",
      "Contactar a Caberti",
    ),
  );
  if (page === "personalizados")
    $("#custom-products").innerHTML = C.state.products
      .filter((p) => p.active && p.custom)
      .slice(0, 4)
      .map(card)
      .join("");
  $("#login-form")?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    location.href = "admin/index.html";
  });
})();
