"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/providers/language-provider";
import { cn } from "@/lib/utils";
import type { Review, ReviewInput } from "@/lib/types/database";

interface ReviewFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review?: Review | null;
  onSubmit: (data: ReviewInput) => Promise<void>;
}

export function ReviewForm({
  open,
  onOpenChange,
  review,
  onSubmit,
}: ReviewFormProps) {
  const { t } = useTranslation();
  const isEditing = !!review;
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(review?.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setRating(review?.rating ?? 0);
      setComment(review?.comment ?? "");
      setHoverRating(0);
      setError(null);
    }
  }, [open, review]);

  const handleOpenChange = (value: boolean) => {
    if (value) {
      setRating(review?.rating ?? 0);
      setComment(review?.comment ?? "");
      setHoverRating(0);
    }
    onOpenChange(value);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ rating, comment });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("marketplace.saveReviewFailed"));
    } finally {
      setSaving(false);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("marketplace.editReviewTitle") : t("marketplace.writeReviewTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>{t("marketplace.formRating")}</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className="p-0.5"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  <Star
                    className={cn(
                      "size-6 transition-colors",
                      value <= displayRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">{t("marketplace.formComment")}</Label>
            <Textarea
              id="comment"
              placeholder={t("marketplace.formCommentPlaceholder")}
              className="min-h-[100px]"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={saving || rating === 0}>
              {saving
                ? t("common.saving")
                : isEditing
                  ? t("marketplace.updateReview")
                  : t("marketplace.submitReview")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
