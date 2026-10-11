/* Interacciones del sitio público: catálogo, carrito, cuenta y pedidos por WhatsApp. */
(async () => {
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
  try {
    await C.ready;
  } catch (error) {
    C.toast(error.message);
    return;
  }
  // Acceso a la cuenta en el encabezado: "Ingresar" o el nombre con opción de salir.
  const cartLink = $(".cart-link");
  if (cartLink) {
    const user = C.state.user;
    const account = document.createElement("span");
    account.className = "account";
    account.innerHTML = user
      ? `<a class="account-link" href="${user.role === "admin" ? "/admin/index.html" : "/pedido.html"}">${e(user.name.split(" ")[0])}</a><button class="account-exit" type="button">Salir</button>`
      : `<a class="account-link" href="/acceso.html?siguiente=${encodeURIComponent((location.pathname.slice(1) || "index.html") + location.search)}">Ingresar</a>`;
    account.querySelector(".account-exit")?.addEventListener("click", () => C.logout());
    cartLink.before(account);
  }
  // Para agregar al pedido o personalizar hace falta una cuenta: se manda a crearla
  // (la página de registro ofrece iniciar sesión) y después se vuelve a esta misma página.
  function requireAccount() {
    if (C.state.user) return true;
    const back = (location.pathname.slice(1) || "index.html") + location.search;
    location.href = "/registro.html?siguiente=" + encodeURIComponent(back);
    return false;
  }
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
  // Muestra el mensaje y un botón que lo abre en WhatsApp con el número de Caberti.
  function preview(text, title = "Tu mensaje para CabertiStack", note) {
    const dialog = $("#request-dialog"),
      url = C.whatsappUrl(text);
    $("#request-title").textContent = title;
    $("#request-message").value = text;
    dialog.querySelector(".eyebrow").textContent = "WhatsApp";
    dialog.querySelector("p.muted.small").textContent =
      note ||
      (url
        ? "Revisa el mensaje y ábrelo en WhatsApp para enviarlo a CabertiStack."
        : "El número de WhatsApp de CabertiStack aún no está configurado. Selecciona el mensaje y envíalo por tu cuenta.");
    let link = $("#open-whatsapp");
    if (!link) {
      link = document.createElement("a");
      link.id = "open-whatsapp";
      link.className = "btn btn-green";
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Abrir WhatsApp";
      $("#request-message").closest("label").after(link);
    }
    link.hidden = !url;
    if (url) link.href = url;
    dialog.showModal();
  }
  $("[data-close-dialog]")?.addEventListener("click", () =>
    $("#request-dialog").close(),
  );
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
    document.title = p.name + " | CabertiStack";
    $("#product-breadcrumb").textContent = p.name;
    const pics = (p.images || []).map(C.assetUrl).filter(Boolean);
    let color = "Crema";
    $("#product-content").innerHTML =
      `<div class="detail-layout"><div><div class="gallery-main"><img id="gallery-image" src="${e(pics[0] || "/assets/productos/02.jpg")}" alt="${e(p.name)}"></div><div class="thumbs">${pics.map((src, i) => `<button type="button" class="thumb ${i === 0 ? "selected" : ""}" data-picture="${i}" aria-label="Ver fotografía ${i + 1}" aria-pressed="${i === 0}"><img src="${e(src)}" alt=""></button>`).join("")}</div><p class="note">Fotografías proporcionadas por CabertiStack.</p></div><div class="detail-info"><p class="eyebrow">${e(p.category)}</p><h1>${e(p.name)}</h1><div class="row"><p class="price">${money(C.price(p))}</p><span class="badge ${p.stock > 0 ? "green" : "gray"}">${p.stock > 0 ? "Disponible" : "Agotado"}</span></div><p class="muted">${e(p.description)}</p><hr class="divider"><form id="product-form">${p.id === 2 ? '<span class="small">Color de ejemplo</span><div class="swatches"><button type="button" class="swatch" data-color="Crema" aria-pressed="true"><i class="color-cream"></i>Crema</button><button type="button" class="swatch" data-color="Rosa" aria-pressed="false"><i class="color-rose"></i>Rosa</button><button type="button" class="swatch" data-color="Negro" aria-pressed="false"><i class="color-black"></i>Negro</button></div>' : ""}${p.custom ? '<label class="field">¿Cómo lo personalizamos?<textarea id="custom-text" maxlength="250" placeholder="Nombre, frase, ocasión o idea para tu regalo"></textarea><small>Opcional. Confirmaremos contigo las opciones y el diseño.</small></label>' : ""}<div class="quantity-row"><span class="small">Cantidad</span><div class="qty"><button type="button" id="qty-down" aria-label="Disminuir cantidad">−</button><input id="product-qty" type="number" min="1" max="${Math.max(1, p.stock)}" value="1" aria-label="Cantidad"><button type="button" id="qty-up" aria-label="Aumentar cantidad">+</button></div></div><div class="actions"><button class="btn" ${p.stock < 1 ? "disabled" : ""}>${C.icon("bag")} Agregar a mi pedido</button><button type="button" class="btn btn-outline" id="consult-product">Consultar</button></div><p class="note">El diseño, el costo de envío y la fecha de entrega se confirman con CabertiStack.</p></form><hr class="divider"><div class="row"><span class="small">${C.icon("gift")} Un detalle a tu estilo</span><span class="small">${C.icon("truck")} Entrega en Tapachula</span></div></div></div><section class="section"><div class="section-heading"><h2>También puede gustarte</h2><a class="text-link" href="catalogo.html">Ver catálogo →</a></div><div class="product-grid">${C.state.products
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
      if (!requireAccount()) return;
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
        C.toast("La cantidad supera las existencias disponibles.");
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
        `Hola, CabertiStack. Quisiera información sobre ${p.name}.\nPersonalización: ${$("#custom-text")?.value.trim() || "Por acordar"}.`,
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
          C.toast("No hay más existencias disponibles.");
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
    // Con sesión iniciada, los datos de la cuenta se llenan solos.
    const user = C.state.user;
    if (user) {
      $("#customer-name").value = user.name;
      $("#customer-phone").value = user.phone;
    }
    $("#checkout-note").innerHTML = user
      ? `Pedido a nombre de <strong>${e(user.email)}</strong>. Se guarda en tu cuenta y luego lo envías por WhatsApp.`
      : 'Para enviar tu pedido necesitas una cuenta. <a class="text-link" href="/acceso.html?siguiente=pedido.html">Inicia sesión</a> o <a class="text-link" href="/registro.html?siguiente=pedido.html">crea una cuenta</a>.';
    $("#checkout-form").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      if (!C.state.user) {
        location.href = "/acceso.html?siguiente=pedido.html";
        return;
      }
      const name = $("#customer-name").value.trim(),
        phone = $("#customer-phone").value.trim(),
        delivery = $("[name=delivery]:checked").value,
        address = $("#customer-address").value.trim(),
        notes = $("#customer-notes").value.trim();
      if (!name || phone.replace(/\D/g, "").length < 10) {
        C.toast("Escribe un nombre y un número de contacto válido.");
        return;
      }
      const items = C.state.cart.map((i) => ({ i, p: C.product(i.productId) }));
      if (items.some(({ i, p }) => !p || !p.active || i.qty > p.stock)) {
        C.toast("Hay un producto sin disponibilidad. Revisa tu pedido.");
        return;
      }
      const button = ev.submitter || $("#checkout-form button[type=submit]");
      button.disabled = true;
      try {
        // El servidor toma nombre y precio de la base de datos; aquí solo se envía qué y cuánto.
        const order = await C.api("/orders", {
          method: "POST",
          body: {
            customer: name,
            phone,
            delivery,
            address: delivery === "domicilio" ? address : "",
            notes,
            items: C.state.cart.map((i) => ({ productId: i.productId, qty: i.qty, custom: i.custom })),
          },
        });
        C.state.cart = [];
        C.saveCart();
        render();
        const total = C.subtotal(order);
        const text = `Hola, CabertiStack. Soy ${order.customer}. Acabo de registrar el pedido #CB-${order.id}:\n\n${order.items.map((i) => `• ${i.qty} × ${i.name} — ${money(i.price * i.qty)}${i.custom ? "\n  " + i.custom : ""}`).join("\n")}\n\nSubtotal: ${money(total)}\nEntrega: ${delivery === "domicilio" ? "A domicilio: " + address : "Recoger en punto por acordar"}\nMi contacto: ${order.phone}\nNotas: ${notes || "Ninguna"}\n\nFavor de confirmar el costo de envío y la fecha de entrega.`;
        preview(text, `Pedido #CB-${order.id} registrado`, "Tu pedido ya quedó registrado. Envía este mensaje a CabertiStack por WhatsApp para confirmarlo.");
      } catch (error) {
        C.toast(error.message);
      } finally {
        button.disabled = false;
      }
    });
    render();
  }
  if (page === "personalizados" && !requireAccount()) return;
  $("#custom-request-form")?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    if (!requireAccount()) return;
    const data = new FormData(ev.currentTarget);
    preview(
      `Hola, CabertiStack. Quiero armar un detalle personalizado.\nOcasión: ${data.get("occasion")}\nPresupuesto aproximado: ${data.get("budget") || "Por acordar"}\nMi idea: ${data.get("idea")}\nNombre: ${data.get("name")}\nContacto: ${data.get("phone")}`,
      "Tu idea para CabertiStack",
    );
  });
  $("[data-contact-preview]")?.addEventListener("click", () =>
    preview(
      "Hola, CabertiStack. Me gustaría conocer más sobre sus productos y entregas en Tapachula.",
      "Contactar a CabertiStack",
    ),
  );
  if (page === "personalizados")
    $("#custom-products").innerHTML = C.state.products
      .filter((p) => p.active && p.custom)
      .slice(0, 4)
      .map(card)
      .join("");
})();
