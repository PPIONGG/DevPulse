"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/providers/language-provider";
import type { KeyValuePair } from "@/lib/types/database";

interface ApiKeyValueEditorProps {
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

export function ApiKeyValueEditor({
  pairs,
  onChange,
  keyPlaceholder,
  valuePlaceholder,
}: ApiKeyValueEditorProps) {
  const { t } = useTranslation();
  const resolvedKeyPlaceholder = keyPlaceholder ?? t("apiPlayground.keyPlaceholder");
  const resolvedValuePlaceholder = valuePlaceholder ?? t("apiPlayground.valuePlaceholder");
  const updatePair = (index: number, field: keyof KeyValuePair, value: string | boolean) => {
    const updated = pairs.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    );
    onChange(updated);
  };

  const addPair = () => {
    onChange([...pairs, { key: "", value: "", enabled: true }]);
  };

  const removePair = (index: number) => {
    onChange(pairs.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {pairs.map((pair, index) => (
        <div key={index} className="flex items-center gap-2">
          <Checkbox
            checked={pair.enabled}
            onCheckedChange={(checked) =>
              updatePair(index, "enabled", checked === true)
            }
          />
          <Input
            placeholder={resolvedKeyPlaceholder}
            value={pair.key}
            onChange={(e) => updatePair(index, "key", e.target.value)}
            className="h-8 text-sm"
          />
          <Input
            placeholder={resolvedValuePlaceholder}
            value={pair.value}
            onChange={(e) => updatePair(index, "value", e.target.value)}
            className="h-8 text-sm"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={() => removePair(index)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        onClick={addPair}
      >
        <Plus className="mr-1 size-3" />
        {t("common.add")}
      </Button>
    </div>
  );
}
