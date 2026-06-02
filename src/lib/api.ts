/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * API client — always targets the Laravel MySQL backend
 * via the Express proxy on port 3000.
 * Firebase / Firestore is bypassed entirely for data reads.
 */

const BASE = import.meta.env.VITE_API_URL || '/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ─── Kits ────────────────────────────────────────────────────────────────────

export async function apiGetKits(): Promise<any[]> {
  try {
    return await apiFetch<any[]>('/kits');
  } catch (e) {
    console.error('[api] fetchKits failed:', e);
    return [];
  }
}

// ─── Tutorials / Courses ─────────────────────────────────────────────────────

export async function apiGetTutorials(): Promise<any[]> {
  try {
    return await apiFetch<any[]>('/tutorials');
  } catch (e) {
    console.error('[api] fetchTutorials failed:', e);
    return [];
  }
}

// ─── Marketplace Products ────────────────────────────────────────────────────

export async function apiGetProducts(): Promise<any[]> {
  try {
    return await apiFetch<any[]>('/products');
  } catch (e) {
    console.error('[api] fetchProducts failed:', e);
    return [];
  }
}

export async function apiAddProduct(product: any): Promise<any> {
  return apiFetch<any>('/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function apiSubmitOrder(order: any): Promise<any> {
  return apiFetch<any>('/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  });
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function apiGetAdminSummary(): Promise<any> {
  return apiFetch<any>('/admin/summary');
}

export async function apiApproveProduct(productId: string): Promise<any> {
  return apiFetch<any>(`/admin/products/${productId}/approve`, { method: 'PUT' });
}

export async function apiRejectProduct(productId: string): Promise<void> {
  await apiFetch<any>(`/admin/products/${productId}`, { method: 'DELETE' });
}

export async function apiRestockKit(kitId: string, stock: number): Promise<any> {
  return apiFetch<any>(`/admin/kits/${kitId}/stock`, {
    method: 'PUT',
    body: JSON.stringify({ stock }),
  });
}

// ─── Offline sync ────────────────────────────────────────────────────────────

export async function apiSync(payload: { products?: any[]; orders?: any[] }): Promise<any> {
  return apiFetch<any>('/sync', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
