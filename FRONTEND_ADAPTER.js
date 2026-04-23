// ═══════════════════════════════════════════════════════════
// EJEMPLO DE CÓMO ADAPTAR TU FRONTEND PARA USAR EL BACKEND
// ═══════════════════════════════════════════════════════════

// ── CONFIGURACIÓN ──
const API_BASE = '/.netlify/functions'; // En producción
// const API_BASE = 'http://localhost:8888/.netlify/functions'; // En desarrollo

let authToken = null;

// ── HELPERS ──
async function apiCall(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// ══════════════════════════════════════════════════════════
// AUTH - Reemplazar tu función verifyAdmin()
// ══════════════════════════════════════════════════════════

async function verifyAdmin() {
  const email = document.getElementById('adminEmail').value.trim();
  const pwd = document.getElementById('adminPassword').value;

  try {
    const data = await apiCall('/auth', {
      method: 'POST',
      body: JSON.stringify({
        action: 'login',
        email,
        password: pwd
      })
    });

    // Guardar token
    authToken = data.session.access_token;
    localStorage.setItem('auth_token', authToken);
    
    currentUser = data.user;
    closeAdminLogin();
    setAdminMode();
    showToast('✅ Sesión iniciada');
    
    await loadProducts();
    await loadInvoices();
  } catch (error) {
    showLoginError(error.message);
  }
}

// Cargar token al iniciar
authToken = localStorage.getItem('auth_token');

// ══════════════════════════════════════════════════════════
// PRODUCTS - Reemplazar loadProducts()
// ══════════════════════════════════════════════════════════

async function loadProducts() {
  try {
    // GET /products no requiere auth
    const data = await apiCall('/products', {
      method: 'GET'
    });

    allProducts = data || [];
    
    if (isAdmin) {
      renderCatalog();
      buildCategoryFilters();
      populateProductSelect();
    } else {
      initPublicCatalog();
    }
    buildCategoryFilters();
  } catch (error) {
    console.error('Error loading products:', error);
    showToast('⚠️ Error cargando productos');
  }
}

// ══════════════════════════════════════════════════════════
// CREAR PRODUCTO - Reemplazar submitProduct()
// ══════════════════════════════════════════════════════════

async function submitProduct() {
  const product = {
    name: document.getElementById('prod-name').value,
    category: document.getElementById('prod-category').value,
    brand: document.getElementById('prod-brand').value || null,
    codigo: document.getElementById('prod-codigo').value || null,
    price: parseFloat(document.getElementById('prod-price').value) || 0,
    price_venta: parseFloat(document.getElementById('prod-price-venta').value) || 0,
    stock: parseInt(document.getElementById('prod-stock').value) || 0,
    trucks: selectedTrucks,
    emoji: document.getElementById('prod-emoji').value || '📦',
    badge: document.getElementById('prod-badge').value || null,
    active: true
  };

  try {
    if (editingProduct) {
      // UPDATE
      await apiCall('/products', {
        method: 'PUT',
        body: JSON.stringify({
          id: editingProduct,
          ...product
        })
      });
      showToast('✅ Producto actualizado');
    } else {
      // CREATE
      await apiCall('/products', {
        method: 'POST',
        body: JSON.stringify(product)
      });
      showToast('✅ Producto creado');
    }

    closeModal('productModal');
    await loadProducts();
  } catch (error) {
    showToast('⚠️ ' + error.message);
  }
}

// ══════════════════════════════════════════════════════════
// INVOICES - Reemplazar loadInvoices()
// ══════════════════════════════════════════════════════════

async function loadInvoices() {
  try {
    const data = await apiCall('/invoices', {
      method: 'GET'
    });

    cachedInvoices = data || [];
    renderInvoices(data || []);
  } catch (error) {
    console.error('Error loading invoices:', error);
    showToast('⚠️ Error cargando facturas');
  }
}

// ══════════════════════════════════════════════════════════
// CREAR FACTURA
// ══════════════════════════════════════════════════════════

async function createInvoiceFromBuilder() {
  if (invItems.length === 0) {
    showToast('⚠️ Agregá productos a la factura');
    return;
  }

  const cliente = document.getElementById('inv-nombre').value.trim();
  if (!cliente) {
    showToast('⚠️ Ingresá el nombre del cliente');
    return;
  }

  const invoice = {
    cliente,
    telefono: document.getElementById('inv-tel').value.trim() || null,
    vehiculo: document.getElementById('inv-vehiculo2').value.trim() || '-',
    fecha: new Date().toISOString().slice(0, 10),
    total: invTotal,
    estado: document.getElementById('inv-estado2').value,
    descripcion: JSON.stringify(invItems)
  };

  try {
    await apiCall('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoice)
    });

    showToast('✅ Factura creada');
    clearInvoiceBuilder();
    await loadInvoices();
  } catch (error) {
    showToast('⚠️ ' + error.message);
  }
}

// ══════════════════════════════════════════════════════════
// ELIMINAR PRODUCTO
// ══════════════════════════════════════════════════════════

async function deleteProduct(id) {
  if (!confirm('¿Eliminar este producto?')) return;

  try {
    await apiCall(`/products?id=${id}`, {
      method: 'DELETE'
    });

    showToast('✅ Producto eliminado');
    await loadProducts();
  } catch (error) {
    showToast('⚠️ ' + error.message);
  }
}

// ══════════════════════════════════════════════════════════
// NOTA: Repetir este patrón para todas las operaciones CRUD
// ══════════════════════════════════════════════════════════
