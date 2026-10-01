import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { setLang } from '../i18n';
import { setUnits } from '../logic/units';
import type { AppData, Settings } from '../types';
import { purgeTrash } from '../logic/trash';
import { defaultData } from './defaults';
import { migrateData } from './migrate';

const KEY = 'gymlog:data:v1';

type Store = {
  data: AppData;
  update: (fn: (d: AppData) => AppData) => void;
};

const Ctx = createContext<Store | null>(null);
// Язык и единицы отдельно: компоненты с текстами перерисовываются только при смене настроек.
const SettingsCtx = createContext<Settings>({ lang: 'ru', units: 'imperial' });

export function AppStoreProvider({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => setData(purgeTrash(raw ? migrateData(JSON.parse(raw)) : defaultData())))
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
  // Язык и единицы для t() и форматирования — до рендера детей, смена применяется сразу.
  setLang(data.settings.lang);
  setUnits(data.settings.units);
  return (
    <Ctx.Provider value={{ data, update }}>
      <SettingsCtx.Provider value={data.settings}>{children}</SettingsCtx.Provider>
    </Ctx.Provider>
  );
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside AppStoreProvider');
  return s;
}

export function useSettings(): Settings {
  return useContext(SettingsCtx);
}
