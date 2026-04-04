import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, PieChart, Info, CreditCard } from "lucide-react";
import type { ExpenseSummary } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";

export function StatsCards({ summary, isLoading }: { summary?: ExpenseSummary, isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1,2,3,4].map(i => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  const totalCount = summary?.categoryBreakdown?.reduce((acc, c) => acc + c.count, 0) || 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="hover-elevate transition-all">
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Spending</p>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingDown className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight">
            {formatCurrency(summary?.totalSpending ?? 0)}
          </div>
        </CardContent>
      </Card>

      <Card className="hover-elevate transition-all">
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Top Category</p>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <PieChart className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight mt-1 truncate">
            {summary?.topCategory || "None"}
          </div>
        </CardContent>
      </Card>

      <Card className="hover-elevate transition-all">
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Transactions</p>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight">
            {totalCount}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-primary text-primary-foreground hover-elevate transition-all border-none">
        <CardContent className="p-6 h-full flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <Info className="h-4 w-4" />
            <span className="text-sm font-medium">Smart Insight</span>
          </div>
          <p className="text-sm leading-relaxed font-medium">
            {summary?.insight || "Add more expenses to get insights on your spending habits."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
