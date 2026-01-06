// Permisos Module - Control de acceso según rol
class PermisosManager {
    constructor() {
        this.userRole = localStorage.getItem('userRole') || 'mesero';
        this.meseroData = JSON.parse(localStorage.getItem('mesero_data') || 'null');
    }

    // Verificar si el usuario es administrador
    isAdmin() {
        return this.userRole === 'admin';
    }

    // Verificar si el usuario es mesero
    isMesero() {
        return this.userRole === 'mesero';
    }

    // Obtener datos del mesero actual
    getMeseroInfo() {
        return this.meseroData;
    }

    // Aplicar permisos a la interfaz
    aplicarPermisos() {
        if (this.isMesero()) {
            this.ocultarOpcionesMesero();
            this.mostrarInfoMesero();
        } else if (this.isAdmin()) {
            this.mostrarTodasOpciones();
        }
    }

    // Ocultar opciones que no debe ver el mesero
    ocultarOpcionesMesero() {
        // Opciones a ocultar
        const opcionesOcultar = ['meseros', 'platos', 'inventario', 'reportes'];
        
        opcionesOcultar.forEach(opcion => {
            const navItem = document.querySelector(`[data-section="${opcion}"]`);
            if (navItem) {
                navItem.style.display = 'none';
            }
        });

        // También ocultar funcionalidades específicas
        this.ocultarFuncionalidadesEspecificas();
    }

    ocultarFuncionalidadesEspecificas() {
        // En la sección de mesas, eliminar botones de agregar y mover
        if (typeof window.loadMesas === 'function') {
            // Sobrescribir temporalmente la función loadMesas
            const originalLoadMesas = window.loadMesas;
            window.loadMesas = async function() {
                const content = document.getElementById('contentArea');
                if (window.permisosManager.isMesero()) {
                    content.innerHTML = `
                        <div style="padding: 20px;">
                            <h2 class="section-title">Gestión de Mesas</h2>
                            <div class="data-table">
                                ${await renderMesasSimplificado()}
                            </div>
                        </div>
                    `;
                } else {
                    return originalLoadMesas();
                }
            };
        }

        // En el dashboard, eliminar capacidad de mover mesas
        if (typeof window.guardarUbicacionesMesas === 'function') {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(() => {
                    const guardarBtn = document.getElementById('guardarUbicacionesBtn');
                    const restaurarBtn = document.querySelector('button[onclick="restaurarUbicacionesMesas()"]');
                    
                    if (guardarBtn && window.permisosManager.isMesero()) {
                        guardarBtn.style.display = 'none';
                    }
                    if (restaurarBtn && window.permisosManager.isMesero()) {
                        restaurarBtn.style.display = 'none';
                    }
                }, 1000);
            });
        }
    }

    // Mostrar todas las opciones (para admin)
    mostrarTodasOpciones() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.style.display = 'flex';
        });
    }

    // Mostrar información del mesero
    mostrarInfoMesero() {
        const userInitials = document.getElementById('userInitials');
        const userNameDisplay = document.getElementById('userNameDisplay');
        
        if (this.meseroData && userInitials) {
            const nombre = this.meseroData.NOMBRE || 'Mesero';
            const iniciales = nombre.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            
            userInitials.textContent = iniciales;
            
            if (userNameDisplay) {
                userNameDisplay.textContent = nombre;
            }
        }
    }

    // Verificar autenticación al cargar
    verificarAutenticacion() {
        if (this.isMesero()) {
            const token = localStorage.getItem('mesero_token');
            if (!token) {
                this.cerrarSesion();
            }
        }
    }

    // Cerrar sesión
    cerrarSesion() {
        localStorage.removeItem('userRole');
        localStorage.removeItem('mesero_token');
        localStorage.removeItem('mesero_data');
        window.location.href = 'login.html';
    }
}

// Crear instancia global
window.permisosManager = new PermisosManager();

// Función para renderizar mesas simplificado (solo lectura)
async function renderMesasSimplificado() {
    try {
        const mesas = await app.loadTableData('mesa');
        const reservas = await app.loadTableData('reserva');
        const pedidos = await app.loadTableData('pedido');
        
        const hoy = new Date().toDateString();
        
        return `
            <table>
                <thead>
                    <tr>
                        <th>Número</th>
                        <th>Capacidad</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${mesas.map(mesa => {
                        let estado = 'Disponible';
                        let estadoClass = 'status-active';
                        
                        // Verificar si está ocupada
                        const tienePedido = pedidos.some(p => {
                            const fecha = p.FECHA_PEDIDO ? new Date(p.FECHA_PEDIDO).toDateString() : '';
                            return p.ID_MESA === mesa.ID_MESA && fecha === hoy;
                        });
                        
                        if (tienePedido) {
                            estado = 'Ocupada';
                            estadoClass = 'status-inactive';
                        } else {
                            // Verificar si tiene reserva hoy
                            const tieneReserva = reservas.some(r => {
                                const fecha = r.FECHA_RESERVA ? new Date(r.FECHA_RESERVA).toDateString() : '';
                                return r.ID_MESA === mesa.ID_MESA && fecha === hoy;
                            });
                            
                            if (tieneReserva) {
                                estado = 'Reservada';
                                estadoClass = 'status-warning';
                            }
                        }
                        
                        return `
                            <tr>
                                <td><strong>Mesa ${mesa.NUMERO}</strong></td>
                                <td>${mesa.CAPACIDAD} personas</td>
                                <td>
                                    <span class="status-badge ${estadoClass}">${estado}</span>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-primary" onclick="app.navigateTo('pedidos'); setTimeout(() => { if(typeof mostrarFormularioPedido === 'function') { mostrarFormularioPedido(); document.getElementById('selectMesa').value = ${mesa.ID_MESA}; } }, 500)">
                                        <i class="fas fa-plus"></i> Pedido
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        return `<div class="error">Error cargando mesas</div>`;
    }
}

// Función global para cerrar sesión
window.cerrarSesionMesero = function() {
    window.permisosManager.cerrarSesion();
};