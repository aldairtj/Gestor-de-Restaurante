let cacheClientes = [];
let cacheMesas = [];
let cacheMeseros = [];

// Reservas Module - VERSIÓN COMPLETA Y FUNCIONAL
window.loadReservas = async function() {
    if (window.permisosManager && window.permisosManager.isMesero()) {
        // Cargar versión simplificada para meseros
        return;
    }
    
    console.log('Cargando módulo de reservas...');
    
    const content = document.getElementById('contentArea');
    
    content.innerHTML = `
        <div style="padding: 20px;">
            <h1>Gestión de Reservas</h1>
            
            <div style="margin: 20px 0; display: flex; gap: 10px; flex-wrap: wrap;">
                <button class="btn btn-primary" onclick="abrirModalReserva()">
                    <i class="fas fa-plus"></i> Nueva Reserva
                </button>
                <button class="btn btn-secondary" onclick="cargarReservas()">
                    <i class="fas fa-sync"></i> Refrescar Lista
                </button>
                <button class="btn btn-secondary" onclick="forzarRecargaDatos()" 
                        title="Forzar recarga completa de clientes y mesas">
                    <i class="fas fa-database"></i> Recargar Datos
                </button>
            </div>
            
            <div id="infoReservas" style="margin: 15px 0; padding: 10px; background: var(--surface-high); border-radius: 6px;">
                <small style="color: var(--text-secondary);">
                    <i class="fas fa-info-circle"></i> 
                    <span id="infoTexto">Cargando información...</span>
                </small>
            </div>
            
            <div id="reservasContainer">
                <div class="loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Cargando reservas...</p>
                </div>
            </div>
        </div>
        
        <!-- Modal para crear/editar reserva -->
        <div class="modal-overlay" id="modalReserva" style="display: none;">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3 id="modalReservaTitle">Nueva Reserva</h3>
                    <button class="btn btn-icon" onclick="cerrarModalReserva()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <form id="formReserva">
                        <input type="hidden" id="reservaId" value="0">
                        
                        <div class="form-group">
                            <label class="form-label" for="clienteReserva">
                                <i class="fas fa-user"></i> Cliente *
                            </label>
                            <select id="clienteReserva" class="form-control" required>
                                <option value="">Cargando clientes...</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="mesaReserva">
                                <i class="fas fa-chair"></i> Mesa *
                            </label>
                            <select id="mesaReserva" class="form-control" required>
                                <option value="">Cargando mesas...</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="meseroReserva">
                                <i class="fas fa-user-tie"></i> Mesero *
                            </label>
                            <select id="meseroReserva" class="form-control" required>
                                <option value="">Cargando meseros...</option>
                            </select>
                            <small style="color: var(--text-secondary); display: block; margin-top: 5px;">
                                Turnos: Mañana (06:00-14:00), Tarde (14:00-22:00), Noche (22:00-06:00)
                            </small>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                            <div class="form-group">
                                <label class="form-label" for="fechaReserva">
                                    <i class="fas fa-calendar"></i> Fecha *
                                </label>
                                <input type="date" id="fechaReserva" class="form-control" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label" for="horaReserva">
                                    <i class="fas fa-clock"></i> Hora *
                                </label>
                                <input type="time" id="horaReserva" class="form-control" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="personasReserva">
                                <i class="fas fa-users"></i> Número de Personas *
                            </label>
                            <input type="number" id="personasReserva" class="form-control" 
                                required min="1" max="50" value="2">
                        </div>
                        
                        <div id="mensajeErrorReserva" style="display: none; margin-top: 15px; padding: 10px; 
                            background: rgba(244, 67, 54, 0.1); color: #f44336; border-radius: 5px;"></div>
                        
                        <div id="mensajeExitoReserva" style="display: none; margin-top: 15px; padding: 10px; 
                            background: rgba(76, 175, 80, 0.1); color: #4CAF50; border-radius: 5px;"></div>
                    </form>
                </div>
                
                <!-- AQUÍ AGREGAMOS LOS BOTONES FALTANTES -->
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="cerrarModalReserva()">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button type="button" class="btn btn-primary" onclick="guardarReserva()">
                        <i class="fas fa-save"></i> Guardar Reserva
                    </button>
                </div>
            </div>
        </div>
    `;
    
    await cargarReservas();
    
    // Agregar eventos después de que el HTML esté cargado
    setTimeout(() => {
        // Evento para hora input
        const horaInput = document.getElementById('horaReserva');
        if (horaInput) {
            horaInput.addEventListener('change', function() {
                if (this.value) {
                    actualizarMeserosPorHora(this.value);
                }
            });
            
            horaInput.addEventListener('input', function() {
                if (this.value && this.value.length === 5) {
                    actualizarMeserosPorHora(this.value);
                }
            });
        }
        
        // Evento para validación en tiempo real de capacidad
        const personasInput = document.getElementById('personasReserva');
        if (personasInput) {
            personasInput.addEventListener('input', function() {
                limpiarMensajes(); // Limpiar mensajes cuando el usuario modifica datos
                const mesaSelect = document.getElementById('mesaReserva');
                const selectedOption = mesaSelect?.options[mesaSelect.selectedIndex];
                const capacidad = selectedOption?.dataset.capacidad;
                
                if (capacidad && this.value > capacidad) {
                    this.style.borderColor = '#f44336';
                    mostrarErrorReserva(`⚠️ La mesa seleccionada tiene capacidad para ${capacidad} personas máximo`);
                } else {
                    this.style.borderColor = '';
                }
            });
        }
        
        // Evento para limpiar mensajes cuando se modifica cualquier campo
        const camposForm = ['clienteReserva', 'mesaReserva', 'meseroReserva', 'fechaReserva', 'horaReserva'];
        camposForm.forEach(campoId => {
            const campo = document.getElementById(campoId);
            if (campo) {
                campo.addEventListener('change', limpiarMensajes);
            }
        });
    }, 100);
};

// Función para limpiar mensajes del modal
function limpiarMensajes() {
    const errorDiv = document.getElementById('mensajeErrorReserva');
    const exitoDiv = document.getElementById('mensajeExitoReserva');
    
    if (errorDiv) errorDiv.style.display = 'none';
    if (exitoDiv) exitoDiv.style.display = 'none';
}

// Función para forzar recarga de datos
window.forzarRecargaDatos = async function() {
    try {
        app.showToast('Recargando datos de clientes y mesas...', 'info');
        
        // Limpiar cache
        cacheClientes = [];
        cacheMesas = [];
        
        // Recargar datos frescos
        const [clientes, mesas] = await Promise.all([
            fetch('http://localhost:5034/api/cliente').then(r => r.json()),
            fetch('http://localhost:5034/api/mesa').then(r => r.json())
        ]);
        
        cacheClientes = clientes || [];
        cacheMesas = mesas || [];
        
        console.log('✅ Datos recargados:');
        console.log('- Clientes:', cacheClientes.map(c => `ID:${c.ID_CLIENTE}=${c.NOMBRE}`));
        console.log('- Mesas:', cacheMesas.map(m => `ID:${m.ID_MESA}=${m.NUMERO}`));
        
        // Actualizar información en pantalla
        actualizarInformacion();
        
        app.showToast(`✅ ${cacheClientes.length} clientes, ${cacheMesas.length} mesas cargados`, 'success');
        
        // Actualizar UI si el modal está abierto
        const modal = document.getElementById('modalReserva');
        if (modal && modal.style.display === 'flex') {
            await actualizarSelectClientes();
            await actualizarSelectMesas();
        }
        
    } catch (error) {
        console.error('Error recargando datos:', error);
        app.showToast(`❌ Error: ${error.message}`, 'error');
    }
};

// Actualizar información en pantalla
function actualizarInformacion() {
    const infoDiv = document.getElementById('infoTexto');
    if (infoDiv) {
        if (cacheClientes.length === 0 && cacheMesas.length === 0) {
            infoDiv.innerHTML = 'No hay clientes ni mesas disponibles';
        } else {
            const clientesInfo = cacheClientes.length > 0 
                ? `${cacheClientes.length} clientes (${cacheClientes.map(c => `${c.NOMBRE} ID:${c.ID_CLIENTE}`).join(', ')})`
                : '0 clientes';
            
            const mesasInfo = cacheMesas.length > 0
                ? `${cacheMesas.length} mesas (${cacheMesas.map(m => `Mesa ${m.NUMERO} ID:${m.ID_MESA}`).join(', ')})`
                : '0 mesas';
            
            infoDiv.innerHTML = `<strong>Clientes disponibles:</strong> ${clientesInfo} | <strong>Mesas disponibles:</strong> ${mesasInfo}`;
        }
    }
}

// Actualizar select de clientes
window.actualizarSelectClientes = async function() {
    try {
        const select = document.getElementById('clienteReserva');
        if (!select) return;
        
        select.innerHTML = '<option value="">Cargando clientes...</option>';
        select.disabled = true;
        
        // Recargar clientes frescos
        const clientes = await fetch('http://localhost:5034/api/cliente').then(r => r.json());
        cacheClientes = clientes || [];
        
        select.innerHTML = '<option value="">Seleccione un cliente</option>';
        
        if (clientes.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '⚠️ No hay clientes registrados';
            option.disabled = true;
            select.appendChild(option);
        } else {
            clientes.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.ID_CLIENTE;
                option.textContent = `${cliente.NOMBRE || 'Sin nombre'} (ID: ${cliente.ID_CLIENTE})`;
                if (cliente.TELEFONO) {
                    option.textContent += ` - ${cliente.TELEFONO}`;
                }
                select.appendChild(option);
            });
            
            console.log('✅ Select actualizado con', clientes.length, 'clientes:', 
                clientes.map(c => `ID:${c.ID_CLIENTE}`));
        }
        
        select.disabled = false;
        
    } catch (error) {
        console.error('Error actualizando clientes:', error);
        const select = document.getElementById('clienteReserva');
        if (select) {
            select.innerHTML = '<option value="">❌ Error cargando clientes</option>';
        }
    }
};

// Actualizar select de mesas - VERSIÓN MEJORADA
window.actualizarSelectMesas = async function() {
    try {
        const select = document.getElementById('mesaReserva');
        if (!select) return;
        
        select.innerHTML = '<option value="">Cargando mesas...</option>';
        
        const mesas = await fetch('http://localhost:5034/api/mesa').then(r => r.json());
        cacheMesas = mesas || [];
        
        select.innerHTML = '<option value="">Seleccione una mesa</option>';
        
        if (mesas.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '⚠️ No hay mesas registradas';
            option.disabled = true;
            select.appendChild(option);
        } else {
            mesas.forEach(mesa => {
                const option = document.createElement('option');
                option.value = mesa.ID_MESA;
                
                // Mostrar capacidad en la opción
                let texto = `Mesa ${mesa.NUMERO || mesa.ID_MESA}`;
                if (mesa.CAPACIDAD) {
                    texto += ` (Máx. ${mesa.CAPACIDAD} pers.)`;
                }
                
                option.textContent = texto;
                
                // Agregar atributo data para la capacidad
                if (mesa.CAPACIDAD) {
                    option.dataset.capacidad = mesa.CAPACIDAD;
                }
                
                select.appendChild(option);
            });
            
            // Agregar evento para actualizar el máximo del input de personas
            select.addEventListener('change', function() {
                const selectedOption = this.options[this.selectedIndex];
                const capacidad = selectedOption.dataset.capacidad;
                const personasInput = document.getElementById('personasReserva');
                
                if (capacidad) {
                    personasInput.max = capacidad;
                    personasInput.title = `Máximo: ${capacidad} personas`;
                    
                    // Si el valor actual excede la capacidad, ajustarlo
                    if (parseInt(personasInput.value) > parseInt(capacidad)) {
                        personasInput.value = capacidad;
                    }
                } else {
                    personasInput.max = 50; // Valor por defecto
                    personasInput.title = '';
                }
            });
        }
        
    } catch (error) {
        console.error('Error actualizando mesas:', error);
        const select = document.getElementById('mesaReserva');
        if (select) {
            select.innerHTML = '<option value="">❌ Error cargando mesas</option>';
        }
    }
};

// Actualizar select de meseros
window.actualizarSelectMeseros = async function() {
    try {
        const select = document.getElementById('meseroReserva');
        if (!select) return;
        
        select.innerHTML = '<option value="">Cargando meseros...</option>';
        
        const meseros = await fetch('http://localhost:5034/api/mesero').then(r => r.json());
        cacheMeseros = meseros || [];
        
        select.innerHTML = '<option value="">Seleccione un mesero</option>';
        
        if (meseros.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '⚠️ No hay meseros registrados';
            option.disabled = true;
            select.appendChild(option);
        } else {
            // Filtrar solo meseros activos
            const meserosActivos = meseros.filter(m => m.ACTIVO !== false);
            
            meserosActivos.forEach(mesero => {
                const option = document.createElement('option');
                option.value = mesero.ID_MESERO;
                
                let texto = `${mesero.NOMBRE || 'Sin nombre'}`;
                if (mesero.TURNO) {
                    texto += ` - Turno: ${mesero.TURNO}`;
                }
                
                option.textContent = texto;
                option.dataset.turno = mesero.TURNO || '';
                
                select.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Error actualizando meseros:', error);
        const select = document.getElementById('meseroReserva');
        if (select) {
            select.innerHTML = '<option value="">❌ Error cargando meseros</option>';
        }
    }
};

// Cargar lista de reservas
async function cargarReservas() {
    try {
        console.log('Cargando reservas con datos frescos...');
        
        // Cargar datos frescos
        await forzarRecargaDatos();
        
        // Cargar reservas
        const reservas = await app.fetchData('reserva');
        const container = document.getElementById('reservasContainer');
        
        if (!reservas || reservas.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; background: var(--surface); border-radius: 10px;">
                    <i class="fas fa-calendar-check" style="font-size: 3rem; color: var(--primary); margin-bottom: 20px;"></i>
                    <h3>No hay reservas registradas</h3>
                    <p>Comienza creando tu primera reserva</p>
                    <button class="btn btn-primary" onclick="abrirModalReserva()" style="margin-top: 15px;">
                        <i class="fas fa-plus"></i> Crear Primera Reserva
                    </button>
                </div>
            `;
            return;
        }
        
        // Ordenar por fecha (más recientes primero)
        const reservasOrdenadas = [...reservas].sort((a, b) => {
            const fechaA = a.FECHA_RESERVA ? new Date(a.FECHA_RESERVA) : new Date(0);
            const fechaB = b.FECHA_RESERVA ? new Date(b.FECHA_RESERVA) : new Date(0);
            return fechaB - fechaA;
        });
        
        let html = `
            <div style="background: var(--surface); border-radius: 10px; overflow: hidden; border: 1px solid var(--surface-high);">
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
                        <thead>
                            <tr style="background: var(--surface-high);">
                                <th style="padding: 15px; text-align: left;">ID</th>
                                <th style="padding: 15px; text-align: left;">Cliente</th>
                                <th style="padding: 15px; text-align: left;">Mesa</th>
                                <th style="padding: 15px; text-align: left;">Fecha</th>
                                <th style="padding: 15px; text-align: left;">Hora</th>
                                <th style="padding: 15px; text-align: left;">Personas</th>
                                <th style="padding: 15px; text-align: left;">Estado</th>
                                <th style="padding: 15px; text-align: left;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        reservasOrdenadas.forEach(reserva => {
            const cliente = cacheClientes.find(c => c.ID_CLIENTE === reserva.ID_CLIENTE);
            const mesa = cacheMesas.find(m => m.ID_MESA === reserva.ID_MESA);
            
            const nombreCliente = cliente ? cliente.NOMBRE : `Cliente ${reserva.ID_CLIENTE}`;
            const numeroMesa = mesa ? (mesa.NUMERO || `Mesa ${mesa.ID_MESA}`) : `Mesa ${reserva.ID_MESA}`;
            
            const fechaReserva = reserva.FECHA_RESERVA ? new Date(reserva.FECHA_RESERVA) : null;
            const fechaFormateada = fechaReserva ? 
                fechaReserva.toLocaleDateString('es-ES', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                }) : 'N/A';
            
            // Determinar estado
            let estado = '';
            let estadoClass = '';
            
            if (fechaReserva) {
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                const fechaReservaSinHora = new Date(fechaReserva);
                fechaReservaSinHora.setHours(0, 0, 0, 0);
                
                if (fechaReservaSinHora < hoy) {
                    estado = 'Pasada';
                    estadoClass = 'status-pasada';
                } else if (fechaReservaSinHora.getTime() === hoy.getTime()) {
                    estado = 'Hoy';
                    estadoClass = 'status-hoy';
                } else {
                    estado = 'Próxima';
                    estadoClass = 'status-proxima';
                }
            }
            
            html += `
                <tr style="border-bottom: 1px solid var(--surface-high);">
                    <td style="padding: 15px;">
                        <strong>#${reserva.ID_RESERVA}</strong>
                    </td>
                    <td style="padding: 15px;">
                        <div style="font-weight: 500;">${nombreCliente}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">
                            ID: ${reserva.ID_CLIENTE}
                        </div>
                    </td>
                    <td style="padding: 15px;">
                        <div>${numeroMesa}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">
                            ID: ${reserva.ID_MESA}
                        </div>
                    </td>
                    <td style="padding: 15px;">${fechaFormateada}</td>
                    <td style="padding: 15px;">${reserva.HORA_RESERVA || 'N/A'}</td>
                    <td style="padding: 15px;">
                        <span style="display: inline-block; padding: 4px 10px; background: var(--primary-light); 
                              color: var(--primary); border-radius: 12px; font-weight: 500;">
                            ${reserva.NUM_PERSONAS || 0}
                        </span>
                    </td>
                    <td style="padding: 15px;">
                        <span class="status-badge ${estadoClass}">${estado}</span>
                    </td>
                    <td style="padding: 15px;">
                        <div style="display: flex; gap: 5px;">
                            <button class="btn btn-sm btn-secondary" onclick="editarReserva(${reserva.ID_RESERVA})" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-secondary" onclick="eliminarReserva(${reserva.ID_RESERVA})" 
                                    title="Eliminar" style="color: var(--error);">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div style="margin-top: 15px; color: var(--text-secondary); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <i class="fas fa-calendar-alt"></i> Total: ${reservas.length} reserva(s)
                </div>
                <div>
                    <span style="margin-right: 15px;">
                        <span class="status-badge status-proxima" style="margin-right: 5px;"></span> Próximas
                    </span>
                    <span style="margin-right: 15px;">
                        <span class="status-badge status-hoy" style="margin-right: 5px;"></span> Hoy
                    </span>
                    <span>
                        <span class="status-badge status-pasada" style="margin-right: 5px;"></span> Pasadas
                    </span>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        
        // Agregar estilos CSS si no existen
        if (!document.querySelector('#reservasStyles')) {
            const styles = document.createElement('style');
            styles.id = 'reservasStyles';
            styles.textContent = `
                .status-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 15px;
                    font-size: 0.85rem;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .status-proxima {
                    background: rgba(33, 150, 243, 0.15);
                    color: #2196F3;
                    border: 1px solid #2196F3;
                }
                .status-hoy {
                    background: rgba(76, 175, 80, 0.15);
                    color: #4CAF50;
                    border: 1px solid #4CAF50;
                }
                .status-pasada {
                    background: rgba(158, 158, 158, 0.15);
                    color: #9E9E9E;
                    border: 1px solid #9E9E9E;
                }
                .primary-light {
                    background: var(--primary-light);
                    color: var(--primary);
                }
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.7);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                .modal-content {
                    background: var(--surface);
                    border-radius: 10px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.3);
                    animation: modalAppear 0.3s ease-out;
                }
                @keyframes modalAppear {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .modal-header {
                    padding: 20px;
                    border-bottom: 1px solid var(--surface-high);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .modal-body {
                    padding: 20px;
                    max-height: 70vh;
                    overflow-y: auto;
                }
                .modal-footer {
                    padding: 20px;
                    border-top: 1px solid var(--surface-high);
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                }
                .form-group {
                    margin-bottom: 20px;
                }
                .form-label {
                    display: block;
                    margin-bottom: 8px;
                    color: var(--text-secondary);
                    font-weight: 500;
                }
                .form-control {
                    width: 100%;
                    padding: 12px;
                    border-radius: 6px;
                    border: 1px solid var(--surface-high);
                    background: var(--background);
                    color: var(--text-primary);
                    font-size: 1rem;
                    transition: border-color 0.3s;
                }
                .form-control:focus {
                    outline: none;
                    border-color: var(--primary);
                }
                .loading {
                    text-align: center;
                    padding: 40px;
                    color: var(--text-secondary);
                }
                .loading i {
                    font-size: 2rem;
                    margin-bottom: 15px;
                }
            `;
            document.head.appendChild(styles);
        }
        
    } catch (error) {
        console.error('Error cargando reservas:', error);
        const container = document.getElementById('reservasContainer');
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--error);">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
                <h3>Error al cargar reservas</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="cargarReservas()">
                    <i class="fas fa-sync"></i> Reintentar
                </button>
            </div>
        `;
    }
}

// Función para determinar el turno basado en la hora
function determinarTurnoPorHora(hora) {
    // hora en formato HH:MM o HH:MM:SS
    const [horas, minutos] = hora.split(':').map(Number);
    const horaDecimal = horas + (minutos / 60);
    
    if (horaDecimal >= 6 && horaDecimal < 14) {
        return 'MAÑANA';
    } else if (horaDecimal >= 14 && horaDecimal < 22) {
        return 'TARDE';
    } else {
        return 'NOCHE';
    }
}

// Función para validar que el mesero esté en el turno correcto
function validarTurnoMesero(meseroId, horaReserva) {
    const mesero = cacheMeseros.find(m => m.ID_MESERO === meseroId);
    if (!mesero || !mesero.TURNO) {
        return { valido: false, mensaje: 'Mesero no encontrado o sin turno asignado' };
    }
    
    const turnoHora = determinarTurnoPorHora(horaReserva);
    const turnoMesero = mesero.TURNO.toUpperCase();
    
    // Normalizar los turnos para comparar
    const turnosEquivalentes = {
        'MAÑANA': ['MAÑANA', 'MANANA', 'MORNING', 'AM'],
        'TARDE': ['TARDE', 'TARDE/NOCHE', 'AFTERNOON', 'PM'],
        'NOCHE': ['NOCHE', 'NIGHT', 'NOCTURNO']
    };
    
    // Verificar si el turno del mesero coincide con la hora de reserva
    const turnoValido = turnosEquivalentes[turnoHora]?.some(t => 
        turnoMesero.includes(t) || t.includes(turnoMesero)
    ) || turnoMesero === turnoHora;
    
    if (!turnoValido) {
        return {
            valido: false,
            mensaje: `El mesero ${mesero.NOMBRE} tiene turno ${mesero.TURNO}. 
                     No puede atender reservas a las ${horaReserva} (Turno ${turnoHora}).`
        };
    }
    
    return { valido: true };
}

// Función para actualizar la lista de meseros según la hora seleccionada
function actualizarMeserosPorHora(hora) {
    limpiarMensajes(); // Limpiar mensajes cuando cambia la hora
    
    const selectMesero = document.getElementById('meseroReserva');
    if (!selectMesero || !cacheMeseros.length) return;
    
    const turnoHora = determinarTurnoPorHora(hora);
    const meseroSeleccionado = selectMesero.value;
    
    // Guardar todas las opciones
    const todasOpciones = Array.from(selectMesero.options);
    
    // Filtrar meseros que coincidan con el turno
    const meserosFiltrados = cacheMeseros.filter(mesero => {
        if (!mesero.ACTIVO && mesero.ACTIVO !== undefined) return false;
        
        const turnoMesero = mesero.TURNO ? mesero.TURNO.toUpperCase() : '';
        const turnosEquivalentes = {
            'MAÑANA': ['MAÑANA', 'MANANA', 'MORNING', 'AM', 'MAÑANA/TARDE'],
            'TARDE': ['TARDE', 'TARDE/NOCHE', 'AFTERNOON', 'PM', 'MAÑANA/TARDE', 'TARDE/NOCHE'],
            'NOCHE': ['NOCHE', 'NIGHT', 'NOCTURNO', 'TARDE/NOCHE']
        };
        
        return turnosEquivalentes[turnoHora]?.some(t => 
            turnoMesero.includes(t) || t.includes(turnoMesero)
        ) || turnoMesero === turnoHora;
    });
    
    // Actualizar el select
    selectMesero.innerHTML = '<option value="">Seleccione un mesero</option>';
    
    if (meserosFiltrados.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = `⚠️ No hay meseros disponibles para el turno ${turnoHora}`;
        option.disabled = true;
        selectMesero.appendChild(option);
    } else {
        meserosFiltrados.forEach(mesero => {
            const option = document.createElement('option');
            option.value = mesero.ID_MESERO;
            option.textContent = `${mesero.NOMBRE} - Turno: ${mesero.TURNO}`;
            option.dataset.turno = mesero.TURNO || '';
            selectMesero.appendChild(option);
        });
        
        // Restaurar selección previa si existe y es válida
        if (meseroSeleccionado && meserosFiltrados.some(m => m.ID_MESERO == meseroSeleccionado)) {
            selectMesero.value = meseroSeleccionado;
        }
    }
    
    console.log(`Meseros disponibles para ${hora} (Turno ${turnoHora}):`, 
                meserosFiltrados.map(m => m.NOMBRE));
}

window.abrirModalReserva = async function(reservaId = 0) {
    const modal = document.getElementById('modalReserva');
    const title = document.getElementById('modalReservaTitle');
    
    try {
        modal.style.display = 'flex';
        
        // Limpiar mensajes previos
        limpiarMensajes();
        
        // Cargar todos los selects
        await Promise.all([
            actualizarSelectClientes(),
            actualizarSelectMesas(),
            actualizarSelectMeseros()
        ]);
        
        // Configurar valores por defecto
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const fechaInput = document.getElementById('fechaReserva');
        const horaInput = document.getElementById('horaReserva');
        
        fechaInput.value = tomorrow.toISOString().split('T')[0];
        horaInput.value = '19:00'; // Hora por defecto para turno tarde/noche
        
        // Actualizar meseros según la hora por defecto
        setTimeout(() => {
            actualizarMeserosPorHora('19:00');
        }, 100);
        
        document.getElementById('personasReserva').value = '2';
        document.getElementById('reservaId').value = '0';
        
        if (reservaId > 0) {
            title.textContent = 'Editar Reserva';
            await cargarDatosReserva(reservaId);
        } else {
            title.textContent = 'Nueva Reserva';
        }
        
    } catch (error) {
        console.error('Error abriendo modal:', error);
        mostrarErrorReserva(`Error: ${error.message}`);
    }
};

// Modifica la función cerrarModalReserva
window.cerrarModalReserva = function() {
    const form = document.getElementById('formReserva');
    const reservaId = document.getElementById('reservaId').value;
    const tieneDatos = Array.from(form.elements).some(
        el => el.type !== 'hidden' && el.value && el.value.trim() !== ''
    );
    
    if (reservaId === '0' && tieneDatos) {
        if (!confirm('¿Está seguro de cancelar? Los datos ingresados se perderán.')) {
            return;
        }
    }
    
    document.getElementById('modalReserva').style.display = 'none';
    
    // Limpiar mensajes
    limpiarMensajes();
};

// Cargar datos de una reserva existente
async function cargarDatosReserva(id) {
    try {
        const reserva = await app.fetchData(`reserva/${id}`);
        
        if (!reserva) {
            throw new Error('Reserva no encontrada');
        }
        
        document.getElementById('reservaId').value = reserva.ID_RESERVA;
        document.getElementById('clienteReserva').value = reserva.ID_CLIENTE || '';
        document.getElementById('mesaReserva').value = reserva.ID_MESA || '';
        
        if (reserva.FECHA_RESERVA) {
            const fecha = new Date(reserva.FECHA_RESERVA);
            document.getElementById('fechaReserva').value = fecha.toISOString().split('T')[0];
        }
        
        document.getElementById('horaReserva').value = reserva.HORA_RESERVA || '19:00';
        document.getElementById('personasReserva').value = reserva.NUM_PERSONAS || '2';
        
    } catch (error) {
        console.error('Error cargando datos de reserva:', error);
        throw error;
    }
}

// En la función guardarReserva(), agrega esta validación ANTES de enviar:
window.guardarReserva = async function() {
    const form = document.getElementById('formReserva');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Limpiar mensajes previos
    limpiarMensajes();
    
    // Obtener valores
    const reservaId = parseInt(document.getElementById('reservaId').value) || 0;
    const clienteId = parseInt(document.getElementById('clienteReserva').value);
    const mesaId = parseInt(document.getElementById('mesaReserva').value);
    const meseroId = parseInt(document.getElementById('meseroReserva').value);
    const fecha = document.getElementById('fechaReserva').value;
    const hora = document.getElementById('horaReserva').value;
    const personas = parseInt(document.getElementById('personasReserva').value);
    
    console.log('=== VERIFICANDO DATOS ===');
    console.log('Cliente ID:', clienteId);
    console.log('Mesa ID:', mesaId);
    console.log('Mesero ID:', meseroId);
    console.log('Hora:', hora);
    
    // Verificar si los IDs existen
    const clienteExiste = cacheClientes.some(c => c.ID_CLIENTE === clienteId);
    const mesaSeleccionada = cacheMesas.find(m => m.ID_MESA === mesaId);
    const mesaExiste = !!mesaSeleccionada;
    const meseroSeleccionado = cacheMeseros.find(m => m.ID_MESERO === meseroId);
    const meseroExiste = !!meseroSeleccionado;
    
    if (!clienteExiste) {
        mostrarErrorReserva(`❌ El cliente ID ${clienteId} no existe.`);
        return;
    }
    
    if (!mesaExiste) {
        mostrarErrorReserva(`❌ La mesa ID ${mesaId} no existe.`);
        return;
    }
    
    if (!meseroExiste) {
        mostrarErrorReserva(`❌ El mesero ID ${meseroId} no existe.`);
        return;
    }
    
    // Validar capacidad de la mesa
    if (mesaSeleccionada.CAPACIDAD && personas > mesaSeleccionada.CAPACIDAD) {
        mostrarErrorReserva(`❌ La mesa ${mesaSeleccionada.NUMERO} tiene capacidad para ${mesaSeleccionada.CAPACIDAD} personas. 
        Ha seleccionado ${personas} personas.`);
        return;
    }
    
    // ⭐⭐ NUEVA VALIDACIÓN: TURNO DEL MESERO ⭐⭐
    const validacionTurno = validarTurnoMesero(meseroId, hora);
    if (!validacionTurno.valido) {
        mostrarErrorReserva(`❌ ${validacionTurno.mensaje}`);
        return;
    }
    
    // Formatear datos
    const horaFormateada = hora.includes(':') && hora.length === 5 ? hora + ':00' : hora;
    const reservaData = {
        ID_CLIENTE: clienteId,
        ID_MESA: mesaId,
        ID_MESERO: meseroId,
        FECHA_RESERVA: fecha,
        HORA_RESERVA: horaFormateada,
        NUM_PERSONAS: personas
    };
    
    if (reservaId > 0) {
        reservaData.ID_RESERVA = reservaId;
    }
    
    console.log('Enviando:', reservaData);
    
    // Mostrar loading
    const guardarBtn = document.querySelector('#modalReserva .modal-footer .btn-primary');
    const originalText = guardarBtn.innerHTML;
    guardarBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    guardarBtn.disabled = true;
    
    try {
        const url = reservaId > 0 
            ? `http://localhost:5034/api/reserva/${reservaId}`
            : 'http://localhost:5034/api/reserva';
        
        const method = reservaId > 0 ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reservaData)
        });
        
        console.log('Response:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }
        
        const resultado = await response.json();
        console.log('✅ Éxito:', resultado);
        
        // Mostrar mensaje de éxito
        const exitoDiv = document.getElementById('mensajeExitoReserva');
        const clienteNombre = cacheClientes.find(c => c.ID_CLIENTE === clienteId)?.NOMBRE || 'Cliente';
        
        if (exitoDiv) {
            exitoDiv.innerHTML = `
                <i class="fas fa-check-circle"></i> 
                <strong>¡Reserva ${reservaId > 0 ? 'actualizada' : 'creada'} exitosamente!</strong><br>
                Reserva #${resultado.ID_RESERVA} para ${clienteNombre}<br>
                Mesa: ${mesaSeleccionada.NUMERO || mesaId} (Capacidad: ${mesaSeleccionada.CAPACIDAD || '?'} pers.)<br>
                Personas: ${personas}<br>
                Fecha: ${fecha} ${hora}<br>
                <small>El modal se cerrará automáticamente...</small>
            `;
            exitoDiv.style.display = 'block';
        }
        
        app.showToast(`✅ Reserva ${reservaId > 0 ? 'actualizada' : 'creada'} para ${clienteNombre}! ID: ${resultado.ID_RESERVA}`, 'success');
        
        // Cerrar automáticamente después de 1.5 segundos (tiempo reducido)
        setTimeout(async () => {
            cerrarModalReserva();
            await cargarReservas();
        }, 1500); // Reducido a 1.5 segundos para que cierre más rápido
        
    } catch (error) {
        console.error('❌ Error:', error);
        mostrarErrorReserva(error.message);
    } finally {
        guardarBtn.innerHTML = originalText;
        guardarBtn.disabled = false;
    }
};

// Mostrar error en el modal (MODIFICADA)
function mostrarErrorReserva(mensaje) {
    const errorDiv = document.getElementById('mensajeErrorReserva');
    const exitoDiv = document.getElementById('mensajeExitoReserva');
    
    // Ocultar mensaje de éxito si existe
    if (exitoDiv) {
        exitoDiv.style.display = 'none';
    }
    
    if (errorDiv) {
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${mensaje}`;
        errorDiv.style.display = 'block';
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        app.showToast(mensaje, 'error');
    }
}

// Editar reserva
window.editarReserva = async function(id) {
    try {
        await abrirModalReserva(id);
    } catch (error) {
        app.showToast('Error cargando reserva para editar', 'error');
    }
};

// Eliminar reserva
window.eliminarReserva = async function(id) {
    if (!confirm(`¿Está seguro de eliminar la reserva #${id}?\n\n⚠️ Esta acción no se puede deshacer.`)) {
        return;
    }
    
    try {
        await app.fetchData(`reserva/${id}`, 'DELETE');
        app.showToast(`✅ Reserva #${id} eliminada`, 'success');
        await cargarReservas();
    } catch (error) {
        app.showToast(`❌ Error eliminando reserva: ${error.message}`, 'error');
    }
};