import React, { useState } from "react";
import { useGetExpenseSummary } from "@workspace/api-client-react";
import { AddExpenseForm } from "@/components/dashboard/add-expense-form";
import { ExpensesTable } from "@/components/dashboard/expenses-table";
import { BudgetCard } from "@/components/dashboard/budget-card";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ExpenseChart } from "@/components/dashboard/expense-chart";
import { MonthlySummary } from "@/components/dashboard/monthly-summary";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Wallet } from "lucide-react";

export default function Home() {
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>(undefined);
  
  const { data: summary, isLoading: isLoadingSummary } = useGetExpenseSummary(
    selectedMonth ? { month: selectedMonth } : undefined
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <Wallet className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Smart Expense Tracker</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Select 
              value={selectedMonth || "all"} 
              onValueChange={(val) => setSelectedMonth(val === "all" ? undefined : val)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                {summary?.monthlyTotals?.map(m => (
                  <SelectItem key={m.month} value={m.month}>
                    {new Date(m.month + "-01").toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-8 space-y-8">
        {summary?.budgetExceeded && (
          <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 animate-in fade-in slide-in-from-top-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Budget Exceeded</AlertTitle>
            <AlertDescription>
              You have exceeded your budget limit of ${summary.budgetLimit?.toFixed(2)}. Consider cutting back on expenses.
            </AlertDescription>
          </Alert>
        )}

        <StatsCards summary={summary} isLoading={isLoadingSummary} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <ExpensesTable selectedMonth={selectedMonth} />
          </div>
          <div className="space-y-8">
            <AddExpenseForm />
            <BudgetCard summary={summary} />
            <ExpenseChart summary={summary} />
            <MonthlySummary summary={summary} />
          </div>
        </div>
      </main>
    </div>
  );
}
