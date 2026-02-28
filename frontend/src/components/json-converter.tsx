"use client";

import { useState } from "react";
import { ArrowRightLeft, Copy, Check } from "lucide-react";
import yaml from "js-yaml";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface JsonConverterProps {
  input: string;
  onInputChange: (value: string) => void;
}

export function JsonConverter({ input, onInputChange }: JsonConverterProps) {
  const [output, setOutput] = useState("");
  const [direction, setDirection] = useState<"json-to-yaml" | "yaml-to-json">("json-to-yaml");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleConvert = () => {
    if (!input.trim()) {
      setOutput("");
      setError(null);
      return;
    }

    try {
      setError(null);
      if (direction === "json-to-yaml") {
        const parsed = JSON.parse(input);
        setOutput(
          yaml.dump(parsed, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
          })
        );
      } else {
        const parsed = yaml.load(input);
        setOutput(JSON.stringify(parsed, null, 2));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed");
      setOutput("");
    }
  };

  const handleToggleDirection = () => {
    setDirection((prev) =>
      prev === "json-to-yaml" ? "yaml-to-json" : "json-to-yaml"
    );
    setOutput("");
    setError(null);
  };

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={handleToggleDirection}>
          <ArrowRightLeft className="mr-2 size-4" />
          {direction === "json-to-yaml" ? "JSON \u2192 YAML" : "YAML \u2192 JSON"}
        </Button>
        <Button size="sm" onClick={handleConvert}>
          Convert
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {direction === "json-to-yaml" ? "JSON Input" : "YAML Input"}
          </label>
          <Textarea
            placeholder={
              direction === "json-to-yaml"
                ? "Paste JSON here..."
                : "Paste YAML here..."
            }
            className="min-h-[300px] font-mono text-sm"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              {direction === "json-to-yaml" ? "YAML Output" : "JSON Output"}
            </label>
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
            placeholder="Converted output will appear here..."
            className="min-h-[300px] font-mono text-sm"
            value={output}
            readOnly
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
