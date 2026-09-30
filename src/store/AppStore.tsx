import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AppData } from '../types';
import { defaultData } from './defaults';
import { migrateData } from './migrate';

const KEY = 'gymlog:data:v1';

type Store = {
  data: AppData;
  update: (fn: (d: AppData) => AppData) => void;
};

const Ctx = createContext<Store | null>(null);

export function AppStoreProvider({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => setData(raw ? migrateData(JSON.parse(raw)) : defaultData()))
      .catch(() => setData(defaultData()));
  }, []);

  // Сохраняем после каждого изменения.
  useEffect(() => {
    if (data) AsyncStorage.setItem(KEY, JSON.stringify(data)).catch(() => {});
  }, [data]);

  const update = useCallback((fn: (d: AppData) => AppData) => {
    setData((d) => (d ? fn(d) : d));
  }, []);

  if (!data) return <>{fallback}</>;
  return <Ctx.Provider value={{ data, update }}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside AppStoreProvider');
  return s;
}
