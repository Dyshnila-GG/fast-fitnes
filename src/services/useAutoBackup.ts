import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { backupDue } from '../logic/backup';
import { useStore } from '../store/AppStore';
import { backupSupported, runBackup } from './backup';

// Раз в неделю при открытии приложения — бэкап в выбранную папку (SPEC_v3_3 §B3).
export function useAutoBackup() {
  const { data, update } = useStore();
  const latest = useRef(data);
  latest.current = data;

  useEffect(() => {
    if (!backupSupported) return;
    const check = () => {
      if (backupDue(latest.current.backup)) runBackup(latest.current, update);
    };
    check();
    const sub = AppState.addEventListener('change', (state) => state === 'active' && check());
    return () => sub.remove();
  }, [update]);
}
