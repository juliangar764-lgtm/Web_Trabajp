// Inicio de sesión (clientes y administradores)
const formulario = document.getElementById("login-form");
const campoPassword = document.getElementById("password");
const botonMostrar = document.getElementById("mostrar-password");
const mensajeError = document.getElementById("login-error");

// Página a la que volver después de entrar. Solo se aceptan rutas internas del sitio.
const parametros = new URLSearchParams(location.search);
const destino = (() => {
  const valor = parametros.get("siguiente") || "";
  return /^\/?[a-z0-9\-/]+\.html(\?[\w=&%.\-]*)?$/i.test(valor) ? "/" + valor.replace(/^\//, "") : null;
})();

// El enlace de registro conserva el destino
if (destino) {
  document.getElementById("register-link").href = "registro.html?siguiente=" + encodeURIComponent(destino);
}

// Mostrar u ocultar la contraseña
botonMostrar.addEventListener("click", function () {
  const mostrar = campoPassword.type === "password";

  campoPassword.type = mostrar ? "text" : "password";
  botonMostrar.textContent = mostrar ? "Ocultar" : "Mostrar";
  botonMostrar.setAttribute("aria-label", mostrar ? "Ocultar contraseña" : "Mostrar contraseña");
  botonMostrar.setAttribute("aria-pressed", String(mostrar));
});

function mostrarError(texto) {
  mensajeError.textContent = texto;
  mensajeError.hidden = false;
}

formulario.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  mensajeError.hidden = true;

  const boton = formulario.querySelector("button[type=submit]");
  boton.disabled = true;

  try {
    const respuesta = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formulario.elements.correo.value,
        password: campoPassword.value,
      }),
    });
    const datos = await respuesta.json().catch(() => null);
    if (!respuesta.ok) {
      mostrarError(datos?.error || "No se pudo iniciar sesión.");
      return;
    }

    const esAdmin = datos.user.role === "admin";
    if (esAdmin) {
      location.href = destino && destino.startsWith("/admin/") ? destino : "/admin/index.html";
    } else {
      location.href = destino && !destino.startsWith("/admin/") ? destino : "/catalogo.html";
    }
  } catch (_) {
    mostrarError("No hay conexión con el servidor. Inténtalo de nuevo.");
  } finally {
    boton.disabled = false;
  }
});
