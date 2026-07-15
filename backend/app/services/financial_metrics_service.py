"""WealthWise AI - Financial Metrics Service"""

import math
from collections import defaultdict
from decimal import Decimal
from typing import Optional, Sequence
from uuid import UUID

from app.models.transaction import Transaction
from app.repositories.transaction_repository import TransactionRepository
from app.schemas.financial_metrics_schema import FinancialMetrics


class FinancialMetricsService:
    def __init__(self, transaction_repo: TransactionRepository) -> None:
        self._txn_repo = transaction_repo

    async def get_metrics(
        self, user_id: UUID, statement_id: Optional[UUID] = None
    ) -> FinancialMetrics:
        """Fetch transactions from database and compute metrics."""
        if statement_id:
            transactions = await self._txn_repo.get_by_statement(statement_id)
        else:
            transactions, _ = await self._txn_repo.get_by_user_filtered(
                user_id=user_id,
                limit=100000,  # Arbitrarily large limit to retrieve all transactions
            )

        return self.compute_metrics_from_transactions(transactions)

    def compute_metrics_from_transactions(
        self, transactions: Sequence[Transaction]
    ) -> FinancialMetrics:
        """Perform transactional aggregation to compile FinancialMetrics."""
        if not transactions:
            return FinancialMetrics(
                total_income=Decimal("0.0"),
                total_expenses=Decimal("0.0"),
                net_cash_flow=Decimal("0.0"),
                savings_rate=Decimal("0.0"),
                transaction_count=0,
                credit_count=0,
                debit_count=0,
                avg_transaction_amount=Decimal("0.0"),
                largest_credit=Decimal("0.0"),
                largest_debit=Decimal("0.0"),
                top_spending_category=None,
                top_spending_category_ratio=Decimal("0.0"),
                top_income_category=None,
                spending_categories_count=0,
                income_months_count=0,
                income_coefficient_of_variation=None,
            )

        total_income = Decimal("0.0")
        total_expenses = Decimal("0.0")
        credit_count = 0
        debit_count = 0
        largest_credit = Decimal("0.0")
        largest_debit = Decimal("0.0")
        total_amount_sum = Decimal("0.0")

        spending_cat_totals = defaultdict(Decimal)
        income_cat_totals = defaultdict(Decimal)

        # Monthly grouping for CV calculation
        monthly_incomes_dict = defaultdict(Decimal)
        unique_months = set()

        for t in transactions:
            amount = t.amount
            total_amount_sum += amount
            year_month = (t.date.year, t.date.month)
            unique_months.add(year_month)

            if t.transaction_type == "credit":
                total_income += amount
                credit_count += 1
                largest_credit = max(largest_credit, amount)
                if t.category:
                    income_cat_totals[t.category] += amount
                monthly_incomes_dict[year_month] += amount
            elif t.transaction_type == "debit":
                total_expenses += amount
                debit_count += 1
                largest_debit = max(largest_debit, amount)
                if t.category:
                    spending_cat_totals[t.category] += amount

        net_cash_flow = total_income - total_expenses

        if total_income > 0:
            savings_rate = (net_cash_flow / total_income) * Decimal("100.0")
        else:
            savings_rate = Decimal("-100.0") if total_expenses > 0 else Decimal("0.0")

        transaction_count = len(transactions)
        avg_transaction_amount = (
            total_amount_sum / Decimal(str(transaction_count))
            if transaction_count > 0
            else Decimal("0.0")
        )

        top_spending_category = (
            max(spending_cat_totals, key=spending_cat_totals.get)
            if spending_cat_totals
            else None
        )
        top_income_category = (
            max(income_cat_totals, key=income_cat_totals.get)
            if income_cat_totals
            else None
        )

        top_spending_cat_amt = (
            spending_cat_totals[top_spending_category]
            if top_spending_category
            else Decimal("0.0")
        )
        top_spending_category_ratio = (
            top_spending_cat_amt / total_expenses
            if total_expenses > 0
            else Decimal("0.0")
        )

        spending_categories_count = len(spending_cat_totals)
        income_months_count = len(unique_months)
        monthly_incomes = [monthly_incomes_dict[m] for m in unique_months]

        income_cv = None
        if income_months_count > 1 and total_income > 0:
            float_incomes = [float(v) for v in monthly_incomes]
            mean_inc = sum(float_incomes) / len(float_incomes)
            if mean_inc > 0:
                var = sum((x - mean_inc) ** 2 for x in float_incomes) / len(
                    float_incomes
                )
                std = math.sqrt(var)
                income_cv = Decimal(str(round(std / mean_inc, 4)))
            else:
                income_cv = Decimal("0.0")
        elif income_months_count > 1:
            income_cv = Decimal("0.0")

        return FinancialMetrics(
            total_income=total_income,
            total_expenses=total_expenses,
            net_cash_flow=net_cash_flow,
            savings_rate=savings_rate,
            transaction_count=transaction_count,
            credit_count=credit_count,
            debit_count=debit_count,
            avg_transaction_amount=avg_transaction_amount,
            largest_credit=largest_credit,
            largest_debit=largest_debit,
            top_spending_category=top_spending_category,
            top_spending_category_ratio=top_spending_category_ratio,
            top_income_category=top_income_category,
            spending_categories_count=spending_categories_count,
            income_months_count=income_months_count,
            income_coefficient_of_variation=income_cv,
        )
