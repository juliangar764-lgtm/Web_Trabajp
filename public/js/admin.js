/* Panel de administración. Todos los datos viven en la base de datos y se leen y escriben con la API. */
(async () => {
  "use strict";
  const C = window.Caberti,
    e = C.escape,
    money = C.money,
    $ = (s) => document.querySelector(s),
    page = document.body.dataset.page;
  document
    .querySelectorAll("[data-icon]")
    .forEach((el) => (el.innerHTML = C.icon(el.dataset.icon)));
  document
    .querySelectorAll("[data-close]")
    .forEach((b) =>
      b.addEventListener("click", () =>
        document.getElementById(b.dataset.close).close(),
      ),
    );
  $("#logout")?.addEventListener("click", () => C.logout());
  // "Salir" del menú lateral también cierra la sesión antes de ir al acceso.
  $('.side-bottom a[href$="acceso.html"]')?.addEventListener("click", async (ev) => {
    ev.preventDefault();
    const href = ev.currentTarget.href;
    await C.api("/auth/logout", { method: "POST" }).catch(() => {});
    location.href = href;
  });

  const toLogin = () =>
    (location.href =
      "/acceso.html?siguiente=" + encodeURIComponent(location.pathname));
  try {
    await C.ready;
  } catch (error) {
    C.toast(error.message);
    return;
  }
  if (C.state.user?.role !== "admin") return toLogin();
  const adminName = $(".admin-user");
  if (adminName)
    adminName.lastChild.textContent = C.state.user.name;

  /** Ejecuta una acción de la API mostrando el error del servidor; si la sesión caducó, vuelve al acceso. */
  async function attempt(action) {
    try {
      return await action();
    } catch (error) {
      if (error.status === 401) return toLogin();
      C.toast(error.message);
    }
  }

  const loadProducts = async () => {
    C.state.products = await C.api("/products?all=1");
    C.state.categoryList = await C.api("/categories");
    C.state.categories = C.state.categoryList.map((c) => c.name);
  };
  const loadMovements = () => C.api("/inventory/movements");
  const loadOrders = () => C.api("/orders");

  function table(headers, rows) {
    return `<table><thead><tr>${headers.map((h) => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows || `<tr><td colspan="${headers.length}">No hay registros para mostrar.</td></tr>`}</tbody></table>`;
  }
  function productLabel(p) {
    return `<div class="table-product">${C.photo(p)}<div>${e(p.name)}</div></div>`;
  }
  function orderRows(orders) {
    return orders
      .map(
        (o) =>
          `<tr><td><a class="text-link" href="pedido.html?id=${o.id}">#CB-${o.id}</a></td><td>${e(o.customer)}</td><td>${C.date(o.date)}</td><td>${money(C.subtotal(o) + (o.shipping || 0))}${o.shipping === null ? "<small>Envío pendiente</small>" : ""}</td><td>${C.badge(o.status)}</td><td><a class="text-link" href="pedido.html?id=${o.id}">Ver →</a></td></tr>`,
      )
      .join("");
  }
  function productOptions() {
    return C.state.products
      .filter((p) => p.active)
      .map((p) => `<option value="${p.id}">${e(p.name)}</option>`)
      .join("");
  }
  /** Cuerpo que espera la API para guardar un producto. */
  function productBody(p, changes = {}) {
    const merged = { ...p, ...changes };
    return {
      name: merged.name,
      categoryId: merged.categoryId,
      price: merged.price,
      sale: merged.sale,
      min: merged.min,
      custom: merged.custom,
      featured: merged.featured,
      active: merged.active,
      description: merged.description,
      images: merged.images,
    };
  }

  if (page === "resumen") {
    await attempt(async () => {
      const [orders] = await Promise.all([loadOrders(), loadProducts()]);
      const active = C.state.products.filter((p) => p.active),
        low = active.filter((p) => p.stock < p.min);
      $("#stats").innerHTML = [
        ["box", "Productos activos", active.length],
        [
          "list",
          "Pedidos pendientes",
          orders.filter((o) => o.status === "Pendiente").length,
        ],
        [
          "truck",
          "En preparación",
          orders.filter((o) => o.status === "En preparación").length,
        ],
        ["alert", "Stock bajo", low.length],
      ]
        .map(
          ([i, label, n]) =>
            `<div class="stat">${C.icon(i)}<div><span>${label}</span><strong>${n}</strong></div></div>`,
        )
        .join("");
      $("#recent-orders").innerHTML = table(
        ["Pedido", "Cliente", "Fecha", "Importe", "Estado", ""],
        orderRows(orders.slice(0, 5)),
      );
      $("#low-stock").innerHTML =
        low
          .map(
            (p) =>
              `<a class="stock-item" href="inventario.html">${C.photo(p)}<div><strong>${e(p.name)}</strong><span>${p.stock} disponibles · mínimo ${p.min}</span></div></a>`,
          )
          .join("") ||
        '<p class="muted">No hay productos por debajo de su mínimo.</p>';
    });
  }
  if (page === "productos") {
    const form = $("#admin-product-form");
    let photos = []; // fotos del producto abierto en el formulario
    function renderPhotos() {
      $("#product-photos").innerHTML = photos
        .map((path, i) => {
          const src = C.assetUrl(path);
          return src
            ? `<span class="photo-item"><img src="${src}" alt="Foto ${i + 1}"><button class="text-link" type="button" data-photo-remove="${i}">Quitar</button></span>`
            : "";
        })
        .join("");
    }
    $("#product-photos").addEventListener("click", (ev) => {
      const remove = ev.target.closest("[data-photo-remove]");
      if (!remove) return;
      photos.splice(Number(remove.dataset.photoRemove), 1);
      renderPhotos();
    });
    function render() {
      const query = $("#admin-search").value.toLocaleLowerCase("es");
      $("#products-table").innerHTML = table(
        [
          "Producto",
          "Categoría",
          "Precio",
          "Existencias",
          "Estado",
          "Acciones",
        ],
        C.state.products
          .filter((p) => p.name.toLocaleLowerCase("es").includes(query))
          .map(
            (p) =>
              `<tr><td>${productLabel(p)}</td><td>${e(p.category)}</td><td>${money(C.price(p))}</td><td>${p.stock}</td><td><span class="badge ${p.active ? "green" : "gray"}">${p.active ? "Activo" : "Inactivo"}</span></td><td><div class="table-actions"><button data-edit="${p.id}">Editar</button><button data-toggle="${p.id}">${p.active ? "Desactivar" : "Activar"}</button></div></td></tr>`,
          )
          .join(""),
      );
    }
    function open(id) {
      form.reset();
      $("#product-category").innerHTML = C.state.categoryList
        .map((c) => `<option value="${c.id}">${e(c.name)}</option>`)
        .join("");
      const p = C.product(id);
      photos = [...(p?.images || [])];
      renderPhotos();
      form.elements.id.value = p?.id || "";
      $("#product-dialog-title").textContent = p
        ? "Editar producto"
        : "Nuevo producto";
      if (p) {
        for (const key of ["name", "price", "min", "description"])
          form.elements[key].value = p[key] ?? "";
        form.elements.category.value = p.categoryId;
        form.elements.sale.value = p.sale || "";
        for (const key of ["custom", "featured", "active"])
          form.elements[key].checked = Boolean(p[key]);
      }
      $("#product-dialog").showModal();
    }
    $("#new-product").addEventListener("click", () => open());
    $("#admin-search").addEventListener("input", render);
    $("#products-table").addEventListener("click", (ev) => {
      const edit = ev.target.closest("[data-edit]"),
        toggle = ev.target.closest("[data-toggle]");
      if (edit) open(edit.dataset.edit);
      if (toggle)
        attempt(async () => {
          const p = C.product(toggle.dataset.toggle);
          await C.api("/products/" + p.id, {
            method: "PUT",
            body: productBody(p, { active: !p.active }),
          });
          await loadProducts();
          render();
          C.toast(!p.active ? "Producto activado." : "Producto desactivado.");
        });
    });
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const data = new FormData(form),
        name = String(data.get("name")).trim(),
        price = Number(data.get("price")),
        sale = data.get("sale") ? Number(data.get("sale")) : null,
        min = Number(data.get("min")),
        file = data.get("photo");
      if (
        !name ||
        price <= 0 ||
        !Number.isFinite(price) ||
        !Number.isInteger(min) ||
        min < 0 ||
        (sale !== null &&
          (!Number.isFinite(sale) || sale <= 0 || sale >= price))
      ) {
        C.toast(
          "Revisa el nombre, precio y mínimo. La promoción debe ser menor que el precio normal.",
        );
        return;
      }
      if (
        file?.size &&
        (!["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
          file.size > 1024 * 1024)
      ) {
        C.toast("Elige una imagen JPG, PNG o WebP de hasta 1 MB.");
        return;
      }
      const button = form.querySelector("button[type=submit],button.btn");
      button.disabled = true;
      await attempt(async () => {
        const original = C.product(data.get("id")),
          body = productBody(original || { images: [] }, {
            name,
            categoryId: Number(data.get("category")),
            price,
            sale,
            min,
            description: String(data.get("description")).trim(),
            custom: data.has("custom"),
            featured: data.has("featured"),
            active: data.has("active"),
            images: photos,
          });
        const saved = original
          ? await C.api("/products/" + original.id, { method: "PUT", body })
          : await C.api("/products", { method: "POST", body });
        if (file?.size)
          await C.api(`/products/${saved.id}/images`, {
            method: "POST",
            raw: file,
            contentType: file.type,
          });
        await loadProducts();
        $("#product-dialog").close();
        render();
        C.toast("Producto guardado.");
      });
      button.disabled = false;
    });
    await attempt(async () => {
      await loadProducts();
      render();
      if (new URLSearchParams(location.search).has("nuevo")) open();
    });
  }
  if (page === "categorias") {
    const form = $("#category-form");
    function render() {
      $("#categories-table").innerHTML = table(
        ["Categoría", "Productos", "Acciones"],
        C.state.categoryList
          .map(
            (c) =>
              `<tr><td>${e(c.name)}</td><td>${C.state.products.filter((p) => p.categoryId === c.id).length}</td><td><div class="table-actions"><button data-category-edit="${c.id}">Editar</button><button data-category-delete="${c.id}">Eliminar</button></div></td></tr>`,
          )
          .join(""),
      );
    }
    function reset() {
      form.reset();
      form.elements.original.value = "";
      $("#category-title").textContent = "Nueva categoría";
    }
    const byId = (id) => C.state.categoryList.find((c) => c.id === Number(id));
    $("#cancel-category").addEventListener("click", reset);
    $("#categories-table").addEventListener("click", (ev) => {
      const edit = ev.target.closest("[data-category-edit]"),
        del = ev.target.closest("[data-category-delete]");
      if (edit) {
        const category = byId(edit.dataset.categoryEdit);
        form.elements.original.value = category.id;
        form.elements.name.value = category.name;
        $("#category-title").textContent = "Editar categoría";
        form.elements.name.focus();
      }
      if (del) {
        const category = byId(del.dataset.categoryDelete);
        if (C.state.products.some((p) => p.categoryId === category.id)) {
          C.toast(
            "Esta categoría tiene productos. Cámbialos de categoría antes de eliminarla.",
          );
          return;
        }
        if (confirm("¿Eliminar la categoría " + category.name + "?"))
          attempt(async () => {
            await C.api("/categories/" + category.id, { method: "DELETE" });
            await loadProducts();
            render();
            reset();
            C.toast("Categoría eliminada.");
          });
      }
    });
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const name = form.elements.name.value.trim(),
        original = form.elements.original.value;
      if (!name) {
        C.toast("Escribe un nombre para la categoría.");
        return;
      }
      attempt(async () => {
        if (original)
          await C.api("/categories/" + original, {
            method: "PUT",
            body: { name },
          });
        else await C.api("/categories", { method: "POST", body: { name } });
        await loadProducts();
        render();
        reset();
        C.toast("Categoría guardada.");
      });
    });
    await attempt(async () => {
      await loadProducts();
      render();
    });
  }
  if (page === "inventario") {
    let movements = [];
    function render() {
      const query = $("#inventory-search").value.toLocaleLowerCase("es");
      $("#inventory-table").innerHTML = table(
        ["Producto", "Existencias", "Mínimo", "Estado"],
        C.state.products
          .filter(
            (p) => p.active && p.name.toLocaleLowerCase("es").includes(query),
          )
          .map(
            (p) =>
              `<tr><td>${productLabel(p)}</td><td><strong>${p.stock}</strong></td><td>${p.min}</td><td><span class="badge ${p.stock < p.min ? "amber" : "green"}">${p.stock < p.min ? "Stock bajo" : "Disponible"}</span></td></tr>`,
          )
          .join(""),
      );
      $("#movements-table").innerHTML = table(
        ["Fecha", "Producto", "Movimiento", "Cantidad", "Motivo"],
        movements
          .slice(0, 20)
          .map(
            (m) =>
              `<tr><td>${C.date(m.date)}</td><td>${e(m.name)}</td><td><span class="badge ${m.delta > 0 ? "green" : "amber"}">${m.delta > 0 ? "Entrada" : "Salida"}</span></td><td>${m.delta > 0 ? "+" : ""}${m.delta}</td><td>${e(m.reason)}</td></tr>`,
          )
          .join(""),
      );
    }
    async function refresh() {
      [movements] = await Promise.all([loadMovements(), loadProducts()]);
      $("#movement-product").innerHTML = productOptions();
      render();
    }
    $("#inventory-search").addEventListener("input", render);
    $("#movement-form").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const form = ev.currentTarget,
        data = new FormData(form),
        qty = Number(data.get("qty")),
        sign = Number(data.get("type")),
        reason = String(data.get("reason")).trim();
      if (!data.get("product") || !Number.isInteger(qty) || qty < 1 || !reason) {
        C.toast("Revisa el producto, la cantidad y el motivo.");
        return;
      }
      attempt(async () => {
        await C.api("/inventory/movements", {
          method: "POST",
          body: {
            productId: Number(data.get("product")),
            delta: qty * sign,
            reason,
          },
        });
        await refresh();
        form.elements.reason.value = "";
        C.toast("Movimiento registrado.");
      });
    });
    await attempt(refresh);
  }
  if (page === "pedidos") {
    const PAGE_SIZE = 25;
    let orders = [],
      pageIndex = 0;
    function render() {
      const query = $("#order-search").value.toLocaleLowerCase("es"),
        status = $("#order-status").value,
        found = orders.filter(
          (o) =>
            (!status || o.status === status) &&
            ("cb-" + o.id + " " + o.customer)
              .toLocaleLowerCase("es")
              .includes(query),
        ),
        pages = Math.max(1, Math.ceil(found.length / PAGE_SIZE));
      pageIndex = Math.min(pageIndex, pages - 1);
      $("#orders-table").innerHTML = table(
        ["Pedido", "Cliente", "Fecha", "Importe", "Estado", ""],
        orderRows(found.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE)),
      );
      // La paginación solo aparece cuando los pedidos no caben en una página.
      const pager = $("#orders-pager");
      pager.hidden = pages < 2;
      pager.innerHTML =
        pages < 2
          ? ""
          : `<button class="btn btn-outline btn-small" type="button" data-page-step="-1" ${pageIndex === 0 ? "disabled" : ""}>← Anteriores</button><span class="small">Página ${pageIndex + 1} de ${pages} · ${found.length} pedidos</span><button class="btn btn-outline btn-small" type="button" data-page-step="1" ${pageIndex === pages - 1 ? "disabled" : ""}>Siguientes →</button>`;
    }
    const firstPage = () => {
      pageIndex = 0;
      render();
    };
    $("#order-search").addEventListener("input", firstPage);
    $("#order-status").addEventListener("change", firstPage);
    $("#orders-pager").addEventListener("click", (ev) => {
      const step = ev.target.closest("[data-page-step]");
      if (!step || step.disabled) return;
      pageIndex += Number(step.dataset.pageStep);
      render();
    });
    $("#new-order").addEventListener("click", () =>
      $("#order-dialog").showModal(),
    );
    $("#new-order-form").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const data = new FormData(ev.currentTarget),
        qty = Number(data.get("qty")),
        name = String(data.get("customer")).trim();
      if (!data.get("product") || !name || !Number.isInteger(qty) || qty < 1) {
        C.toast("Revisa los datos del pedido.");
        return;
      }
      attempt(async () => {
        const order = await C.api("/orders", {
          method: "POST",
          body: {
            customer: name,
            delivery: "domicilio",
            address: "Por confirmar",
            notes: "Pedido registrado desde el panel",
            items: [
              {
                productId: Number(data.get("product")),
                qty,
                custom: String(data.get("custom")).trim(),
              },
            ],
          },
        });
        location.href = "pedido.html?id=" + order.id;
      });
    });
    await attempt(async () => {
      [orders] = await Promise.all([loadOrders(), loadProducts()]);
      $("#new-order-product").innerHTML = productOptions();
      render();
      if (new URLSearchParams(location.search).has("nuevo"))
        $("#order-dialog").showModal();
    });
  }
  if (page === "reporte") {
    // Pedidos que ya descontaron existencias: son las ventas.
    const SALES = ["Confirmado", "En preparación", "Entregado"];
    const form = $("#report-form"),
      fields = form.elements;
    let orders = [];
    // Día local (AAAA-MM-DD) para comparar con los campos de fecha.
    const localDay = (value) => {
      const d = new Date(value);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    const fullDate = (value) =>
      new Date(value).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    const stats = (items) =>
      `<div class="stats report-stats">${items.map(([label, value]) => `<div class="stat"><div><span>${label}</span><strong>${value}</strong></div></div>`).join("")}</div>`;

    function render() {
      const sales = fields.type.value === "ventas",
        from = fields.from.value,
        to = fields.to.value;
      fields.status.disabled = sales;
      const status = sales ? "" : fields.status.value;
      const rows = orders
        .filter((o) => {
          const day = localDay(o.date);
          return (
            (sales ? SALES.includes(o.status) : !status || o.status === status) &&
            (!from || day >= from) &&
            (!to || day <= to)
          );
        })
        .reverse(); // la API los entrega del más reciente al más antiguo
      const title = sales ? "Reporte de ventas" : "Reporte de pedidos",
        period =
          from || to
            ? `${from ? "del " + fullDate(from + "T00:00") : "desde el inicio"} ${to ? "al " + fullDate(to + "T00:00") : "a la fecha"}`
            : "todo el historial",
        products = rows.reduce((sum, o) => sum + C.subtotal(o), 0),
        shipping = rows.reduce((sum, o) => sum + (o.shipping || 0), 0),
        byStatus = (list) => rows.filter((o) => list.includes(o.status)).length;
      // El título de la página es el nombre que el navegador propone para el PDF.
      document.title = `${title} ${from || "inicio"} a ${to || localDay(Date.now())} | CabertiStack`;

      const top = new Map();
      if (sales)
        for (const o of rows)
          for (const i of o.items) {
            const entry = top.get(i.productId) ?? { name: i.name, qty: 0, amount: 0 };
            entry.qty += i.qty;
            entry.amount += i.qty * i.price;
            top.set(i.productId, entry);
          }

      $("#report").innerHTML =
        `<div class="section-heading"><div><p class="eyebrow print-only">CabertiStack</p><h2>${title}</h2><p class="muted small">Periodo: ${period}${status ? " · Estado: " + e(status) : ""} · Generado el ${fullDate(Date.now())}</p></div></div>` +
        stats(
          sales
            ? [
                ["Pedidos vendidos", rows.length],
                ["Productos", money(products)],
                ["Envíos", money(shipping)],
                ["Total vendido", money(products + shipping)],
              ]
            : [
                ["Pedidos", rows.length],
                ["Pendientes", byStatus(["Pendiente"])],
                ["Vendidos", byStatus(SALES)],
                ["Cancelados", byStatus(["Cancelado"])],
              ],
        ) +
        `<div class="table-wrap">${table(
          ["Pedido", "Fecha", "Cliente", "Artículos", "Estado", "Subtotal", "Envío", "Total"],
          rows
            .map(
              (o) =>
                `<tr><td>#CB-${o.id}</td><td>${fullDate(o.date)}</td><td class="report-wrap">${e(o.customer)}</td><td class="report-wrap report-items">${o.items.map((i) => `${i.qty} × ${e(i.name)}`).join("<br>")}</td><td>${e(o.status)}</td><td>${money(C.subtotal(o))}</td><td>${o.shipping === null ? "Pendiente" : money(o.shipping)}</td><td>${money(C.subtotal(o) + (o.shipping || 0))}</td></tr>`,
            )
            .join("") +
            (sales && rows.length
              ? `<tr class="report-total"><td colspan="5">Total</td><td>${money(products)}</td><td>${money(shipping)}</td><td>${money(products + shipping)}</td></tr>`
              : ""),
        )}</div>` +
        (top.size
          ? `<h2>Productos más vendidos</h2><div class="table-wrap">${table(
              ["Producto", "Unidades", "Importe"],
              [...top.values()]
                .sort((a, b) => b.qty - a.qty || b.amount - a.amount)
                .slice(0, 10)
                .map((p) => `<tr><td>${e(p.name)}</td><td>${p.qty}</td><td>${money(p.amount)}</td></tr>`)
                .join(""),
            )}</div>`
          : "");
    }
    // Por defecto, el mes en curso.
    const today = localDay(Date.now());
    fields.from.value = today.slice(0, 8) + "01";
    fields.to.value = today;
    form.addEventListener("input", render);
    form.addEventListener("submit", (ev) => ev.preventDefault());
    $("#print-report").addEventListener("click", () => window.print());
    await attempt(async () => {
      orders = await loadOrders();
      render();
    });
  }
  if (page === "pedido-admin") {
    const id = Number(new URLSearchParams(location.search).get("id")),
      states = [
        "Pendiente",
        "Confirmado",
        "En preparación",
        "Entregado",
        "Cancelado",
      ];
    let o;
    try {
      o = await C.api("/orders/" + id);
    } catch (_) {
      $("#admin-order-detail").innerHTML =
        '<div class="empty"><h2>No encontramos este pedido</h2><a class="btn" href="pedidos.html">Volver a pedidos</a></div>';
      return;
    }
    function whatsappLink() {
      const digits = String(o.phone || "").replace(/\D/g, "");
      if (digits.length < 10) return "";
      const number = digits.length === 10 ? "52" + digits : digits;
      return `<p><a class="text-link" href="https://wa.me/${number}" target="_blank" rel="noopener">Escribir por WhatsApp →</a></p>`;
    }
    function render() {
      const subtotal = C.subtotal(o);
      $("#admin-order-detail").innerHTML =
        `<div class="section-heading"><div><h2>Pedido #CB-${o.id}</h2><p class="muted small">${C.date(o.date)}</p></div>${C.badge(o.status)}</div><div class="admin-grid"><div class="stack"><section class="panel"><h2>Artículos del pedido</h2><div class="table-wrap">${table(["Producto", "Cantidad", "Precio unitario", "Importe"], o.items.map((i) => `<tr><td><div class="table-product">${C.photo(i)}<div>${e(i.name)}<small>${e(i.custom)}</small></div></div></td><td>${i.qty}</td><td>${money(i.price)}</td><td>${money(i.qty * i.price)}</td></tr>`).join(""))}</div></section><div class="form-row"><section class="panel"><h2>Cliente</h2><p>${e(o.customer)}</p><p class="muted small">${e(o.phone) || "Sin teléfono"}</p>${whatsappLink()}</section><section class="panel"><h2>Entrega</h2><p>${o.delivery === "domicilio" ? "A domicilio" : "Recoger en punto acordado"}</p><p class="muted small">${e(o.address)}</p><p class="small">${e(o.notes)}</p></section></div></div><form class="panel" id="order-update-form"><h2>Resumen del pedido</h2><div class="row small"><span>Productos</span><strong>${money(subtotal)}</strong></div><hr class="divider"><label class="field">Costo de envío (MXN)<input name="shipping" id="shipping-input" type="number" min="0" max="999999" step="0.01" value="${o.shipping ?? ""}" placeholder="Por confirmar"></label><div class="row"><strong>Total final</strong><strong id="final-total">${o.shipping === null ? "Por confirmar" : money(subtotal + o.shipping)}</strong></div><hr class="divider"><h2>Actualizar estado</h2><label class="field">Estado<select name="status">${states.map((s) => `<option ${o.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></label><ul class="timeline">${states
          .slice(0, 4)
          .map((s) => `<li class="${o.status === s ? "active" : ""}">${s}</li>`)
          .join(
            "",
          )}</ul><button class="btn full">Guardar cambios</button><p class="note">Al confirmar el pedido se descuentan las existencias; si se cancela, se devuelven.</p></form></div>`;
      $("#shipping-input").addEventListener("input", (ev) => {
        $("#final-total").textContent =
          ev.target.value === ""
            ? "Por confirmar"
            : money(subtotal + Number(ev.target.value));
      });
      $("#order-update-form").addEventListener("submit", (ev) => {
        ev.preventDefault();
        const data = new FormData(ev.currentTarget),
          status = String(data.get("status")),
          shipping =
            data.get("shipping") === "" ? null : Number(data.get("shipping"));
        if (shipping !== null && (!Number.isFinite(shipping) || shipping < 0)) {
          C.toast("Revisa el costo de envío.");
          return;
        }
        attempt(async () => {
          o = await C.api(`/orders/${o.id}/status`, {
            method: "PATCH",
            body: { status, shipping },
          });
          render();
          C.toast("Pedido actualizado.");
        });
      });
    }
    render();
  }
})();
