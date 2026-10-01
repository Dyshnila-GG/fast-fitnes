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

// Множественное число по правилам языка — Intl.PluralRules (CLDR): ru/uk — one / few / many / other (дроби),
// en — one / other. Ключи словаря: base.one, base.few, base.many, base.other — во всех языках.
export type PluralForm = 'one' | 'few' | 'many' | 'other';

const pluralRules: Partial<Record<Lang, Intl.PluralRules | null>> = {};
function rulesFor(lang: Lang): Intl.PluralRules | null {
  if (!(lang in pluralRules)) {
    try {
      pluralRules[lang] = typeof Intl !== 'undefined' && typeof Intl.PluralRules === 'function' ? new Intl.PluralRules(lang) : null;
    } catch {
      pluralRules[lang] = null;
    }
  }
  return pluralRules[lang] ?? null;
}

// Запасной вариант, если в движке нет Intl.PluralRules: те же правила CLDR.
function fallbackForm(n: number, lang: Lang): PluralForm {
  const abs = Math.abs(n);
  if (lang === 'en') return abs === 1 ? 'one' : 'other';
  if (!Number.isInteger(abs)) return 'other';
  const m10 = abs % 10;
  const m100 = abs % 100;
  if (m10 === 1 && m100 !== 11) return 'one';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'few';
  return 'many';
}

export function pluralForm(n: number, lang: Lang = current): PluralForm {
  const rules = rulesFor(lang);
  if (!rules) return fallbackForm(n, lang);
  const form = rules.select(n);
  return form === 'one' || form === 'few' || form === 'many' ? form : 'other';
}

// Для тестов: форма без Intl.PluralRules.
export const pluralFormFallback = fallbackForm;

// tp('count.workouts', 5) → «5 тренировок» / «5 workouts» / «5 тренувань».
export function tp(base: string, n: number, params?: Params): string {
  return tk(`${base}.${pluralForm(n)}`, String(n), { n: formatNumber(n), ...params });
}

// ---- Числа и даты по языку ----

// Неразрывный пробел: «11 890» не переносится по строкам.
const SPACE = '\u00A0';

// Поле ввода: число с десятичным разделителем языка, без разрядов («161,3» / «161.3»).
export const decimalSep = (lang: Lang = current) => (lang === 'en' ? '.' : ',');
export const inputNum = (n: number | undefined) => (n == null ? '' : String(n).replace('.', decimalSep()));
// Набор в поле: «.» и «,» → разделитель языка, прочее вырезается (разбор — parseNum, принимает оба).
export function cleanDecimal(text: string): string {
  const sep = decimalSep();
  return text.replace(/[.,]/g, sep).replace(sep === ',' ? /[^0-9,]/g : /[^0-9.]/g, '');
}

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
