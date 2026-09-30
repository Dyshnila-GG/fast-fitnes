export type Kind = 'machine' | 'free';
export type Mode = 'weight' | 'bodyweight' | 'time';
export type Length = 'long' | 'short';
export type LegacyTemplateId = 'A' | 'B' | 'C'; // программа v1 — только история
export type TemplateId = 'tue' | 'thu' | 'sat' | LegacyTemplateId;
export type Rating = 'easy' | 'normal' | 'hard' | 'fail'; // v1 — только история
export type Feel = 'easy' | 'normal' | 'hard'; // «Как пошла разминка?»

export type Plan = {
  weight?: number;
  reps?: number;
  repsMax?: number; // для диапазона «8–10»
  seconds?: number;
  sets: number;
};

export type Warmup = { pct: number; reps?: number; seconds?: number }; // pct = 0 — без веса

// Рекорд варианта: вес (с весом), диапазон повторов (свой вес) или секунды (планка).
export type Best = Omit<Plan, 'sets'>;

export type Variant = {
  kind: Kind;
  name: string;
  equipment: string;
  gifId: string;
  cue: string;
  mode: Mode;
  plan: Plan;
  warmup: Warmup[];
  perLeg?: boolean; // повторы «на ногу»
};

export type Exercise = {
  id: string;
  title: string;
  muscles: string;
  legs?: boolean;
  restSec: number;
  tempo: string;
  defaultVariant: Kind;
  variants: Variant[];
};

export type WorkoutTemplate = {
  id: TemplateId;
  title: string;
  day: string;
  weekday: number; // 0 = воскресенье
  exercises: Exercise[];
};

export type SetLog = {
  type: 'warmup' | 'work';
  planWeight?: number;
  planReps?: number;
  planRepsMax?: number; // верх диапазона «8–10»
  planSeconds?: number;
  factWeight?: number;
  factReps?: number;
  factSeconds?: number;
  done: boolean;
};

export type ExerciseLog = {
  exerciseId: string;
  variant: Kind;
  sets: SetLog[];
  record?: Best; // рекорд на начало тренировки («было»)
  feel?: Feel;
  todayWeight?: number; // вес «сегодня» для всех рабочих подходов
  comment?: string; // «Заметка»
  rating?: Rating; // v1
  difficulty?: number; // v1
};

// Секундомер по меткам времени: накоплено + идёт с момента since.
export type Stopwatch = { ms: number; since?: string };

export type SessionWarmup = {
  run: Stopwatch & { distanceMi?: number };
  joints: Stopwatch;
};

export type Session = {
  id: string;
  templateId: TemplateId;
  length: Length;
  startedAt: string;
  finishedAt?: string;
  pausedMs: number;
  pausedAt?: string; // момент начала текущей паузы
  restEndsAt?: string; // окончание текущего отдыха
  restSec?: number; // длительность текущего отдыха
  warmup?: SessionWarmup;
  warmupDone?: string[]; // v1: чек-лист разминки
  exercises: ExerciseLog[];
};

export type Profile = { age: number; heightIn: number; startWeight: number };
export type BodyWeightEntry = { id: string; date: string; value: number };
export type MeasurementEntry = {
  id: string;
  date: string;
  chest?: number;
  waist?: number;
  biceps?: number;
  thigh?: number;
  calf?: number;
};

export type AppData = {
  version: 2;
  profile: Profile;
  lengthChoice: Partial<Record<TemplateId, Length>>;
  variantChoice: Record<string, Kind>;
  records: Record<string, Best>; // ключ — название варианта
  plans: Record<string, Partial<Record<Kind, Plan>>>; // v1 — источник переноса рекордов
  activeSession: Session | null;
  summaryId: string | null; // завершённая тренировка, итог которой ещё не закрыт
  sessions: Session[];
  bodyWeight: BodyWeightEntry[];
  measurements: MeasurementEntry[];
};
