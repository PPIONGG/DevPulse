"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { POMODORO_LIMITS } from "@/config/pomodoro";
import { useTranslation } from "@/providers/language-provider";
import type { PomodoroConfig } from "@/hooks/use-pomodoro";

interface PomodoroSettingsProps {
  config: PomodoroConfig;
  onUpdateConfig: (config: Partial<PomodoroConfig>) => void;
  disabled?: boolean;
}

export function PomodoroSettings({
  config,
  onUpdateConfig,
  disabled = false,
}: PomodoroSettingsProps) {
  const { t } = useTranslation();
  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="px-4 py-3">
        <CardTitle className="text-base">{t("pomodoro.timerSettings")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4 pt-0">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="workMinutes">{t("pomodoro.workMinutes")}</Label>
            <Input
              id="workMinutes"
              type="number"
              min={POMODORO_LIMITS.minWork}
              max={POMODORO_LIMITS.maxWork}
              value={config.workMinutes}
              onChange={(e) =>
                onUpdateConfig({
                  workMinutes: clamp(
                    parseInt(e.target.value) || POMODORO_LIMITS.minWork,
                    POMODORO_LIMITS.minWork,
                    POMODORO_LIMITS.maxWork
                  ),
                })
              }
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="breakMinutes">{t("pomodoro.breakMinutes")}</Label>
            <Input
              id="breakMinutes"
              type="number"
              min={POMODORO_LIMITS.minBreak}
              max={POMODORO_LIMITS.maxBreak}
              value={config.breakMinutes}
              onChange={(e) =>
                onUpdateConfig({
                  breakMinutes: clamp(
                    parseInt(e.target.value) || POMODORO_LIMITS.minBreak,
                    POMODORO_LIMITS.minBreak,
                    POMODORO_LIMITS.maxBreak
                  ),
                })
              }
              disabled={disabled}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="longBreakMinutes">{t("pomodoro.longBreakMinutes")}</Label>
            <Input
              id="longBreakMinutes"
              type="number"
              min={POMODORO_LIMITS.minLongBreak}
              max={POMODORO_LIMITS.maxLongBreak}
              value={config.longBreakMinutes}
              onChange={(e) =>
                onUpdateConfig({
                  longBreakMinutes: clamp(
                    parseInt(e.target.value) || POMODORO_LIMITS.minLongBreak,
                    POMODORO_LIMITS.minLongBreak,
                    POMODORO_LIMITS.maxLongBreak
                  ),
                })
              }
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sessionsBeforeLong">{t("pomodoro.sessionsBeforeLong")}</Label>
            <Input
              id="sessionsBeforeLong"
              type="number"
              min={POMODORO_LIMITS.minSessions}
              max={POMODORO_LIMITS.maxSessions}
              value={config.sessionsBeforeLong}
              onChange={(e) =>
                onUpdateConfig({
                  sessionsBeforeLong: clamp(
                    parseInt(e.target.value) || POMODORO_LIMITS.minSessions,
                    POMODORO_LIMITS.minSessions,
                    POMODORO_LIMITS.maxSessions
                  ),
                })
              }
              disabled={disabled}
            />
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id="autoStartBreaks"
              checked={config.autoStartBreaks}
              onCheckedChange={(checked) =>
                onUpdateConfig({ autoStartBreaks: checked === true })
              }
              disabled={disabled}
            />
            <Label htmlFor="autoStartBreaks" className="font-normal">
              {t("pomodoro.autoBreaks")}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="autoStartWork"
              checked={config.autoStartWork}
              onCheckedChange={(checked) =>
                onUpdateConfig({ autoStartWork: checked === true })
              }
              disabled={disabled}
            />
            <Label htmlFor="autoStartWork" className="font-normal">
              {t("pomodoro.autoWork")}
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
