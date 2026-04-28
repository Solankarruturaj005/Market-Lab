import api from './api';
import type { AlertItem } from '../types/stock';

export interface CreateAlertPayload {
  stockId: number;
  targetPrice: number;
  triggerType: AlertItem['triggerType'];
}

function normalizeAlert(alert: AlertItem): AlertItem {
  return {
    ...alert,
    targetPrice: Number(alert.targetPrice),
  };
}

export async function fetchAlerts() {
  const { data } = await api.get<AlertItem[]>('/alerts');
  return data.map(normalizeAlert);
}

export async function createAlert(payload: CreateAlertPayload) {
  const { data } = await api.post<AlertItem>('/alerts', payload);
  return normalizeAlert(data);
}

export async function deleteAlert(id: number) {
  await api.delete(`/alerts/${id}`);
}
