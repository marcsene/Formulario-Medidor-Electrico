// ===========================
// Configuración de seguridad
// ===========================
// Contraseña: Nombre de Pila + este número
const PASSWORD_SUFFIX = "2025"; 
const maxVisitas = 50; // Máximo de 2 accesos por periodo.
const periodoDias = 30; // Periodo de gracia para reiniciar el contador de visitas (aunque la lógica lo maneja como días transcurridos desde el primer acceso).
const TARIFA_UNITARIA_INICIAL = 180; 

// ===========================
// Base de datos estática
// ===========================
const fechaInicial = "2025-10-30"; 

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
// Funciones de Login y Seguridad
// ===========================

function esAdmin() {
    // Si se accede con ?admin=si, se salta el límite y el login
    return window.location.search.includes('admin=si');
}

function comprobarLimiteVisitas() {
    if (esAdmin()) return { permitido: true }; 
    
    // Lógica para limitar a maxVisitas por periodoDias
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
        // Primer acceso
        registro = { fecha: ahora.toISOString(), veces: 0 };
    } else {
        const diasPasados = (ahora - new Date(registro.fecha)) / (1000 * 60 * 60 * 24);
        if (diasPasados > periodoDias) {
            // Reiniciar el contador si ha pasado el periodo
            registro = { fecha: ahora.toISOString(), veces: 0 };
        }
    }

    if (registro.veces >= maxVisitas) {
        return { permitido: false, registro };
    } else {
        // Registrar visita
        registro.veces = registro.veces + 1;
        registro.fecha = new Date().toISOString();
        localStorage.setItem(clave, JSON.stringify(registro));
        return { permitido: true, registro };
    }
}

/**
 * Función principal de LOGIN que verifica el usuario, contraseña y límite de visitas.
 */
window.iniciarSesion = function() {
    const usuario = document.getElementById("usernameInput").value.trim();
    const clave = document.getElementById("passwordInput").value.trim();
    const mensaje = document.getElementById("loginMessage");
    mensaje.textContent = '';

    // 1. Verificar si el usuario es un cliente de la lista
    const clienteEncontrado = datosLectura.find(d => d.nombre.toLowerCase() === usuario.toLowerCase());

    if (!clienteEncontrado) {
        mensaje.textContent = "Error: El nombre de usuario no se encuentra en la lista.";
        return;
    }

    // 2. Generar y comparar la contraseña esperada (Nombre de Pila + PASSWORD_SUFFIX)
    const nombrePila = clienteEncontrado.nombre.split(' ')[0];
    const claveEsperada = nombrePila + PASSWORD_SUFFIX;

    if (clave === claveEsperada) {
        
        // 3. Comprobar límite de visitas (LÓGICA DE RESTRICCIÓN AQUÍ)
        const limite = comprobarLimiteVisitas();
        if (!limite.permitido) {
            mensaje.textContent = `Acceso denegado: Has alcanzado el límite de ${limite.registro.veces} accesos permitidos en los últimos ${periodoDias} días.`;
            return;
        }

        // Éxito: Mostrar la aplicación
        document.getElementById("login-container").style.display = 'none';
        document.getElementById("app-container").style.display = 'block';
        
        // Cargar los datos y la tabla
        crearOptionClientes();
        cargarTabla();

    } else {
        mensaje.textContent = "Error: Contraseña incorrecta.";
    }
}


// ===========================
// Funciones de Lógica y Cálculo Proporcional (Sin Cambios)
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
    
    datosLectura.forEach(cliente => {
        const consumoCalculado = cliente.lecturaActual - cliente.lecturaAnterior;
        
        const montos = calcularMontoTotalCliente(consumoCalculado);

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
    
    mostrarResultadoHtml(`
        <p><strong>Variables de Distribución Global:</strong></p>
        <p>Total Clientes: ${variablesGlobales.numClientes}</p>
        <p>Suma Consumo Total (kWh): ${variablesGlobales.totalConsumoKwh.toLocaleString('es-CL')}</p>
        <hr>
        <p><strong>Costo Fijo por Persona:</strong> $${variablesGlobales.costoFijoPorPersona.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
        <p><strong>Precio por 1 kWh (Unitario):</strong> $${variablesGlobales.precioKwhUnitario.toFixed(4).toLocaleString('es-CL')}</p>
        <hr>
        <p style="font-weight: bold; color: green;">Tabla de Costos por Cliente Actualizada.</p>
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

    cliente.fechaAnterior = fechaMesAnterior;
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

    if (costoFijoTotalInput && !costoFijoTotalInput.value) {
        costoFijoTotalInput.value = 50000; 
    }
    if (costoConsumoTotalInput && !costoConsumoTotalInput.value) {
        costoConsumoTotalInput.value = 350000; 
    }
    if (fechaInput) {
        fechaInput.valueAsDate = new Date();
    }
    
    // **Admin Bypass** (Se salta el login y el límite de visitas)
    if (esAdmin()) {
        document.getElementById("login-container").style.display = 'none';
        document.getElementById("app-container").style.display = 'block';
        crearOptionClientes();
        cargarTabla();
    } 
    // Si no es admin, la aplicación permanece oculta y el usuario debe hacer login.

});