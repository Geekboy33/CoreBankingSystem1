'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { Balance } from '../store/useStore';
import { ArrowUpIcon, ArrowDownIcon } from '@radix-ui/react-icons';

interface BalanceCardProps {
  balance: Balance;
}

export default function BalanceCard({ balance }: BalanceCardProps) {
  const { currency, amount, change24h, changePercent } = balance;
  const hasChanges = change24h !== 0 || changePercent !== 0;
  const isPositive = changePercent >= 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{currency}</CardTitle>
          {hasChanges && (
            <Badge variant={isPositive ? 'default' : 'destructive'} className="text-xs">
              {isPositive ? <ArrowUpIcon className="w-3 h-3 mr-1" /> : <ArrowDownIcon className="w-3 h-3 mr-1" />}
              {formatPercentage(changePercent)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold">
            {formatCurrency(amount, currency)}
          </div>
          {hasChanges && (
            <div className="text-sm text-muted-foreground">
              <span className={isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {isPositive ? '+' : ''}{formatCurrency(change24h, currency)}
              </span>
              {' '}en las últimas 24h
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
