const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export async function fetchProducts(search = '') {
  const url = new URL(`${API_BASE}/products`, window.location.origin);
  if (search) {
    url.searchParams.set('search', search);
  }

  const response = await fetch(url.href);
  if (!response.ok) {
    throw new Error(`Failed to load products (${response.status})`);
  }

  const data = await response.json();
  return data.products || [];
}

export async function fetchProductDetails(productId) {
  const response = await fetch(`${API_BASE}/products/${encodeURIComponent(productId)}`);
  if (!response.ok) {
    throw new Error(`Failed to load product details (${response.status})`);
  }

  const data = await response.json();
  return data.product || null;
}

export async function checkHealth() {
  const response = await fetch(`${API_BASE}/health`);
  const data = await response.json();
  return data;
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed (${response.status})`);
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
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed (${response.status})`);
  }
  return data;
}
