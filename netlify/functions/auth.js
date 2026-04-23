// netlify/functions/auth.js
const { createClient } = require('@supabase/supabase-js');

// Helper para crear cliente Supabase con env vars
const getSupabase = () => {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
};

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const sb = getSupabase();
  const body = JSON.parse(event.body);
  const { action, email, password } = body;

  try {
    switch (action) {
      case 'login': {
        const { data, error } = await sb.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            user: data.user,
            session: data.session
          })
        };
      }

      case 'signup': {
        const { data, error } = await sb.auth.signUp({
          email,
          password
        });
        
        if (error) throw error;
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            user: data.user,
            session: data.session
          })
        };
      }

      case 'logout': {
        const { error } = await sb.auth.signOut();
        if (error) throw error;
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        };
      }

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }
  } catch (error) {
    console.error('Auth error:', error);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
