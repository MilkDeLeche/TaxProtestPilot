/**
 * Tax Protest Pilot backend API client (app.py / api.py).
 * Base URL: REACT_APP_API_URL (e.g. http://localhost:8000)
 */

const getApiUrl = () => process.env.REACT_APP_API_URL || 'http://localhost:8000';

export function getAuthHeaders(token) {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || res.statusText || 'API error');
  return data;
}

export async function apiLogin(baseUrl, orgName, email, password) {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ org_name: orgName, email, password }),
  });
  return handleResponse(res);
}

export async function apiRegister(baseUrl, orgName, email, password) {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ org_name: orgName, email, password }),
  });
  return handleResponse(res);
}

export async function apiDashboardStats(baseUrl, token) {
  const res = await fetch(`${baseUrl}/api/dashboard/stats`, {
    headers: getAuthHeaders(token),
  });
  return handleResponse(res);
}

export async function apiGetCustomers(baseUrl, token, { q, show_inactive } = {}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (show_inactive) params.set('show_inactive', 'true');
  const res = await fetch(`${baseUrl}/api/customers?${params}`, {
    headers: getAuthHeaders(token),
  });
  return handleResponse(res);
}

export async function apiCreateCustomer(baseUrl, token, customer) {
  const res = await fetch(`${baseUrl}/api/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders(token) },
    body: JSON.stringify(customer),
  });
  return handleResponse(res);
}

export async function apiUpdateCustomer(baseUrl, token, customerId, payload) {
  const res = await fetch(`${baseUrl}/api/customers/${customerId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders(token) },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function apiGetSettings(baseUrl, token) {
  const res = await fetch(`${baseUrl}/api/settings`, {
    headers: getAuthHeaders(token),
  });
  return handleResponse(res);
}

export async function apiPutSettings(baseUrl, token, settings) {
  const res = await fetch(`${baseUrl}/api/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders(token) },
    body: JSON.stringify(settings),
  });
  return handleResponse(res);
}

export async function apiCreateBatch(baseUrl, token, batch) {
  const res = await fetch(`${baseUrl}/api/batches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders(token) },
    body: JSON.stringify(batch),
  });
  return handleResponse(res);
}

export async function apiListBatches(baseUrl, token) {
  const res = await fetch(`${baseUrl}/api/batches`, {
    headers: getAuthHeaders(token),
  });
  return handleResponse(res);
}

export async function apiGetBatch(baseUrl, token, batchId) {
  const res = await fetch(`${baseUrl}/api/batches/${batchId}`, {
    headers: getAuthHeaders(token),
  });
  return handleResponse(res);
}

export async function apiUpdateBatch(baseUrl, token, batchId, payload) {
  const res = await fetch(`${baseUrl}/api/batches/${batchId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders(token) },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function apiUpdateBatchRows(baseUrl, token, batchId, rows) {
  const res = await fetch(`${baseUrl}/api/batches/${batchId}/rows`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders(token) },
    body: JSON.stringify(rows),
  });
  return handleResponse(res);
}

export async function apiBatchExport(baseUrl, token, batchId, store = false) {
  const res = await fetch(`${baseUrl}/api/batches/${batchId}/export?store=${store}`, {
    headers: getAuthHeaders(token),
  });
  return handleResponse(res);
}

export async function apiDeleteBatch(baseUrl, token, batchId) {
  const res = await fetch(`${baseUrl}/api/batches/${batchId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  return handleResponse(res);
}

export { getApiUrl };
