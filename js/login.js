// Elementos del formulario
const formulario = document.getElementById("login-form");
const campoPassword = document.getElementById("password");
const botonMostrar = document.getElementById("mostrar-password");

// Mostrar u ocultar la contraseña
botonMostrar.addEventListener("click", function () {
  const mostrar = campoPassword.type === "password";

  campoPassword.type = mostrar ? "text" : "password";

  botonMostrar.textContent = mostrar ? "Ocultar" : "Mostrar";

  botonMostrar.setAttribute(
    "aria-label",
    mostrar ? "Ocultar contraseña" : "Mostrar contraseña"
  );

  botonMostrar.setAttribute("aria-pressed", String(mostrar));
});

// Navegar al panel sin validar credenciales
formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();

  window.location.href = "admin/index.html";
});