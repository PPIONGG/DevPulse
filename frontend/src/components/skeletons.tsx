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

export function WeeklyHoursCardSkeleton() {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex-row items-center gap-2 px-4 py-3">
        <Skeleton className="size-4 rounded" />
        <Skeleton className="h-5 w-28" />
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 space-y-1">
        <Skeleton className="h-9 w-16" />
        <Skeleton className="h-4 w-28" />
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      <WeeklyHoursCardSkeleton />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="gap-0 py-0">
          <CardHeader className="flex-row items-center justify-between px-4 py-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-16" />
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <RecentListSkeleton count={3} />
          </CardContent>
        </Card>
        <Card className="gap-0 py-0">
          <CardHeader className="flex-row items-center justify-between px-4 py-3">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-16" />
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <RecentListSkeleton count={3} />
          </CardContent>
        </Card>
      </div>
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

export function WorkLogCardSkeleton() {
  return (
    <Card className="gap-0 py-0 overflow-hidden">
      <CardHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Skeleton className="h-5 w-20 shrink-0 rounded-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-3 w-8" />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0 space-y-1.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </CardContent>
    </Card>
  );
}

export function ArticleCardSkeleton() {
  return (
    <Card className="gap-0 py-0 overflow-hidden">
      <CardHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="size-8 rounded-md" />
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0 space-y-1.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-3/4" />
      </CardContent>
      <div className="flex flex-wrap gap-1 px-4 py-3">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    </Card>
  );
}

export function BookmarkCardSkeleton() {
  return (
    <Card className="gap-0 py-0 overflow-hidden">
      <CardHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Skeleton className="size-4 shrink-0 rounded" />
          <Skeleton className="h-5 w-2/3" />
        </div>
        <Skeleton className="size-8 rounded-md" />
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </CardContent>
      <div className="flex flex-wrap gap-1 px-4 py-3">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>
    </Card>
  );
}
