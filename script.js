// ===========================
// Configuración de seguridad
// ===========================
const PASSWORD_SUFFIX = "2025"; 
const ADMIN_USER = "Admin"; 
const ADMIN_PASSWORD = ADMIN_USER + PASSWORD_SUFFIX; 
const maxVisitas = 2; 
const periodoDias = 30; 
const TARIFA_UNITARIA_INICIAL = 180; 

// ===========================
// Base de datos estática (Alineada con tu Excel: Suma Consumo = 1666 kWh)
// ===========================
const fechaInicial = "2025-10-30"; 

const datosLectura = [
    { nombre: "Ines Fuentes", parcela: "Parcela 6", fechaActual: fechaInicial, lecturaAnterior: 42920, lecturaActual: 43032 }, // Consumo: 112
    { nombre: "Pablo Arriagada Vial", parcela: "Parcela 4", fechaActual: fechaInicial, lecturaAnterior: 9293, lecturaActual: 9293 }, // Consumo: 0
    { nombre: "Carlos", parcela: "Parcela 5", fechaActual: fechaInicial, lecturaAnterior: 4211, lecturaActual: 4240 }, // Consumo: 29
    { nombre: "Cesar Rojas", parcela: "Parcela 10", fechaActual: fechaInicial, lecturaAnterior: 432, lecturaActual: 437 }, // Consumo: 5
    { nombre: "Juan Fco. Zeger", parcela: "Parcela 23", fechaActual: fechaInicial, lecturaAnterior: 53214, lecturaActual: 53418 }, // Consumo: 204
    { nombre: "Margarita Fierro", parcela: "Parcela 05", fechaActual: fechaInicial, lecturaAnterior: 22872, lecturaActual: 23102 }, // Consumo: 230
    { nombre: "Jose Lopez", parcela: "Parcela 2", fechaActual: fechaInicial, lecturaAnterior: 72893, lecturaActual: 73208 }, // Consumo: 315
    { nombre: "P. Gutierrez / Washington Roj.", parcela: "Parcela 1", fechaActual: fechaInicial, lecturaAnterior: 36516, lecturaActual: 36516 }, // Consumo: 0
    { nombre: "Armijo", parcela: "Parcela 3", fechaActual: fechaInicial, lecturaAnterior: 1885, lecturaActual: 1977 }, // Consumo: 92
    { nombre: "Arturo Lamarca", parcela: "Parcela 9", fechaActual: fechaInicial, lecturaAnterior: 31625, lecturaActual: 31711 }, // Consumo: 86
    { nombre: "Pablo Fuentes", parcela: "Parcela 20", fechaActual: fechaInicial, lecturaAnterior: 19560, lecturaActual: 19590 }, // Consumo: 30
    { nombre: "Pedro Pablo Zeger", parcela: "Parcela 22", fechaActual: fechaInicial, lecturaAnterior: 1500, lecturaActual: 1579 }, // Consumo: 79
    { nombre: "Samuel Villalobos", parcela: "Parcela 12", fechaActual: fechaInicial, lecturaAnterior: 1888, lecturaActual: 1909 }, // Consumo: 103 
    { nombre: "Sebastian", parcela: "Parcela 14", fechaActual: fechaInicial, lecturaAnterior: 3, lecturaActual: 3 }, // Consumo: 52
    { nombre: "Alvaro Carrasco", parcela: "Parcela 7", fechaActual: fechaInicial, lecturaAnterior: 20145, lecturaActual: 20441 }, // Consumo: 204
    { nombre: "Gustavo Miranda", parcela: "Parcela 3", fechaActual: fechaInicial, lecturaAnterior: 11037, lecturaActual: 11140 }, // Consumo: 0
    { nombre: "Pier Migueles", parcela: "Lote 2 Parcela 1", fechaActual: fechaInicial, lecturaAnterior: 2762, lecturaActual: 2774 }, // Consumo: 103
    { nombre: "Robinson",fechaActual: fechaInicial, lecturaAnterior: 36282, lecturaActual: 36334 }, // Consumo: 103


];

// ===========================
// Funciones de Login y Seguridad
// ===========================

function esAdmin() {
    return window.location.search.includes('admin=si');
}

function permitirAcceso() {
    document.getElementById("login-container").style.display = 'none';
    document.getElementById("app-container").style.display = 'block';
    
    crearOptionClientes();
    cargarTabla();
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

window.iniciarSesion = function() {
    const role = document.getElementById("roleSelect").value;
    const usuario = document.getElementById("usernameInput").value.trim();
    const clave = document.getElementById("passwordInput").value.trim();
    const mensaje = document.getElementById("loginMessage");
    mensaje.textContent = '';
    
    if (role === 'admin') {
        if (usuario.toLowerCase() === ADMIN_USER.toLowerCase() && clave === ADMIN_PASSWORD) {
            permitirAcceso();
        } else {
            mensaje.textContent = "Error: Credenciales de administrador incorrectas. (Usuario: Admin, Contraseña: Admin2025)";
        }
        return;
    }
    
    if (role === 'cliente') {
        
        const clienteEncontrado = datosLectura.find(d => d.nombre.toLowerCase() === usuario.toLowerCase());

        if (!clienteEncontrado) {
            mensaje.textContent = "Error: El nombre de usuario no se encuentra en la lista de clientes.";
            return;
        }

        const nombrePila = clienteEncontrado.nombre.split(' ')[0];
        const claveEsperada = nombrePila + PASSWORD_SUFFIX;

        if (clave === claveEsperada) {
            
            const limite = comprobarLimiteVisitas();
            if (!limite.permitido) {
                mensaje.textContent = `Acceso denegado: Has alcanzado el límite de ${limite.registro.veces} accesos permitidos en los últimos ${periodoDias} días.`;
                return;
            }

            permitirAcceso();

        } else {
            mensaje.textContent = "Error: Contraseña incorrecta para el cliente.";
        }
    }
}


// ===========================
// Funciones de Lógica y Cálculo Proporcional 
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

function obtenerVariablesGlobales() {
    const costoFijoTotal = parseFloat(document.getElementById("costoFijoTotalInput").value) || 0;
    const costoConsumoTotal = parseFloat(document.getElementById("costoConsumoTotalInput").value) || 0;
    
    const totalConsumoKwh = datosLectura.reduce((sum, d) => sum + (d.lecturaActual - d.lecturaAnterior), 0);
    const numClientes = datosLectura.length;
    
    const costoFijoPorPersona = numClientes > 0 ? costoFijoTotal / numClientes : 0;
    
    const precioKwhUnitario = totalConsumoKwh > 0 ? costoConsumoTotal / totalConsumoKwh : 0;

    return {
        costoFijoTotal,
        costoConsumoTotal,
        totalConsumoKwh,
        numClientes,
        costoFijoPorPersona,
        precioKwhUnitario 
    };
}

function calcularMontoTotalCliente(consumoKwh) {
    const variables = obtenerVariablesGlobales();
    
    const costoKwhConsumido = consumoKwh * variables.precioKwhUnitario; 
    const totalPagar = costoKwhConsumido + variables.costoFijoPorPersona; 
    
    return { 
        costoKwhConsumido: costoKwhConsumido,
        costoFijoPorPersona: variables.costoFijoPorPersona,
        totalPagar: totalPagar,
        precioKwhUnitario: variables.precioKwhUnitario 
    };
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
    
    const variablesGlobales = obtenerVariablesGlobales();
    let sumaTotalPagar = 0; // Inicializamos la variable para sumar el total

    datosLectura.forEach(cliente => {
        const consumoCalculado = cliente.lecturaActual - cliente.lecturaAnterior;
        
        const montos = calcularMontoTotalCliente(consumoCalculado);
        sumaTotalPagar += montos.totalPagar; // Sumamos el total a pagar de cada cliente

        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${escapeHtml(cliente.nombre)}</td>
            <td>${formatearFecha(cliente.fechaAnterior || cliente.fechaActual)}</td>
            <td>${cliente.lecturaAnterior.toLocaleString('es-CL')}</td>
            <td>${cliente.lecturaActual.toLocaleString('es-CL')}</td>
            <td>${consumoCalculado.toLocaleString('es-CL')}</td>
            <td>$${montos.costoKwhConsumido.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
            <td>$${montos.costoFijoPorPersona.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
            <td>$${montos.totalPagar.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
        `;
        tablaBody.appendChild(fila);
    });
    
    // --- FILA DEL TOTAL GENERAL ---
    const filaTotal = document.createElement("tr");
    filaTotal.classList.add('total-row');
    filaTotal.innerHTML = `
        <td colspan="4" style="text-align: right; font-weight: bold;">TOTAL GENERAL A REPARTIR:</td>
        <td>${variablesGlobales.totalConsumoKwh.toLocaleString('es-CL')}</td>
        <td style="font-weight: bold;">$${variablesGlobales.costoConsumoTotal.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
        <td style="font-weight: bold;">$${variablesGlobales.costoFijoTotal.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
        <td style="font-weight: bold; background-color: #ffc; color: #333;">$${sumaTotalPagar.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
    `;
    tablaBody.appendChild(filaTotal);
    
    // --- MENSAJE DE RESULTADO ---
    mostrarResultadoHtml(`
        <p><strong>Variables de Distribución Global:</strong></p>
        <p>Total Clientes: ${variablesGlobales.numClientes}</p>
        <p>Suma Consumo Total (kWh): ${variablesGlobales.totalConsumoKwh.toLocaleString('es-CL')}</p>
        <hr>
        <p><strong>Costo Fijo por Persona:</strong> $${variablesGlobales.costoFijoPorPersona.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
        <p><strong>Precio por 1 kWh (Unitario):</strong> $${variablesGlobales.precioKwhUnitario.toFixed(4).toLocaleString('es-CL')}</p>
        <hr>
        <p style="font-weight: bold; color: green;">Tabla de Costos por Cliente Actualizada. Total Repartido: $${(variablesGlobales.costoConsumoTotal + variablesGlobales.costoFijoTotal).toLocaleString('es-CL')}</p>
    `);
}

window.recalcularTodo = function() {
    cargarTabla();
}

window.calcularConsumo = function() {
    const nombreCliente = document.getElementById("clienteSelect").value;
    const nuevaLecturaRaw = document.getElementById("lecturaInput").value.trim();
    const nuevaLectura = parseFloat(nuevaLecturaRaw); 
    const fechaLectura = document.getElementById("fechaInput").value;

    if (!fechaLectura || isNaN(nuevaLectura) || nuevaLectura < 0) {
        mostrarResultadoHtml("<span style='color:red;'>Por favor, complete la fecha y la lectura correctamente.</span>");
        return;
    }

    const cliente = datosLectura.find(d => d.nombre === nombreCliente);
    const lecturaMesAnterior = cliente.lecturaActual;

    if (nuevaLectura < lecturaMesAnterior) {
        mostrarResultadoHtml(`<span style="color: red;">Error: La Lectura Mes Actual (${nuevaLectura}) no puede ser menor que la Lectura Mes Anterior (${lecturaMesAnterior}).</span>`);
        return;
    }

    // Actualizar datos
    cliente.fechaAnterior = cliente.fechaActual;
    cliente.fechaActual = fechaLectura; 
    cliente.lecturaAnterior = lecturaMesAnterior; 
    cliente.lecturaActual = nuevaLectura;         
    
    cargarTabla();

    document.getElementById("lecturaInput").value = "";
}

// ===========================
// Inicialización de la app
// ===========================
document.addEventListener('DOMContentLoaded', () => {

    const costoFijoTotalInput = document.getElementById("costoFijoTotalInput");
    const costoConsumoTotalInput = document.getElementById("costoConsumoTotalInput");
    const fechaInput = document.getElementById("fechaInput");

    // VALORES INICIALES AJUSTADOS para que el Total a Repartir sea $625,600
    if (costoFijoTotalInput && !costoFijoTotalInput.value) {
        costoFijoTotalInput.value = 227696; 
    }
    if (costoConsumoTotalInput && !costoConsumoTotalInput.value) {
        costoConsumoTotalInput.value = 397904; 
    }
    if (fechaInput) {
        fechaInput.valueAsDate = new Date();
    }
    
    if (esAdmin()) {
        permitirAcceso();
    }
});