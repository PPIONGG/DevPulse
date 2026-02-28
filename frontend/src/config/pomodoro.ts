export const DEFAULT_POMODORO_CONFIG = {
  workMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLong: 4,
  autoStartBreaks: true,
  autoStartWork: false,
} as const;

export const POMODORO_LIMITS = {
  minWork: 1,
  maxWork: 90,
  minBreak: 1,
  maxBreak: 30,
  minLongBreak: 5,
  maxLongBreak: 60,
  minSessions: 2,
  maxSessions: 8,
} as const;
