const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function parseJson(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function createError(response, data) {
  const message = data?.error || data?.message || response.statusText || `Request failed (${response.status})`;
  return new Error(message);
}

export async function fetchProducts(search = '') {
  const url = new URL(`${API_BASE}/products`, window.location.origin);
  if (search) {
    url.searchParams.set('search', search);
  }

  const response = await fetch(url.href);
  const data = await parseJson(response);
  if (!response.ok) {
    throw createError(response, data);
  }
  return data?.products || [];
}

export async function fetchProductDetails(productId) {
  const response = await fetch(`${API_BASE}/products/${encodeURIComponent(productId)}`);
  const data = await parseJson(response);
  if (!response.ok) {
    throw createError(response, data);
  }
  return data?.product || null;
}

export async function checkHealth() {
  const response = await fetch(`${API_BASE}/health`);
  const data = await parseJson(response);
  if (!response.ok) {
    throw createError(response, data);
  }
  return data;
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await parseJson(response);
  if (!response.ok) {
    throw createError(response, data);
  }

  return data;
}

export async function loginUser(payload) {
  return postJson(`${API_BASE}/auth/login`, payload);
}

export async function registerUser(payload) {
  return postJson(`${API_BASE}/auth/register`, payload);
}

export async function fetchProfile(token) {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJson(response);
  if (!response.ok) {
    throw createError(response, data);
  }
  return data;
}

export async function fetchVendorProducts(token) {
  const response = await fetch(`${API_BASE}/products/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJson(response);
  if (!response.ok) {
    throw createError(response, data);
  }
  return data;
}

export async function createProduct(payload, token) {
  const response = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(response);
  if (!response.ok) {
    throw createError(response, data);
  }
  return data;
}

export async function uploadProductImages(formData, token) {
  const response = await fetch(`${API_BASE}/products/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const data = await parseJson(response);
  if (!response.ok) {
    throw createError(response, data);
  }
  return data;
}

// Categories
export async function fetchCategories() {
  const response = await fetch(`${API_BASE}/categories`);
  const data = await parseJson(response);
  if (!response.ok) {
    throw createError(response, data);
  }
  return data?.categories || [];
}

export async function createCategory(name, token) {
  const response = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name })
  });
  const data = await parseJson(response);
  if (!response.ok) {
    throw createError(response, data);
  }
  return data;
}

// Orders
export async function createOrder(orderData, token) {
  const response = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(orderData)
  });
  const data = await parseJson(response);
  if (!response.ok) {
    throw createError(response, data);
  }
  return data;
}

export async function fetchOrders(token) {
  const response = await fetch(`${API_BASE}/orders`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await parseJson(response);
  if (!response.ok) {
    throw createError(response, data);
  }
  return data;
}

export async function fetchOrderDetails(orderId, token) {
  const response = await fetch(`${API_BASE}/orders/${orderId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await parseJson(response);
  if (!response.ok) {
    throw createError(response, data);
  }
  return data;
}

// Advanced Search
export async function advancedSearch(filters) {
  const params = new URLSearchParams();
  
  if (filters.search) params.set('search', filters.search);
  if (filters.category) params.set('category', filters.category);
  if (filters.vendor) params.set('vendor', filters.vendor);
  if (filters.minPrice) params.set('minPrice', filters.minPrice);
  if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
  if (filters.minRating) params.set('minRating', filters.minRating);
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  params.set('page', filters.page || 1);
  params.set('limit', filters.limit || 20);

  const url = new URL(`${API_BASE}/products`, window.location.origin);
  url.search = params.toString();

  const response = await fetch(url.href);
  const data = await parseJson(response);
  if (!response.ok) {
    throw createError(response, data);
  }
  return data;
}

// Vendor Dashboard
export async function fetchVendorDashboard(token) {
  const response = await fetch(`${API_BASE}/vendors/dashboard`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await parseJson(response);
  if (!response.ok) {
    throw createError(response, data);
  }
  return data;
}

export async function fetchVendorStats(token) {
  const response = await fetch(`${API_BASE}/vendors/dashboard/stats`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await parseJson(response);
  if (!response.ok) {
    throw createError(response, data);
  }
  return data;
}

export async function fetchLowStockAlerts(token) {
  const response = await fetch(`${API_BASE}/vendors/alerts/low-stock`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await parseJson(response);
  if (!response.ok) {
    throw createError(response, data);
  }
  return data;
}
