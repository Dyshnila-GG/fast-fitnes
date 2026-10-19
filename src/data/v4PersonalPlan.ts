import type { PlanExercise, PlanWorkout, TochkaPlanPack } from '../planPack';

// Встроенный персональный Plan Pack TOCHKA v4 (handoff §9, §13, §45).
// Вес — стартовый рабочий в lb (гантели — вес одной гантели); без веса — подбирается на первой тренировке.
// Названия вариантов совпадают с программой v3 там, где совпадает gifId: от них зависят переводы.

export const V4_PLAN_ID = 'tochka-v4-personal';

const LEGS = ' Колено не глубже 90°, не заваливается внутрь. Боль — стоп.';

const incline: PlanExercise = {
  exerciseId: 'incline-chest-press', variantId: 'machine', title: 'Жим на наклонной', variantName: 'Жим на наклонной в тренажёре',
  equipment: 'Тренажёр для жима на наклонной', gifId: 'Leverage_Incline_Chest_Press', muscles: 'Верх груди, передние дельты, трицепс',
  cue: 'Лопатки сведены и прижаты, рукояти на уровне верха груди. Толкай грудью, а не руками.',
  kind: 'machine', mode: 'weight', sets: 3, repsMin: 6, repsMax: 10, targetRir: 2, restMinSec: 150, restMaxSec: 180,
};

const chestPress: PlanExercise = {
  exerciseId: 'chest-press', variantId: 'machine', title: 'Жим от груди', variantName: 'Жим от груди в тренажёре',
  equipment: 'Тренажёр для жима от груди', gifId: 'Leverage_Chest_Press', muscles: 'Грудь, трицепс, передние дельты',
  cue: 'Лопатки сведены, локти ~45° к корпусу. Медленно назад до растяжения груди.',
  kind: 'machine', mode: 'weight', sets: 3, weight: 100, repsMin: 8, repsMax: 12, targetRir: 2, restMinSec: 150, restMaxSec: 180,
};

const pecDeck: PlanExercise = {
  exerciseId: 'pec-deck', variantId: 'machine', title: 'Сведение рук', variantName: 'Бабочка',
  equipment: 'Тренажёр «бабочка»', gifId: 'Butterfly', muscles: 'Грудь',
  cue: 'Локти чуть согнуты и неподвижны, своди руками как обнимаешь бочку. Пауза в сведении.',
  kind: 'machine', mode: 'weight', sets: 2, repsMin: 10, repsMax: 15, targetRir: 1, restMinSec: 90, restMaxSec: 120,
};

const lateral: PlanExercise = {
  exerciseId: 'lateral-raise', variantId: 'dumbbell', title: 'Махи в стороны', variantName: 'Махи гантелями в стороны',
  equipment: 'Гантели', gifId: 'Side_Lateral_Raise', muscles: 'Средние дельты',
  cue: 'Локти чуть согнуты, поднимай до уровня плеч. Плечи не тянутся к ушам, без раскачки.',
  kind: 'free', mode: 'weight', sets: 3, weight: 15, repsMin: 12, repsMax: 20, targetRir: 1, restMinSec: 90, restMaxSec: 120,
};

const shoulderPress: PlanExercise = {
  exerciseId: 'shoulder-press', variantId: 'machine', title: 'Жим на плечи', variantName: 'Жим в тренажёре',
  equipment: 'Тренажёр для жима от плеч', gifId: 'Leverage_Shoulder_Press', muscles: 'Передние и средние дельты, трицепс',
  cue: 'Спина прижата, жми вверх без рывка, локти не выпрямляй до щелчка.',
  kind: 'machine', mode: 'weight', sets: 2, weight: 50, repsMin: 8, repsMax: 12, targetRir: 2, restMinSec: 120, restMaxSec: 150,
};

const triceps: PlanExercise = {
  exerciseId: 'triceps-pushdown', variantId: 'cable', title: 'Трицепс', variantName: 'Разгибание на блоке',
  equipment: 'Верхний блок, прямая рукоять', gifId: 'Triceps_Pushdown', muscles: 'Трицепс',
  cue: 'Локти прижаты и неподвижны, разгибай до конца, назад медленно.',
  kind: 'machine', mode: 'weight', sets: 2, weight: 25, repsMin: 10, repsMax: 15, targetRir: 1, restMinSec: 90, restMaxSec: 120,
};

const abs: PlanExercise = {
  exerciseId: 'ab-crunch', variantId: 'machine', title: 'Пресс', variantName: 'Скручивания в тренажёре',
  equipment: 'Тренажёр для пресса', gifId: 'Ab_Crunch_Machine', muscles: 'Пресс',
  cue: 'Скручивайся корпусом, а не руками; выдох на усилии, без рывка.',
  kind: 'machine', mode: 'weight', sets: 3, weight: 40, repsMin: 10, repsMax: 15, targetRir: 2, restMinSec: 90, restMaxSec: 90,
};

const pulldown: PlanExercise = {
  exerciseId: 'lat-pulldown', variantId: 'machine', title: 'Вертикальная тяга', variantName: 'Тяга верхнего блока',
  equipment: 'Верхний блок, широкая рукоять', gifId: 'Wide-Grip_Lat_Pulldown', muscles: 'Широчайшие, бицепс',
  cue: 'Тяни к верху груди, локти вниз к карманам, корпус чуть назад, без рывков.',
  kind: 'machine', mode: 'weight', sets: 3, weight: 100, repsMin: 8, repsMax: 12, targetRir: 2, restMinSec: 150, restMaxSec: 150,
};

const row: PlanExercise = {
  exerciseId: 'seated-row', variantId: 'cable', title: 'Горизонтальная тяга', variantName: 'Тяга горизонтального блока',
  equipment: 'Горизонтальный блок, узкая рукоять', gifId: 'Seated_Cable_Rows', muscles: 'Середина спины, широчайшие',
  cue: 'Спина прямая, тяни к животу, своди лопатки, корпус не раскачивай.',
  kind: 'machine', mode: 'weight', sets: 3, weight: 90, repsMin: 8, repsMax: 12, targetRir: 2, restMinSec: 150, restMaxSec: 150,
};

const reversePecDeck: PlanExercise = {
  exerciseId: 'reverse-pec-deck', variantId: 'machine', title: 'Задняя дельта', variantName: 'Обратная бабочка',
  equipment: 'Тренажёр «бабочка», лицом к спинке', gifId: 'Reverse_Machine_Flyes', muscles: 'Задние дельты, верх спины',
  cue: 'Руки почти прямые, разводи в стороны до линии плеч, без рывка.',
  kind: 'machine', mode: 'weight', sets: 3, repsMin: 12, repsMax: 20, targetRir: 1, restMinSec: 90, restMaxSec: 120,
};

const curl = (sets: number, repsMin: number, repsMax: number): PlanExercise => ({
  exerciseId: 'biceps-curl', variantId: 'dumbbell', title: 'Бицепс', variantName: 'Сгибания с гантелями',
  equipment: 'Гантели', gifId: 'Dumbbell_Bicep_Curl', muscles: 'Бицепс',
  cue: 'Локти прижаты к корпусу, супинируй кисть вверху, без раскачки.',
  kind: 'free', mode: 'weight', sets, weight: 25, repsMin, repsMax, targetRir: 1, restMinSec: 90, restMaxSec: 120,
});

const inclineCurl: PlanExercise = {
  exerciseId: 'incline-db-curl', variantId: 'dumbbell', title: 'Бицепс на наклонной', variantName: 'Сгибания на наклонной скамье',
  equipment: 'Гантели, скамья 45–60°', gifId: 'Incline_Dumbbell_Curl', muscles: 'Бицепс (длинная головка)',
  cue: 'Руки висят за корпусом, локти неподвижны, полное разгибание внизу.',
  kind: 'free', mode: 'weight', sets: 2, repsMin: 10, repsMax: 15, targetRir: 1, restMinSec: 90, restMaxSec: 120,
};

const hammer: PlanExercise = {
  exerciseId: 'hammer-curl', variantId: 'dumbbell', title: 'Молотки', variantName: 'Молотки',
  equipment: 'Гантели', gifId: 'Hammer_Curls', muscles: 'Брахиалис, предплечья, бицепс',
  cue: 'Нейтральный хват, локти прижаты, без раскачки корпусом.',
  kind: 'free', mode: 'weight', sets: 2, weight: 15, repsMin: 10, repsMax: 15, targetRir: 1, restMinSec: 90, restMaxSec: 120,
};

const legPress: PlanExercise = {
  exerciseId: 'leg-press', variantId: 'machine', title: 'Ноги', variantName: 'Жим ногами',
  equipment: 'Тренажёр для жима ногами', gifId: 'Leg_Press', muscles: 'Квадрицепс, ягодицы',
  cue: 'Стопы на ширине плеч, поясница прижата к спинке.' + LEGS,
  kind: 'machine', mode: 'weight', sets: 3, weight: 130, repsMin: 10, repsMax: 15, targetRir: 3, restMinSec: 150, restMaxSec: 180,
};

const legCurl: PlanExercise = {
  exerciseId: 'seated-leg-curl', variantId: 'machine', title: 'Задняя поверхность бедра', variantName: 'Сгибание ног сидя',
  equipment: 'Тренажёр для сгибания ног сидя', gifId: 'Seated_Leg_Curl', muscles: 'Бицепс бедра',
  cue: 'Колени на оси тренажёра, сгибай плавно, назад медленно, таз не отрывай.',
  kind: 'machine', mode: 'weight', sets: 3, weight: 75, repsMin: 10, repsMax: 15, targetRir: 2, restMinSec: 120, restMaxSec: 120,
};

const calf: PlanExercise = {
  exerciseId: 'calf-raise', variantId: 'smith', title: 'Икры', variantName: 'Подъём на носки в Смите',
  equipment: 'Машина Смита, степ-платформа', gifId: 'Smith_Machine_Calf_Raise', muscles: 'Икры',
  cue: 'Полная амплитуда: пятка вниз до растяжения, пауза вверху.',
  kind: 'machine', mode: 'weight', sets: 3, weight: 90, repsMin: 10, repsMax: 20, targetRir: 2, restMinSec: 90, restMaxSec: 120,
};

export const V4_WORKOUTS: PlanWorkout[] = [
  { id: 'v4-tue', title: 'Вт — Грудь, плечи, трицепс', weekday: 2, exercises: [incline, chestPress, pecDeck, lateral, shoulderPress, triceps, abs] },
  { id: 'v4-thu', title: 'Чт — Спина и бицепс', weekday: 4, exercises: [pulldown, row, reversePecDeck, curl(3, 8, 12), inclineCurl, hammer, abs] },
  { id: 'v4-sat', title: 'Сб — Верх и ноги', weekday: 6, exercises: [chestPress, pulldown, legPress, legCurl, lateral, curl(2, 10, 15), calf, abs] },
];

export const V4_PERSONAL_PLAN: TochkaPlanPack = {
  format: 'tochka-plan',
  schemaVersion: 1,
  id: V4_PLAN_ID,
  version: '1.0.0',
  title: 'TOCHKA v4',
  author: 'TOCHKA',
  description: 'Вт / Чт / Сб. RIR после каждого подхода, вес подбирается автоматически.',
  visibility: 'private',
  training: { id: 'tochka-v4-training', title: 'TOCHKA v4', workouts: V4_WORKOUTS },
};
