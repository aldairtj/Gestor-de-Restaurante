// Meseros Module (Gestión de cuentas de meseros)
window.loadMeseros = async function() {
    const content = document.getElementById('contentArea');
    
    content.innerHTML = `
        <div class="table-header">
            <h3>Gestión de Meseros</h3>
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-primary" onclick="abrirModalMesero()">
                    <i class="fas fa-plus"></i> Nuevo Mesero
                </button>
                <button class="btn btn-secondary" onclick="exportarMeseros()">
                    <i class="fas fa-download"></i> Exportar
                </button>
            </div>
        </div>
        
        <div class="table-container">
            <table id="meserosTable">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Usuario</th>
                        <th>Turno</th>
                        <th>Email</th>
                        <th>Estado</th>
                        <th>Último Acceso</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Data will be loaded here -->
                </tbody>
            </table>
        </div>
        
        <div class="modal" id="modalMesero">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modalMeseroTitle">Nuevo Mesero</h3>
                    <button class="btn btn-icon" onclick="cerrarModalMesero()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="formMesero">
                        <input type="hidden" id="meseroId" value="0">
                        
                        <div class="form-group">
                            <label class="form-label" for="nombreMesero">Nombre Completo *</label>
                            <input type="text" id="nombreMesero" class="form-control" required>
                        </div>
                        
                        <div class="grid-2">
                            <div class="form-group">
                                <label class="form-label" for="usuarioMesero">Usuario *</label>
                                <input type="text" id="usuarioMesero" class="form-control" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label" for="contrasenaMesero">Contraseña *</label>
                                <input type="password" id="contrasenaMesero" class="form-control" required>
                            </div>
                        </div>
                        
                        <div class="grid-2">
                            <div class="form-group">
                                <label class="form-label" for="turnoMesero">Turno</label>
                                <select id="turnoMesero" class="form-control">
                                    <option value="">Seleccionar turno</option>
                                    <option value="Mañana">Mañana</option>
                                    <option value="Tarde">Tarde</option>
                                    <option value="Noche">Noche</option>
                                    <option value="Completo">Completo</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label" for="emailMesero">Email</label>
                                <input type="email" id="emailMesero" class="form-control">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="activoMesero">Estado</label>
                            <select id="activoMesero" class="form-control">
                                <option value="true">Activo</option>
                                <option value="false">Inactivo</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="cerrarModalMesero()">Cancelar</button>
                    <button class="btn btn-primary" onclick="guardarMesero()">Guardar</button>
                </div>
            </div>
        </div>
        
        <div class="modal" id="modalCambiarPassword">
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h3>Cambiar Contraseña</h3>
                    <button class="btn btn-icon" onclick="cerrarModalCambiarPassword()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="formCambiarPassword">
                        <input type="hidden" id="meseroIdPassword" value="0">
                        
                        <div class="form-group">
                            <label class="form-label" for="passwordActual">Contraseña Actual *</label>
                            <input type="password" id="passwordActual" class="form-control" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="passwordNuevo">Nueva Contraseña *</label>
                            <input type="password" id="passwordNuevo" class="form-control" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="passwordConfirmar">Confirmar Nueva Contraseña *</label>
                            <input type="password" id="passwordConfirmar" class="form-control" required>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="cerrarModalCambiarPassword()">Cancelar</button>
                    <button class="btn btn-primary" onclick="actualizarContrasena()">Cambiar Contraseña</button>
                </div>
            </div>
        </div>
    `;
    
    await cargarMeseros();
};

async function cargarMeseros() {
    try {
        const meseros = await app.fetchData('mesero');
        const tbody = document.querySelector('#meserosTable tbody');
        
        if (meseros.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px;">
                        No hay meseros registrados
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = meseros.map(mesero => {
            const estado = mesero.ACTIVO ? 'Activo' : 'Inactivo';
            const estadoClass = mesero.ACTIVO ? 'status-active' : 'status-inactive';
            
            const ultimoAcceso = mesero.ULTIMO_ACCESO 
                ? new Date(mesero.ULTIMO_ACCESO).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
                : 'Nunca';
            
            return `
                <tr>
                    <td>${mesero.ID_MESERO}</td>
                    <td>${mesero.NOMBRE || 'N/A'}</td>
                    <td>${mesero.USUARIO || 'N/A'}</td>
                    <td>${mesero.TURNO || 'N/A'}</td>
                    <td>${mesero.EMAIL || 'N/A'}</td>
                    <td><span class="status-badge ${estadoClass}">${estado}</span></td>
                    <td>${ultimoAcceso}</td>
                    <td>
                        <button class="btn btn-sm btn-secondary" onclick="editarMesero(${mesero.ID_MESERO})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="cambiarPassword(${mesero.ID_MESERO})">
                            <i class="fas fa-key"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="toggleEstadoMesero(${mesero.ID_MESERO}, ${mesero.ACTIVO})">
                            <i class="fas ${mesero.ACTIVO ? 'fa-user-slash' : 'fa-user-check'}"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="eliminarMesero(${mesero.ID_MESERO})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        const tbody = document.querySelector('#meserosTable tbody');
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: var(--error);">
                    Error cargando meseros: ${error.message}
                </td>
            </tr>
        `;
    }
}

window.abrirModalMesero = function(meseroId = 0) {
    const modal = document.getElementById('modalMesero');
    const title = document.getElementById('modalMeseroTitle');
    const form = document.getElementById('formMesero');
    
    if (meseroId > 0) {
        title.textContent = 'Editar Mesero';
        cargarDatosMesero(meseroId);
    } else {
        title.textContent = 'Nuevo Mesero';
        form.reset();
        document.getElementById('meseroId').value = '0';
        document.getElementById('activoMesero').value = 'true';
    }
    
    modal.style.display = 'flex';
};

window.cerrarModalMesero = function() {
    document.getElementById('modalMesero').style.display = 'none';
};

window.abrirModalCambiarPassword = function(meseroId) {
    const modal = document.getElementById('modalCambiarPassword');
    document.getElementById('meseroIdPassword').value = meseroId;
    modal.style.display = 'flex';
};

window.cerrarModalCambiarPassword = function() {
    document.getElementById('modalCambiarPassword').style.display = 'none';
};

async function cargarDatosMesero(id) {
    try {
        const mesero = await app.fetchData(`mesero/${id}`);
        
        document.getElementById('meseroId').value = mesero.ID_MESERO;
        document.getElementById('nombreMesero').value = mesero.NOMBRE || '';
        document.getElementById('usuarioMesero').value = mesero.USUARIO || '';
        document.getElementById('contrasenaMesero').value = '********'; // Placeholder
        document.getElementById('turnoMesero').value = mesero.TURNO || '';
        document.getElementById('emailMesero').value = mesero.EMAIL || '';
        document.getElementById('activoMesero').value = mesero.ACTIVO ? 'true' : 'false';
    } catch (error) {
        app.showToast('Error cargando datos del mesero', 'error');
    }
}

window.guardarMesero = async function() {
    const form = document.getElementById('formMesero');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const meseroData = {
        ID_MESERO: parseInt(document.getElementById('meseroId').value) || 0,
        NOMBRE: document.getElementById('nombreMesero').value,
        USUARIO: document.getElementById('usuarioMesero').value,
        CONTRASENA: document.getElementById('contrasenaMesero').value,
        TURNO: document.getElementById('turnoMesero').value || null,
        EMAIL: document.getElementById('emailMesero').value || null,
        ACTIVO: document.getElementById('activoMesero').value === 'true'
    };
    
    try {
        if (meseroData.ID_MESERO > 0) {
            // Update
            await app.fetchData(`mesero/${meseroData.ID_MESERO}`, 'PUT', meseroData);
            app.showToast('Mesero actualizado correctamente');
        } else {
            // Create
            await app.fetchData('mesero', 'POST', meseroData);
            app.showToast('Mesero creado correctamente');
        }
        
        cerrarModalMesero();
        await cargarMeseros();
    } catch (error) {
        app.showToast('Error guardando el mesero: ' + error.message, 'error');
    }
};

window.editarMesero = function(id) {
    abrirModalMesero(id);
};

window.cambiarPassword = function(id) {
    abrirModalCambiarPassword(id);
};

window.actualizarContrasena = async function() {
    const meseroId = parseInt(document.getElementById('meseroIdPassword').value);
    const passwordActual = document.getElementById('passwordActual').value;
    const passwordNuevo = document.getElementById('passwordNuevo').value;
    const passwordConfirmar = document.getElementById('passwordConfirmar').value;
    
    if (!passwordActual || !passwordNuevo || !passwordConfirmar) {
        app.showToast('Todos los campos son requeridos', 'error');
        return;
    }
    
    if (passwordNuevo !== passwordConfirmar) {
        app.showToast('Las contraseñas no coinciden', 'error');
        return;
    }
    
    try {
        await app.fetchData(`mesero/${meseroId}/cambiarpassword`, 'PUT', {
            PasswordActual: passwordActual,
            PasswordNuevo: passwordNuevo
        });
        
        app.showToast('Contraseña actualizada correctamente');
        cerrarModalCambiarPassword();
    } catch (error) {
        app.showToast('Error cambiando la contraseña: ' + error.message, 'error');
    }
};

window.toggleEstadoMesero = async function(id, estadoActual) {
    const nuevoEstado = !estadoActual;
    const confirmacion = confirm(`¿Está seguro de ${nuevoEstado ? 'activar' : 'desactivar'} este mesero?`);
    
    if (!confirmacion) return;
    
    try {
        // Primero obtenemos el mesero actual
        const mesero = await app.fetchData(`mesero/${id}`);
        mesero.ACTIVO = nuevoEstado;
        
        await app.fetchData(`mesero/${id}`, 'PUT', mesero);
        app.showToast(`Mesero ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`);
        await cargarMeseros();
    } catch (error) {
        app.showToast('Error cambiando estado del mesero', 'error');
    }
};

window.eliminarMesero = async function(id) {
    if (!confirm('¿Está seguro de eliminar este mesero? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        await app.fetchData(`mesero/${id}`, 'DELETE');
        app.showToast('Mesero eliminado correctamente');
        await cargarMeseros();
    } catch (error) {
        app.showToast('Error eliminando el mesero', 'error');
    }
};

window.exportarMeseros = async function() {
    try {
        const meseros = await app.fetchData('mesero');
        
        if (meseros.length === 0) {
            app.showToast('No hay meseros para exportar', 'warning');
            return;
        }
        
        const contenido = `REPORTE DE MESEROS\n${'='.repeat(50)}\n\n` +
            meseros.map(m => {
                return `ID: ${m.ID_MESERO}\n` +
                       `Nombre: ${m.NOMBRE || 'N/A'}\n` +
                       `Usuario: ${m.USUARIO || 'N/A'}\n` +
                       `Turno: ${m.TURNO || 'N/A'}\n` +
                       `Email: ${m.EMAIL || 'N/A'}\n` +
                       `Estado: ${m.ACTIVO ? 'Activo' : 'Inactivo'}\n` +
                       `Último acceso: ${m.ULTIMO_ACCESO ? new Date(m.ULTIMO_ACCESO).toLocaleString('es-ES') : 'Nunca'}\n` +
                       `${'-'.repeat(50)}\n`;
            }).join('\n');
        
        const blob = new Blob([contenido], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meseros_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        app.showToast('Reporte exportado correctamente');
    } catch (error) {
        app.showToast('Error exportando meseros', 'error');
    }
};