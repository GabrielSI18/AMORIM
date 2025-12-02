/**
 * Dashboard Loading State
 * 
 * Skeleton específico para o layout do dashboard
 */

import { SkeletonStatsCard, SkeletonCard } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <div className="h-16 border-b border-border bg-background/80 backdrop-blur-xl" />
      
      <main className="pt-24 pb-20">
        <div className="container-custom">
          {/* Welcome Section Skeleton */}
          <div className="mb-12">
            <div className="h-10 w-64 bg-muted rounded animate-pulse mb-2" />
            <div className="h-6 w-48 bg-muted rounded animate-pulse" />
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <SkeletonStatsCard />
            <SkeletonStatsCard />
            <SkeletonStatsCard />
          </div>

          {/* Main Content Skeleton */}
          <SkeletonCard className="h-64" />
        </div>
      </main>
    </div>
  );
}
