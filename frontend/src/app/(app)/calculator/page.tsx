"use client";

import { Calculator as CalculatorIcon, Trash2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CalculatorDisplay } from "@/components/calculator-display";
import { CalculatorSkeleton } from "@/components/skeletons";
import { useCalculator } from "@/hooks/use-calculator";
import { toast } from "sonner";

export default function CalculatorPage() {
  const { history, loading, error, calculate, deleteEntry, clearHistory, refetch } =
    useCalculator();

  const handleDelete = async (id: string) => {
    try {
      await deleteEntry(id);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete entry"
      );
    }
  };

  const handleClear = async () => {
    try {
      await clearHistory();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to clear history"
      );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Calculator</h2>
          <p className="mt-1 text-muted-foreground">
            Developer-friendly calculator with persistent history.
          </p>
        </div>
        <CalculatorSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Calculator</h2>
        <p className="mt-1 text-muted-foreground">
          Developer-friendly calculator with persistent history.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p>{error}</p>
          <button
            onClick={refetch}
            className="mt-2 text-sm font-medium underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <CalculatorDisplay onCalculate={calculate} />

        <Card className="gap-0 py-0">
          <CardHeader className="flex-row items-center justify-between px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="size-4" />
              History
            </CardTitle>
            {history.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all history?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all calculation history. This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClear}>
                      Clear
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalculatorIcon className="mb-3 size-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No calculations yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your history will appear here.
                </p>
              </div>
            ) : (
              <div className="max-h-[400px] space-y-1 overflow-y-auto">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="group flex items-center justify-between rounded-md px-2 py-2 hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium tabular-nums">
                        {entry.expression}
                      </p>
                      <p className="truncate text-xs text-muted-foreground tabular-nums">
                        = {entry.result}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 opacity-0 group-hover:opacity-100"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
