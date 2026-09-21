import { apiGet, apiPost } from './client';

export async function fetchHealth() {
  const body = await apiGet('/health');
  return body?.data ?? null;
}

export async function fetchSessions() {
  const body = await apiGet('/sessions');
  return Array.isArray(body?.data) ? body.data : [];
}

export async function fetchSessionById(id) {
  const body = await apiGet(`/sessions/${id}`);
  return body?.data ?? null;
}

export async function createSession(payload) {
  const body = await apiPost('/sessions', payload);
  return body?.data ?? null;
}

export async function analyzeSession(id) {
  const body = await apiPost(`/sessions/${id}/analyze`);
  return body?.data ?? null;
}
