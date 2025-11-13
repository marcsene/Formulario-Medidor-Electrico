// ===========================
// Configuración de seguridad
// ===========================
const REQUIRE_PASSWORD = true;
const PASSWORD = "energia2025";
const maxVisitas = 20;
const periodoDias = 30; 
const TARIFA_UNITARIA_INICIAL = 180; 

// ===========================
// Base de datos estática (Añadida la fecha de la última lectura)
// ===========================
const fechaInicial = "2025-10-30"; // Fecha de ejemplo para la Lectura Anterior

const datosLectura = [
    { nombre: "Ines Fuentes", fechaActual: fechaInicial, lecturaAnterior: 42920, lecturaActual: 43032 },
    { nombre: "Pablo Arriagada Vial", fechaActual: fechaInicial, lecturaAnterior: 9293, lecturaActual: 9293 },
    { nombre: "Carlos", fechaActual: fechaInicial, lecturaAnterior: 4211, lecturaActual: 4240 },
    { nombre: "Cesar Rojas", fechaActual: fechaInicial, lecturaAnterior: 432, lecturaActual: 437 },
    { nombre: "Margarita Fierro", fechaActual: fechaInicial, lecturaAnterior: 53214, lecturaActual: 53418 },
    { nombre: "Jose Lopez", fechaActual: fechaInicial, lecturaAnterior: 22872, lecturaActual: 23102 },
    { nombre: "Pascuala Gutierrez", fechaActual: fechaInicial, lecturaAnterior: 72893, lecturaActual: 73208 },
    { nombre: "Pablo Armijo", fechaActual: fechaInicial, lecturaAnterior: 36516, lecturaActual: 36516 },
    { nombre: "Arturo Lamarca", fechaActual: fechaInicial, lecturaAnterior: 1885, lecturaActual: 1977 },
    { nombre: "Pablo Fuentes", fechaActual: fechaInicial, lecturaAnterior: 31625, lecturaActual: 31711 },
    { nombre: "Pedro Pablo Zeger", fechaActual: fechaInicial, lecturaAnterior: 19560, lecturaActual: 19590 },
    { nombre: "Samuel Villalobos", fechaActual: fechaInicial, lecturaAnterior: 1500, lecturaActual: 1579 },
    { nombre: "Robinson", fechaActual: fechaInicial, lecturaAnterior: 11037, lecturaActual: 20441 },
    { nombre: "Pier Migueles", fechaActual: fechaInicial, lecturaAnterior: 36282, lecturaActual: 36334 },
    { nombre: "Juan Fco. Zeger (Material ibarra)", fechaActual: fechaInicial, lecturaAnterior: 53214, lecturaActual: 53418 },
    { nombre: "Sebastian", fechaActual: fechaInicial, lecturaAnterior: 3, lecturaActual: 3 },
    { nombre: "Alvaro Carrasco", fechaActual: fechaInicial, lecturaAnterior: 20145, lecturaActual: 20441 },
    { nombre: "Gustavo Miranda", fechaActual: fechaInicial, lecturaAnterior: 11037, lecturaActual: 11140 },
];

// ===========================
// Funciones de seguridad
// ===========================

function esAdmin() {
    return window.location.search.includes('admin=si');
}

function comprobarPassword() {
    if (esAdmin()) return true; 
    if (!REQUIRE_PASSWORD) return true;
    try {
        const ingreso = prompt("Ingrese la contraseña para acceder:");
        if (ingreso === null) return false; 
        return ingreso === PASSWORD;
    } catch (e) {
        return false;
    }
}

function comprobarLimiteVisitas() {
    if (esAdmin()) return { permitido: true }; 
    
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
            registro = { fecha: ahora.toISOString(), veces: 0 };
        }
    }

    if (registro.veces >= maxVisitas) {
        return { permitido: false, registro };
    } else {
        registro.veces = registro.veces + 1;
        registro.fecha = new Date().toISOString();
        localStorage.setItem(clave, JSON.stringify(registro));
        return { permitido: true, registro };
    }
}

// ===========================
// Funciones de Cálculo y Lógica
// ===========================

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function formatearFecha(fechaString) {
    if (!fechaString || fechaString === 'N/A') return 'N/A';
    const partes = fechaString.split('-');
    if (partes.length === 3) {
        return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
    return fechaString; 
}


function obtenerTarifas() {
    const tarifa = parseFloat(document.getElementById("tarifaInput").value) || 0;
    const gastoFijo = parseFloat(document.getElementById("gastoFijoInput").value) || 0;
    return { tarifa, gastoFijo };
}

function calcularMonto(consumo) {
    const { tarifa, gastoFijo } = obtenerTarifas();
    const subtotal = consumo * tarifa;
    const totalPagar = subtotal + gastoFijo;
    return { subtotal, totalPagar, tarifa, gastoFijo };
}

function crearOptionClientes() {
    const selectCliente = document.getElementById("clienteSelect");
    selectCliente.innerHTML = datosLectura.map(d => `<option value="${escapeHtml(d.nombre)}">${escapeHtml(d.nombre)}</option>`).join('');
}

function mostrarResultadoHtml(html) {
    const resultadoDiv = document.getElementById("resultado");
    resultadoDiv.innerHTML = html;
}

function cargarTabla() {
    const tablaBody = document.querySelector("#lecturasTable tbody");
    tablaBody.innerHTML = "";
    datosLectura.forEach(cliente => {
        const consumoCalculado = cliente.lecturaActual - cliente.lecturaAnterior;
        const { totalPagar } = calcularMonto(consumoCalculado);

        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${escapeHtml(cliente.nombre)}</td>
            <td>${formatearFecha(cliente.fechaAnterior || cliente.fechaActual)}</td>
            <td>${cliente.lecturaAnterior.toLocaleString('es-CL')}</td>
            <td>${cliente.lecturaActual.toLocaleString('es-CL')}</td>
            <td>${consumoCalculado.toLocaleString('es-CL')}</td>
            <td>${totalPagar.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
        `;
        tablaBody.appendChild(fila);
    });
}

window.recalcularTodo = function() {
    cargarTabla(); 
    mostrarResultadoHtml(`
        <p style="text-align: center;">¡Tarifas aplicadas y tabla actualizada! Revise los Totales a Pagar.</p>
    `);
}


window.calcularConsumo = function() {
    const nombreCliente = document.getElementById("clienteSelect").value;
    const nuevaLecturaRaw = document.getElementById("lecturaInput").value.trim();
    const nuevaLectura = parseFloat(nuevaLecturaRaw); 
    const fechaLectura = document.getElementById("fechaInput").value;

    if (!fechaLectura) {
        mostrarResultadoHtml("<span style='color:red;'>Por favor, seleccione la fecha de la lectura.</span>");
        return;
    }
    if (isNaN(nuevaLectura) || nuevaLectura < 0) {
        mostrarResultadoHtml("<span style='color:red;'>Por favor, ingrese una lectura válida (solo números). </span>");
        return;
    }

    const cliente = datosLectura.find(d => d.nombre === nombreCliente);

    if (!cliente) {
        mostrarResultadoHtml("<span style='color:red;'>Cliente no encontrado.</span>");
        return;
    }

    const fechaMesAnterior = cliente.fechaActual; 
    const lecturaMesAnterior = cliente.lecturaActual;

    if (nuevaLectura < lecturaMesAnterior) {
        mostrarResultadoHtml(`<span style="color: red;">Error: La Lectura Mes Actual (${nuevaLectura}) no puede ser menor que la Lectura Mes Anterior (${lecturaMesAnterior}).</span>`);
        return;
    }

    const consumo = nuevaLectura - lecturaMesAnterior;
    const { subtotal, totalPagar, tarifa, gastoFijo } = calcularMonto(consumo);
    
    // Actualiza los datos en memoria para la próxima lectura
    cliente.fechaAnterior = fechaMesAnterior;
    cliente.fechaActual = fechaLectura; 
    cliente.lecturaAnterior = lecturaMesAnterior; 
    cliente.lecturaActual = nuevaLectura;         
    
    // Recargar tabla visual
    cargarTabla();

    mostrarResultadoHtml(`
        <p><strong>Cálculo para ${escapeHtml(cliente.nombre)}:</strong></p>
        <p>Fecha Lectura Anterior: ${formatearFecha(fechaMesAnterior)}</p>
        <p>Fecha Lectura Actual: ${formatearFecha(fechaLectura)}</p>
        <hr>
        <p>Lectura Mes Anterior: ${lecturaMesAnterior.toLocaleString('es-CL')} kWh</p>
        <p>Lectura Mes Actual: ${nuevaLectura.toLocaleString('es-CL')} kWh</p>
        <p>Consumo de Energía: ${consumo.toLocaleString('es-CL')} kWh</p>
        <hr>
        <p>Costo por Consumo (${consumo.toLocaleString('es-CL')} kWh @ ${tarifa.toLocaleString('es-CL')}$/kWh): **$${subtotal.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}**</p>
        <p>Gasto Fijo Mensual: **$${gastoFijo.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}**</p>
        <hr>
        <p style="font-size: 1.2em;"><strong>TOTAL A PAGAR: $${totalPagar.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong></p>
    `);

    document.getElementById("lecturaInput").value = "";
}

// ===========================
// Inicialización de la app
// ===========================
document.addEventListener('DOMContentLoaded', () => {

    // 0) Asigna valores iniciales a los inputs de tarifa y fecha
    const tarifaInput = document.getElementById("tarifaInput");
    const gastoFijoInput = document.getElementById("gastoFijoInput");
    const fechaInput = document.getElementById("fechaInput");


    if (tarifaInput && !tarifaInput.value) {
        tarifaInput.value = TARIFA_UNITARIA_INICIAL;
    }
    if (gastoFijoInput && !gastoFijoInput.value) {
        gastoFijoInput.value = 2500; 
    }
    if (fechaInput) {
        fechaInput.valueAsDate = new Date();
    }


    // 1) Control de seguridad
    if (!comprobarPassword()) {
        document.body.innerHTML = `<main style="padding:30px;"><h2>Acceso denegado 🔒</h2><p>No se proporcionó la contraseña correcta.</p></main>`;
        return;
    }
    const limite = comprobarLimiteVisitas();
    if (!limite.permitido) {
        document.body.innerHTML = `<main style="padding:30px;"><h2>Has alcanzado el límite de visitas este periodo 🔒</h2>
        <p>Has usado ${limite.registro.veces} visitas en los últimos ${periodoDias} días. Vuelve cuando el periodo se reinicie.</p></main>`;
        return;
    }

    // 2) Cargar UI y datos
    crearOptionClientes();
    cargarTabla();
});