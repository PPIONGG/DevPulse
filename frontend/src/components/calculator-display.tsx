"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface CalculatorDisplayProps {
  onCalculate: (expression: string, result: string) => Promise<unknown>;
}

const BUTTONS = [
  ["C", "⌫", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "−"],
  ["1", "2", "3", "+"],
  ["0", ".", "()", "="],
];

function sanitizeExpression(expr: string): string {
  return expr
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-");
}

function isValidExpression(expr: string): boolean {
  return /^[0-9+\-*/.()% ]+$/.test(expr);
}

function formatResult(value: number): string {
  if (!isFinite(value)) return "Error";
  if (Number.isInteger(value) && Math.abs(value) < 1e15) {
    return value.toString();
  }
  const str = value.toPrecision(10);
  return parseFloat(str).toString();
}

export function CalculatorDisplay({ onCalculate }: CalculatorDisplayProps) {
  const [display, setDisplay] = useState("0");
  const [previousResult, setPreviousResult] = useState<string | null>(null);
  const [hasResult, setHasResult] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const evaluate = useCallback(async () => {
    const sanitized = sanitizeExpression(display);
    if (!isValidExpression(sanitized)) {
      setDisplay("Error");
      setHasResult(true);
      return;
    }
    try {
      const fn = new Function(`"use strict"; return (${sanitized});`);
      const value = fn();
      if (typeof value !== "number") {
        setDisplay("Error");
        setHasResult(true);
        return;
      }
      const result = formatResult(value);
      setPreviousResult(`${display} =`);
      setDisplay(result);
      setHasResult(true);
      try {
        await onCalculate(display, result);
      } catch {
        toast.error("Failed to save calculation");
      }
    } catch {
      setDisplay("Error");
      setHasResult(true);
    }
  }, [display, onCalculate]);

  const handleInput = useCallback(
    (value: string) => {
      switch (value) {
        case "C":
          setDisplay("0");
          setPreviousResult(null);
          setHasResult(false);
          break;
        case "⌫":
          if (hasResult) {
            setDisplay("0");
            setHasResult(false);
          } else {
            setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));
          }
          break;
        case "=":
          if (display !== "0" && display !== "Error") {
            evaluate();
          }
          break;
        case "()": {
          if (hasResult) {
            setDisplay("(");
            setHasResult(false);
            break;
          }
          const openCount = (display.match(/\(/g) || []).length;
          const closeCount = (display.match(/\)/g) || []).length;
          const lastChar = display[display.length - 1];
          if (
            openCount <= closeCount ||
            lastChar === "(" ||
            ["+", "−", "×", "÷", "%"].includes(lastChar)
          ) {
            setDisplay((prev) => (prev === "0" ? "(" : prev + "("));
          } else {
            setDisplay((prev) => prev + ")");
          }
          break;
        }
        default: {
          const operators = ["+", "−", "×", "÷", "%"];
          const isOperator = operators.includes(value);

          if (hasResult && !isOperator) {
            setDisplay(value === "." ? "0." : value);
            setHasResult(false);
          } else if (hasResult && isOperator) {
            setDisplay((prev) => prev + value);
            setHasResult(false);
          } else if (display === "0" && !isOperator && value !== ".") {
            setDisplay(value);
          } else if (display === "0" && value === ".") {
            setDisplay("0.");
          } else {
            setDisplay((prev) => prev + value);
          }
        }
      }
    },
    [display, hasResult, evaluate]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      const key = e.key;
      if (key >= "0" && key <= "9") {
        e.preventDefault();
        handleInput(key);
      } else if (key === "+" || key === "-" || key === "*" || key === "/") {
        e.preventDefault();
        const map: Record<string, string> = {
          "+": "+",
          "-": "−",
          "*": "×",
          "/": "÷",
        };
        handleInput(map[key]);
      } else if (key === "." || key === "%") {
        e.preventDefault();
        handleInput(key);
      } else if (key === "(" || key === ")") {
        e.preventDefault();
        handleInput("()");
      } else if (key === "Enter" || key === "=") {
        e.preventDefault();
        handleInput("=");
      } else if (key === "Escape") {
        e.preventDefault();
        handleInput("C");
      } else if (key === "Backspace") {
        e.preventDefault();
        handleInput("⌫");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleInput]);

  function getButtonVariant(
    btn: string
  ): "default" | "secondary" | "outline" | "ghost" {
    if (btn === "=") return "default";
    if (["C", "⌫", "%", "÷", "×", "−", "+", "()"].includes(btn))
      return "secondary";
    return "outline";
  }

  return (
    <Card ref={containerRef} className="gap-0 overflow-hidden py-0">
      <div className="border-b bg-muted/30 px-4 py-4">
        {previousResult && (
          <div className="mb-1 truncate text-right text-sm text-muted-foreground">
            {previousResult}
          </div>
        )}
        <div className="truncate text-right text-3xl font-semibold tabular-nums">
          {display}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 p-3">
        {BUTTONS.flat().map((btn) => (
          <Button
            key={btn}
            variant={getButtonVariant(btn)}
            className={`h-12 text-lg font-medium ${btn === "⌫" ? "text-base" : ""}`}
            onClick={() => handleInput(btn)}
          >
            {btn === "⌫" ? <Delete className="size-5" /> : btn}
          </Button>
        ))}
      </div>
    </Card>
  );
}
