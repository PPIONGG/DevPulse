"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useTranslation } from "@/providers/language-provider";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import {
  getSystemSettings, updateSystemSetting, getAdminFeatureToggles,
  updateFeatureToggle, setAnnouncement, setMaintenanceMode,
} from "@/lib/services/admin";
import type { SystemSetting, FeatureToggle } from "@/lib/types/database";
import {
  Wrench, Loader2, AlertTriangle, Megaphone, ToggleLeft,
  Info, CheckCircle, XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [toggles, setToggles] = useState<FeatureToggle[]>([]);
  const [loading, setLoading] = useState(true);

  // Maintenance form
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");

  // Announcement form
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [announcementType, setAnnouncementType] = useState("info");

  useEffect(() => {
    if (!authLoading && user?.role === "admin") {
      fetchAll();
    }
  }, [authLoading, user]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [settingsData, togglesData] = await Promise.all([
        getSystemSettings(),
        getAdminFeatureToggles(),
      ]);
      setSettings(settingsData);
      setToggles(togglesData);

      // Populate forms from settings
      const getVal = (key: string) => settingsData.find(s => s.key === key)?.value || "";
      setMaintenanceEnabled(getVal("maintenance_mode") === "true");
      setMaintenanceMessage(getVal("maintenance_message"));
      setAnnouncementEnabled(getVal("announcement_enabled") === "true");
      setAnnouncementMessage(getVal("announcement_message"));
      setAnnouncementType(getVal("announcement_type") || "info");
    } catch {
      toast.error(t("adminSettings.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  if (!authLoading && user?.role !== "admin") {
    redirect("/dashboard");
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSaveMaintenance = async () => {
    try {
      await setMaintenanceMode({ enabled: maintenanceEnabled, message: maintenanceMessage });
      toast.success(t("adminSettings.maintenanceUpdated"));
    } catch {
      toast.error(t("adminSettings.maintenanceFailed"));
    }
  };

  const handleSaveAnnouncement = async () => {
    try {
      await setAnnouncement({ enabled: announcementEnabled, message: announcementMessage, type: announcementType });
      toast.success(t("adminSettings.announcementUpdated"));
    } catch {
      toast.error(t("adminSettings.announcementFailed"));
    }
  };

  const handleToggleFeature = async (toggle: FeatureToggle) => {
    try {
      const newEnabled = !toggle.is_enabled;
      await updateFeatureToggle(toggle.id, newEnabled, toggle.disabled_message);
      setToggles(prev => prev.map(t => t.id === toggle.id ? { ...t, is_enabled: newEnabled } : t));
      toast.success(`${toggle.module_path} ${newEnabled ? t("adminSettings.featureEnabled") : t("adminSettings.featureDisabled")}`);
    } catch {
      toast.error(t("adminSettings.featureToggleFailed"));
    }
  };

  const handleUpdateDisabledMessage = async (toggle: FeatureToggle, message: string) => {
    try {
      await updateFeatureToggle(toggle.id, toggle.is_enabled, message);
      setToggles(prev => prev.map(t => t.id === toggle.id ? { ...t, disabled_message: message } : t));
    } catch {
      toast.error(t("adminSettings.disabledMessageFailed"));
    }
  };

  const typeConfig = {
    info: { label: t("adminSettings.typeInfo"), icon: Info, color: "text-blue-600" },
    warning: { label: t("adminSettings.typeWarning"), icon: AlertTriangle, color: "text-yellow-600" },
    error: { label: t("adminSettings.typeError"), icon: XCircle, color: "text-red-600" },
    success: { label: t("adminSettings.typeSuccess"), icon: CheckCircle, color: "text-green-600" },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t("adminSettings.title")}</h2>
        <p className="text-muted-foreground">{t("adminSettings.subtitle")}</p>
      </div>

      {/* Maintenance Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-yellow-500" /> {t("adminSettings.maintenance")}
          </CardTitle>
          <CardDescription>{t("adminSettings.maintenanceDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch checked={maintenanceEnabled} onCheckedChange={setMaintenanceEnabled} />
            <Label>{maintenanceEnabled ? t("common.enabled") : t("common.disabled")}</Label>
          </div>
          <div className="space-y-2">
            <Label>{t("adminSettings.maintenanceMessage")}</Label>
            <Textarea
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              rows={2}
              placeholder={t("adminSettings.maintenancePlaceholder")}
            />
          </div>
          <Button onClick={handleSaveMaintenance} size="sm">{t("adminSettings.saveMaintenanceSettings")}</Button>
        </CardContent>
      </Card>

      {/* Announcement Banner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="size-5 text-blue-500" /> {t("adminSettings.announcement")}
          </CardTitle>
          <CardDescription>{t("adminSettings.announcementDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch checked={announcementEnabled} onCheckedChange={setAnnouncementEnabled} />
            <Label>{announcementEnabled ? t("common.enabled") : t("common.disabled")}</Label>
          </div>
          <div className="space-y-2">
            <Label>{t("adminSettings.announcementMessage")}</Label>
            <Textarea
              value={announcementMessage}
              onChange={(e) => setAnnouncementMessage(e.target.value)}
              rows={2}
              placeholder={t("adminSettings.announcementPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("adminSettings.announcementType")}</Label>
            <Select value={announcementType} onValueChange={setAnnouncementType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(typeConfig).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <cfg.icon className={`size-3 ${cfg.color}`} />
                      {cfg.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Live Preview */}
          {announcementEnabled && announcementMessage && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("adminSettings.announcementPreview")}</Label>
              <div className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border ${
                announcementType === "warning" ? "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-200 dark:border-yellow-900/30" :
                announcementType === "error" ? "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-200 dark:border-red-900/30" :
                announcementType === "success" ? "bg-green-50 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-200 dark:border-green-900/30" :
                "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-900/30"
              }`}>
                {(() => {
                  const cfg = typeConfig[announcementType as keyof typeof typeConfig] || typeConfig.info;
                  return <cfg.icon className="size-4 shrink-0" />;
                })()}
                <span>{announcementMessage}</span>
              </div>
            </div>
          )}

          <Button onClick={handleSaveAnnouncement} size="sm">{t("adminSettings.saveAnnouncement")}</Button>
        </CardContent>
      </Card>

      {/* Feature Toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ToggleLeft className="size-5" /> {t("adminSettings.featureToggles")}
          </CardTitle>
          <CardDescription>{t("adminSettings.featureTogglesDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y border-t">
            {toggles.map((toggle) => (
              <div key={toggle.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{toggle.module_path}</span>
                    {toggle.is_enabled ? (
                      <Badge className="h-4 text-[10px] bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        {t("common.enabled")}
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="h-4 text-[10px]">{t("common.disabled")}</Badge>
                    )}
                  </div>
                  {!toggle.is_enabled && (
                    <Input
                      value={toggle.disabled_message}
                      onChange={(e) => {
                        setToggles(prev => prev.map(t => t.id === toggle.id ? { ...t, disabled_message: e.target.value } : t));
                      }}
                      onBlur={() => handleUpdateDisabledMessage(toggle, toggle.disabled_message)}
                      className="mt-2 h-7 text-xs"
                      placeholder={t("adminSettings.disabledPlaceholder")}
                    />
                  )}
                </div>
                <Switch
                  checked={toggle.is_enabled}
                  onCheckedChange={() => handleToggleFeature(toggle)}
                />
              </div>
            ))}
            {toggles.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">{t("adminSettings.noToggles")}</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
