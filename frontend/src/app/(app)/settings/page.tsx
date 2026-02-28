"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactCrop, {
  type Crop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useAuth } from "@/providers/auth-provider";
import { useProfile } from "@/hooks/use-profile";
import { useAvatarUpload } from "@/hooks/use-avatar-upload";
import { useTranslation } from "@/providers/language-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera } from "lucide-react";
import type { Language } from "@/lib/i18n";

function getCroppedBlob(
  image: HTMLImageElement,
  crop: Crop
): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const size = 256;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    size,
    size
  );

  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { profile, updating, updateProfile } = useProfile();
  const {
    uploadAvatar,
    uploading,
    error: avatarError,
  } = useAvatarUpload();
  const { language, setLanguage, t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  // Crop state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();

  // Sync state when profile loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setAvatarUrl(profile.avatar_url ?? "");
    }
  }, [profile]);

  const initials = displayName
    ? displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "?";

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      const cropInit = centerCrop(
        makeAspectCrop({ unit: "%", width: 80 }, 1, width, height),
        width,
        height
      );
      setCrop(cropInit);
    },
    []
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
    // Reset so same file can be re-selected
    e.target.value = "";
  };

  const handleCropUpload = async () => {
    if (!imgRef.current || !crop || !user) return;

    setMessage(null);

    const blob = await getCroppedBlob(imgRef.current, crop);
    if (!blob) {
      setMessage({ type: "error", text: t("settings.cropFailed") });
      return;
    }

    const freshUrl = await uploadAvatar(blob);
    if (freshUrl) {
      setAvatarUrl(freshUrl);
      setMessage({ type: "success", text: t("settings.avatarUpdated") });
    } else if (avatarError) {
      setMessage({ type: "error", text: avatarError });
    }

    setImageSrc(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setMessage(null);

    try {
      await updateProfile({ display_name: displayName || null });
      setMessage({ type: "success", text: t("settings.profileSaved") });
    } catch {
      setMessage({ type: "error", text: t("settings.profileSaveFailed") });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("settings.title")}</h2>
        <p className="mt-2 text-muted-foreground">
          {t("settings.subtitle")}
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>{t("settings.profile")}</CardTitle>
          <CardDescription>{t("settings.profileDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            {/* Avatar */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage
                      src={avatarUrl}
                      alt="Profile"
                      className="object-cover"
                    />
                    <AvatarFallback className="text-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  {uploading
                    ? t("settings.uploading")
                    : t("settings.avatarHint")}
                </div>
              </div>

              {/* Crop UI */}
              {imageSrc && (
                <div className="space-y-3 rounded-md border p-3">
                  <p className="text-sm font-medium">
                    {t("settings.cropTitle")}
                  </p>
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    aspect={1}
                    circularCrop
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      ref={imgRef}
                      src={imageSrc}
                      alt="Crop preview"
                      onLoad={onImageLoad}
                      className="max-h-64"
                    />
                  </ReactCrop>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleCropUpload}
                      disabled={uploading}
                      size="sm"
                    >
                      {uploading ? t("settings.uploading") : t("settings.savePhoto")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setImageSrc(null)}
                    >
                      {t("settings.cancel")}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="display-name">{t("settings.displayName")}</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t("settings.displayNamePlaceholder")}
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">{t("settings.email")}</Label>
              <Input
                id="email"
                value={user?.email ?? ""}
                disabled
                className="bg-muted"
              />
            </div>

            <Button type="submit" disabled={updating}>
              {updating ? t("settings.saving") : t("settings.saveChanges")}
            </Button>

            {message && (
              <p
                className={`text-sm ${
                  message.type === "error"
                    ? "text-destructive"
                    : "text-green-600"
                }`}
              >
                {message.text}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Language Preference */}
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>{t("settings.language")}</CardTitle>
          <CardDescription>{t("settings.languageDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t("language.en")}</SelectItem>
              <SelectItem value="th">{t("language.th")}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
}
