import type { Exercise, Kind, Mode, Plan, Variant, Warmup, WorkoutTemplate } from '../types';
import { exerciseFactory, v } from './helpers';
import { LEGACY_PROGRAM } from './legacy';

// Программа v2 (SPEC_v2 §3). plan — подходы, диапазон повторов и стартовый рекорд.

const BASE = 120;
const ISO = 90;

// Разминка (SPEC_v2 §2.1): №1–2 — 50%×10 и 75%×5, остальные — 50%×10; свой вес и планка — 1 лёгкий подход.
function warmupFor(index: number, mode: Mode): Warmup[] {
  if (mode === 'time') return [{ pct: 0, seconds: 20 }];
  if (mode === 'bodyweight') return [{ pct: 0, reps: 5 }];
  return index < 2
    ? [
        { pct: 0.5, reps: 10 },
        { pct: 0.75, reps: 5 },
      ]
    : [{ pct: 0.5, reps: 10 }];
}

const ex = exerciseFactory(warmupFor);

const range = (sets: number, reps: number, repsMax: number, weight?: number): Plan => ({ sets, reps, repsMax, weight });

// Повторяющиеся варианты (одно движение — одно название — один рекорд)
const latPulldown = (sets: number) =>
  v('machine', 'Тяга верхнего блока', 'Верхний блок, широкая рукоять', 'Wide-Grip_Lat_Pulldown',
    'Тяни к верху груди, локти вниз, корпус чуть назад, без рывков.', range(sets, 8, 12, 100));
const pullups = (sets: number) =>
  v('free', 'Подтягивания', 'Турник', 'Pullups',
    'Хват чуть шире плеч, подбородок над перекладиной, опускайся полностью.', range(sets, 6, 10), { mode: 'bodyweight' });
const cableLateral = (sets: number) =>
  v('machine', 'Махи на блоке одной рукой', 'Нижний блок, одна рукоять', 'Cable_Seated_Lateral_Raise',
    'Локоть чуть согнут, поднимай до уровня плеча, без раскачки.', range(sets, 12, 15, 10));
const dbLateral = (sets: number) =>
  v('free', 'Махи гантелями в стороны', 'Гантели', 'Side_Lateral_Raise',
    'Локти чуть согнуты, поднимай до уровня плеч, плечи не поднимай к ушам.', range(sets, 12, 15, 10));

export const PROGRAM: WorkoutTemplate[] = [
  {
    id: 'tue',
    title: 'Вт — Грудь и плечи',
    day: 'Вторник',
    weekday: 2,
    exercises: [
      ex('tue', 0, 'Жим лёжа', 'Грудь, трицепс, плечи', BASE, 'machine', [
        v('machine', 'Жим лёжа в Смите', 'Машина Смита, горизонтальная скамья', 'Smith_Machine_Bench_Press',
          'Гриф к нижней части груди, лопатки сведены, локти ~45° к корпусу.', range(4, 6, 10, 75)),
        v('free', 'Жим гантелей лёжа', 'Гантели, горизонтальная скамья', 'Dumbbell_Bench_Press',
          'Лопатки сведены, опускай гантели до уровня груди, локти ~45°.', range(4, 6, 10, 30)),
      ]),
      ex('tue', 1, 'Жим на наклонной', 'Верх груди, плечи', BASE, 'free', [
        v('machine', 'Жим на наклонной в Смите', 'Машина Смита, наклонная скамья', 'Smith_Machine_Incline_Bench_Press',
          'Гриф к верху груди, лопатки сведены, локти ~45°.', range(3, 8, 12, 65)),
        v('free', 'Жим гантелей на наклонной', 'Гантели, наклонная скамья 30°', 'Incline_Dumbbell_Press',
          'Лопатки сведены, гантели к верху груди, локти ~45°.', range(3, 8, 12, 25)),
      ]),
      ex('tue', 2, 'Жим на плечи', 'Дельты, трицепс', BASE, 'free', [
        v('machine', 'Жим в тренажёре', 'Тренажёр для жима от плеч', 'Leverage_Shoulder_Press',
          'Спина прижата, жми вверх без рывка, локти не выпрямляй до щелчка.', range(3, 8, 12, 50)),
        v('free', 'Жим гантелей сидя', 'Гантели, скамья со спинкой', 'Dumbbell_Shoulder_Press',
          'Спина прижата, гантели от уровня ушей вверх, не прогибай поясницу.', range(3, 8, 12, 15)),
      ]),
      ex('tue', 3, 'Махи в стороны', 'Средние дельты', ISO, 'free', [cableLateral(3), dbLateral(3)]),
      ex('tue', 4, 'Трицепс', 'Трицепс', ISO, 'machine', [
        v('machine', 'Разгибание на блоке', 'Верхний блок, прямая рукоять', 'Triceps_Pushdown',
          'Локти прижаты и неподвижны, разгибай до конца.', range(3, 10, 15, 40)),
        v('free', 'Французский жим гантелями лёжа', 'Гантели, скамья', 'Lying_Dumbbell_Tricep_Extension',
          'Плечи неподвижны, опускай гантели к ушам, локти не разводи.', range(3, 10, 15, 15)),
      ]),
      ex('tue', 5, 'Пресс', 'Пресс', ISO, 'machine', [
        v('machine', 'Скручивания в тренажёре', 'Тренажёр для пресса', 'Ab_Crunch_Machine',
          'Скручивайся корпусом, а не руками; поясница прижата, выдох на усилии.', range(3, 12, 15, 40)),
        v('free', 'Скручивания на полу', 'Коврик', 'Crunches',
          'Поясница прижата к полу, поднимай лопатки, шею не тяни руками.', range(3, 15, 20), { mode: 'bodyweight' }),
      ]),
    ],
  },
  {
    id: 'thu',
    title: 'Чт — Спина и руки',
    day: 'Четверг',
    weekday: 4,
    exercises: [
      ex('thu', 0, 'Вертикальная тяга', 'Широчайшие, бицепс', BASE, 'machine', [latPulldown(4), pullups(4)]),
      ex('thu', 1, 'Горизонтальная тяга', 'Середина спины', BASE, 'machine', [
        v('machine', 'Тяга горизонтального блока', 'Горизонтальный блок, узкая рукоять', 'Seated_Cable_Rows',
          'Спина прямая, тяни к животу, своди лопатки, корпус не раскачивай.', range(3, 8, 12, 90)),
        v('free', 'Тяга гантелей в наклоне', 'Гантели', 'Bent_Over_Two-Dumbbell_Row',
          'Наклон ~45°, спина прямая, тяни гантели к поясу локтями назад.', range(3, 8, 12, 35)),
      ]),
      ex('thu', 2, 'Тяга одной рукой', 'Широчайшие', BASE, 'free', [
        v('machine', 'Тяга нижнего блока одной рукой', 'Нижний блок, одна рукоять', 'Seated_One-arm_Cable_Pulley_Rows',
          'Спина прямая, тяни локоть назад вдоль корпуса, без скручивания.', range(3, 8, 12, 45)),
        v('free', 'Тяга гантели одной рукой', 'Гантель, скамья', 'One-Arm_Dumbbell_Row',
          'Опора на скамью, спина ровная, тяни гантель к поясу.', range(3, 8, 12, 35)),
      ]),
      ex('thu', 3, 'Задняя дельта', 'Задние дельты, верх спины', ISO, 'machine', [
        v('machine', 'Обратная бабочка', 'Тренажёр «бабочка», лицом к спинке', 'Reverse_Machine_Flyes',
          'Руки почти прямые, разводи в стороны до линии плеч, лопатки не своди до конца.', range(3, 12, 15, 40)),
        v('free', 'Разводка гантелей в наклоне', 'Гантели, скамья', 'Seated_Bent-Over_Rear_Delt_Raise',
          'Сидя с наклоном, грудь к бёдрам, разводи гантели в стороны без рывка.', range(3, 12, 15, 10)),
      ]),
      ex('thu', 4, 'Бицепс', 'Бицепс', ISO, 'free', [
        v('machine', 'Сгибания в тренажёре', 'Тренажёр для бицепса', 'Machine_Bicep_Curl',
          'Локти на подушке, сгибай полностью, медленно опускай.', range(3, 8, 12, 40)),
        v('free', 'Сгибания с гантелями', 'Гантели', 'Dumbbell_Bicep_Curl',
          'Локти прижаты к корпусу, супинируй кисть вверху, без раскачки.', range(3, 8, 12, 20)),
      ]),
      ex('thu', 5, 'Предплечья, бицепс', 'Брахиалис, предплечья, бицепс', ISO, 'free', [
        v('machine', 'Сгибания на блоке с канатом', 'Нижний блок, канат', 'Cable_Hammer_Curls_-_Rope_Attachment',
          'Локти прижаты к корпусу, без раскачки, медленно опускай.', range(3, 10, 12, 40)),
        v('free', 'Молотки', 'Гантели', 'Hammer_Curls',
          'Нейтральный хват, локти прижаты, без раскачки корпусом.', range(3, 10, 12, 25)),
      ]),
      ex('thu', 6, 'Пресс', 'Пресс, кор', ISO, 'free', [
        v('free', 'Планка', 'Коврик', 'Plank',
          'Тело — прямая линия, пресс и ягодицы напряжены, таз не проваливается.', { sets: 3, seconds: 40 },
          { mode: 'time' }),
      ]),
    ],
  },
  {
    id: 'sat',
    title: 'Сб — Ноги и верх',
    day: 'Суббота',
    weekday: 6,
    exercises: [
      ex('sat', 0, 'Ноги (квадрицепс)', 'Квадрицепс, ягодицы', BASE, 'machine', [
        v('machine', 'Жим ногами', 'Тренажёр для жима ногами', 'Leg_Press',
          'Стопы на ширине плеч, поясница прижата к спинке.', range(3, 10, 12, 110)),
        v('free', 'Гоблет-присед на скамью', 'Гантель, скамья', 'Goblet_Squat',
          'Гантель у груди, садись до касания скамьи, спина прямая.', range(3, 10, 12, 35)),
      ], true),
      ex('sat', 1, 'Задняя поверхность бедра', 'Бицепс бедра', ISO, 'machine', [
        v('machine', 'Сгибание ног сидя', 'Тренажёр для сгибания ног сидя', 'Seated_Leg_Curl',
          'Колени на оси тренажёра, сгибай плавно, таз не отрывай.', range(3, 10, 12, 60)),
        v('free', 'Румынская тяга с гантелями', 'Гантели', 'Stiff-Legged_Dumbbell_Deadlift',
          'Таз назад, спина прямая, гантели скользят вдоль ног до середины голени.', range(3, 10, 12, 30)),
      ], true),
      ex('sat', 2, 'Брусья (грудь, трицепс)', 'Грудь, трицепс', BASE, 'free', [
        v('machine', 'Жим от груди в тренажёре', 'Тренажёр для жима от груди', 'Leverage_Chest_Press',
          'Лопатки сведены, рукояти на уровне груди, локти не выпрямляй до щелчка.', range(3, 8, 12, 90)),
        v('free', 'Брусья', 'Брусья', 'Dips_-_Chest_Version',
          'Наклон корпуса вперёд, локти в стороны, опускайся до 90° в локтях.', range(3, 6, 12), { mode: 'bodyweight' }),
      ]),
      ex('sat', 3, 'Подтягивания (спина)', 'Спина, бицепс', BASE, 'free', [latPulldown(3), pullups(3)]),
      ex('sat', 4, 'Ягодицы', 'Ягодицы', BASE, 'free', [
        v('machine', 'Ягодичный мост в Смите', 'Машина Смита, скамья', 'Barbell_Hip_Thrust',
          'Лопатки на скамье, гриф на тазу, вверху сожми ягодицы, подбородок к груди.', range(3, 10, 12, 65)),
        v('free', 'Ягодичный мост с гантелью', 'Гантель, коврик', 'Barbell_Glute_Bridge',
          'Гантель на тазу, толкай пятками, вверху пауза и сжатие ягодиц.', range(3, 10, 12, 40)),
      ], true),
      ex('sat', 5, 'Махи в стороны', 'Средние дельты', ISO, 'free', [cableLateral(2), dbLateral(2)]),
      ex('sat', 6, 'Икры', 'Икры, голеностоп', ISO, 'machine', [
        v('machine', 'Подъём на носки в Смите', 'Машина Смита, степ-платформа', 'Smith_Machine_Calf_Raise',
          'Полная амплитуда: пятка вниз, пауза вверху.', range(3, 12, 15, 45)),
        v('free', 'Подъём на носки с гантелями', 'Гантели, степ-платформа', 'Standing_Dumbbell_Calf_Raise',
          'Полная амплитуда: пятка вниз, пауза вверху.', range(3, 12, 15, 25)),
      ], true),
    ],
  },
];

const ALL = [...PROGRAM, ...LEGACY_PROGRAM];

export function isLegacyTemplate(id: string): boolean {
  return LEGACY_PROGRAM.some((t) => t.id === id);
}

export function getTemplate(id: string): WorkoutTemplate {
  const t = ALL.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown template ${id}`);
  return t;
}

export function getExercise(id: string): Exercise {
  for (const t of ALL) {
    const e = t.exercises.find((x) => x.id === id);
    if (e) return e;
  }
  throw new Error(`Unknown exercise ${id}`);
}

export function getVariant(exercise: Exercise, kind: Kind): Variant {
  return exercise.variants.find((x) => x.kind === kind) ?? exercise.variants[0];
}
