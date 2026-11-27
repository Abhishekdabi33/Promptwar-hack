import { ActivityHistoryItem } from '../types';

const STORAGE_KEY = 'pii_shield_activity_history';
const MAX_ITEMS = 50;

export function loadActivityHistory(): ActivityHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch (e) {
    return [];
  }
}

export function saveActivityItem(item: ActivityHistoryItem): ActivityHistoryItem[] {
  try {
    const existing = loadActivityHistory();
    const filtered = existing.filter(h => h.id !== item.id);
    const updated = [item, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
}

export function deleteActivityItem(id: string): ActivityHistoryItem[] {
  try {
    const existing = loadActivityHistory();
    const updated = existing.filter(h => h.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
}

export function clearActivityHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
}

export function exportHistoryAsJson(history: ActivityHistoryItem[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `pii_shield_history_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
