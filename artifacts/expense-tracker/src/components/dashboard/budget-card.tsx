import { useState, useEffect } from "react";
import { useSetBudget, getGetExpenseSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Target, Loader2 } from "lucide-react";
import type { ExpenseSummary } from "@workspace/api-client-react";

export function BudgetCard({ summary }: { summary?: ExpenseSummary }) {
  const [isEditing, setIsEditing] = useState(false);
  const [budgetVal, setBudgetVal] = useState("");
  const setBudget = useSetBudget();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (summary?.budgetLimit) {
      setBudgetVal(summary.budgetLimit.toString());
    }
  }, [summary?.budgetLimit]);

  const handleSave = () => {
    const val = parseFloat(budgetVal);
    if (isNaN(val) || val <= 0) {
      toast({ title: "Invalid budget", variant: "destructive" });
      return;
    }
    
    setBudget.mutate(
      { data: { limit: val } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetExpenseSummaryQueryKey() });
          setIsEditing(false);
          toast({ title: "Budget updated" });
        },
        onError: () => {
          toast({ title: "Failed to update budget", variant: "destructive" });
        }
      }
    );
  };

  const limit = summary?.budgetLimit || 0;
  const spent = summary?.totalSpending || 0;
  const remaining = summary?.remainingBudget || 0;
  const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Monthly Budget
          </CardTitle>
          {!isEditing && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              {limit > 0 ? "Edit" : "Set Budget"}
            </Button>
          )}
        </div>
        <CardDescription>Track spending against your limit</CardDescription>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="flex items-center gap-2 mt-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
              <Input 
                type="number" 
                value={budgetVal} 
                onChange={(e) => setBudgetVal(e.target.value)} 
                className="pl-7"
                placeholder="0.00"
                autoFocus
              />
            </div>
            <Button onClick={handleSave} disabled={setBudget.isPending}>
              {setBudget.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </Button>
            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
          </div>
        ) : limit > 0 ? (
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-bold">${spent.toFixed(2)}</span>
                <span className="text-muted-foreground text-sm ml-1">/ ${limit.toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className={`text-sm font-medium ${summary?.budgetExceeded ? 'text-destructive' : 'text-primary'}`}>
                  ${Math.abs(remaining).toFixed(2)} {summary?.budgetExceeded ? 'over' : 'left'}
                </span>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Progress value={percent} className={`h-2 ${summary?.budgetExceeded ? '*:bg-destructive' : ''}`} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>{percent.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">No budget set for this month</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
