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

// ===========================
// CONFIGURACIÓN DE TARIFAS
// ===========================
const TARIFA_UNITARIA_INICIAL = 180; 

// ===========================
// Base de datos estática (se mantiene igual, puedes agregar o quitar clientes)
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

function esAdmin() {
    // Revisa si la URL contiene el parámetro '?admin=si'
    return window.location.search.includes('admin=si');
}

function comprobarPassword() {
    if (esAdmin()) return true; // Omite si es administrador
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
    if (esAdmin()) return { permitido: true }; // Omite si es administrador
    
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
// Funciones de Cálculo y Lógica (Sin Cambios en el Core)
// ===========================

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
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
            <td>${cliente.lecturaAnterior}</td>
            <td>${cliente.lecturaActual}</td>
            <td>${consumoCalculado}</td>
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
    const { subtotal, totalPagar, tarifa, gastoFijo } = calcularMonto(consumo);
    
    cliente.lecturaAnterior = lecturaMesAnterior; 
    cliente.lecturaActual = nuevaLectura;         
    
    cargarTabla();

    mostrarResultadoHtml(`
        <p><strong>Cálculo para ${escapeHtml(cliente.nombre)}:</strong></p>
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

    // 0) Asigna valores iniciales a los inputs de tarifa si existen
    const tarifaInput = document.getElementById("tarifaInput");
    const gastoFijoInput = document.getElementById("gastoFijoInput");

    if (tarifaInput) {
        if (!tarifaInput.value) tarifaInput.value = TARIFA_UNITARIA_INICIAL;
    }
    if (gastoFijoInput && !gastoFijoInput.value) {
        gastoFijoInput.value = 2500; 
    }


    // 1) Control de contraseña (solo se aplica a usuarios que NO son admin)
    if (!comprobarPassword()) {
        document.body.innerHTML = `<main style="padding:30px;"><h2>Acceso denegado 🔒</h2><p>No se proporcionó la contraseña correcta.</p></main>`;
        return;
    }

    // 2) Control de límite de visitas por navegador (solo se aplica a usuarios que NO son admin)
    const limite = comprobarLimiteVisitas();
    if (!limite.permitido) {
        document.body.innerHTML = `<main style="padding:30px;"><h2>Has  Por tu seguridad,alcanzado el límite de visitas este periodo 🔒</h2>
        <p>Has usado ${limite.registro.veces} visitas en los últimos ${periodoDias} días. Vuelve cuando el periodo se reinicie por favor.</p></main>`;
        return;
    }

    // 3) Cargar UI y datos
    crearOptionClientes();
    cargarTabla();
});