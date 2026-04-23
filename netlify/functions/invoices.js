// netlify/functions/invoices.js
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

const validateAuth = (event) => {
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }
  return authHeader.replace('Bearer ', '');
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const sb = getSupabase();

  try {
    // Todas las operaciones de facturas requieren auth
    const token = validateAuth(event);
    sb.auth.setSession({ access_token: token, refresh_token: '' });

    const body = event.body ? JSON.parse(event.body) : {};

    switch (event.httpMethod) {
      case 'GET': {
        const { data, error } = await sb
          .from('invoices')
          .select('*')
          .order('fecha', { ascending: false });

        if (error) throw error;

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(data)
        };
      }

      case 'POST': {
        // Validaciones server-side
        if (!body.cliente) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Cliente requerido' })
          };
        }

        if (!body.total || body.total <= 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Total debe ser mayor a 0' })
          };
        }

        // Validar que el total coincida con los items (si vienen items)
        if (body.descripcion) {
          try {
            const items = JSON.parse(body.descripcion);
            if (Array.isArray(items) && items.length > 0) {
              const calculatedTotal = items.reduce((sum, item) => {
                return sum + (item.price || 0) * (item.qty || 0);
              }, 0);
              
              // Permitir 1% de diferencia por redondeos
              const diff = Math.abs(calculatedTotal - body.total);
              if (diff > body.total * 0.01) {
                return {
                  statusCode: 400,
                  headers,
                  body: JSON.stringify({ 
                    error: `Total no coincide con items. Calculado: ${calculatedTotal}, Recibido: ${body.total}` 
                  })
                };
              }
            }
          } catch (e) {
            // Si descripcion no es JSON válido, continuar
          }
        }

        const { data, error } = await sb
          .from('invoices')
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

        const { data, error } = await sb
          .from('invoices')
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
          .from('invoices')
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
    console.error('Invoices error:', error);
    return {
      statusCode: error.message === 'Unauthorized' ? 401 : 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
