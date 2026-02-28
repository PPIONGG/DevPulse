"use client";

import { useState } from "react";
import { Copy, Check, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/providers/language-provider";

interface ValidationResult {
  valid: boolean;
  error?: string;
  line?: number;
  column?: number;
}

function validateJson(input: string): ValidationResult {
  if (!input.trim()) return { valid: true };
  try {
    JSON.parse(input);
    return { valid: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid JSON";
    const posMatch = message.match(/position (\d+)/);
    if (posMatch) {
      const pos = parseInt(posMatch[1]);
      const lines = input.slice(0, pos).split("\n");
      return {
        valid: false,
        error: message,
        line: lines.length,
        column: lines[lines.length - 1].length + 1,
      };
    }
    return { valid: false, error: message };
  }
}

interface JsonFormatterProps {
  input: string;
  onInputChange: (value: string) => void;
}

export function JsonFormatter({ input, onInputChange }: JsonFormatterProps) {
  const { t } = useTranslation();
  const [output, setOutput] = useState("");
  const [indent, setIndent] = useState<number | string>(2);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFormat = () => {
    if (!input.trim()) return;
    const result = validateJson(input);
    setValidation(result);
    if (result.valid) {
      try {
        const parsed = JSON.parse(input);
        const indentValue = indent === "tab" ? "\t" : indent;
        setOutput(JSON.stringify(parsed, null, indentValue));
      } catch {
        // already handled by validation
      }
    }
  };

  const handleMinify = () => {
    if (!input.trim()) return;
    const result = validateJson(input);
    setValidation(result);
    if (result.valid) {
      try {
        const parsed = JSON.parse(input);
        setOutput(JSON.stringify(parsed));
      } catch {
        // already handled by validation
      }
    }
  };

  const handleValidate = () => {
    if (!input.trim()) {
      setValidation(null);
      return;
    }
    setValidation(validateJson(input));
  };

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("jsonTools.input")}</label>
          <Textarea
            placeholder={t("jsonTools.inputPlaceholder")}
            className="min-h-[300px] font-mono text-sm"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{t("jsonTools.output")}</label>
            {output && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="size-4 text-green-500" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            )}
          </div>
          <Textarea
            placeholder={t("jsonTools.outputPlaceholder")}
            className="min-h-[300px] font-mono text-sm"
            value={output}
            readOnly
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-muted-foreground">{t("jsonTools.indent")}</span>
          {[2, 4, "tab"].map((val) => (
            <Button
              key={String(val)}
              variant={indent === val ? "default" : "outline"}
              size="sm"
              onClick={() => setIndent(val)}
            >
              {val === "tab" ? t("jsonTools.tab") : val}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleFormat}>
            {t("jsonTools.format")}
          </Button>
          <Button size="sm" variant="outline" onClick={handleMinify}>
            {t("jsonTools.minify")}
          </Button>
          <Button size="sm" variant="outline" onClick={handleValidate}>
            {t("jsonTools.validate")}
          </Button>
        </div>

        {validation && input.trim() && (
          <div className="flex items-center gap-1.5 text-sm">
            {validation.valid ? (
              <>
                <CheckCircle2 className="size-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400">{t("jsonTools.validJson")}</span>
              </>
            ) : (
              <>
                <XCircle className="size-4 text-red-500" />
                <span className="text-red-600 dark:text-red-400">
                  {validation.error}
                  {validation.line && ` (${t("jsonTools.line")} ${validation.line}, ${t("jsonTools.col")} ${validation.column})`}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
