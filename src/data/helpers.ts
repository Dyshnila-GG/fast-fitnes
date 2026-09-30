import type { Exercise, Kind, Mode, Plan, Variant, Warmup } from '../types';

// Общие правила техники для ног (SPEC §3).
const LEGS = 'Колено не ниже 90°, не заваливается внутрь; при дискомфорте — снизить вес.';

export type VariantInput = Omit<Variant, 'warmup' | 'mode'> & { mode?: Mode };

export function v(
  kind: Kind,
  name: string,
  equipment: string,
  gifId: string,
  cue: string,
  plan: Plan,
  extra: Partial<VariantInput> = {},
): VariantInput {
  return { kind, name, equipment, gifId, cue, plan, ...extra };
}

export type WarmupRule = (index: number, mode: Mode) => Warmup[];

export function exerciseFactory(warmupFor: WarmupRule) {
  return function ex(
    templateId: string,
    index: number,
    title: string,
    muscles: string,
    restSec: number,
    defaultVariant: Kind,
    variants: VariantInput[],
    legs = false,
  ): Exercise {
    return {
      id: `${templateId}${index + 1}`,
      title,
      muscles,
      legs: legs || undefined,
      restSec,
      tempo: '2-0-1',
      defaultVariant,
      variants: variants.map((x) => {
        const mode = x.mode ?? 'weight';
        return {
          ...x,
          mode,
          cue: legs ? `${x.cue} ${LEGS}` : x.cue,
          warmup: warmupFor(index, mode),
        };
      }),
    };
  };
}
