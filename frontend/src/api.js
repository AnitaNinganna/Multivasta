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

export async function checkHealth() {
  const response = await fetch(`${API_BASE}/health`);
  const data = await response.json();
  return data;
}
