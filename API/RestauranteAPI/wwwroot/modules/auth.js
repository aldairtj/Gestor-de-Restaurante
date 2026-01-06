// Authentication Module - Versión corregida
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.token = localStorage.getItem('mesero_token');
        this.userData = JSON.parse(localStorage.getItem('mesero_data') || 'null');
        
        if (this.token && this.userData) {
            this.currentUser = this.userData;
        }
    }

    async login(usuario, contrasena) {
        try {
            const response = await fetch('/api/mesero/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ Usuario: usuario, Contrasena: contrasena })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Error en inicio de sesión');
            }

            const data = await response.json();
            
            // Guardar en localStorage
            localStorage.setItem('mesero_token', data.Token || '');
            localStorage.setItem('mesero_data', JSON.stringify(data));
            
            this.token = data.Token || '';
            this.currentUser = data;
            this.userData = data;

            // Mostrar mensaje si app existe
            if (window.app && window.app.showToast) {
                window.app.showToast(`Bienvenido ${data.NOMBRE || 'Usuario'}!`, 'success');
            } else {
                alert(`Bienvenido ${data.NOMBRE || 'Usuario'}!`);
            }
            
            return data;
        } catch (error) {
            console.error('Error en login:', error);
            if (window.app && window.app.showToast) {
                window.app.showToast(error.message || 'Error en inicio de sesión', 'error');
            } else {
                alert(error.message || 'Error en inicio de sesión');
            }
            throw error;
        }
    }

    logout() {
        localStorage.removeItem('mesero_token');
        localStorage.removeItem('mesero_data');
        this.token = null;
        this.currentUser = null;
        this.userData = null;
        
        if (window.app && window.app.showToast) {
            window.app.showToast('Sesión cerrada', 'success');
        }
        window.location.reload();
    }

    isLoggedIn() {
        return this.token !== null && this.currentUser !== null;
    }

    getUserInfo() {
        return this.currentUser;
    }

    getAuthHeader() {
        if (this.token) {
            return { 'Authorization': `Bearer ${this.token}` };
        }
        return {};
    }
}

// Crear una única instancia global
window.authManager = new AuthManager();

window.cerrarSesion = function() {
    localStorage.removeItem('mesero_token');
    localStorage.removeItem('mesero_data');
    localStorage.removeItem('userRole');
    window.location.href = 'login.html';
};