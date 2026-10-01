import { getExercise, getTemplate, getVariant, isLegacyTemplate } from '../data/program';
import type { ExerciseLog, Kind, RunEntry, Session } from '../types';
import { dayKey } from './dates';
import { formatNum } from './food';
import {
  exerciseMeta,
  FEEL_LABEL,
  formatBest,
  formatDate,
  formatDay,
  formatDuration,
  formatFact,
  formatSetPlan,
  formatTime,
  formatWarmup,
  RATING_LABEL,
} from './format';
import { formatPace, formatRunTime, paceMinPerMi } from './run';
import { grow, startBest } from './records';
import { elapsedMs, WARMUP_ITEMS } from './session';
import { tonnage } from './tonnage';

// Отчёт по тренировке в Markdown (SPEC_v3_3 §B2): файл отдаётся в системное «Поделиться».

export type Report = { fileName: string; markdown: string };

const APP = 'TOCHKA-Fitness';
const KIND_LABEL: Record<Kind, string> = { machine: 'тренажёр', free: 'свободный вес' };

// «Грудь и плечи» → «Грудь-и-плечи»; символы, недопустимые в именах файлов, убираются.
const slug = (title: string) =>
  title
    .replace(/[\\/:*?"<>|]/g, '')
    .trim()
    .replace(/\s+/g, '-');

// «Вт — Грудь и плечи» → «Грудь и плечи» (имя файла, уведомления).
export const workoutName = (title: string) => title.replace(/^[^—]+—\s*/, '');

export const reportFileName = (day: string, title: string) => `${APP}_${day}_${slug(title)}.md`;

// Ячейка таблицы Markdown: без переводов строк и вертикальных черт.
const cell = (text: string) => text.replace(/\|/g, '/').replace(/\s*\n\s*/g, ' ');

function exerciseSection(log: ExerciseLog, n: number): string[] {
  const ex = getExercise(log.exerciseId);
  const variant = getVariant(ex, log.variant);
  const lines = [`## ${n}. ${variant.name}`, '', `- Упражнение: ${ex.title}`, `- Вариант: ${KIND_LABEL[variant.kind]} — ${variant.equipment}`];
  if (log.record) {
    // v2: рекорд «было → стало», ответ после разминки, вес «сегодня», оценка.
    const before = log.record ?? startBest(variant);
    const after = grow(before, log, variant);
    lines.push(`- Рекорд: ${formatBest(variant, before)} → ${formatBest(variant, after)}`);
    if (variant.mode !== 'time') lines.push(`- Ответ после разминки: ${log.feel ? FEEL_LABEL[log.feel] : 'нет ответа'}`);
    if (variant.mode === 'weight') lines.push(`- Вес «сегодня»: ${log.todayWeight != null ? `${log.todayWeight} lb` : '—'}`);
    lines.push(`- Оценка: ${log.rating ? RATING_LABEL[log.rating] : 'без оценки'}`);
  } else {
    lines.push(`- ${exerciseMeta(log, variant)}`);
  }
  if (log.comment) lines.push(`- Заметка: ${cell(log.comment)}`);
  lines.push('', '| Подход | План | Факт |', '|---|---|---|');
  let warm = 0;
  let work = 0;
  for (const set of log.sets) {
    const label = set.type === 'warmup' ? `Разминочный ${++warm}` : `Рабочий ${++work}`;
    lines.push(`| ${label} | ${cell(formatSetPlan(set))} | ${cell(formatFact(set, variant))} |`);
  }
  return lines;
}

export function sessionReport(s: Session): Report {
  const end = s.finishedAt ?? s.startedAt;
  const title = getTemplate(s.templateId).title;
  const warmup =
    formatWarmup(s) ??
    WARMUP_ITEMS.map((w) => `${w.label} — ${s.warmupDone?.includes(w.id) ? 'выполнено' : 'пропущено'}`).join(' · ');
  const lines = [
    `# ${title}`,
    '',
    `- Дата: ${formatDate(end)}, ${formatTime(s.startedAt)}–${formatTime(end)}`,
    `- Название: ${title}`,
    `- Версия: ${s.length === 'short' ? 'короткая' : 'длинная'}`,
    `- Длительность: ${formatDuration(elapsedMs(s, new Date(end).getTime()))}`,
    `- Общая пауза: ${formatDuration(s.pausedMs)}`,
    `- Разминка: ${warmup}`,
    `- Тоннаж: ${formatNum(tonnage(s))} lb`,
  ];
  if (isLegacyTemplate(s.templateId)) lines.push('- Программа v1 (A/B/C)');
  s.exercises.forEach((log, i) => lines.push('', ...exerciseSection(log, i + 1)));
  lines.push('', '---', 'TOCHKA Fitness', '');
  return { fileName: reportFileName(dayKey(new Date(end)), workoutName(title)), markdown: lines.join('\n') };
}

export function runReport(day: string, run: RunEntry): Report {
  const pace = paceMinPerMi(run.minutes, run.distanceMi);
  const lines = [
    '# Пробежка',
    '',
    `- Дата: ${formatDay(day)}`,
    `- Время: ${formatRunTime(run.minutes)}`,
    `- Дистанция: ${run.distanceMi != null ? `${run.distanceMi} mi` : '—'}`,
    `- Темп: ${pace != null ? formatPace(pace) : '—'}`,
    '',
    '---',
    'TOCHKA Fitness',
    '',
  ];
  return { fileName: reportFileName(day, 'Пробежка'), markdown: lines.join('\n') };
}
