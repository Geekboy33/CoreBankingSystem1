'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export default function PromoteStaging() {
  const [isPromoting, setIsPromoting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const promoteStaging = async () => {
    setIsPromoting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/v1/ingest/promote?batch=1000', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al promover datos');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setIsPromoting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Promover Staging → Ledger</h3>
          <p className="text-sm text-muted-foreground">
            Promueve transacciones desde las tablas de staging al libro mayor
          </p>
        </div>
        <Button 
          onClick={promoteStaging} 
          disabled={isPromoting}
          id="promote-btn"
        >
          {isPromoting ? 'Promoviendo...' : 'Promover Datos'}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="text-red-600 dark:text-red-400 font-medium">Error:</div>
          <div className="text-red-500 dark:text-red-300">{error}</div>
        </div>
      )}

      {result && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="text-green-600 dark:text-green-400 font-medium mb-2">
            Promoción completada exitosamente
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Badge variant="default" className="text-xs">
                {result.accountsUpserted || 0} cuentas
              </Badge>
              <Badge variant="default" className="text-xs">
                {result.transactionsPosted || 0} transacciones
              </Badge>
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              {result.accountsUpserted || 0} cuentas actualizadas, {result.transactionsPosted || 0} transacciones promovidas al ledger
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        <p>• Este proceso promueve transacciones desde staging.transactions_raw al ledger</p>
        <p>• Las cuentas se crean automáticamente si no existen</p>
        <p>• Se procesan en lotes de 1000 transacciones por defecto</p>
      </div>
    </div>
  );
}
