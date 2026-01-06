// Main Application Module - Versión corregida
class RestauranteApp {
    constructor() {
        this.verificarAcceso();

        this.currentSection = null;
        this.isLoading = false;
        this.initialized = false;
        this.init();
    }

    verificarAcceso() {
        const userRole = localStorage.getItem('userRole');
        const meseroToken = localStorage.getItem('mesero_token');
        
        // Si no hay rol definido o es mesero sin token, redirigir al login
        if (!userRole || (userRole === 'mesero' && !meseroToken)) {
            window.location.href = 'login.html';
            return false;
        }
        
        // Si está en la versión mesero pero no es mesero, redirigir
        if (window.location.pathname.includes('index-mesero') && userRole !== 'mesero') {
            window.location.href = 'index.html';
            return false;
        }
        
        return true;
    }

    init() {
        try {
            console.log('Inicializando aplicación...');
            this.bindEvents();
            this.updateTime();
            setInterval(() => this.updateTime(), 60000);
            this.initialized = true;
            console.log('Aplicación inicializada correctamente');
        } catch (error) {
            console.error('Error en init:', error);
            this.showError('Error inicializando la aplicación');
        }
    }

    bindEvents() {
        // Navigation
        const navItems = document.querySelectorAll('.nav-item');
        console.log('Enlaces de navegación encontrados:', navItems.length);
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                console.log('Click en sección:', section);
                this.navigateTo(section);
            });
        });

        // Toggle sidebar
        const toggleBtn = document.getElementById('toggleSidebar');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const sidebar = document.getElementById('sidebar');
                if (sidebar) {
                    sidebar.classList.toggle('collapsed');
                    const icon = toggleBtn.querySelector('i');
                    const text = toggleBtn.querySelector('span');
                    
                    if (sidebar.classList.contains('collapsed')) {
                        icon.className = 'fas fa-bars';
                        text.textContent = 'Mostrar menú';
                    } else {
                        icon.className = 'fas fa-times';
                        text.textContent = 'Ocultar menú';
                    }
                }
            });
        }

        // Mobile menu toggle (solo si es móvil)
        if (window.innerWidth <= 768) {
            const header = document.querySelector('.header');
            if (header) {
                const menuBtn = document.createElement('button');
                menuBtn.className = 'btn btn-icon';
                menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
                menuBtn.addEventListener('click', () => {
                    const sidebar = document.getElementById('sidebar');
                    if (sidebar) {
                        sidebar.classList.toggle('show');
                    }
                });
                header.insertBefore(menuBtn, header.querySelector('.user-info'));
            }
        }
    }

    navigateTo(section) {
        console.log('navigateTo llamado con sección:', section);
        console.log('currentSection:', this.currentSection);
        console.log('isLoading:', this.isLoading);
        
        if (this.currentSection === section) {
            console.log('Ya en esta sección');
            return;
        }
        
        if (this.isLoading) {
            console.log('Ya se está cargando otra sección');
            return;
        }
        
        console.log('Navegando a:', section);
        
        // Update UI
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === section) {
                item.classList.add('active');
            }
        });
        
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = this.getSectionTitle(section);
        }
        
        this.currentSection = section;
        this.loadSection(section);
    }

    getSectionTitle(section) {
        const titles = {
            'dashboard': 'Dashboard',
            'mesas': 'Gestión de Mesas',
            'reservas': 'Reservas',
            'pedidos': 'Pedidos',
            'platos': 'Platos del Menú',
            'clientes': 'Clientes',
            'facturas': 'Facturas',
            'inventario': 'Inventario',
            'reportes': 'Reportes',
            'meseros': 'Gestión de Meseros'
        };
        return titles[section] || 'Sistema Restaurante';
    }

    loadSection(section) {
        console.log('Cargando sección:', section);
        this.isLoading = true;
        this.showLoading();
        
        // Pequeño delay para asegurar que el loading se muestre
        setTimeout(() => {
            switch(section) {
                case 'dashboard':
                    this.loadDashboard();
                    break;
                case 'mesas':
                    this.loadMesas();
                    break;
                case 'reservas':
                    this.loadReservas();
                    break;
                case 'pedidos':
                    this.loadPedidos();
                    break;
                case 'platos':
                    this.loadPlatos();
                    break;
                case 'clientes':
                    this.loadClientes();
                    break;
                case 'facturas':
                    this.loadFacturas();
                    break;
                case 'inventario':
                    this.loadInventario();
                    break;
                case 'reportes':
                    this.loadReportes();
                    break;
                case 'meseros':
                    this.loadMeseros();
                    break;
                default:
                    this.showError(`Sección "${section}" no implementada`);
                    break;
            }
        }, 50);
    }

    // Métodos de carga que llaman a las funciones globales
    loadDashboard() {
        console.log('main.js: Cargando dashboard...');
        if (typeof window.loadDashboard === 'function') {
            console.log('Ejecutando loadDashboard global...');
            window.loadDashboard();
        } else {
            console.error('loadDashboard NO es una función');
            this.showError('Módulo dashboard no disponible');
        }
    }

    loadMesas() {
        if (typeof window.loadMesas === 'function') {
            window.loadMesas();
        } else {
            this.showError('Módulo mesas no disponible');
        }
    }

    loadReservas() {
        if (typeof window.loadReservas === 'function') {
            window.loadReservas();
        } else {
            this.showError('Módulo reservas no disponible');
        }
    }

    loadPedidos() {
        if (typeof window.loadPedidos === 'function') {
            window.loadPedidos();
        } else {
            this.showError('Módulo pedidos no disponible');
        }
    }

    loadPlatos() {
        if (typeof window.loadPlatos === 'function') {
            window.loadPlatos();
        } else {
            this.showError('Módulo platos no disponible');
        }
    }

    loadClientes() {
        if (typeof window.loadClientes === 'function') {
            window.loadClientes();
        } else {
            this.showError('Módulo clientes no disponible');
        }
    }

    loadFacturas() {
        if (typeof window.loadFacturas === 'function') {
            window.loadFacturas();
        } else {
            this.showError('Módulo facturas no disponible');
        }
    }

    loadInventario() {
        if (typeof window.loadInventario === 'function') {
            window.loadInventario();
        } else {
            this.showError('Módulo inventario no disponible');
        }
    }

    loadReportes() {
        if (typeof window.loadReportes === 'function') {
            window.loadReportes();
        } else {
            this.showError('Módulo reportes no disponible');
        }
    }

    loadMeseros() {
        if (typeof window.loadMeseros === 'function') {
            window.loadMeseros();
        } else {
            this.showError('Módulo meseros no disponible');
        }
    }

    showLoading() {
        const content = document.getElementById('contentArea');
        if (content) {
            content.innerHTML = `
                <div class="loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Cargando datos...</p>
                </div>
            `;
        }
        this.isLoading = true;
    }

    showError(message) {
        const content = document.getElementById('contentArea');
        if (content) {
            content.innerHTML = `
                <div class="loading">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error: ${message}</p>
                    <button class="btn btn-primary" onclick="app.loadSection('${this.currentSection}')">Reintentar</button>
                </div>
            `;
        }
        console.error('Error en la aplicación:', message);
        this.isLoading = false;
    }

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        const dateString = now.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const currentTimeEl = document.getElementById('currentTime');
        if (currentTimeEl) {
            currentTimeEl.innerHTML = `
                <strong>${timeString}</strong><br>
                <small>${dateString}</small>
            `;
        }
    }

    showToast(message, type = 'success') {
        let toast = document.getElementById('toast');
        if (!toast) {
            // Crear toast si no existe
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        
        toast.textContent = message;
        toast.className = `toast ${type}`;
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // API Helper Methods
    async fetchData(endpoint, method = 'GET', data = null) {
        this.isLoading = true;
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(`${API_BASE}/${endpoint}`, options);
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            if (response.status === 204) {
                return null;
            }
            
            return await response.json();
        } catch (error) {
            this.showToast(`Error: ${error.message}`, 'error');
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    async loadTableData(endpoint) {
        try {
            const data = await this.fetchData(endpoint);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error cargando datos:', error);
            return [];
        }
    }
}

// Hacer la clase disponible globalmente
window.RestauranteApp = RestauranteApp;