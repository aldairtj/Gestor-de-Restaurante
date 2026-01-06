// Mesas Module
window.loadMesas = async function() {
    if (window.permisosManager && window.permisosManager.isMesero()) {
        // Cargar versión simplificada para meseros
        return;
    }

    const content = document.getElementById('contentArea');
    
    content.innerHTML = `
        <div class="table-header">
            <h3>Lista de Mesas</h3>
            <button class="btn btn-primary" onclick="abrirModalMesa()">
                <i class="fas fa-plus"></i> Nueva Mesa
            </button>
        </div>
        
        <div class="table-container">
            <table id="mesasTable">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Número</th>
                        <th>Capacidad</th>
                        <th>Posición</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Data will be loaded here -->
                </tbody>
            </table>
        </div>
        
        <div class="modal" id="modalMesa">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modalMesaTitle">Nueva Mesa</h3>
                    <button class="btn btn-icon" onclick="cerrarModalMesa()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="formMesa">
                        <input type="hidden" id="mesaId" value="0">
                        
                        <div class="form-group">
                            <label class="form-label" for="numeroMesa">Número de Mesa *</label>
                            <input type="number" id="numeroMesa" class="form-control" required min="1">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="capacidadMesa">Capacidad *</label>
                            <input type="number" id="capacidadMesa" class="form-control" required min="1" max="20">
                        </div>
                        
                        <div class="grid-2">
                            <div class="form-group">
                                <label class="form-label" for="posXMesa">Posición X</label>
                                <input type="number" id="posXMesa" class="form-control">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label" for="posYMesa">Posición Y</label>
                                <input type="number" id="posYMesa" class="form-control">
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="cerrarModalMesa()">Cancelar</button>
                    <button class="btn btn-primary" onclick="guardarMesa()">Guardar</button>
                </div>
            </div>
        </div>
    `;
    
    await cargarMesas();
};

async function cargarMesas() {
    try {
        const mesas = await app.fetchData('mesa');
        const tbody = document.querySelector('#mesasTable tbody');
        
        if (mesas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        No hay mesas registradas
                    </td>
                </tr>
            `;
            return;
        }
        
        // Get current reservations for status
        const reservas = await app.loadTableData('reserva');
        const hoy = new Date().toDateString();
        
        tbody.innerHTML = mesas.map(mesa => {
            const tieneReserva = reservas.some(r => 
                r.ID_MESA === mesa.ID_MESA && 
                r.FECHA_RESERVA && 
                new Date(r.FECHA_RESERVA).toDateString() === hoy
            );
            
            const status = tieneReserva ? 'Reservada' : 'Disponible';
            const statusClass = tieneReserva ? 'status-inactive' : 'status-active';
            
            return `
                <tr>
                    <td>${mesa.ID_MESA}</td>
                    <td>${mesa.NUMERO || 'N/A'}</td>
                    <td>${mesa.CAPACIDAD || 'N/A'}</td>
                    <td>${mesa.POS_X && mesa.POS_Y ? `(${mesa.POS_X}, ${mesa.POS_Y})` : 'N/A'}</td>
                    <td><span class="status-badge ${statusClass}">${status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-secondary" onclick="editarMesa(${mesa.ID_MESA})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="eliminarMesa(${mesa.ID_MESA})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        const tbody = document.querySelector('#mesasTable tbody');
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--error);">
                    Error cargando mesas: ${error.message}
                </td>
            </tr>
        `;
    }
}

window.abrirModalMesa = function(mesaId = 0) {
    const modal = document.getElementById('modalMesa');
    const title = document.getElementById('modalMesaTitle');
    const form = document.getElementById('formMesa');
    
    if (mesaId > 0) {
        title.textContent = 'Editar Mesa';
        cargarDatosMesa(mesaId);
    } else {
        title.textContent = 'Nueva Mesa';
        form.reset();
        document.getElementById('mesaId').value = '0';
    }
    
    modal.style.display = 'flex';
};

window.cerrarModalMesa = function() {
    document.getElementById('modalMesa').style.display = 'none';
};

async function cargarDatosMesa(id) {
    try {
        const mesa = await app.fetchData(`mesa/${id}`);
        
        document.getElementById('mesaId').value = mesa.ID_MESA;
        document.getElementById('numeroMesa').value = mesa.NUMERO || '';
        document.getElementById('capacidadMesa').value = mesa.CAPACIDAD || '';
        document.getElementById('posXMesa').value = mesa.POS_X || '';
        document.getElementById('posYMesa').value = mesa.POS_Y || '';
    } catch (error) {
        app.showToast('Error cargando datos de la mesa', 'error');
    }
}

window.guardarMesa = async function() {
    const form = document.getElementById('formMesa');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const mesaData = {
        ID_MESA: parseInt(document.getElementById('mesaId').value) || 0,
        NUMERO: parseInt(document.getElementById('numeroMesa').value),
        CAPACIDAD: parseInt(document.getElementById('capacidadMesa').value),
        POS_X: document.getElementById('posXMesa').value ? parseInt(document.getElementById('posXMesa').value) : null,
        POS_Y: document.getElementById('posYMesa').value ? parseInt(document.getElementById('posYMesa').value) : null
    };
    
    try {
        if (mesaData.ID_MESA > 0) {
            // Update
            await app.fetchData(`mesa/${mesaData.ID_MESA}`, 'PUT', mesaData);
            app.showToast('Mesa actualizada correctamente');
        } else {
            // Create
            await app.fetchData('mesa', 'POST', mesaData);
            app.showToast('Mesa creada correctamente');
        }
        
        cerrarModalMesa();
        await cargarMesas();
    } catch (error) {
        app.showToast('Error guardando la mesa', 'error');
    }
};

window.editarMesa = function(id) {
    abrirModalMesa(id);
};

window.eliminarMesa = async function(id) {
    if (!confirm('¿Está seguro de eliminar esta mesa? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        await app.fetchData(`mesa/${id}`, 'DELETE');
        app.showToast('Mesa eliminada correctamente');
        await cargarMesas();
    } catch (error) {
        app.showToast('Error eliminando la mesa', 'error');
    }
};