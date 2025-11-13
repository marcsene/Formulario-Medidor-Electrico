// ===========================
// Configuración de seguridad
// ===========================

// Cambia a true si quieres exigir contraseña (opcional)
const REQUIRE_PASSWORD = true;
// Si REQUIRE_PASSWORD = true, coloca aquí la contraseña deseada:
const PASSWORD = "energia2025";

// Límite por navegador: maxVisitas en periodoDias
const maxVisitas = 2;
const periodoDias = 30; // periodo en días para contar las visitas

// Tarifa unitaria
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
    { nombre: "Juan Fco. Zeger (Material ibarra)", lecturaAnterior: 53214, lecturaActual: 53418 },
    { nombre: "Sebastian", lecturaAnterior: 3, lecturaActual: 3 },
    { nombre: "Alvaro Carrasco", lecturaAnterior: 20145, lecturaActual: 20441 },
    { nombre: "Gustavo Miranda", lecturaAnterior: 11037, lecturaActual: 11140 },
];

// ===========================
// Funciones de seguridad
// ===========================
function comprobarPassword() {
    if (!REQUIRE_PASSWORD) return true;
    try {
        const ingreso = prompt("Ingrese la contraseña para acceder:");
        if (ingreso === null) return false; // usuario canceló
        return ingreso === PASSWORD;
    } catch (e) {
        return false;
    }
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
        } catch (e) {
            registro = null;
        }
    }

    if (!registro) {
        registro = { fecha: ahora.toISOString(), veces: 0 };
    } else {
        const diasPasados = (ahora - new Date(registro.fecha)) / (1000 * 60 * 60 * 24);
        if (diasPasados > periodoDias) {
            // reiniciar periodo
            registro = { fecha: ahora.toISOString(), veces: 0 };
        }
    }

    if (registro.veces >= maxVisitas) {
        return { permitido: false, registro };
    } else {
        // incrementar y guardar
        registro.veces = registro.veces + 1;
        registro.fecha = new Date().toISOString();
        localStorage.setItem(clave, JSON.stringify(registro));
        return { permitido: true, registro };
    }
}

// ===========================
// UI y lógica principal
// ===========================
function crearOptionClientes() {
    const selectCliente = document.getElementById("clienteSelect");
    selectCliente.innerHTML = datosLectura.map(d => `<option value="${escapeHtml(d.nombre)}">${escapeHtml(d.nombre)}</option>`).join('');
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function cargarTabla() {
    const tablaBody = document.querySelector("#lecturasTable tbody");
    tablaBody.innerHTML = "";
    datosLectura.forEach(cliente => {
        const consumoCalculado = cliente.lecturaActual - cliente.lecturaAnterior;
        const subtotalCalculado = consumoCalculado * TARIFA_UNITARIA;

        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${escapeHtml(cliente.nombre)}</td>
            <td>${cliente.lecturaAnterior}</td>
            <td>${cliente.lecturaActual}</td>
            <td>${consumoCalculado}</td>
            <td>${subtotalCalculado.toLocaleString('es-CL')}</td>
        `;
        tablaBody.appendChild(fila);
    });
}

function mostrarResultadoHtml(html) {
    const resultadoDiv = document.getElementById("resultado");
    resultadoDiv.innerHTML = html;
}

function calcularConsumoHandler() {
    const nombreCliente = document.getElementById("clienteSelect").value;
    const nuevaLecturaRaw = document.getElementById("lecturaInput").value.trim();
    const nuevaLectura = parseInt(nuevaLecturaRaw, 10);

    if (isNaN(nuevaLectura) || nuevaLectura < 0) {
        mostrarResultadoHtml("<span style='color:red;'>Por favor, ingrese una lectura válida (solo números). </span>");
        return;
    }

    const cliente = datosLectura.find(d => d.nombre === nombreCliente);

    if (!cliente) {
        mostrarResultadoHtml("<span style='color:red;'>Cliente no encontrado.</span>");
        return;
    }

    const lecturaMesAnterior = cliente.lecturaActual;

    if (nuevaLectura < lecturaMesAnterior) {
        mostrarResultadoHtml(`<span style="color: red;">Error: La Lectura Mes Actual (${nuevaLectura}) no puede ser menor que la Lectura Mes Anterior (${lecturaMesAnterior}).</span>`);
        return;
    }

    const consumo = nuevaLectura - lecturaMesAnterior;
    const subtotal = consumo * TARIFA_UNITARIA;

    // Actualizamos la "base de datos" en memoria: el nuevo valor pasa a ser lecturaActual
    cliente.lecturaAnterior = cliente.lecturaActual;
    cliente.lecturaActual = nuevaLectura;

    // Actualizar tabla visual
    cargarTabla();

    mostrarResultadoHtml(`
        <p><strong>Cálculo para ${escapeHtml(cliente.nombre)}:</strong></p>
        <p>Lectura Mes Anterior: ${lecturaMesAnterior} kWh</p>
        <p>Lectura Mes Actual: ${nuevaLectura} kWh</p>
        <p><strong>Consumo Mensual: ${consumo} kWh</strong></p>
        <p><strong>Subtotal a Pagar: $ ${subtotal.toLocaleString('es-CL')}</strong></p>
    `);

    // Limpia el input para la siguiente medición
    document.getElementById("lecturaInput").value = "";
}

// ===========================
// Inicialización de la app
// ===========================
document.addEventListener('DOMContentLoaded', () => {

    // 1) Control de contraseña (opcional)
    if (!comprobarPassword()) {
        document.body.innerHTML = `<main style="padding:30px;"><h2>Acceso denegado 🔒</h2><p>No se proporcionó la contraseña correcta.</p></main>`;
        return;
    }

    // 2) Control de límite de visitas por navegador
    const limite = comprobarLimiteVisitas();
    if (!limite.permitido) {
        document.body.innerHTML = `<main style="padding:30px;"><h2>Has alcanzado el límite de visitas este periodo 🔒</h2>
        <p>Has usado ${limite.registro.veces} visitas en los últimos ${periodoDias} días. Vuelve cuando el periodo se reinicie.</p></main>`;
        return;
    }

    // 3) Cargar UI y datos
    crearOptionClientes();
    cargarTabla();

    // 4) Event listener para botón
    document.getElementById("calcularBtn").addEventListener("click", calcularConsumoHandler);
});
