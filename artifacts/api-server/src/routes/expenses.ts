import { Router, type IRouter } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db, expensesTable, budgetTable } from "@workspace/db";
import {
  AddExpenseBody,
  DeleteExpenseParams,
  ListExpensesQueryParams,
  GetExpenseSummaryQueryParams,
  SetBudgetBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /expenses — list all expenses with optional category/month filter
router.get("/expenses", async (req, res): Promise<void> => {
  const parsed = ListExpensesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { category, month } = parsed.data;

  let expenses = await db
    .select()
    .from(expensesTable)
    .orderBy(desc(expensesTable.date));

  if (category) {
    expenses = expenses.filter((e) => e.category === category);
  }

  if (month) {
    expenses = expenses.filter((e) => e.date.startsWith(month));
  }

  res.json(expenses);
});

// POST /expenses — add a new expense
router.post("/expenses", async (req, res): Promise<void> => {
  const parsed = AddExpenseBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid expense body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [expense] = await db
    .insert(expensesTable)
    .values({
      amount: parsed.data.amount,
      category: parsed.data.category,
      description: parsed.data.description,
      date: parsed.data.date,
    })
    .returning();

  res.status(201).json(expense);
});

// DELETE /expenses/:id — delete an expense by ID
router.delete("/expenses/:id", async (req, res): Promise<void> => {
  const params = DeleteExpenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(expensesTable)
    .where(eq(expensesTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }

  res.sendStatus(204);
});

// GET /expenses/summary — aggregated insights
router.get("/expenses/summary", async (req, res): Promise<void> => {
  const parsed = GetExpenseSummaryQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { month } = parsed.data;

  const currentMonth = new Date().toISOString().slice(0, 7);
  // Budget always operates on a specific month: the selected one or the current calendar month
  const budgetMonth = month ?? currentMonth;

  const allExpenses = await db.select().from(expensesTable);

  // Display stats respect the selected filter:
  //   - "All Time" (no month param) → use ALL expenses
  //   - specific month selected → filter to that month only
  const filteredExpenses = month
    ? allExpenses.filter((e) => e.date.startsWith(month))
    : allExpenses;

  const totalSpending = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryMap: Record<string, { total: number; count: number }> = {};
  for (const e of filteredExpenses) {
    if (!categoryMap[e.category]) {
      categoryMap[e.category] = { total: 0, count: 0 };
    }
    categoryMap[e.category].total += e.amount;
    categoryMap[e.category].count += 1;
  }

  const categoryBreakdown = Object.entries(categoryMap)
    .map(([category, { total, count }]) => ({ category, total, count }))
    .sort((a, b) => b.total - a.total);

  // Monthly totals always span all months (for the bar chart trend view)
  const monthMap: Record<string, { total: number; count: number }> = {};
  for (const e of allExpenses) {
    const m = e.date.slice(0, 7);
    if (!monthMap[m]) {
      monthMap[m] = { total: 0, count: 0 };
    }
    monthMap[m].total += e.amount;
    monthMap[m].count += 1;
  }

  const monthlyTotals = Object.entries(monthMap)
    .map(([month, { total, count }]) => ({ month, total, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const topCategory =
    categoryBreakdown.length > 0 ? categoryBreakdown[0].category : null;

  const insight = topCategory
    ? `You spent the most on ${topCategory}${month ? ` in ${month}` : ""}`
    : "No expenses recorded yet";

  const budgetRows = await db.select().from(budgetTable).limit(1);
  const budgetLimit = budgetRows.length > 0 ? budgetRows[0].limit : null;

  // Budget uses only the budget month's expenses — always month-scoped, never all-time
  const budgetMonthSpending = allExpenses
    .filter((e) => e.date.startsWith(budgetMonth))
    .reduce((sum, e) => sum + e.amount, 0);

  const budgetExceeded = budgetLimit !== null && budgetMonthSpending > budgetLimit;
  const remainingBudget =
    budgetLimit !== null ? budgetLimit - budgetMonthSpending : null;

  res.json({
    totalSpending,
    categoryBreakdown,
    monthlyTotals,
    topCategory,
    insight,
    budgetLimit,
    budgetMonthSpending,
    budgetExceeded,
    remainingBudget,
  });
});

// GET /expenses/budget — get current budget limit
router.get("/expenses/budget", async (req, res): Promise<void> => {
  const budgetRows = await db.select().from(budgetTable).limit(1);
  const limit = budgetRows.length > 0 ? budgetRows[0].limit : null;
  res.json({ limit });
});

// POST /expenses/budget — set budget limit
router.post("/expenses/budget", async (req, res): Promise<void> => {
  const parsed = SetBudgetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const budgetRows = await db.select().from(budgetTable).limit(1);

  if (budgetRows.length > 0) {
    await db
      .update(budgetTable)
      .set({ limit: parsed.data.limit })
      .where(eq(budgetTable.id, budgetRows[0].id));
  } else {
    await db.insert(budgetTable).values({ limit: parsed.data.limit });
  }

  res.json({ limit: parsed.data.limit });
});

export default router;
