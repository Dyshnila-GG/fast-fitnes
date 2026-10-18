import type { AppData, Profile } from '../types';
import { parsePlanPack, type TochkaPlanPack } from '../planPack';

export type InstallPlanOptions = {
  applyProfilePreset?: boolean;
  installedAt?: Date;
};

function applyProfile(profile: Profile, pack: TochkaPlanPack): Profile {
  const p = pack.profilePreset;
  if (!p) return profile;
  return {
    ...profile,
    goal: p.goal ?? profile.goal,
    gainStrategy: p.gainStrategy ?? profile.gainStrategy,
    musclePriorities: p.musclePriorities ?? profile.musclePriorities,
    limitations: p.limitations ?? profile.limitations,
  };
}

/**
 * Installs configuration only. Sessions, body history, food history and records
 * are deliberately left untouched.
 */
export function installPlanPack(data: AppData, raw: unknown, options: InstallPlanOptions = {}): AppData {
  const parsed = parsePlanPack(raw);
  if (!parsed.ok) throw new Error(parsed.error);
  const pack = parsed.pack;
  return {
    ...data,
    profile: options.applyProfilePreset === false ? data.profile : applyProfile(data.profile, pack),
    installedPlan: {
      pack,
      installedAt: (options.installedAt ?? new Date()).toISOString(),
    },
  };
}

export function uninstallPlanPack(data: AppData): AppData {
  return { ...data, installedPlan: null };
}
