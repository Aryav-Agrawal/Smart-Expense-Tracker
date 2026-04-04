import { useState } from "react";
import { useListExpenses, useDeleteExpense, getListExpensesQueryKey, getGetExpenseSummaryQueryKey } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Trash2, Receipt, Loader2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["Food", "Transport", "Shopping", "Entertainment", "Health", "Utilities", "Education", "Other"];

interface ExpensesTableProps {
  selectedMonth?: string;
}

export function ExpensesTable({ selectedMonth }: ExpensesTableProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: expenses, isLoading } = useListExpenses({
    month: selectedMonth,
    category: categoryFilter !== "all" ? categoryFilter : undefined
  });

  const deleteExpense = useDeleteExpense();

  const handleDelete = (id: number) => {
    deleteExpense.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetExpenseSummaryQueryKey() });
          toast({ title: "Expense deleted" });
        },
        onError: () => {
          toast({ title: "Error deleting expense", variant: "destructive" });
        }
      }
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Recent Expenses</CardTitle>
          <CardDescription>Your detailed spending history</CardDescription>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !expenses?.length ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-muted/20 rounded-lg border border-dashed border-border">
            <Receipt className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
            <h3 className="font-medium text-foreground mb-1">No expenses found</h3>
            <p className="text-sm text-muted-foreground">Start adding expenses to see them listed here.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id} className="group">
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {format(new Date(expense.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal text-xs">
                        {expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(expense.id)}
                        disabled={deleteExpense.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
