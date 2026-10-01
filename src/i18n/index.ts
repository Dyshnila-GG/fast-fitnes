import type { Lang } from '../types';
import { en } from './en';
import { ru } from './ru';
import { uk } from './uk';

// Тексты интерфейса и стандартного контента (SPEC_v3_3 §D2): словари ru / en / uk и одна функция t('key').
// Текущий язык ставит AppStore при каждом рендере по настройкам — смена применяется сразу, без перезапуска.

export type Key = keyof typeof ru;
export type Dict = Record<Key, string>;
export type Params = Record<string, string | number>;

export const DICTS: Record<Lang, Dict> = { ru, en, uk };
export const LANGS: Lang[] = ['ru', 'en', 'uk'];

let current: Lang = 'ru';
export const setLang = (lang: Lang) => {
  current = lang;
};
export const getLang = () => current;

const fill = (text: string, params?: Params) =>
  params ? text.replace(/\{(\w+)\}/g, (m, k: string) => (params[k] != null ? String(params[k]) : m)) : text;

export function t(key: Key, params?: Params): string {
  return fill(DICTS[current][key] ?? ru[key] ?? key, params);
}

// Ключ, собранный из данных (стандартный контент: упражнения, блюда, продукты). Нет ключа — fallback.
export function tk(key: string, fallback: string, params?: Params): string {
  const dict = DICTS[current] as Record<string, string>;
  const text = dict[key] ?? (ru as Record<string, string>)[key];
  return fill(text ?? fallback, params);
}

// Множественное число: ru/uk — one / few / many, en — one / many.
export type PluralForm = 'one' | 'few' | 'many';
export function pluralForm(n: number, lang: Lang = current): PluralForm {
  const abs = Math.abs(n);
  if (!Number.isInteger(abs)) return lang === 'en' ? 'many' : 'few';
  if (lang === 'en') return abs === 1 ? 'one' : 'many';
  const m10 = abs % 10;
  const m100 = abs % 100;
  if (m10 === 1 && m100 !== 11) return 'one';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'few';
  return 'many';
}

// tp('days', 3) → ключ «days.few» (в en — «days.many»), {n} подставляется.
export function tp(base: string, n: number, params?: Params): string {
  return tk(`${base}.${pluralForm(n)}`, String(n), { n: formatNumber(n), ...params });
}

// ---- Числа и даты по языку ----

const SPACE = ' ';

// 3320 → «3 320» (ru/uk) / «3,320» (en); дробная часть — «,» (ru/uk) / «.» (en).
export function formatNumber(n: number, digits = 1, lang: Lang = current): string {
  const factor = 10 ** digits;
  const rounded = (Math.sign(n) * Math.round(Math.abs(n) * factor)) / factor;
  const [int, frac] = String(Math.abs(rounded)).split('.');
  const group = lang === 'en' ? ',' : SPACE;
  const dec = lang === 'en' ? '.' : ',';
  const body = int.replace(/\B(?=(\d{3})+(?!\d))/g, group) + (frac ? dec + frac : '');
  return rounded < 0 ? `−${body}` : body;
}

export const monthShort = (m: number) => t(`month.short.${m}` as Key);
export const monthFull = (m: number) => t(`month.full.${m}` as Key);
export const weekdayName = (w: number) => t(`weekday.${w}` as Key);
export const weekdayShort = (w: number) => t(`weekday.short.${w}` as Key);

// Названия языков — на самом языке (так их ищут в списке).
export const LANG_NAMES: Record<Lang, string> = { ru: 'Русский', en: 'English', uk: 'Українська' };
export const LOCALES: Record<Lang, string> = { ru: 'ru-RU', en: 'en-US', uk: 'uk-UA' };
