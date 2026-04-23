// netlify/functions/products.js
const { createClient } = require('@supabase/supabase-js');

const getSupabase = () => {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
};

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

// Validar que el request viene de un usuario autenticado
const validateAuth = (event) => {
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authorization header');
  }
  return authHeader.replace('Bearer ', '');
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const sb = getSupabase();

  try {
    // Para GET (lista pública), no requiere auth
    if (event.httpMethod === 'GET') {
      const { data, error } = await sb
        .from('products')
        .select('id, name, category, brand, codigo, trucks, price_venta, stock, emoji, badge, active')
        .eq('active', true)
        .order('category');

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    }

    // Para POST, PUT, DELETE requiere autenticación
    const token = validateAuth(event);
    
    // Configurar cliente con el token del usuario
    sb.auth.setSession({ access_token: token, refresh_token: '' });

    const body = event.body ? JSON.parse(event.body) : {};

    switch (event.httpMethod) {
      case 'POST': {
        // Validaciones server-side
        if (!body.name || body.name.length < 2) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Nombre debe tener al menos 2 caracteres' })
          };
        }

        if (body.price < 0 || body.price_venta < 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Los precios no pueden ser negativos' })
          };
        }

        if (body.stock < 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Stock no puede ser negativo' })
          };
        }

        const { data, error } = await sb
          .from('products')
          .insert(body)
          .select()
          .single();

        if (error) throw error;

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(data)
        };
      }

      case 'PUT': {
        const { id, ...updates } = body;
        
        if (!id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'ID requerido' })
          };
        }

        // Validaciones
        if (updates.price !== undefined && updates.price < 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Precio no puede ser negativo' })
          };
        }

        if (updates.stock !== undefined && updates.stock < 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Stock no puede ser negativo' })
          };
        }

        const { data, error } = await sb
          .from('products')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(data)
        };
      }

      case 'DELETE': {
        const id = event.queryStringParameters?.id;
        
        if (!id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'ID requerido' })
          };
        }

        const { error } = await sb
          .from('products')
          .delete()
          .eq('id', id);

        if (error) throw error;

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        };
      }

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Products error:', error);
    return {
      statusCode: error.message === 'No authorization header' ? 401 : 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
