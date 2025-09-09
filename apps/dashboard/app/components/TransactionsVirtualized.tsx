'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, formatDate, formatTransactionId } from '../utils/formatters';
import { Transaction } from '../store/useStore';

interface TransactionsVirtualizedProps {
  transactions: Transaction[];
}

export default function TransactionsVirtualized({ transactions }: TransactionsVirtualizedProps) {
  const [displayTransactions, setDisplayTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Cargar transacciones reales del ledger
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/v1/ledger/transactions?limit=50');
        if (response.ok) {
          const data = await response.json();
          setDisplayTransactions(data.transactions || []);
        } else {
          setDisplayTransactions([]);
        }
      } catch (err) {
        setDisplayTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (displayTransactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay transacciones disponibles
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {displayTransactions.map((transaction, index) => (
        <div
          key={transaction.id || index}
          className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-brand/20 rounded-full flex items-center justify-center">
                                   <span className="text-xs font-medium text-brand">
                   T
                 </span>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                                                 <div className="flex items-center justify-between">
                  <div className="text-sm font-medium truncate">
                    {transaction.fromAccount} → {transaction.toAccount}
                  </div>
                  <div className="text-sm font-semibold">
                    {formatCurrency(transaction.amount, transaction.currency || 'EUR')}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <div className="text-xs text-muted-foreground truncate">
                    {transaction.description || 'Sin referencia'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(transaction.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
                         <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
               Completada
             </div>
          </div>
        </div>
      ))}
    </div>
  );
}
