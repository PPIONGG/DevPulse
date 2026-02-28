"use client";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/providers/language-provider";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground">
          {t("error.title")}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          {error.message || t("error.description")}
        </p>
        <div className="mt-8">
          <Button onClick={reset}>{t("common.tryAgain")}</Button>
        </div>
      </div>
    </div>
  );
}
