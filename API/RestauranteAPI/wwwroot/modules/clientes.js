// Clientes Module
window.loadClientes = async function() {
    if (window.permisosManager && window.permisosManager.isMesero()) {
        // Cargar versión simplificada para meseros
        return;
    }
    
    const content = document.getElementById('contentArea');
    
    content.innerHTML = `
        <div class="table-header">
            <h3>Gestión de Clientes</h3>
            <button class="btn btn-primary" onclick="abrirModalCliente()">
                <i class="fas fa-plus"></i> Nuevo Cliente
            </button>
        </div>
        
        <div class="table-container">
            <table id="clientesTable">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Teléfono</th>
                        <th>Reservas</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Data will be loaded here -->
                </tbody>
            </table>
        </div>
        
        <div class="modal" id="modalCliente">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modalClienteTitle">Nuevo Cliente</h3>
                    <button class="btn btn-icon" onclick="cerrarModalCliente()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="formCliente">
                        <input type="hidden" id="clienteId" value="0">
                        
                        <div class="form-group">
                            <label class="form-label" for="nombreCliente">Nombre *</label>
                            <input type="text" id="nombreCliente" class="form-control" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="telefonoCliente">Teléfono</label>
                            <input type="tel" id="telefonoCliente" class="form-control">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="cerrarModalCliente()">Cancelar</button>
                    <button class="btn btn-primary" onclick="guardarCliente()">Guardar</button>
                </div>
            </div>
        </div>
    `;
    
    await cargarClientes();
};

async function cargarClientes() {
    try {
        const clientes = await app.fetchData('cliente');
        const reservas = await app.loadTableData('reserva');
        
        const tbody = document.querySelector('#clientesTable tbody');
        
        if (clientes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px;">
                        No hay clientes registrados
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = clientes.map(cliente => {
            const reservasCliente = reservas.filter(r => r.ID_CLIENTE === cliente.ID_CLIENTE);
            
            return `
                <tr>
                    <td>${cliente.ID_CLIENTE}</td>
                    <td>${cliente.NOMBRE || 'N/A'}</td>
                    <td>${cliente.TELEFONO || 'N/A'}</td>
                    <td>${reservasCliente.length}</td>
                    <td>
                        <button class="btn btn-sm btn-secondary" onclick="editarCliente(${cliente.ID_CLIENTE})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="eliminarCliente(${cliente.ID_CLIENTE})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        const tbody = document.querySelector('#clientesTable tbody');
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: var(--error);">
                    Error cargando clientes: ${error.message}
                </td>
            </tr>
        `;
    }
}

window.abrirModalCliente = function(clienteId = 0) {
    const modal = document.getElementById('modalCliente');
    const title = document.getElementById('modalClienteTitle');
    const form = document.getElementById('formCliente');
    
    if (clienteId > 0) {
        title.textContent = 'Editar Cliente';
        cargarDatosCliente(clienteId);
    } else {
        title.textContent = 'Nuevo Cliente';
        form.reset();
        document.getElementById('clienteId').value = '0';
    }
    
    modal.style.display = 'flex';
};

window.cerrarModalCliente = function() {
    document.getElementById('modalCliente').style.display = 'none';
};

async function cargarDatosCliente(id) {
    try {
        const cliente = await app.fetchData(`cliente/${id}`);
        
        document.getElementById('clienteId').value = cliente.ID_CLIENTE;
        document.getElementById('nombreCliente').value = cliente.NOMBRE || '';
        document.getElementById('telefonoCliente').value = cliente.TELEFONO || '';
    } catch (error) {
        app.showToast('Error cargando datos del cliente', 'error');
    }
}

window.guardarCliente = async function() {
    const form = document.getElementById('formCliente');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const clienteData = {
        ID_CLIENTE: parseInt(document.getElementById('clienteId').value) || 0,
        NOMBRE: document.getElementById('nombreCliente').value,
        TELEFONO: document.getElementById('telefonoCliente').value || null
    };
    
    try {
        if (clienteData.ID_CLIENTE > 0) {
            // Update
            await app.fetchData(`cliente/${clienteData.ID_CLIENTE}`, 'PUT', clienteData);
            app.showToast('Cliente actualizado correctamente');
        } else {
            // Create
            await app.fetchData('cliente', 'POST', clienteData);
            app.showToast('Cliente creado correctamente');
        }
        
        cerrarModalCliente();
        await cargarClientes();
    } catch (error) {
        app.showToast('Error guardando el cliente', 'error');
    }
};

window.editarCliente = function(id) {
    abrirModalCliente(id);
};

window.eliminarCliente = async function(id) {
    if (!confirm('¿Está seguro de eliminar este cliente?')) {
        return;
    }
    
    try {
        await app.fetchData(`cliente/${id}`, 'DELETE');
        app.showToast('Cliente eliminado correctamente');
        await cargarClientes();
    } catch (error) {
        app.showToast('Error eliminando el cliente', 'error');
    }
};