import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatCardSkeleton() {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex-row items-center justify-between px-4 py-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-4 rounded" />
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <Skeleton className="h-8 w-12" />
      </CardContent>
    </Card>
  );
}

export function RecentListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-2 px-2 py-1">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="mt-1 text-muted-foreground">
          Welcome to DevPulse. Your developer productivity hub.
        </p>
      </div>

      <StatCardSkeleton />

      <Card className="gap-0 py-0">
        <CardHeader className="flex-row items-center justify-between px-4 py-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <RecentListSkeleton count={3} />
        </CardContent>
      </Card>
    </div>
  );
}

export function SnippetCardSkeleton() {
  return (
    <Card className="gap-0 py-0 overflow-hidden">
      <CardHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
        <Skeleton className="h-5 w-2/3" />
        <div className="flex shrink-0 items-center gap-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="size-8 rounded-md" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="bg-muted/50 px-4 py-3 space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-4/6" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </CardContent>
      <div className="flex flex-wrap gap-1 px-4 py-3">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>
    </Card>
  );
}

export function ExpenseCardSkeleton() {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Skeleton className="h-5 w-2/5" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="size-8 rounded-md" />
        </div>
      </CardHeader>
    </Card>
  );
}

export function HabitCardSkeleton() {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex-row items-start justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Skeleton className="mt-0.5 size-6 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-2/5" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-3/5" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-14" />
            </div>
          </div>
        </div>
        <Skeleton className="size-8 shrink-0 rounded-md" />
      </CardHeader>
      <div className="flex gap-[3px] px-4 pb-3">
        {Array.from({ length: 30 }).map((_, i) => (
          <Skeleton key={i} className="size-3 rounded-sm" />
        ))}
      </div>
    </Card>
  );
}

export function KanbanBoardCardSkeleton() {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Skeleton className="h-5 w-3/5" />
        </div>
        <Skeleton className="size-8 shrink-0 rounded-md" />
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0">
        <Skeleton className="h-4 w-4/5" />
      </CardContent>
    </Card>
  );
}

export function PomodoroStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="gap-0 py-0">
          <CardHeader className="flex-row items-center justify-between px-4 py-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="size-4 rounded" />
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <Skeleton className="h-8 w-10" />
            <Skeleton className="mt-1 h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function VaultCardSkeleton() {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="size-8 rounded-md" />
        </div>
      </CardHeader>
    </Card>
  );
}

export function JsonDocumentCardSkeleton() {
  return (
    <Card className="gap-0 py-0 overflow-hidden">
      <CardHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Skeleton className="h-5 w-2/5" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <Skeleton className="size-8 shrink-0 rounded-md" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="bg-muted/50 px-4 py-3 space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-4/6" />
        </div>
      </CardContent>
      <div className="flex flex-wrap gap-1 px-4 py-3">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>
    </Card>
  );
}

export function CalculatorSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="gap-0 overflow-hidden py-0">
        <div className="border-b bg-muted/30 px-4 py-4">
          <Skeleton className="ml-auto h-4 w-24" />
          <Skeleton className="ml-auto mt-2 h-8 w-32" />
        </div>
        <div className="grid grid-cols-4 gap-1.5 p-3">
          {Array.from({ length: 20 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-md" />
          ))}
        </div>
      </Card>
      <Card className="gap-0 py-0">
        <CardHeader className="flex-row items-center justify-between px-4 py-3">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </CardHeader>
        <CardContent className="space-y-2 px-4 pb-4 pt-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="size-8 rounded-md" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

