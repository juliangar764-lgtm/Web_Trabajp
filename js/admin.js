/* Panel de demostración. No autentica usuarios ni se conecta a una base de datos. */
(() => {
  "use strict";
  const C = window.Caberti,
    e = C.escape,
    money = C.money,
    $ = (s) => document.querySelector(s),
    page = document.body.dataset.page;
  document
    .querySelectorAll("[data-icon]")
    .forEach((el) => (el.innerHTML = C.icon(el.dataset.icon)));
  $("#reset-demo").addEventListener("click", () => {
    if (
      confirm(
        "¿Restablecer todos los datos de ejemplo? Se perderán los cambios locales del catálogo, inventario y pedidos.",
      )
    )
      C.reset();
  });
  document
    .querySelectorAll("[data-close]")
    .forEach((b) =>
      b.addEventListener("click", () =>
        document.getElementById(b.dataset.close).close(),
      ),
    );
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
  if (page === "resumen") {
    const active = C.state.products.filter((p) => p.active),
      low = active.filter((p) => p.stock < p.min);
    $("#stats").innerHTML = [
      ["box", "Productos activos", active.length],
      [
        "list",
        "Pedidos pendientes",
        C.state.orders.filter((o) => o.status === "Pendiente").length,
      ],
      [
        "truck",
        "En preparación",
        C.state.orders.filter((o) => o.status === "En preparación").length,
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
      orderRows([...C.state.orders].sort((a, b) => b.id - a.id).slice(0, 5)),
    );
    $("#low-stock").innerHTML =
      low
        .map(
          (p) =>
            `<a class="stock-item" href="inventario.html">${C.photo(p)}<div><strong>${e(p.name)}</strong><span>${p.stock} disponibles · mínimo ${p.min}</span></div></a>`,
        )
        .join("") ||
      '<p class="muted">No hay productos por debajo de su mínimo.</p>';
  }
  if (page === "productos") {
    const form = $("#admin-product-form");
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
      $("#product-category").innerHTML = C.state.categories
        .map((c) => `<option>${e(c)}</option>`)
        .join("");
      const p = C.product(id);
      form.elements.id.value = p?.id || "";
      $("#product-dialog-title").textContent = p
        ? "Editar producto"
        : "Nuevo producto";
      if (p) {
        for (const key of ["name", "category", "price", "min", "description"])
          form.elements[key].value = p[key] ?? "";
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
      if (toggle) {
        const p = C.product(toggle.dataset.toggle);
        p.active = !p.active;
        C.save();
        render();
        C.toast(p.active ? "Producto activado." : "Producto desactivado.");
      }
    });
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const data = new FormData(form),
        name = String(data.get("name")).trim(),
        price = Number(data.get("price")),
        sale = data.get("sale") ? Number(data.get("sale")) : null,
        min = Number(data.get("min"));
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
      const button = form.querySelector("button[type=submit],button.btn");
      button.disabled = true;
      try {
        const original = C.product(data.get("id")),
          p = {
            ...original,
            id: original?.id || C.nextId(C.state.products),
            name,
            category: String(data.get("category")),
            price,
            sale,
            min,
            description: String(data.get("description")).trim(),
            custom: data.has("custom"),
            featured: data.has("featured"),
            active: data.has("active"),
            stock: original?.stock || 0,
          };
        const file = data.get("photo");
        if (file?.size) {
          if (
            !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
            file.size > 1024 * 1024
          ) {
            C.toast("Elige una imagen JPG, PNG o WebP de hasta 1 MB.");
            return;
          }
          p.image = await new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result);
            r.onerror = reject;
            r.readAsDataURL(file);
          });
        }
        if (original) Object.assign(original, p);
        else C.state.products.push(p);
        const saved = C.save();
        $("#product-dialog").close();
        render();
        if (saved) C.toast("Producto guardado en la demostración.");
      } finally {
        button.disabled = false;
      }
    });
    render();
    if (new URLSearchParams(location.search).has("nuevo")) open();
  }
  if (page === "categorias") {
    const form = $("#category-form");
    function render() {
      $("#categories-table").innerHTML = table(
        ["Categoría", "Productos", "Acciones"],
        C.state.categories
          .map(
            (c, i) =>
              `<tr><td>${e(c)}</td><td>${C.state.products.filter((p) => p.category === c).length}</td><td><div class="table-actions"><button data-category-edit="${i}">Editar</button><button data-category-delete="${i}">Eliminar</button></div></td></tr>`,
          )
          .join(""),
      );
    }
    function reset() {
      form.reset();
      form.elements.original.value = "";
      $("#category-title").textContent = "Nueva categoría";
    }
    $("#cancel-category").addEventListener("click", reset);
    $("#categories-table").addEventListener("click", (ev) => {
      const edit = ev.target.closest("[data-category-edit]"),
        del = ev.target.closest("[data-category-delete]");
      if (edit) {
        const name = C.state.categories[Number(edit.dataset.categoryEdit)];
        form.elements.original.value = name;
        form.elements.name.value = name;
        $("#category-title").textContent = "Editar categoría";
        form.elements.name.focus();
      }
      if (del) {
        const name = C.state.categories[Number(del.dataset.categoryDelete)];
        if (C.state.products.some((p) => p.category === name)) {
          C.toast(
            "Esta categoría tiene productos. Cámbialos de categoría antes de eliminarla.",
          );
          return;
        }
        if (confirm("¿Eliminar la categoría " + name + "?")) {
          C.state.categories = C.state.categories.filter((c) => c !== name);
          C.save();
          render();
          reset();
        }
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
      if (
        C.state.categories.some(
          (c) =>
            c.toLocaleLowerCase("es") === name.toLocaleLowerCase("es") &&
            c !== original,
        )
      ) {
        C.toast("Ya existe esa categoría.");
        return;
      }
      if (original) {
        C.state.categories = C.state.categories.map((c) =>
          c === original ? name : c,
        );
        C.state.products.forEach((p) => {
          if (p.category === original) p.category = name;
        });
      } else C.state.categories.push(name);
      C.save();
      render();
      reset();
      C.toast("Categoría guardada.");
    });
    render();
  }
  if (page === "inventario") {
    $("#movement-product").innerHTML = productOptions();
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
        [...C.state.movements]
          .sort((a, b) => b.id - a.id)
          .slice(0, 20)
          .map(
            (m) =>
              `<tr><td>${C.date(m.date)}</td><td>${e(C.product(m.productId)?.name || "Producto")}</td><td><span class="badge ${m.delta > 0 ? "green" : "amber"}">${m.delta > 0 ? "Entrada" : "Salida"}</span></td><td>${m.delta > 0 ? "+" : ""}${m.delta}</td><td>${e(m.reason)}</td></tr>`,
          )
          .join(""),
      );
    }
    $("#inventory-search").addEventListener("input", render);
    $("#movement-form").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const data = new FormData(ev.currentTarget),
        p = C.product(data.get("product")),
        qty = Number(data.get("qty")),
        sign = Number(data.get("type")),
        reason = String(data.get("reason")).trim();
      if (!p || !Number.isInteger(qty) || qty < 1 || !reason) {
        C.toast("Revisa el producto, la cantidad y el motivo.");
        return;
      }
      const delta = qty * sign;
      if (p.stock + delta < 0) {
        C.toast("La salida supera las existencias disponibles.");
        return;
      }
      p.stock += delta;
      C.state.movements.push({
        id: C.nextId(C.state.movements),
        productId: p.id,
        delta,
        reason,
        date: new Date().toISOString(),
        user: "Administrador",
      });
      C.save();
      render();
      ev.currentTarget.elements.reason.value = "";
      C.toast("Movimiento registrado en la demostración.");
    });
    render();
  }
  if (page === "pedidos") {
    $("#new-order-product").innerHTML = productOptions();
    function render() {
      const query = $("#order-search").value.toLocaleLowerCase("es"),
        status = $("#order-status").value;
      const orders = C.state.orders
        .filter(
          (o) =>
            (!status || o.status === status) &&
            ("cb-" + o.id + " " + o.customer)
              .toLocaleLowerCase("es")
              .includes(query),
        )
        .sort((a, b) => b.id - a.id);
      $("#orders-table").innerHTML = table(
        ["Pedido", "Cliente", "Fecha", "Importe", "Estado", ""],
        orderRows(orders),
      );
    }
    $("#order-search").addEventListener("input", render);
    $("#order-status").addEventListener("change", render);
    $("#new-order").addEventListener("click", () =>
      $("#order-dialog").showModal(),
    );
    $("#new-order-form").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const data = new FormData(ev.currentTarget),
        p = C.product(data.get("product")),
        qty = Number(data.get("qty")),
        name = String(data.get("customer")).trim();
      if (!p || !name || !Number.isInteger(qty) || qty < 1) {
        C.toast("Revisa los datos del pedido.");
        return;
      }
      const order = {
        id: Math.max(100, C.nextId(C.state.orders)),
        customer: name,
        phone: "",
        address: "Por confirmar",
        delivery: "domicilio",
        notes: "Pedido de demostración",
        date: new Date().toISOString(),
        status: "Pendiente",
        shipping: null,
        applied: false,
        items: [
          {
            productId: p.id,
            name: p.name,
            qty,
            price: C.price(p),
            images: p.images,
            image: p.image,
            custom: String(data.get("custom")).trim(),
          },
        ],
      };
      C.state.orders.push(order);
      C.save();
      location.href = "pedido.html?id=" + order.id;
    });
    render();
    if (new URLSearchParams(location.search).has("nuevo"))
      $("#order-dialog").showModal();
  }
  if (page === "pedido-admin") {
    const id = Number(new URLSearchParams(location.search).get("id") || 104),
      o = C.state.orders.find((o) => o.id === id);
    if (!o) {
      $("#admin-order-detail").innerHTML =
        '<div class="empty"><h2>No encontramos este pedido</h2><a class="btn" href="pedidos.html">Volver a pedidos</a></div>';
      return;
    }
    const states = [
      "Pendiente",
      "Confirmado",
      "En preparación",
      "Entregado",
      "Cancelado",
    ];
    function render() {
      const subtotal = C.subtotal(o);
      $("#admin-order-detail").innerHTML =
        `<div class="section-heading"><div><h2>Pedido #CB-${o.id}</h2><p class="muted small">${C.date(o.date)} · Datos de demostración</p></div>${C.badge(o.status)}</div><div class="admin-grid"><div class="stack"><section class="panel"><h2>Artículos del pedido</h2><div class="table-wrap">${table(["Producto", "Cantidad", "Precio unitario", "Importe"], o.items.map((i) => `<tr><td><div class="table-product">${C.photo(i)}<div>${e(i.name)}<small>${e(i.custom)}</small></div></div></td><td>${i.qty}</td><td>${money(i.price)}</td><td>${money(i.qty * i.price)}</td></tr>`).join(""))}</div></section><div class="form-row"><section class="panel"><h2>Cliente</h2><p>${e(o.customer)}</p><p class="muted small">Contacto de demostración. No se enviarán mensajes.</p></section><section class="panel"><h2>Entrega</h2><p>${o.delivery === "domicilio" ? "A domicilio" : "Recoger en punto acordado"}</p><p class="muted small">${e(o.address)}</p><p class="small">${e(o.notes)}</p></section></div></div><form class="panel" id="order-update-form"><h2>Resumen del pedido</h2><div class="row small"><span>Productos</span><strong>${money(subtotal)}</strong></div><hr class="divider"><label class="field">Costo de envío (MXN)<input name="shipping" id="shipping-input" type="number" min="0" max="999999" step="0.01" value="${o.shipping ?? ""}" placeholder="Por confirmar"></label><div class="row"><strong>Total final</strong><strong id="final-total">${o.shipping === null ? "Por confirmar" : money(subtotal + o.shipping)}</strong></div><hr class="divider"><h2>Actualizar estado</h2><label class="field">Estado<select name="status">${states.map((s) => `<option ${o.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></label><ul class="timeline">${states
          .slice(0, 4)
          .map((s) => `<li class="${o.status === s ? "active" : ""}">${s}</li>`)
          .join(
            "",
          )}</ul><button class="btn full">Guardar cambios</button><p class="note">Confirma disponibilidad y entrega antes de preparar el pedido. Los cambios son solo de demostración.</p></form></div>`;
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
        if (!states.includes(status)) return;
        const shouldApply = [
          "Confirmado",
          "En preparación",
          "Entregado",
        ].includes(status);
        if (shouldApply && shipping === null) {
          C.toast(
            "Confirma el costo de envío. Usa 0 si la entrega no tiene costo.",
          );
          return;
        }
        const quantities = new Map();
        o.items.forEach((i) =>
          quantities.set(
            i.productId,
            (quantities.get(i.productId) || 0) + i.qty,
          ),
        );
        if (shouldApply && !o.applied) {
          for (const [pid, qty] of quantities) {
            const p = C.product(pid);
            if (!p || !p.active || p.stock < qty) {
              C.toast("Existencias insuficientes para confirmar este pedido.");
              return;
            }
          }
        }
        if (shouldApply !== o.applied) {
          for (const [pid, qty] of quantities) {
            const p = C.product(pid);
            if (!p) continue;
            const delta = shouldApply ? -qty : qty;
            p.stock += delta;
            C.state.movements.push({
              id: C.nextId(C.state.movements),
              productId: pid,
              delta,
              reason: `${shouldApply ? "Pedido" : "Devolución del pedido"} #CB-${o.id}`,
              date: new Date().toISOString(),
              user: "Administrador",
            });
          }
          o.applied = shouldApply;
        }
        o.status = status;
        o.shipping = shipping;
        C.save();
        render();
        C.toast("Pedido actualizado en la demostración.");
      });
    }
    render();
  }
})();
