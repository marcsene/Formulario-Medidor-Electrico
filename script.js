// =====================================================
// PARTE 1 — CONFIGURACIÓN + BASE DE DATOS + SEGURIDAD
// =====================================================

// --- CONFIGURACIÓN GENERAL ---
const PASSWORD_SUFFIX = "2025";
let ADMIN_USER = "Admin"; 
let ADMIN_PASSWORD = "Admin" + PASSWORD_SUFFIX; 
const maxVisitas = 30; // Se asume un valor para maxVisitas
const periodoDias = 30;
const fechaInicial = "2025-10-30";
const LOCAL_STORAGE_KEY = "lecturasData";
const LOCAL_STORAGE_ADMIN_PASS_KEY = "adminPassword"; 

// --- ESTADO GLOBAL ---
let usuarioActual = null; 

// --- BASE DE DATOS ---
let datosLectura = [];
let costosGlobales = {
    fijo: 100000,
    consumo: 50000
};

// Datos iniciales de ejemplo si no hay nada en localStorage
const datosIniciales = [
    { nombre: "Ines Fuentes", parcela: "Parcela 6", fechaActual: fechaInicial, lecturaAnterior: 42920, lecturaActual: 43032, passwordHash: "Ines2025" },
    { nombre: "Pablo Arriagada Vial", parcela: "Parcela 4", fechaActual: fechaInicial, lecturaAnterior: 9293, lecturaActual: 9293, passwordHash: "Pablo2025" },
    { nombre: "Carlos", parcela: "Parcela 5", fechaActual: fechaInicial, lecturaAnterior: 4211, lecturaActual: 4240, passwordHash: "Carlos2025" },
    { nombre: "Cesar Rojas", parcela: "Parcela 10", fechaActual: fechaInicial, lecturaAnterior: 432, lecturaActual: 437, passwordHash: "Cesar2025" },
    { nombre: "Juan Fco. Zeger", parcela: "Parcela 23", fechaActual: fechaInicial, lecturaAnterior: 53214, lecturaActual: 53418, passwordHash: "Juan2025" },
    { nombre: "Margarita Fierro", parcela: "Parcela 05", fechaActual: fechaInicial, lecturaAnterior: 22872, lecturaActual: 23102, passwordHash: "Margarita2025" },
    { nombre: "Jose Lopez", parcela: "Parcela 2", fechaActual: fechaInicial, lecturaAnterior: 72893, lecturaActual: 73208, passwordHash: "Jose2025" },
    { nombre: "P. Gutierrez / Washington Roj.", parcela: "Parcela 1", fechaActual: fechaInicial, lecturaAnterior: 36516, lecturaActual: 36516, passwordHash: "P.2025" },
    { nombre: "Armijo", parcela: "Parcela 3", fechaActual: fechaInicial, lecturaAnterior: 1885, lecturaActual: 1977, passwordHash: "Armijo2025" },
    { nombre: "Arturo Lamarca", parcela: "Parcela 9", fechaActual: fechaInicial, lecturaAnterior: 31625, lecturaActual: 31711, passwordHash: "Arturo2025" },
    { nombre: "Pablo Fuentes", parcela: "Parcela 20", fechaActual: fechaInicial, lecturaAnterior: 19560, lecturaActual: 19590, passwordHash: "Pablo2025" },
    { nombre: "Pedro Pablo Zeger", parcela: "Parcela 22", fechaActual: fechaInicial, lecturaAnterior: 1500, lecturaActual: 1579, passwordHash: "Pedro2025" },
    { nombre: "Samuel Villalobos", parcela: "Parcela 12", fechaActual: fechaInicial, lecturaAnterior: 1888, lecturaActual: 1909, passwordHash: "Samuel2025" },
    { nombre: "Sebastian", parcela: "Parcela 14", fechaActual: fechaInicial, lecturaAnterior: 3, lecturaActual: 3, passwordHash: "Sebastian2025" },
    { nombre: "Alvaro Carrasco", parcela: "Parcela 7", fechaActual: fechaInicial, lecturaAnterior: 20145, lecturaActual: 20441, passwordHash: "Alvaro2025" },
    { nombre: "Gustavo Miranda", parcela: "Parcela 3", fechaActual: fechaInicial, lecturaAnterior: 11037, lecturaActual: 11140, passwordHash: "Gustavo2025" },
    { nombre: "Pier Migueles", parcela: "Lote 2 Parcela 1", fechaActual: fechaInicial, lecturaAnterior: 2762, lecturaActual: 2774, passwordHash: "Pier2025" },
    { nombre: "Robinson", parcela: "N/A", fechaActual: fechaInicial, lecturaAnterior: 36282, lecturaActual: 36334, passwordHash: "Robinson2025" }
];

// --- FUNCIONES DE PERSISTENCIA (LOCAL STORAGE) ---
function cargarDatos() {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedData) {
        const data = JSON.parse(storedData);
        datosLectura = data.clientes || datosIniciales;
        costosGlobales = data.costos || { fijo: 100000, consumo: 50000 };
    } else {
        datosLectura = datosIniciales;
        guardarDatos();
    }
    
    const storedAdminPass = localStorage.getItem(LOCAL_STORAGE_ADMIN_PASS_KEY);
    if (storedAdminPass) {
        ADMIN_PASSWORD = storedAdminPass;
    }
}

function guardarDatos() {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        clientes: datosLectura,
        costos: costosGlobales
    }));
}

// --- FUNCIONES DE SEGURIDAD ---
function comprobarLimiteVisitas() {
    const clave = "visitas_lecturas";
    const ahora = new Date();
    let registro = JSON.parse(localStorage.getItem(clave)) || null;

    if (!registro) {
        registro = { fecha: ahora.toISOString(), veces: 0 };
    } else {
        const dias = (ahora - new Date(registro.fecha)) / (1000 * 60 * 60 * 24);
        if (dias > periodoDias) registro = { fecha: ahora.toISOString(), veces: 0 };
    }

    if (registro.veces >= maxVisitas) return { permitido: false, registro };

    registro.veces++;
    registro.fecha = new Date().toISOString();
    localStorage.setItem(clave, JSON.stringify(registro));

    return { permitido: true, registro };
}

// -----------------------------------------------------------------------
// FUNCIÓN BÁSICA DE NAVEGACIÓN (SE SOBREESCRIBE ABAJO PARA LÓGICA RESPONSIVE)
// -----------------------------------------------------------------------
function mostrarSeccion(id) {
    document.querySelectorAll(".seccion").forEach(sec => sec.style.display = "none");

    const target = document.getElementById(id);
    if (target) target.style.display = "block";
}

function setUsuarioActual(username) {
    usuarioActual = username;
}

// =====================================================
// PARTE 2 — LOGIN + PANEL
// =====================================================

// -------------------------
// INICIAR SESIÓN
// -------------------------
window.iniciarSesion = function() {
    const usuario = document.getElementById("usernameInput").value.trim();
    const clave = document.getElementById("passwordInput").value.trim();
    const rol = document.getElementById("roleSelect").value;
    const msg = document.getElementById("loginMessage");

    msg.textContent = "";

    // Ocultar botones de Admin por defecto
    document.querySelectorAll('.admin-only').forEach(btn => btn.style.display = 'none');
    
    // Mostrar todos los botones por defecto (luego se ocultan para el cliente)
    document.getElementById("btn-lecturas").style.display = "block";
    document.getElementById("btn-costos").style.display = "block";
    document.getElementById("btn-tabla").style.display = "block";
    document.getElementById("btn-pass").style.display = "block";
    document.getElementById("btn-admin").style.display = "block"; 
    
    // Ocultar botón de menú en el login (solo aparece en #app-container)
    document.getElementById("menu-toggle").style.display = 'none';

    // ==== ADMIN LOGIN ====
    if (rol === "admin" && usuario.toLowerCase() === ADMIN_USER.toLowerCase() && clave === ADMIN_PASSWORD) {
        document.getElementById("login-container").style.display = "none";
        document.getElementById("app-container").style.display = "flex";
        document.querySelectorAll('.admin-only').forEach(btn => btn.style.display = 'block');

        mostrarSeccion("seccion-lecturas"); 
        cargarOptionClientes();
        cargarTabla();
        cargarOptionsCrud();
        
        setUsuarioActual(ADMIN_USER);
        
        return;
    }

    // ==== CLIENTE LOGIN ====
    const cliente = datosLectura.find(c => c.nombre.toLowerCase() === usuario.toLowerCase());

    if (!cliente) {
        msg.textContent = "❌ El nombre no existe.";
        return;
    }
    
    const nombrePila = cliente.nombre.split(" ")[0];
    const claveActualEsperada = cliente.passwordHash || (nombrePila + PASSWORD_SUFFIX);

    if (rol === "cliente" && clave !== claveActualEsperada) {
        msg.textContent = "❌ Contraseña incorrecta para el rol de Cliente.";
        return;
    }

    // Si intenta entrar como administrador y falla, o si el rol es incorrecto
    if (rol === "admin") {
        msg.textContent = "❌ Credenciales de Administrador incorrectas.";
        return;
    }
    
    // Límite de visitas
    const limite = comprobarLimiteVisitas();
    if (!limite.permitido) {
        msg.textContent = `❌ Has alcanzado el límite de visitas (${maxVisitas}) por mes.`;
        return;
    }

    // ACCESO DE CLIENTE
    document.getElementById("login-container").style.display = "none";
    document.getElementById("app-container").style.display = "flex";
    
    // ESCONDER BOTONES INNECESARIOS PARA EL CLIENTE
    document.getElementById("btn-lecturas").style.display = "none";
    document.getElementById("btn-costos").style.display = "none";
    document.getElementById("btn-admin").style.display = "none"; 
    
    mostrarSeccion("seccion-tabla");
    cargarTablaCliente(cliente.nombre); // Muestra solo su tabla
    cargarOptionClientes();
    
    setUsuarioActual(cliente.nombre);
}

// -------------------------
// CERRAR SESIÓN
// -------------------------
window.cerrarSesion = function() {
    window.location.reload(); 
}

// =====================================================
// PARTE 3 — CÁLCULO + TABLAS + LECTURAS
// =====================================================

// -----------------------------
// FORMATEO + UTILIDADES
// -----------------------------
function escapeHtml(t) {
    const div = document.createElement("div");
    div.textContent = t;
    return div.innerHTML;
}

function formatearFecha(f) {
    if (!f) return "N/A";
    const p = f.split("-");
    return `${p[2]}-${p[1]}-${p[0]}`; 
}

// -----------------------------
// OBTENER VARIABLES GLOBALES
// -----------------------------
function obtenerVariablesGlobales() {
    const costoFijoTotal = costosGlobales.fijo; 
    const costoConsumoTotal = costosGlobales.consumo;

    const totalConsumo = datosLectura.reduce(
        (sum, c) => sum + (c.lecturaActual - c.lecturaAnterior), 0
    );

    const numClientes = datosLectura.length;

    return {
        costoFijoTotal,
        costoConsumoTotal,
        totalConsumo,
        costoFijoPersona: numClientes > 0 ? costoFijoTotal / numClientes : 0,
        precioKwh: totalConsumo > 0 ? costoConsumoTotal / totalConsumo : 0
    };
}

// -----------------------------
// MONTOS POR CLIENTE
// -----------------------------
function calcularMontoCliente(consumo) {
    const v = obtenerVariablesGlobales();
    return {
        consumoCosto: consumo * v.precioKwh,
        fijo: v.costoFijoPersona,
        total: (consumo * v.precioKwh) + v.costoFijoPersona
    };
}

// -----------------------------
// ACTUALIZAR Y RECALCULAR (Desde sección Costos)
// -----------------------------
window.recalcularTodo = function() {
    const nuevoFijo = Number(document.getElementById("costoFijoTotal").value);
    const nuevoConsumo = Number(document.getElementById("costoConsumoTotal").value);

    costosGlobales.fijo = nuevoFijo;
    costosGlobales.consumo = nuevoConsumo;

    guardarDatos(); 

    cargarTabla();
    alert("✔ Costos globales actualizados y tabla recalculada.");
}

// -----------------------------
// CARGAR SELECT DE CLIENTES
// -----------------------------
function cargarOptionClientes() {
    const sel = document.getElementById("clienteSelect");
    sel.innerHTML = datosLectura.map(c =>
        `<option value="${c.nombre}">${c.nombre}</option>`
    ).join("");
}

// -----------------------------
// TABLA GENERAL (ADMIN)
// -----------------------------
function cargarTabla() {
    const tbody = document.querySelector("#seccion-tabla tbody");
    if (!tbody) return; 

    tbody.innerHTML = "";

    const vars = obtenerVariablesGlobales();
    let sumaTotalFacturada = 0;

    datosLectura.forEach(cli => {
        const consumo = cli.lecturaActual - cli.lecturaAnterior;
        const m = calcularMontoCliente(consumo);

        sumaTotalFacturada += m.total;

        const row = `
        <tr>
            <td>${escapeHtml(cli.nombre)}</td>
            <td>${formatearFecha(cli.fechaActual)}</td>
            <td>${cli.lecturaAnterior}</td>
            <td>${cli.lecturaActual}</td>
            <td>${consumo}</td>
            <td>$${m.consumoCosto.toFixed(0)}</td>
            <td>$${m.fijo.toFixed(0)}</td>
            <td>$${m.total.toFixed(0)}</td>
        </tr>
        `;
        tbody.insertAdjacentHTML("beforeend", row);
    });

    // Total general
    tbody.insertAdjacentHTML("beforeend", `
        <tr class="total-row">
            <td colspan="4" style="text-align:right;font-weight:bold;">TOTAL GENERAL:</td>
            <td>${vars.totalConsumo}</td>
            <td>$${vars.costoConsumoTotal.toFixed(0)}</td>
            <td>$${vars.costoFijoTotal.toFixed(0)}</td>
            <td>$${sumaTotalFacturada.toFixed(0)}</td>
        </tr>
    `);
}

// -----------------------------
// TABLA — SOLO CLIENTE
// -----------------------------
function cargarTablaCliente(nombre) {
    const tbody = document.querySelector("#seccion-tabla tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const cli = datosLectura.find(c => c.nombre === nombre);
    if (!cli) {
           tbody.innerHTML = `<tr><td colspan="8">Error: No se encontraron datos para el usuario ${nombre}.</td></tr>`;
           return;
    }

    const consumo = cli.lecturaActual - cli.lecturaAnterior;
    const m = calcularMontoCliente(consumo);
    
    const row = `
        <tr>
            <td>${cli.nombre}</td>
            <td>${formatearFecha(cli.fechaActual)}</td>
            <td>${cli.lecturaAnterior}</td>
            <td>${cli.lecturaActual}</td>
            <td>${consumo}</td>
            <td>$${m.consumoCosto.toFixed(0)}</td>
            <td>$${m.fijo.toFixed(0)}</td>
            <td>$${m.total.toFixed(0)}</td>
        </tr>
    `;
    tbody.insertAdjacentHTML("beforeend", row);
}

// -----------------------------------
// REGISTRAR NUEVA LECTURA
// -----------------------------------
window.calcularConsumo = function() {
    const nombre = document.getElementById("clienteSelect").value;
    const fecha = document.getElementById("fechaInput").value;
    const lecturaNueva = Number(document.getElementById("lecturaInput").value);

    if (!fecha || isNaN(lecturaNueva)) {
        alert("⚠ Complete fecha y lectura.");
        return;
    }

    let cliente = datosLectura.find(d => d.nombre === nombre);

    if (!cliente) {
        alert("Error: Cliente no encontrado.");
        return;
    }

    if (lecturaNueva < cliente.lecturaActual) {
        alert("⚠ La nueva lectura no puede ser menor a la lectura actual registrada.");
        return;
    }

    cliente.fechaAnterior = cliente.fechaActual;
    cliente.fechaActual = fecha;
    cliente.lecturaAnterior = cliente.lecturaActual;
    cliente.lecturaActual = lecturaNueva;

    guardarDatos();
    
    cargarTabla();
    alert("✔ Lectura registrada correctamente.");
}

// =====================================================
// PARTE 4 — CRUD ADMINISTRADOR COMPLETO
// =====================================================

// REFERENCIAS A LOS INPUTS DEL CRUD
const crudSelect = document.getElementById("crud-select");
const crudNombre = document.getElementById("crud-nombre");
const crudParcela = document.getElementById("crud-parcela");
const crudLectura = document.getElementById("crud-lectura");
const crudMensaje = document.getElementById("crud-mensaje");

const crudBtnGuardar = document.getElementById("crud-guardar");
const crudBtnEliminar = document.getElementById("crud-eliminar");
const crudBtnCrear = document.getElementById("crud-crear");


function cargarOptionsCrud() {
    crudSelect.innerHTML =
        `<option value="">-- Seleccione Cliente --</option>` +
        datosLectura.map((c, i) =>
            `<option value="${i}">${c.nombre}</option>`
        ).join("");
}

function cargarDatosCrud() {
    const idx = crudSelect.value;

    if (idx === "") {
        crudNombre.value = "";
        crudParcela.value = "";
        crudLectura.value = "";
        crudMensaje.textContent = "";
        return;
    }

    const c = datosLectura[idx];

    crudNombre.value = c.nombre;
    crudParcela.value = c.parcela || "";
    crudLectura.value = c.lecturaActual;
    crudMensaje.textContent = `Cliente seleccionado: ${c.nombre}`;
}

function nombreExiste(nombre, ignorarIndex = null) {
    return datosLectura.some((c, i) => {
        if (i === ignorarIndex) return false;
        return c.nombre.toLowerCase() === nombre.toLowerCase();
    });
}

function guardarCrud() {
    const idx = crudSelect.value;

    if (idx === "") {
        crudMensaje.textContent = "Seleccione un cliente antes de guardar.";
        return;
    }

    const nuevoNombre = crudNombre.value.trim();
    const nuevaParcela = crudParcela.value.trim();
    const nuevaLectura = Number(crudLectura.value);

    if (!nuevoNombre) {
        crudMensaje.textContent = "El nombre no puede estar vacío.";
        return;
    }

    if (nombreExiste(nuevoNombre, Number(idx))) {
        crudMensaje.textContent = "Error: Ya existe un cliente con ese nombre.";
        return;
    }

    datosLectura[idx].nombre = nuevoNombre;
    datosLectura[idx].parcela = nuevaParcela;
    datosLectura[idx].lecturaActual = nuevaLectura;

    guardarDatos();
    
    crudMensaje.textContent = "✔ Cambios guardados correctamente.";

    cargarTabla();
    cargarOptionClientes();
    cargarOptionsCrud();
}

function eliminarCrud() {
    const idx = crudSelect.value;

    if (idx === "") {
        crudMensaje.textContent = "Seleccione un cliente para eliminar.";
        return;
    }

    if (!confirm(`¿Seguro que desea eliminar al cliente ${datosLectura[idx].nombre}? Esta acción es irreversible.`)) return;

    datosLectura.splice(idx, 1);

    guardarDatos();

    crudMensaje.textContent = "✔ Cliente eliminado.";

    crudSelect.value = "";
    crudNombre.value = "";
    crudParcela.value = "";
    crudLectura.value = "";

    cargarTabla();
    cargarOptionClientes();
    cargarOptionsCrud();
}

function crearNuevoCliente() {
    const nuevoNombre = crudNombre.value.trim();
    const nuevaParcela = crudParcela.value.trim();
    const nuevaLectura = Number(crudLectura.value);
    
    const nombrePila = nuevoNombre.split(" ")[0];
    const nuevaPassword = nombrePila + PASSWORD_SUFFIX; 

    if (!nuevoNombre) {
        crudMensaje.textContent = "Error: El nombre es obligatorio.";
        return;
    }

    if (nombreExiste(nuevoNombre)) {
        crudMensaje.textContent = "Error: Ese cliente ya existe.";
        return;
    }

    datosLectura.push({
        nombre: nuevoNombre,
        parcela: nuevaParcela || "N/A",
        fechaActual: fechaInicial,
        lecturaAnterior: nuevaLectura,
        lecturaActual: nuevaLectura,
        passwordHash: nuevaPassword
    });

    guardarDatos();
    
    crudMensaje.textContent = `✔ Cliente agregado. Contraseña inicial: ${nuevaPassword}`;

    cargarTabla();
    cargarOptionClientes();
    cargarOptionsCrud();

    crudSelect.value = "";
    crudNombre.value = "";
    crudParcela.value = "";
    crudLectura.value = "";
}

// Asignación de eventos del CRUD
if(crudSelect) crudSelect.onchange = cargarDatosCrud;
if(crudBtnGuardar) crudBtnGuardar.onclick = guardarCrud;
if(crudBtnEliminar) crudBtnEliminar.onclick = eliminarCrud;
if(crudBtnCrear) crudBtnCrear.onclick = crearNuevoCliente;


// =====================================================
// PARTE 5 — GESTIÓN DE CONTRASEÑAS
// =====================================================

window.cambiarPassword = function() {
    const passActual = document.getElementById("passActualInput").value.trim();
    const passNueva = document.getElementById("passNuevaInput").value.trim();
    const passConfirma = document.getElementById("passConfirmaInput").value.trim();
    const msg = document.getElementById("passMessage");
    msg.textContent = "";

    if (passNueva !== passConfirma) {
        msg.textContent = "❌ Las contraseñas no coinciden.";
        return;
    }

    if (passNueva.length < 5) {
        msg.textContent = "❌ La nueva contraseña debe tener al menos 5 caracteres.";
        return;
    }

    // --- LÓGICA PARA ADMINISTRADOR ---
    if (usuarioActual === ADMIN_USER) {
        if (passActual !== ADMIN_PASSWORD) {
            msg.textContent = "❌ Contraseña actual del Administrador incorrecta.";
            return;
        }

        ADMIN_PASSWORD = passNueva;
        localStorage.setItem(LOCAL_STORAGE_ADMIN_PASS_KEY, ADMIN_PASSWORD);
        msg.textContent = "✅ Contraseña de Administrador actualizada. Por favor, reinicie la sesión.";
        return;
    }
    
    // --- LÓGICA PARA CLIENTE ---
    const cliente = datosLectura.find(c => c.nombre === usuarioActual);

    if (!cliente) {
        msg.textContent = "❌ Error: Usuario no encontrado.";
        return;
    }
    
    const nombrePila = cliente.nombre.split(" ")[0];
    const claveActualEsperada = cliente.passwordHash || (nombrePila + PASSWORD_SUFFIX);

    if (passActual !== claveActualEsperada) {
        msg.textContent = "❌ Contraseña actual incorrecta.";
        return;
    }
    
    // Actualizar la contraseña del cliente
    cliente.passwordHash = passNueva;
    guardarDatos();
    
    msg.textContent = "✅ Contraseña actualizada correctamente. Por favor, reinicie la sesión.";
}

// =====================================================
// PARTE 6 — RESPONSIVE (MÓVIL) Y EVENT LISTENERS
// =====================================================

// Se guarda la referencia original de mostrarSeccion
const originalMostrarSeccion = mostrarSeccion;

// Se sobrescribe mostrarSeccion para manejar el cierre del menú en móvil
mostrarSeccion = function(id) {
    const sidebar = document.getElementById('sidebar');
    
    if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('open')) {
        // Cierra el sidebar
        sidebar.classList.remove('open');
        // Espera la transición de CSS para mostrar la sección
        setTimeout(() => {
            originalMostrarSeccion(id);
        }, 300); 
    } else {
        originalMostrarSeccion(id);
    }
}


// Asignar eventos una vez que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", () => {
    // --- LÓGICA DE CARGA INICIAL ---
    cargarDatos();
    // Inicialmente ocultamos la app y mostramos el login
    document.getElementById("login-container").style.display = "block";
    document.getElementById("app-container").style.display = "none";
    
    // --- LÓGICA RESPONSIVE DE MENÚ ---
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');

    if (menuToggle && sidebar) {
        // Asignar el evento para abrir/cerrar el menú
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // --- ASIGNACIÓN DE EVENTOS A BOTONES DEL MENÚ ---
    // Usamos esta forma para asegurar que los eventos se asignen correctamente
    // sin depender de 'onclick' en el HTML, y usan la función 'mostrarSeccion' modificada.
    
    document.getElementById("btn-lecturas").onclick = () => {
        mostrarSeccion("seccion-lecturas"); 
    };

    document.getElementById("btn-tabla").onclick = () => {
        mostrarSeccion("seccion-tabla");
        if (usuarioActual === ADMIN_USER) {
            cargarTabla();
        } else if (usuarioActual) {
            cargarTablaCliente(usuarioActual);
        }
    };

    document.getElementById("btn-costos").onclick = () => {
        mostrarSeccion("seccion-costos");
        document.getElementById("costoFijoTotal").value = costosGlobales.fijo;
        document.getElementById("costoConsumoTotal").value = costosGlobales.consumo;
    };

    document.getElementById("btn-pass").onclick = () => {
        mostrarSeccion("seccion-pass");
        document.getElementById("passMessage").textContent = "";
    };

    document.getElementById("btn-admin").onclick = () => {
        mostrarSeccion("seccion-admin");
        cargarOptionsCrud();
    };

});