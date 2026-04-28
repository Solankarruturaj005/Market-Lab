import { useEffect } from 'react';
import { useUiStore } from '../store/uiStore';

// Apply theme immediately from localStorage before React hydrates Zustand
function applyThemeClass(theme: string) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

// Eagerly apply persisted theme to avoid flash-of-wrong-theme
try {
  const stored = localStorage.getItem('stock-dashboard-ui');
  const parsed = stored ? JSON.parse(stored) : null;
  const theme = parsed?.state?.theme ?? 'dark';
  applyThemeClass(theme);
} catch {
  applyThemeClass('dark');
}

export function useTheme() {
  const theme = useUiStore((state) => state.theme);

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);
}
