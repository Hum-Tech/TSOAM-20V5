import React from 'react';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface BudgetProgressProps {
  budget: number;
  spent: number;
  className?: string;
  showDetails?: boolean;
}

export function BudgetProgress({
  budget,
  spent,
  className = "",
  showDetails = true
}: BudgetProgressProps) {
  const remaining = budget - spent;
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;
  const isOverBudget = spent > budget;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  if (budget === 0) {
    return (
      <div className={`text-center text-muted-foreground text-sm ${className}`}>
        No budget set
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium flex items-center gap-1">
          <DollarSign className="h-3 w-3" />
          Budget Status
        </span>
        <span className={`text-sm font-semibold flex items-center gap-1 ${
          isOverBudget ? 'text-red-600' : 'text-green-600'
        }`}>
          {isOverBudget ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {percentage.toFixed(1)}%
        </span>
      </div>

      <Progress
        value={Math.min(percentage, 100)}
        className={`h-2 ${isOverBudget ? '[&>[data-state="complete"]]:bg-red-500' : '[&>[data-state="complete"]]:bg-green-500'}`}
      />

      {showDetails && (
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="text-muted-foreground">Budget</div>
            <div className="font-semibold text-blue-600">
              {formatCurrency(budget)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Spent</div>
            <div className="font-semibold text-orange-600">
              {formatCurrency(spent)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Remaining</div>
            <div className={`font-semibold ${
              remaining >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(remaining)}
            </div>
          </div>
        </div>
      )}

      {isOverBudget && (
        <div className="text-xs text-red-600 text-center bg-red-50 p-1 rounded">
          Over budget by {formatCurrency(Math.abs(remaining))}
        </div>
      )}
    </div>
  );
}

export default BudgetProgress;
