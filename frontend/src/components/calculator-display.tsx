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

// --- Safe expression evaluator using recursive descent parsing ---

type Token =
  | { type: "num"; value: number }
  | { type: "op"; value: "+" | "-" | "*" | "/" }
  | { type: "%" }
  | { type: "(" }
  | { type: ")" };

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (ch === " ") {
      i++;
      continue;
    }
    if ((ch >= "0" && ch <= "9") || ch === ".") {
      let num = "";
      while (
        i < expr.length &&
        ((expr[i] >= "0" && expr[i] <= "9") || expr[i] === ".")
      ) {
        num += expr[i++];
      }
      tokens.push({ type: "num", value: parseFloat(num) });
      continue;
    }
    switch (ch) {
      case "+":
        tokens.push({ type: "op", value: "+" });
        break;
      case "-":
        tokens.push({ type: "op", value: "-" });
        break;
      case "*":
        tokens.push({ type: "op", value: "*" });
        break;
      case "/":
        tokens.push({ type: "op", value: "/" });
        break;
      case "%":
        tokens.push({ type: "%" });
        break;
      case "(":
        tokens.push({ type: "(" });
        break;
      case ")":
        tokens.push({ type: ")" });
        break;
      default:
        throw new Error("Invalid character");
    }
    i++;
  }
  return tokens;
}

function safeEvaluate(rawExpr: string): number {
  let expr = rawExpr.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");

  // Strip trailing operators
  expr = expr.replace(/[+\-*/]+$/, "");
  if (!expr) throw new Error("Empty expression");

  // Auto-close unclosed parentheses
  const openCount = (expr.match(/\(/g) || []).length;
  const closeCount = (expr.match(/\)/g) || []).length;
  expr += ")".repeat(Math.max(0, openCount - closeCount));

  // Implicit multiplication: 2( → 2*(, )( → )*(, )2 → )*2, %( → %*(, %2 → %*2
  expr = expr
    .replace(/(\d)\(/g, "$1*(")
    .replace(/\)\(/g, ")*(")
    .replace(/\)(\d)/g, ")*$1")
    .replace(/%\(/g, "%*(")
    .replace(/%(\d)/g, "%*$1");

  const tokens = tokenize(expr);
  if (tokens.length === 0) throw new Error("Empty expression");

  let pos = 0;
  const peek = (): Token | undefined => tokens[pos];
  const consume = (): Token => tokens[pos++];

  // Grammar:
  //   expression = term (('+' | '-') term)*
  //   term       = factor (('*' | '/') factor)*
  //   factor     = unary ('%')*          ← postfix percentage (÷100)
  //   unary      = ('-' | '+') unary | atom
  //   atom       = NUMBER | '(' expression ')'

  function parseExpression(): number {
    let left = parseTerm();
    while (pos < tokens.length) {
      const t = peek();
      if (t?.type === "op" && (t.value === "+" || t.value === "-")) {
        const op = consume() as { type: "op"; value: "+" | "-" };
        const right = parseTerm();
        left = op.value === "+" ? left + right : left - right;
      } else break;
    }
    return left;
  }

  function parseTerm(): number {
    let left = parseFactor();
    while (pos < tokens.length) {
      const t = peek();
      if (t?.type === "op" && (t.value === "*" || t.value === "/")) {
        const op = consume() as { type: "op"; value: "*" | "/" };
        const right = parseFactor();
        left = op.value === "*" ? left * right : left / right;
      } else break;
    }
    return left;
  }

  function parseFactor(): number {
    let value = parseUnary();
    while (pos < tokens.length && peek()?.type === "%") {
      consume();
      value /= 100;
    }
    return value;
  }

  function parseUnary(): number {
    const t = peek();
    if (t?.type === "op" && t.value === "-") {
      consume();
      return -parseUnary();
    }
    if (t?.type === "op" && t.value === "+") {
      consume();
      return parseUnary();
    }
    return parseAtom();
  }

  function parseAtom(): number {
    const t = peek();
    if (!t) throw new Error("Unexpected end");
    if (t.type === "num") {
      consume();
      return t.value;
    }
    if (t.type === "(") {
      consume();
      const value = parseExpression();
      if (pos < tokens.length && peek()?.type === ")") consume();
      return value;
    }
    throw new Error("Unexpected token");
  }

  const result = parseExpression();
  if (pos < tokens.length) throw new Error("Unexpected token");
  if (!isFinite(result)) throw new Error("Result is not finite");
  return result;
}

function formatResult(value: number): string {
  if (!isFinite(value)) return "Error";
  if (Number.isInteger(value) && Math.abs(value) < 1e15) {
    return value.toString();
  }
  return parseFloat(value.toPrecision(10)).toString();
}

// --- Component ---

export function CalculatorDisplay({ onCalculate }: CalculatorDisplayProps) {
  const [display, setDisplay] = useState("0");
  const [previousResult, setPreviousResult] = useState<string | null>(null);
  const [hasResult, setHasResult] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const evaluate = useCallback(async () => {
    try {
      const value = safeEvaluate(display);
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
      const OPERATORS = ["+", "−", "×", "÷"];

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
            setDisplay((prev) =>
              prev.length > 1 ? prev.slice(0, -1) : "0"
            );
          }
          break;

        case "=":
          if (display !== "0" && display !== "Error") evaluate();
          break;

        case "()": {
          if (hasResult) {
            setDisplay("(");
            setHasResult(false);
            break;
          }
          const openCount = (display.match(/\(/g) || []).length;
          const closeCount = (display.match(/\)/g) || []).length;
          const last = display[display.length - 1];
          if (
            openCount <= closeCount ||
            last === "(" ||
            OPERATORS.includes(last)
          ) {
            setDisplay((prev) => (prev === "0" ? "(" : prev + "("));
          } else {
            setDisplay((prev) => prev + ")");
          }
          break;
        }

        default: {
          const isOp = OPERATORS.includes(value);
          const isPct = value === "%";
          const lastChar = display[display.length - 1];
          const lastIsOp = OPERATORS.includes(lastChar);

          // After Error → start fresh (only digits, dot, or open-paren)
          if (display === "Error") {
            if (isOp || isPct) break;
            setDisplay(value === "." ? "0." : value);
            setHasResult(false);
            break;
          }

          // After a computed result
          if (hasResult) {
            if (isOp || isPct) {
              setDisplay((prev) => prev + value);
            } else {
              setDisplay(value === "." ? "0." : value);
            }
            setHasResult(false);
            break;
          }

          // --- Operators ---
          if (isOp) {
            // Don't start with ×, ÷, + (but − is OK for negative)
            if (display === "0" && value !== "−") break;

            // After open-paren only − is allowed (for negative)
            if (lastChar === "(") {
              if (value === "−") setDisplay((prev) => prev + value);
              break;
            }

            if (lastIsOp) {
              // Allow − after ×, ÷, + for negative numbers
              if (value === "−" && lastChar !== "−") {
                setDisplay((prev) => prev + value);
              } else {
                // Replace trailing operator chain with the new operator
                setDisplay((prev) => {
                  let s = prev;
                  while (s.length > 1 && OPERATORS.includes(s[s.length - 1])) {
                    s = s.slice(0, -1);
                  }
                  return s + value;
                });
              }
            } else {
              setDisplay((prev) => prev + value);
            }
            break;
          }

          // --- Percentage ---
          if (isPct) {
            // Only after digit, ), or %
            if (
              (lastChar >= "0" && lastChar <= "9") ||
              lastChar === ")" ||
              lastChar === "%"
            ) {
              setDisplay((prev) => prev + "%");
            }
            break;
          }

          // --- Decimal point ---
          if (value === ".") {
            // Check if current number already has a decimal
            let currentNum = "";
            for (let j = display.length - 1; j >= 0; j--) {
              const c = display[j];
              if ((c >= "0" && c <= "9") || c === ".") currentNum = c + currentNum;
              else break;
            }
            if (currentNum.includes(".")) break;

            if (display === "0") {
              setDisplay("0.");
            } else if (lastIsOp || lastChar === "(") {
              setDisplay((prev) => prev + "0.");
            } else {
              setDisplay((prev) => prev + ".");
            }
            break;
          }

          // --- Digit ---
          if (display === "0") {
            setDisplay(value);
          } else {
            setDisplay((prev) => prev + value);
          }
        }
      }
    },
    [display, hasResult, evaluate]
  );

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      const key = e.key;
      if (key >= "0" && key <= "9") {
        e.preventDefault();
        handleInput(key);
      } else if ("+-*/".includes(key)) {
        e.preventDefault();
        const map: Record<string, string> = { "+": "+", "-": "−", "*": "×", "/": "÷" };
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

  function getButtonVariant(btn: string): "default" | "secondary" | "outline" {
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
