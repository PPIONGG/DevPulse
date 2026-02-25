"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactCrop, {
  type Crop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useAuth } from "@/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
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
import { Camera } from "lucide-react";

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
  const { user, profile, refreshProfile } = useAuth();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
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

    setUploading(true);
    setMessage(null);

    const blob = await getCroppedBlob(imgRef.current, crop);
    if (!blob) {
      setMessage({ type: "error", text: "Failed to crop image." });
      setUploading(false);
      return;
    }

    const filePath = `${user.id}/avatar.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, blob, {
        upsert: true,
        contentType: "image/jpeg",
      });

    if (uploadError) {
      setMessage({ type: "error", text: uploadError.message });
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    const freshUrl = `${publicUrl}?t=${Date.now()}`;
    setAvatarUrl(freshUrl);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: freshUrl, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (updateError) {
      setMessage({ type: "error", text: updateError.message });
    } else {
      await refreshProfile();
      setMessage({ type: "success", text: "Avatar updated." });
    }

    setImageSrc(null);
    setUploading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      await refreshProfile();
      setMessage({ type: "success", text: "Profile saved." });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="mt-2 text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your public profile information.</CardDescription>
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
                    ? "Uploading..."
                    : "Click the camera icon to change"}
                </div>
              </div>

              {/* Crop UI */}
              {imageSrc && (
                <div className="space-y-3 rounded-md border p-3">
                  <p className="text-sm font-medium">
                    Crop your photo (drag to adjust)
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
                      {uploading ? "Uploading..." : "Save Photo"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setImageSrc(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user?.email ?? ""}
                disabled
                className="bg-muted"
              />
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
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
    </div>
  );
}
