import { useSettings } from '../store/AppStore';
import { t } from './index';

// t() с подпиской на настройки: компонент перерисуется при смене языка или единиц.
export function useT() {
  useSettings();
  return t;
}
