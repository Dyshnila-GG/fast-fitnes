import { getExercise, getTemplate, getVariant, isLegacyTemplate } from '../data/program';
import type { ExerciseLog, Kind, RunEntry, Session, Units } from '../types';
import { dayKey } from './dates';
import { t } from '../i18n';
import { exerciseTitle, templateName, templateTitle, variantEquipment, variantName } from '../i18n/content';
import {
  exerciseMeta,
  feelLabel,
  formatBest,
  formatDistance,
  formatTonnage,
  formatWeight,
  formatDate,
  formatDay,
  formatDuration,
  formatFact,
  formatSetPlan,
  formatTime,
  formatWarmup,
  ratingLabel,
} from './format';
import { formatPace, formatRunTime, paceMinPerMi } from './run';
import { elapsedMs, recordStep, sessionUnits, WARMUP_ITEMS } from './session';
import { tonnage } from './tonnage';

// Отчёт по тренировке в Markdown (SPEC_v3_3 §B2): файл отдаётся в системное «Поделиться».

export type Report = { fileName: string; markdown: string };

const APP = 'TOCHKA-Fitness';
const kindLabel = (kind: Kind) => t(`report.kind.${kind}`);

// «Грудь и плечи» → «Грудь-и-плечи»; символы, недопустимые в именах файлов, убираются.
const slug = (title: string) =>
  title
    .replace(/[\\/:*?"<>|]/g, '')
    .trim()
    .replace(/\s+/g, '-');

export const reportFileName = (day: string, title: string) => `${APP}_${day}_${slug(title)}.md`;

// Ячейка таблицы Markdown: без переводов строк и вертикальных черт.
const cell = (text: string) => text.replace(/\|/g, '/').replace(/\s*\n\s*/g, ' ');
const line = (label: string, value: string) => `- ${label}: ${value}`;

function exerciseSection(log: ExerciseLog, n: number, units: Units): string[] {
  const ex = getExercise(log.exerciseId);
  const variant = getVariant(ex, log.variant);
  const lines = [
    `## ${n}. ${variantName(variant)}`,
    '',
    line(t('report.exercise'), exerciseTitle(ex)),
    line(t('report.variant'), `${kindLabel(variant.kind)} — ${variantEquipment(variant)}`),
  ];
  if (log.record) {
    // v2: рекорд «было → стало», ответ после разминки, вес «сегодня», оценка.
    const { before, after } = recordStep(log, units);
    lines.push(line(t('report.record'), `${formatBest(variant, before)} → ${formatBest(variant, after)}`));
    if (variant.mode !== 'time') lines.push(line(t('report.feel'), log.feel ? feelLabel(log.feel) : t('report.noAnswer')));
    if (variant.mode === 'weight') lines.push(line(t('report.today'), log.todayWeight != null ? formatWeight(log.todayWeight) : '—'));
    lines.push(line(t('report.rating'), log.rating ? ratingLabel(log.rating) : t('meta.noRating')));
  } else {
    lines.push(`- ${exerciseMeta(log, variant)}`);
  }
  if (log.comment) lines.push(line(t('report.note'), cell(log.comment)));
  lines.push('', `| ${t('report.set')} | ${t('report.plan')} | ${t('report.fact')} |`, '|---|---|---|');
  let warm = 0;
  let work = 0;
  for (const set of log.sets) {
    const label = set.type === 'warmup' ? t('report.warmupSet', { n: ++warm }) : t('report.workSet', { n: ++work });
    lines.push(`| ${label} | ${cell(formatSetPlan(set))} | ${cell(formatFact(set, variant))} |`);
  }
  return lines;
}

export function sessionReport(s: Session): Report {
  const end = s.finishedAt ?? s.startedAt;
  const tpl = getTemplate(s.templateId);
  const title = templateTitle(tpl);
  const warmup =
    formatWarmup(s) ??
    WARMUP_ITEMS.map((w) => `${w.label} — ${t(s.warmupDone?.includes(w.id) ? 'report.done' : 'report.skipped')}`).join(' · ');
  const lines = [
    `# ${title}`,
    '',
    line(t('report.date'), `${formatDate(end)}, ${formatTime(s.startedAt)}–${formatTime(end)}`),
    line(t('report.title'), title),
    line(t('report.length'), t(s.length === 'short' ? 'length.shortLower' : 'length.longLower')),
    line(t('report.duration'), formatDuration(elapsedMs(s, new Date(end).getTime()))),
    line(t('report.pause'), formatDuration(s.pausedMs)),
    line(t('report.warmup'), warmup),
    line(t('report.tonnage'), formatTonnage(tonnage(s))),
  ];
  if (isLegacyTemplate(s.templateId)) lines.push(`- ${t('report.legacy')}`);
  s.exercises.forEach((log, i) => lines.push('', ...exerciseSection(log, i + 1, sessionUnits(s))));
  lines.push('', '---', 'TOCHKA Fitness', '');
  return { fileName: reportFileName(dayKey(new Date(end)), templateName(tpl)), markdown: lines.join('\n') };
}

export function runReport(day: string, run: RunEntry): Report {
  const pace = paceMinPerMi(run.minutes, run.distanceMi);
  const lines = [
    `# ${t('report.run')}`,
    '',
    line(t('report.date'), formatDay(day)),
    line(t('report.time'), formatRunTime(run.minutes)),
    line(t('report.distance'), run.distanceMi != null ? formatDistance(run.distanceMi) : '—'),
    line(t('report.pace'), pace != null ? formatPace(pace) : '—'),
    '',
    '---',
    'TOCHKA Fitness',
    '',
  ];
  return { fileName: reportFileName(day, t('report.run')), markdown: lines.join('\n') };
}
