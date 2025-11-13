// ===========================
// Configuración de seguridad
// ===========================
const REQUIRE_PASSWORD = true; // Cambia a false si no quieres pedir contraseña
const PASSWORD = "energia2025"; // Contraseña
const maxVisitas = 2; // Máximo de accesos
const periodoDias = 30; // Periodo en días (un mes)
const TARIFA_UNITARIA = 180; // $/kWh

// ===========================
// Base de datos estática
// ===========================
const datosLectura = [
  { nombre: "Ines Fuentes", lecturaAnterior: 42920, lecturaActual: 43032 },
  { nombre: "Pablo Arriagada Vial", lecturaAnterior: 9293, lecturaActual: 9293 },
  { nombre: "Carlos", lecturaAnterior: 4211, lecturaActual: 4240 },
  { nombre: "Cesar Rojas", lecturaAnterior: 432, lecturaActual: 437 },
  { nombre: "Margarita Fierro", lecturaAnterior: 53214, lecturaActual: 53418 },
  { nombre: "Jose Lopez", lecturaAnterior: 22872, lecturaActual: 23102 },
  { nombre: "Pascuala Gutierrez", lecturaAnterior: 72893, lecturaActual: 73208 },
  { nombre: "Pablo Armijo", lecturaAnterior: 36516, lecturaActual: 36516 },
  { nombre: "Arturo Lamarca", lecturaAnterior: 1885, lecturaActual: 1977 },
  { nombre: "Pablo Fuentes", lecturaAnterior: 31625, lecturaActual: 31711 },
  { nombre: "Pedro Pablo Zeger", lecturaAnterior: 19560, lecturaActual: 19590 },
  { nombre: "Samuel Villalobos", lecturaAnterior: 1500, lecturaActual: 1579 },
  { nombre: "Robinson", lecturaAnterior: 11037, lecturaActual: 20441 },
  { nombre: "Pier Migueles", lecturaAnterior: 36282, lecturaActual: 36334 },
];

// ===========================
// Funciones de seguridad
// ===========================
function comprobarPassword() {
  if (!REQUIRE_PASSWORD) return true;
  const ingreso = prompt("Ingrese la contraseña para acceder:");
  if (ingreso === null) return false;
  return ingreso === PASSWORD;
}

function comprobarLimiteVisitas() {
  const clave = "visitas_lecturas";
  const ahora = new Date();
  const registroRaw = localStorage.getItem(clave);
  let registro = null;

  if (registroRaw) {
    try {
      registro = JSON.parse(registroRaw);
      registro.fecha = new Date(registro.fecha);
    } catch {
      registro = null;
    }
  }

  if (!registro) {
    registro = { fecha: ahora.toISOString(), veces: 0 };
  } else {
    const diasPasados = (ahora - new Date(registro.fecha)) / (1000 * 60 * 60 * 24);
    if (diasPasados > periodoDias) registro = { fecha: ahora.toISOString(), veces: 0 };
  }

  if (registro.veces >= maxVisitas) return { permitido: false, registro };
  registro.veces++;
  registro.fecha = new Date().toISOString();
  localStorage.setItem(clave, JSON.stringify(registro));
  return { permitido: true, registro };
}

// ===========================
// UI y lógica principal
// ===========================
function crearOptionClientes() {
  const selectCliente = document.getElementById("clienteSelect");
  selectCliente.innerHTML = datosLectura
    .map((d) => `<option value="${escapeHtml(d.nombre)}">${escapeHtml(d.nombre)}</option>`)
    .join("");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function cargarTabla() {
  const tablaBody = document.querySelector("#lecturasTable tbody");
  tablaBody.innerHTML = "";
  datosLectura.forEach((cliente) => {
    const consumo = cliente.lecturaActual - cliente.lecturaAnterior;
    const subtotal = consumo * TARIFA_UNITARIA;
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${escapeHtml(cliente.nombre)}</td>
      <td>${cliente.lecturaAnterior}</td>
      <td>${cliente.lecturaActual}</td>
      <td>${consumo}</td>
      <td>${subtotal.toLocaleString("es-CL")}</td>
    `;
    tablaBody.appendChild(fila);
  });
}

function mostrarResultadoHtml(html) {
  document.getElementById("resultado").innerHTML = html;
}

function calcularConsumoHandler() {
  const nombreCliente = document.getElementById("clienteSelect").value;
  const nuevaLectura = parseInt(document.getElementById("lecturaInput").value.trim(), 10);

  if (isNaN(nuevaLectura) || nuevaLectura < 0) {
    mostrarResultadoHtml("<span style='color:red;'>Por favor, ingrese una lectura válida.</span>");
    return;
  }

  const cliente = datosLectura.find((d) => d.nombre === nombreCliente);
  if (!cliente) {
    mostrarResultadoHtml("<span style='color:red;'>Cliente no encontrado.</span>");
    return;
  }

  const lecturaAnterior = cliente.lecturaActual;
  if (nuevaLectura < lecturaAnterior) {
    mostrarResultadoHtml(`<span style="color:red;">Error: La lectura actual (${nuevaLectura}) no puede ser menor que la anterior (${lecturaAnterior}).</span>`);
    return;
  }

  const consumo = nuevaLectura - lecturaAnterior;
  const subtotal = consumo * TARIFA_UNITARIA;
  cliente.lecturaAnterior = cliente.lecturaActual;
  cliente.lecturaActual = nuevaLectura;

  cargarTabla();
  mostrarResultadoHtml(`
    <p><strong>Cálculo para ${escapeHtml(cliente.nombre)}:</strong></p>
    <p>Lectura anterior: ${lecturaAnterior} kWh</p>
    <p>Lectura actual: ${nuevaLectura} kWh</p>
    <p><strong>Consumo: ${consumo} kWh</strong></p>
    <p><strong>Subtotal: $${subtotal.toLocaleString("es-CL")}</strong></p>
  `);

  document.getElementById("lecturaInput").value = "";
}

// ===========================
// Inicialización
// ===========================
document.addEventListener("DOMContentLoaded", () => {
  if (!comprobarPassword()) {
    document.body.innerHTML = "<main style='padding:30px;'><h2>Acceso denegado 🔒</h2></main>";
    return;
  }

  const limite = comprobarLimiteVisitas();
  if (!limite.permitido) {
    document.body.innerHTML = `<main style="padding:30px;">
      <h2>Has alcanzado el límite de visitas 🔒</h2>
      <p>Has usado ${limite.registro.veces} visitas en los últimos ${periodoDias} días.</p>
    </main>`;
    return;
  }

  crearOptionClientes();
  cargarTabla();
  document.getElementById("calcularBtn").addEventListener("click", calcularConsumoHandler);
});
