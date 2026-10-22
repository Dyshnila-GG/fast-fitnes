import type { PlanExercise, PlanWorkout, TochkaPlanPack } from '../planPack';

// Встроенный персональный Plan Pack TOCHKA v4 (handoff §9, §13, §14, §15, §45).
// Вес — стартовый рабочий в lb (гантели — вес одной гантели); без веса — подбирается на первой тренировке.
// У каждого движения есть вариант на тренажёре и со свободным весом — если тренажёр занят или его нет.
// Названия вариантов совпадают с программой v3 там, где совпадает gifId: от них зависят переводы.
// Анимации — ExerciseDB (бесплатный API, 180p), кадры free-exercise-db (gifId) — запасной вариант.

export const V4_PLAN_ID = 'tochka-v4-personal';

const media = (id: string) => `https://static.exercisedb.dev/media/${id}.gif`;
const KNEE = 'Колено не уходит глубже 90° и не заваливается внутрь. Боль в колене — сразу стоп.';

type Movement = Omit<PlanExercise, 'sets' | 'repsMin' | 'repsMax' | 'targetRir' | 'restMinSec' | 'restMaxSec'>;
type Dose = Pick<PlanExercise, 'sets' | 'repsMin' | 'repsMax' | 'targetRir' | 'restMinSec' | 'restMaxSec'>;
const dose = (sets: number, repsMin: number, repsMax: number, targetRir: number, restMinSec: number, restMaxSec = restMinSec): Dose => ({
  sets, repsMin, repsMax, targetRir, restMinSec, restMaxSec,
});
const TEMPO: Record<string, string> = {
  'incline-chest-press': '3-0-1',
  'chest-press': '3-0-1',
  'pec-deck': '3-0-1',
  'lateral-raise': '2-0-2',
  'shoulder-press': '2-0-1',
  'triceps-pushdown': '2-0-1',
  'ab-crunch': '2-0-1',
  'lat-pulldown': '3-0-1',
  'seated-row': '2-0-1',
  'reverse-pec-deck': '2-0-2',
  'biceps-curl': '3-0-1',
  'incline-db-curl': '3-0-1',
  'hammer-curl': '2-0-1',
  'leg-press': '3-0-1',
  'seated-leg-curl': '3-0-1',
  'calf-raise': '3-1-1',
};
const ex = (m: Movement, d: Dose): PlanExercise => ({ ...m, ...d, tempo: TEMPO[m.exerciseId] ?? '2-0-1' });

// ---------- Грудь ----------

const inclinePress: Movement = {
  exerciseId: 'incline-chest-press', title: 'Жим на наклонной',
  variantId: 'machine', kind: 'machine', mode: 'weight',
  variantName: 'Жим на наклонной в тренажёре', equipment: 'Тренажёр для жима на наклонной',
  gifId: 'Leverage_Incline_Chest_Press', mediaUrl: media('jHAnWmT'),
  muscles: 'Верх груди, передние дельты, трицепс',
  primaryMuscles: ['верх груди'], secondaryMuscles: ['передние дельты', 'трицепс'],
  cue: 'Толкай грудью, лопатки прижаты к спинке.',
  setup: ['Сиденье так, чтобы рукояти были на уровне верха груди.', 'Лопатки сведи и опусти, прижми к спинке.', 'Стопы плотно в пол.'],
  execution: ['Выжимай вверх и чуть к центру, не выпрямляя локти до щелчка.', 'Назад медленно, 2–3 сек, до лёгкого растяжения груди.'],
  mistakes: ['Плечи поднимаются к ушам.', 'Локти разведены на 90° в стороны.', 'Рывок и отбив в нижней точке.'],
  feel: 'Верх груди под ключицами; трицепс и передняя дельта помогают, но не главные.',
  wrongFeel: [
    'Плечи: опусти сиденье ниже, лопатки сильнее сведи и прижми.',
    'Предплечья/кисти: держи рукояти расслабленнее, запястья ровно над локтями, толкай основанием ладони.',
    'Трицепс: не выпрямляй локти до конца, думай «свести локти друг к другу».',
  ],
  alternatives: [{
    variantId: 'dumbbell', kind: 'free', mode: 'weight', weight: 25,
    variantName: 'Жим гантелей на наклонной', equipment: 'Гантели, скамья 30°',
    gifId: 'Incline_Dumbbell_Press', mediaUrl: media('ns0SIbU'),
    cue: 'Скамья 30°, гантели к верху груди, локти ~45°.',
    setup: ['Спинка скамьи 30°, не выше — иначе работают плечи.', 'Гантели на бёдрах, ложись и подними их коленями.', 'Лопатки сведены, небольшой прогиб в грудном отделе.'],
    execution: ['Опускай к верху груди 2–3 сек, локти под ~45° к корпусу.', 'Выжимай вверх по небольшой дуге, гантели не стучат.'],
  }],
};

const chestPress: Movement = {
  exerciseId: 'chest-press', title: 'Жим от груди',
  variantId: 'machine', kind: 'machine', mode: 'weight', weight: 100,
  variantName: 'Жим от груди в тренажёре', equipment: 'Тренажёр для жима от груди',
  gifId: 'Leverage_Chest_Press', mediaUrl: media('T0yTjgW'),
  muscles: 'Грудь, трицепс, передние дельты',
  primaryMuscles: ['грудь'], secondaryMuscles: ['трицепс', 'передние дельты'],
  cue: 'Лопатки сведены, локти ~45° к корпусу, назад медленно.',
  setup: ['Сиденье: рукояти на уровне середины груди.', 'Лопатки сведены и прижаты к спинке весь подход.'],
  execution: ['Выжимай, не отрывая лопатки от спинки.', 'Назад 2–3 сек до растяжения груди, без отбива.'],
  mistakes: ['Сиденье слишком высоко — нагрузка уходит в плечи.', 'Локти вверх в стороны.', 'Полное выпрямление с ударом в суставе.'],
  feel: 'Середина груди; в конце повтора — сжатие груди.',
  wrongFeel: [
    'Плечи: опусти сиденье на одну позицию, сильнее сведи лопатки.',
    'Предплечья: не сжимай рукояти изо всех сил, запястья прямые.',
    'Трицепс: останавливай движение чуть раньше полного выпрямления.',
  ],
  alternatives: [{
    variantId: 'dumbbell', kind: 'free', mode: 'weight', weight: 30,
    variantName: 'Жим гантелей лёжа', equipment: 'Гантели, горизонтальная скамья',
    gifId: 'Dumbbell_Bench_Press', mediaUrl: media('SpYC0Kp'),
    cue: 'Лопатки сведены, опускай гантели до уровня груди, локти ~45°.',
    setup: ['Ляг на скамью, гантели подними коленями.', 'Лопатки сведены и опущены, стопы в пол.'],
    execution: ['Опускай 2–3 сек до уровня груди.', 'Выжимай вверх и чуть к центру, гантели не стучат.'],
  }],
};

const pecDeck: Movement = {
  exerciseId: 'pec-deck', title: 'Сведение рук',
  variantId: 'machine', kind: 'machine', mode: 'weight',
  variantName: 'Бабочка', equipment: 'Тренажёр «бабочка»',
  gifId: 'Butterfly', mediaUrl: media('v3xmPAR'),
  muscles: 'Грудь',
  primaryMuscles: ['грудь'], secondaryMuscles: ['передние дельты'],
  cue: 'Локти чуть согнуты и неподвижны, своди руки как обнимаешь бочку.',
  setup: ['Сиденье: рукояти на уровне груди, не выше плеч.', 'Спина и лопатки прижаты к спинке.'],
  execution: ['Своди руки перед собой, пауза 1 сек в сведении.', 'Назад медленно до растяжения груди, плечи не уходят вперёд.'],
  mistakes: ['Сгибание локтей — превращается в жим.', 'Слишком большой вес и рывок.'],
  feel: 'Грудь сжимается в конце, растягивается в начале.',
  wrongFeel: ['Плечи: опусти сиденье, держи грудь «открытой», не своди плечи вперёд.', 'Бицепс: локти мягко согнуты и не меняют угол.'],
  alternatives: [{
    variantId: 'dumbbell', kind: 'free', mode: 'weight',
    variantName: 'Разводка гантелей лёжа', equipment: 'Гантели, горизонтальная скамья',
    gifId: 'Dumbbell_Flyes', mediaUrl: media('yz9nUhF'),
    cue: 'Локти чуть согнуты, опускай гантели дугой до растяжения груди.',
    setup: ['Ляг на скамью, гантели над грудью, ладони друг к другу.', 'Лопатки сведены.'],
    execution: ['Разводи дугой 2–3 сек до растяжения, локти не опускай ниже скамьи.', 'Своди той же дугой, не выпрямляй и не сгибай локти.'],
  }],
};

// ---------- Плечи ----------

const lateral: Movement = {
  exerciseId: 'lateral-raise', title: 'Махи в стороны',
  variantId: 'dumbbell', kind: 'free', mode: 'weight', weight: 15,
  variantName: 'Махи гантелями в стороны', equipment: 'Гантели',
  gifId: 'Side_Lateral_Raise', mediaUrl: media('DsgkuIt'),
  muscles: 'Средние дельты',
  primaryMuscles: ['средние дельты'], secondaryMuscles: ['трапеции (минимально)'],
  cue: 'Локти чуть согнуты, до уровня плеч, без раскачки.',
  setup: ['Стоя, корпус чуть вперёд, гантели по бокам.', 'Плечи опущены от ушей.'],
  execution: ['Поднимай в стороны локтями до уровня плеч.', 'Опускай 2–3 сек, не бросай вниз.'],
  mistakes: ['Раскачка корпусом.', 'Подъём выше плеч — работают трапеции.', 'Кисти выше локтей.'],
  feel: 'Боковая часть плеча; к концу подхода — жжение там же.',
  wrongFeel: ['Трапеции/шея: возьми вес легче, тянись руками в стороны «вдаль», а не вверх.'],
  alternatives: [{
    variantId: 'machine', kind: 'machine', mode: 'weight',
    variantName: 'Махи в тренажёре', equipment: 'Тренажёр для махов в стороны',
    mediaUrl: media('dRTfGZT'),
    cue: 'Плечи на оси тренажёра, поднимай локтями до уровня плеч.',
    setup: ['Сиденье так, чтобы плечевой сустав был на оси вращения.', 'Подушки — на внешней стороне рук над локтями.'],
    execution: ['Поднимай до уровня плеч, пауза 1 сек.', 'Опускай медленно.'],
  }],
};

const shoulderPress: Movement = {
  exerciseId: 'shoulder-press', title: 'Жим на плечи',
  variantId: 'machine', kind: 'machine', mode: 'weight', weight: 50,
  variantName: 'Жим в тренажёре', equipment: 'Тренажёр для жима от плеч',
  gifId: 'Leverage_Shoulder_Press', mediaUrl: media('vqsbmL0'),
  muscles: 'Передние и средние дельты, трицепс',
  primaryMuscles: ['передние дельты', 'средние дельты'], secondaryMuscles: ['трицепс'],
  cue: 'Спина прижата, жми вверх без рывка, локти не выпрямляй до щелчка.',
  setup: ['Сиденье: рукояти на уровне ушей/подбородка.', 'Поясница прижата к спинке.'],
  execution: ['Выжимай вверх, локти чуть впереди корпуса.', 'Опускай 2 сек до уровня ушей.'],
  mistakes: ['Прогиб в пояснице.', 'Опускание слишком низко с потерей контроля.'],
  feel: 'Плечи спереди и сбоку.',
  wrongFeel: ['Поясница: прижми её к спинке, напряги пресс, сбрось вес.', 'Трицепс: не дожимай локти до конца.'],
  alternatives: [{
    variantId: 'dumbbell', kind: 'free', mode: 'weight', weight: 15,
    variantName: 'Жим гантелей сидя', equipment: 'Гантели, скамья со спинкой',
    gifId: 'Dumbbell_Shoulder_Press', mediaUrl: media('znQUdHY'),
    cue: 'Спина прижата, гантели от уровня ушей вверх, не прогибай поясницу.',
    setup: ['Спинка почти вертикально.', 'Гантели на уровне ушей, ладони вперёд.'],
    execution: ['Жми вверх, гантели не стучат вверху.', 'Опускай 2 сек до уровня ушей.'],
  }],
};

const triceps: Movement = {
  exerciseId: 'triceps-pushdown', title: 'Трицепс',
  variantId: 'cable', kind: 'machine', mode: 'weight', weight: 25,
  variantName: 'Разгибание на блоке', equipment: 'Верхний блок, прямая рукоять',
  gifId: 'Triceps_Pushdown', mediaUrl: media('3ZflifB'),
  muscles: 'Трицепс',
  primaryMuscles: ['трицепс'],
  cue: 'Локти прижаты и неподвижны, разгибай до конца, назад медленно.',
  setup: ['Встань близко к блоку, корпус чуть вперёд.', 'Локти прижаты к бокам.'],
  execution: ['Разгибай руки до конца, пауза 1 сек.', 'Поднимай медленно до угла ~90° в локтях.'],
  mistakes: ['Локти уходят вперёд — подключаются плечи.', 'Корпус наваливается на рукоять.'],
  feel: 'Задняя поверхность плеча, ближе к локтю.',
  wrongFeel: ['Плечи/грудь: зафиксируй локти, сбрось вес.', 'Предплечья: расслабь хват, толкай основанием ладони.'],
  alternatives: [{
    variantId: 'dumbbell', kind: 'free', mode: 'weight', weight: 15,
    variantName: 'Французский жим гантелями лёжа', equipment: 'Гантели, скамья',
    gifId: 'Lying_Dumbbell_Tricep_Extension', mediaUrl: media('mpKZGWz'),
    cue: 'Плечи неподвижны, опускай гантели к ушам, локти не разводи.',
    setup: ['Ляг на скамью, гантели над плечами, ладони друг к другу.'],
    execution: ['Сгибай только в локтях, опуская гантели к ушам 2 сек.', 'Разгибай до прямых рук.'],
  }],
};

// ---------- Пресс ----------

const abs: Movement = {
  exerciseId: 'ab-crunch', title: 'Пресс',
  variantId: 'machine', kind: 'machine', mode: 'weight', weight: 40,
  variantName: 'Скручивания в тренажёре', equipment: 'Тренажёр для пресса',
  gifId: 'Ab_Crunch_Machine', mediaUrl: media('Wgaz7pm'),
  muscles: 'Пресс',
  primaryMuscles: ['прямая мышца живота'], secondaryMuscles: ['косые мышцы'],
  cue: 'Скручивайся корпусом, а не руками; выдох на усилии.',
  setup: ['Сиденье так, чтобы подушки/рукояти были у груди.'],
  execution: ['Скругли спину, своди рёбра к тазу, выдох.', 'Возвращайся медленно, не бросай вес.'],
  mistakes: ['Тянешь руками.', 'Рывок и раскачка.'],
  feel: 'Напряжение и жжение в прессе.',
  wrongFeel: ['Руки/плечи: держи рукояти расслабленно, двигай рёбрами.', 'Поясница: уменьши вес и амплитуду.'],
  alternatives: [{
    variantId: 'floor', kind: 'free', mode: 'bodyweight',
    variantName: 'Скручивания на полу', equipment: 'Коврик',
    gifId: 'Crunches', mediaUrl: media('TFqbd8t'),
    cue: 'Поясница прижата к полу, поднимай лопатки, шею не тяни руками.',
    execution: ['Отрывай лопатки, своди рёбра к тазу, выдох.', 'Опускайся медленно.'],
  }],
};

// ---------- Спина ----------

const pulldown: Movement = {
  exerciseId: 'lat-pulldown', title: 'Вертикальная тяга',
  variantId: 'machine', kind: 'machine', mode: 'weight', weight: 100,
  variantName: 'Тяга верхнего блока', equipment: 'Верхний блок, широкая рукоять',
  gifId: 'Wide-Grip_Lat_Pulldown', mediaUrl: media('RVwzP10'),
  muscles: 'Широчайшие, бицепс',
  primaryMuscles: ['широчайшие'], secondaryMuscles: ['бицепс', 'задние дельты', 'середина спины'],
  cue: 'Тяни к верху груди, локти вниз к карманам, корпус чуть назад.',
  setup: ['Бёдра плотно под валиками.', 'Хват чуть шире плеч.'],
  execution: ['Сначала опусти плечи, затем тяни локтями вниз к верху груди.', 'Вверх медленно до полного растяжения спины.'],
  mistakes: ['Тянешь руками, а не локтями.', 'Раскачка корпусом.', 'Тяга за голову.'],
  feel: 'Широчайшие по бокам спины, под мышками.',
  wrongFeel: ['Бицепс/предплечья: представь, что кисти — крючки, тяни локтями; можно взять ремни.', 'Трапеции: в начале каждого повтора опусти плечи вниз.'],
  alternatives: [{
    variantId: 'pullup', kind: 'free', mode: 'bodyweight',
    variantName: 'Подтягивания', equipment: 'Турник',
    gifId: 'Pullups', mediaUrl: media('lBDjFxJ'),
    cue: 'Хват чуть шире плеч, подбородок над перекладиной, опускайся полностью.',
    execution: ['Сначала опусти плечи, потом тяни грудь к перекладине.', 'Опускайся медленно до прямых рук.'],
  }],
};

const row: Movement = {
  exerciseId: 'seated-row', title: 'Горизонтальная тяга',
  variantId: 'cable', kind: 'machine', mode: 'weight', weight: 90,
  variantName: 'Тяга горизонтального блока', equipment: 'Горизонтальный блок, узкая рукоять',
  gifId: 'Seated_Cable_Rows', mediaUrl: media('hvV79Si'),
  muscles: 'Середина спины, широчайшие',
  primaryMuscles: ['середина спины', 'широчайшие'], secondaryMuscles: ['бицепс', 'задние дельты'],
  cue: 'Спина прямая, тяни к животу, своди лопатки, корпус не раскачивай.',
  setup: ['Стопы на платформе, колени чуть согнуты.', 'Спина прямая, грудь вперёд.'],
  execution: ['Тяни рукоять к животу, своди лопатки, пауза 1 сек.', 'Отпускай медленно до растяжения спины, корпус почти неподвижен.'],
  mistakes: ['Раскачка корпусом назад.', 'Плечи поднимаются к ушам.'],
  feel: 'Середина спины между лопатками и широчайшие.',
  wrongFeel: ['Бицепс: тяни локтями назад, кисти расслаблены.', 'Поясница: сбрось вес, не отклоняйся назад.'],
  alternatives: [{
    variantId: 'dumbbell', kind: 'free', mode: 'weight', weight: 35,
    variantName: 'Тяга гантелей в наклоне', equipment: 'Гантели',
    gifId: 'Bent_Over_Two-Dumbbell_Row', mediaUrl: media('BJ0Hz5L'),
    cue: 'Наклон ~45°, спина прямая, тяни гантели к поясу локтями назад.',
    setup: ['Колени чуть согнуты, таз назад, спина прямая.'],
    execution: ['Тяни гантели к поясу, своди лопатки.', 'Опускай медленно до прямых рук.'],
  }],
};

const reversePecDeck: Movement = {
  exerciseId: 'reverse-pec-deck', title: 'Задняя дельта',
  variantId: 'machine', kind: 'machine', mode: 'weight',
  variantName: 'Обратная бабочка', equipment: 'Тренажёр «бабочка», лицом к спинке',
  gifId: 'Reverse_Machine_Flyes', mediaUrl: media('myfUsKf'),
  muscles: 'Задние дельты, верх спины',
  primaryMuscles: ['задние дельты'], secondaryMuscles: ['ромбовидные', 'трапеции'],
  cue: 'Руки почти прямые, разводи в стороны до линии плеч, без рывка.',
  setup: ['Сядь лицом к спинке, рукояти на уровне плеч.'],
  execution: ['Разводи руки в стороны, думай «руками в стороны», а не «лопатки вместе».', 'Возвращай медленно.'],
  mistakes: ['Сведение лопаток вместо работы дельт.', 'Рывок корпусом.'],
  feel: 'Задняя часть плеча.',
  wrongFeel: ['Середина спины/трапеции: не своди лопатки до конца, возьми вес легче.'],
  alternatives: [{
    variantId: 'dumbbell', kind: 'free', mode: 'weight', weight: 10,
    variantName: 'Разводка гантелей в наклоне', equipment: 'Гантели, скамья',
    gifId: 'Seated_Bent-Over_Rear_Delt_Raise', mediaUrl: media('EAs3xL9'),
    cue: 'Грудь к бёдрам, разводи гантели в стороны без рывка.',
    execution: ['Разводи в стороны до линии плеч, мизинцы чуть вверх.', 'Опускай медленно.'],
  }],
};

// ---------- Бицепс ----------

const curl: Movement = {
  exerciseId: 'biceps-curl', title: 'Бицепс',
  variantId: 'dumbbell', kind: 'free', mode: 'weight', weight: 25,
  variantName: 'Сгибания с гантелями', equipment: 'Гантели',
  gifId: 'Dumbbell_Bicep_Curl', mediaUrl: media('NbVPDMW'),
  muscles: 'Бицепс',
  primaryMuscles: ['бицепс'], secondaryMuscles: ['брахиалис', 'предплечья'],
  cue: 'Локти прижаты к корпусу, разворачивай кисть ладонью вверх, без раскачки.',
  setup: ['Стоя, гантели по бокам, ладони вперёд.'],
  execution: ['Сгибай до верха, сожми бицепс 1 сек.', 'Опускай 2–3 сек до почти прямых рук.'],
  mistakes: ['Раскачка корпусом.', 'Локти уходят вперёд.', 'Неполное разгибание внизу.'],
  feel: 'Бицепс, особенно вверху движения.',
  wrongFeel: ['Предплечья: держи гантель мягче, кисть прямая, не сгибай запястье.', 'Плечи: прижми локти и возьми вес легче.'],
  alternatives: [{
    variantId: 'machine', kind: 'machine', mode: 'weight', weight: 40,
    variantName: 'Сгибания в тренажёре', equipment: 'Тренажёр для бицепса',
    gifId: 'Machine_Bicep_Curl', mediaUrl: media('q6y3OhV'),
    cue: 'Локти на подушке, сгибай полностью, медленно опускай.',
    setup: ['Сиденье так, чтобы локти лежали на подушке на оси вращения.'],
    execution: ['Сгибай до конца, пауза 1 сек.', 'Опускай медленно до почти прямых рук.'],
  }],
};

const inclineCurl: Movement = {
  exerciseId: 'incline-db-curl', title: 'Бицепс на наклонной',
  variantId: 'dumbbell', kind: 'free', mode: 'weight',
  variantName: 'Сгибания на наклонной скамье', equipment: 'Гантели, скамья 45–60°',
  gifId: 'Incline_Dumbbell_Curl', mediaUrl: media('ae9UoXQ'),
  muscles: 'Бицепс (длинная головка)',
  primaryMuscles: ['бицепс (длинная головка)'], secondaryMuscles: ['брахиалис'],
  cue: 'Руки висят за корпусом, локти неподвижны, полное разгибание внизу.',
  setup: ['Спинка 45–60°, сядь и прижми спину.', 'Руки свободно висят вниз.'],
  execution: ['Сгибай, не выводя локти вперёд.', 'Опускай медленно до полного растяжения.'],
  mistakes: ['Локти уходят вперёд.', 'Слишком тяжёлый вес — плечо отрывается от скамьи.'],
  feel: 'Растяжение бицепса внизу и сжатие вверху.',
  wrongFeel: ['Передняя часть плеча: возьми вес легче, держи локти строго вниз.'],
  alternatives: [{
    variantId: 'machine', kind: 'machine', mode: 'weight',
    variantName: 'Сгибания в тренажёре Скотта', equipment: 'Тренажёр Скотта',
    gifId: 'Machine_Preacher_Curls', mediaUrl: media('ye84CTU'),
    cue: 'Плечи плотно на подушке, разгибай почти до конца.',
    execution: ['Сгибай до верха, пауза 1 сек.', 'Опускай медленно, не бросай вес внизу.'],
  }],
};

const hammer: Movement = {
  exerciseId: 'hammer-curl', title: 'Молотки',
  variantId: 'dumbbell', kind: 'free', mode: 'weight', weight: 15,
  variantName: 'Молотки', equipment: 'Гантели',
  gifId: 'Hammer_Curls', mediaUrl: media('2NpxjC1'),
  muscles: 'Брахиалис, предплечья, бицепс',
  primaryMuscles: ['брахиалис', 'плечелучевая'], secondaryMuscles: ['бицепс'],
  cue: 'Нейтральный хват, локти прижаты, без раскачки корпусом.',
  execution: ['Сгибай с ладонями друг к другу.', 'Опускай 2 сек.'],
  mistakes: ['Раскачка корпусом.', 'Локти уходят вперёд.'],
  feel: 'Внешняя сторона плеча и предплечье — здесь это нормально.',
  alternatives: [{
    variantId: 'cable', kind: 'machine', mode: 'weight', weight: 40,
    variantName: 'Сгибания на блоке с канатом', equipment: 'Нижний блок, канат',
    gifId: 'Cable_Hammer_Curls_-_Rope_Attachment', mediaUrl: media('HPlPoQA'),
    cue: 'Локти прижаты к корпусу, без раскачки, медленно опускай.',
    execution: ['Сгибай канат к плечам, ладони друг к другу.', 'Опускай медленно.'],
  }],
};

// ---------- Ноги (ограничение колена) ----------

const legPress: Movement = {
  exerciseId: 'leg-press', title: 'Ноги',
  variantId: 'machine', kind: 'machine', mode: 'weight', weight: 130,
  variantName: 'Жим ногами', equipment: 'Тренажёр для жима ногами',
  gifId: 'Leg_Press', mediaUrl: media('10Z2DXU'),
  muscles: 'Квадрицепс, ягодицы',
  primaryMuscles: ['квадрицепс', 'ягодицы'], secondaryMuscles: ['приводящие'],
  cue: `Стопы на ширине плеч, поясница прижата. ${KNEE}`,
  setup: ['Стопы на ширине плеч чуть выше середины платформы.', 'Поясница и таз прижаты к спинке.'],
  execution: ['Опускай платформу 2–3 сек до угла 90° в колене, не глубже.', 'Выжимай пятками, колени не выпрямляй до щелчка.'],
  mistakes: ['Таз отрывается от сиденья внизу.', 'Колени сводятся внутрь.', 'Слишком глубоко.'],
  feel: 'Передняя поверхность бедра и ягодицы. Колено — без боли.',
  wrongFeel: ['Колено: уменьши глубину и вес; боль — стоп.', 'Поясница: опускайся менее глубоко, таз прижат.'],
  alternatives: [{
    variantId: 'dumbbell', kind: 'free', mode: 'weight', weight: 35,
    variantName: 'Гоблет-присед на скамью', equipment: 'Гантель, скамья',
    gifId: 'Goblet_Squat', mediaUrl: media('mnzcrIB'),
    cue: `Гантель у груди, садись до касания скамьи, спина прямая. ${KNEE}`,
    execution: ['Садись назад-вниз до касания скамьи (колено ~90°).', 'Вставай, толкая пятками.'],
  }],
};

const legCurl: Movement = {
  exerciseId: 'seated-leg-curl', title: 'Задняя поверхность бедра',
  variantId: 'machine', kind: 'machine', mode: 'weight', weight: 75,
  variantName: 'Сгибание ног сидя', equipment: 'Тренажёр для сгибания ног сидя',
  gifId: 'Seated_Leg_Curl', mediaUrl: media('Zg3XY7P'),
  muscles: 'Бицепс бедра',
  primaryMuscles: ['бицепс бедра'], secondaryMuscles: ['икры'],
  cue: 'Колени на оси тренажёра, сгибай плавно, назад медленно.',
  setup: ['Колено на оси вращения тренажёра.', 'Валик над коленями зафиксирован плотно.'],
  execution: ['Сгибай до упора, пауза 1 сек.', 'Разгибай медленно 2–3 сек.'],
  mistakes: ['Таз отрывается от сиденья.', 'Бросаешь вес назад.'],
  feel: 'Задняя поверхность бедра.',
  wrongFeel: ['Икры: потяни носки на себя.', 'Колено: проверь, что ось тренажёра на уровне колена; боль — стоп.'],
  alternatives: [{
    variantId: 'dumbbell', kind: 'free', mode: 'weight', weight: 30,
    variantName: 'Румынская тяга с гантелями', equipment: 'Гантели',
    gifId: 'Stiff-Legged_Dumbbell_Deadlift', mediaUrl: media('rR0LJzx'),
    cue: 'Таз назад, спина прямая, гантели вдоль ног до середины голени.',
    execution: ['Отводи таз назад, колени чуть согнуты и неподвижны.', 'Возвращайся, толкая таз вперёд.'],
  }],
};

const calf: Movement = {
  exerciseId: 'calf-raise', title: 'Икры',
  variantId: 'smith', kind: 'machine', mode: 'weight', weight: 90,
  variantName: 'Подъём на носки в Смите', equipment: 'Машина Смита, степ-платформа',
  gifId: 'Smith_Machine_Calf_Raise', mediaUrl: media('6MaEjVA'),
  muscles: 'Икры',
  primaryMuscles: ['икроножные'], secondaryMuscles: ['камбаловидные'],
  cue: 'Полная амплитуда: пятка вниз до растяжения, пауза вверху.',
  execution: ['Опускай пятки ниже платформы до растяжения, пауза 1 сек.', 'Поднимайся на носки до упора, пауза 1 сек.'],
  mistakes: ['Пружинящие короткие повторы.', 'Сгибание коленей.'],
  feel: 'Икры, жжение к концу подхода.',
  alternatives: [{
    variantId: 'dumbbell', kind: 'free', mode: 'weight', weight: 25,
    variantName: 'Подъём на носки с гантелями', equipment: 'Гантели, степ-платформа',
    gifId: 'Standing_Dumbbell_Calf_Raise', mediaUrl: media('dPmaUaU'),
    cue: 'Полная амплитуда: пятка вниз, пауза вверху.',
  }],
};

export const V4_WORKOUTS: PlanWorkout[] = [
  {
    id: 'v4-tue', title: 'Вт — Грудь, плечи, трицепс', weekday: 2,
    exercises: [
      ex(inclinePress, dose(3, 6, 10, 2, 150, 180)),
      ex(chestPress, dose(3, 8, 12, 2, 150, 180)),
      ex(pecDeck, dose(2, 10, 15, 1, 90, 120)),
      ex(lateral, dose(3, 12, 20, 1, 90, 120)),
      ex(shoulderPress, dose(2, 8, 12, 2, 120, 150)),
      ex(triceps, dose(2, 10, 15, 1, 90, 120)),
      ex(abs, dose(3, 10, 15, 2, 90)),
    ],
  },
  {
    id: 'v4-thu', title: 'Чт — Спина и бицепс', weekday: 4,
    exercises: [
      ex(pulldown, dose(3, 8, 12, 2, 150)),
      ex(row, dose(3, 8, 12, 2, 150)),
      ex(reversePecDeck, dose(3, 12, 20, 1, 90, 120)),
      ex(curl, dose(3, 8, 12, 1, 90, 120)),
      ex(inclineCurl, dose(2, 10, 15, 1, 90, 120)),
      ex(hammer, dose(2, 10, 15, 1, 90, 120)),
      ex(abs, dose(3, 10, 15, 2, 90)),
    ],
  },
  {
    id: 'v4-sat', title: 'Сб — Верх и ноги', weekday: 6,
    exercises: [
      ex(chestPress, dose(3, 8, 12, 2, 150, 180)),
      ex(pulldown, dose(3, 8, 12, 2, 150)),
      ex(legPress, dose(3, 10, 15, 3, 150, 180)),
      ex(legCurl, dose(3, 10, 15, 2, 120)),
      ex(lateral, dose(3, 12, 20, 1, 90, 120)),
      ex(curl, dose(2, 10, 15, 1, 90, 120)),
      ex(calf, dose(3, 10, 20, 2, 90, 120)),
      ex(abs, dose(3, 10, 15, 2, 90)),
    ],
  },
];

export const V4_PERSONAL_PLAN: TochkaPlanPack = {
  format: 'tochka-plan',
  schemaVersion: 1,
  id: V4_PLAN_ID,
  version: '1.2.0',
  title: 'TOCHKA v4',
  author: 'TOCHKA',
  description: 'Вт / Чт / Сб. RIR после каждого подхода, вес подбирается автоматически. Тренажёр или свободный вес — на выбор.',
  visibility: 'private',
  training: { id: 'tochka-v4-training', title: 'TOCHKA v4', workouts: V4_WORKOUTS },
};

