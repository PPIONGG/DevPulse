"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/providers/language-provider";

export default function AppNotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          {t("error.notFoundTitle")}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("error.notFoundDesc")}
        </p>
        <div className="mt-8">
          <Button asChild>
            <Link href="/dashboard">{t("error.backToDashboard")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
