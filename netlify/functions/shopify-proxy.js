exports.handler = async (event, context) => {
  // CORS Headers for local development, Netlify handles production
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: 'OK' };
  }

  // Allow both GET and POST
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  // Load configuration from environment variables
  const storeUrl = process.env.SHOPIFY_STORE_URL;
  const adminToken = process.env.SHOPIFY_ADMIN_TOKEN;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

  if (!storeUrl || (!adminToken && (!clientId || !clientSecret))) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Shopify credentials missing. Provide either SHOPIFY_ADMIN_TOKEN or both SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET.' })
    };
  }

  // Helper to dynamically resolve the access token
  const resolveAccessToken = async () => {
    if (adminToken) return adminToken; // Fallback for legacy setups
    
    // Perform Client Credentials Grant for new Dev Dashboard setups
    const tokenEndpoint = `https://${storeUrl}/admin/oauth/access_token`;
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
      })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error_description || 'Failed to negotiate OAuth token');
    return data.access_token;
  };

  try {
    let action, payload;

    if (event.httpMethod === 'GET') {
      // Default GET to 'get_products'
      action = 'get_products';
      payload = event.queryStringParameters || {};
    } else {
      const body = JSON.parse(event.body);
      action = body.action;
      payload = body.payload;
    }

    if (action === 'test') {
      const resolvedToken = await resolveAccessToken();
      const endpoint = `https://${storeUrl}/admin/api/2023-10/graphql.json`;
      const query = `{ shop { name primaryDomain { url } } }`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': resolvedToken
        },
        body: JSON.stringify({ query })
      });
      
      const data = await response.json();
      if (data.errors) throw new Error(data.errors[0].message);
      
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, shop: data.data.shop }) };
    }

    if (action === 'get_products') {
      const endpoint = `https://${storeUrl}/products.json?limit=250`;
      const response = await fetch(endpoint);
      const data = await response.json();
      if (!response.ok) throw new Error(data.errors || response.statusText);
      
      const responseHeaders = {
        ...headers,
        'Cache-Control': 's-maxage=1, stale-while-revalidate=59'
      };
      return { statusCode: 200, headers: responseHeaders, body: JSON.stringify({ success: true, products: data.products }) };
    }

    if (action === 'push_order') {
      const resolvedToken = await resolveAccessToken();
      const endpoint = `https://${storeUrl}/admin/api/2023-10/orders.json`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': resolvedToken
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(JSON.stringify(data.errors) || response.statusText);
      }
      
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, order: data.order }) };
    }

    if (action === 'get_customer_orders') {
      const resolvedToken = await resolveAccessToken();
      const endpoint = `https://${storeUrl}/admin/api/2023-10/graphql.json`;
      const query = `{
        orders(first: 20, query: "phone:${payload.phone}") {
          edges {
            node {
              id
              name
              createdAt
              displayFinancialStatus
              displayFulfillmentStatus
              totalPriceSet { shopMoney { amount } }
              fulfillments {
                trackingInfo {
                  number
                  url
                }
              }
              lineItems(first: 10) {
                edges {
                  node {
                    title
                    quantity
                    image { url }
                  }
                }
              }
            }
          }
        }
      }`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': resolvedToken
        },
        body: JSON.stringify({ query })
      });
      
      const data = await response.json();
      if (data.errors) throw new Error(data.errors[0].message);
      
      const orders = data.data.orders.edges.map(e => e.node);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, orders }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid action.' }) };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' })
    };
  }
};
