# MZ 4x4 - Backend con Netlify Functions

## 🏗️ Arquitectura

```
Frontend (HTML/JS)
     ↓
Netlify Functions (Backend)
     ↓
Supabase (Database)
```

**Ventajas:**
- ✅ Credenciales de Supabase 100% ocultas
- ✅ Validaciones server-side
- ✅ Mejor seguridad
- ✅ Preparado para escalar

---

## 📋 Setup

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno en Netlify

Netlify Dashboard → Site settings → Environment variables:

```
SUPABASE_URL = https://sxhkyofbagvdufhzuzqm.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4aGt5b2ZiYWd2ZHVmaHp1enFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzAxOTcsImV4cCI6MjA4OTg0NjE5N30.70q0VsEDx3BuKhJN3Dx25x4TCASaaVjMEKbh4QJzzAA
```

### 3. Deploy

**Opción A: Git Deploy (recomendado)**

```bash
# Crear repo en GitHub
git init
git add .
git commit -m "Initial commit with backend"
git remote add origin https://github.com/TU-USUARIO/mz4x4.git
git push -u origin main

# En Netlify: New site → Import from Git → Seleccionar repo
```

**Opción B: Netlify CLI**

```bash
netlify login
netlify init
netlify deploy --prod
```

---

## 🔌 API Endpoints

### **Auth**

**POST** `/.netlify/functions/auth`

```javascript
// Login
{
  "action": "login",
  "email": "admin@mz4x4.local",
  "password": "tu-contraseña"
}

// Signup
{
  "action": "signup",
  "email": "admin@mz4x4.local",
  "password": "tu-contraseña"
}

// Logout
{
  "action": "logout"
}
```

**Response:**
```javascript
{
  "user": { ... },
  "session": {
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

---

### **Products**

**GET** `/.netlify/functions/products`  
Lista todos los productos activos (público, sin auth)

**POST** `/.netlify/functions/products`  
Crear producto (requiere auth)

```javascript
// Headers
{
  "Authorization": "Bearer ACCESS_TOKEN"
}

// Body
{
  "name": "Kit suspensión",
  "category": "Suspensiones",
  "price": 450000,
  "price_venta": 600000,
  "stock": 5
}
```

**PUT** `/.netlify/functions/products`  
Actualizar producto (requiere auth)

```javascript
{
  "id": 123,
  "stock": 3
}
```

**DELETE** `/.netlify/functions/products?id=123`  
Eliminar producto (requiere auth)

---

### **Invoices**

**GET** `/.netlify/functions/invoices`  
Lista facturas (requiere auth)

**POST** `/.netlify/functions/invoices`  
Crear factura (requiere auth)

```javascript
{
  "cliente": "Juan Pérez",
  "vehiculo": "Hilux 2022",
  "total": 560000,
  "estado": "pending",
  "descripcion": "[...]"
}
```

**PUT** `/.netlify/functions/invoices`  
Actualizar factura (requiere auth)

**DELETE** `/.netlify/functions/invoices?id=123`  
Eliminar factura (requiere auth)

---

## 🔒 Seguridad implementada

✅ **Credenciales ocultas** — Variables de entorno  
✅ **Validaciones server-side** — Precios/stock no negativos  
✅ **Autenticación requerida** — JWT token en header  
✅ **CORS configurado** — Solo orígenes permitidos  
✅ **Rate limiting** — Netlify aplica límites por defecto  
✅ **Validación de totales** — Facturas deben coincidir con items  

---

## 🧪 Testing local

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Crear archivo .env local
echo "SUPABASE_URL=https://sxhkyofbagvdufhzuzqm.supabase.co" > .env
echo "SUPABASE_ANON_KEY=eyJ..." >> .env

# Correr servidor local
netlify dev
```

Abre `http://localhost:8888`

---

## 📊 Monitoreo

Netlify Dashboard → Functions:
- Invocations (requests)
- Execution time
- Errors
- Logs

---

## 🚀 Próximos pasos (roadmap)

- [ ] Implementar rate limiting custom por endpoint
- [ ] Logs de auditoría en tabla separada
- [ ] Implementar refresh token logic
- [ ] Agregar tests unitarios
- [ ] Implementar webhooks de Supabase

---

## ⚠️ Notas importantes

1. **No commitear credenciales** — Solo en variables de entorno
2. **Regenerar anon key** después de testing público
3. **Monitorear uso** — Netlify Free: 125k invocaciones/mes
4. **Backups** — Supabase Dashboard → Database → Backups
