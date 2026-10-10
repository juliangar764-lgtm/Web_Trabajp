// Registro de clientes
const formulario = document.getElementById("register-form");
const campoPassword = document.getElementById("password");
const botonMostrar = document.getElementById("mostrar-password");
const mensajeError = document.getElementById("login-error");

// Página a la que volver después de registrarse. Solo se aceptan rutas internas del sitio.
const destino = (() => {
  const valor = new URLSearchParams(location.search).get("siguiente") || "";
  return /^\/?[a-z0-9\-/]+\.html(\?[\w=&%.\-]*)?$/i.test(valor) && !/admin\//i.test(valor)
    ? "/" + valor.replace(/^\//, "")
    : null;
})();

if (destino) {
  document.getElementById("login-link").href = "acceso.html?siguiente=" + encodeURIComponent(destino);
}

botonMostrar.addEventListener("click", function () {
  const mostrar = campoPassword.type === "password";

  campoPassword.type = mostrar ? "text" : "password";
  document.getElementById("password2").type = mostrar ? "text" : "password";
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

  const campos = formulario.elements;
  if (campos.password.value !== campos.password2.value) {
    mostrarError("Las contraseñas no coinciden.");
    return;
  }

  const boton = formulario.querySelector("button[type=submit]");
  boton.disabled = true;

  try {
    const respuesta = await fetch("/api/auth/register", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: campos.nombre.value,
        email: campos.correo.value,
        phone: campos.telefono.value,
        password: campos.password.value,
      }),
    });
    const datos = await respuesta.json().catch(() => null);
    if (!respuesta.ok) {
      mostrarError(datos?.error || "No se pudo crear la cuenta.");
      return;
    }
    location.href = destino || "/catalogo.html";
  } catch (_) {
    mostrarError("No hay conexión con el servidor. Inténtalo de nuevo.");
  } finally {
    boton.disabled = false;
  }
});
