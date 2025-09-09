'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { formatCurrency } from '../utils/formatters';

export default function TransferForm() {
  const [formData, setFormData] = useState({
    fromAccount: '',
    toAccount: '',
    amount: '',
    currency: 'EUR',
    reference: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/v1/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({
          fromAccount: formData.fromAccount,
          toAccount: formData.toAccount,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          reference: formData.reference,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        // Limpiar formulario en caso de éxito
        setFormData({
          fromAccount: '',
          toAccount: '',
          amount: '',
          currency: 'EUR',
          reference: ''
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al procesar la transferencia');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Cuenta Origen
            </label>
            <input
              type="text"
              value={formData.fromAccount}
              onChange={(e) => handleInputChange('fromAccount', e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-background"
              placeholder="ES12345678901234567890"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Cuenta Destino
            </label>
            <input
              type="text"
              value={formData.toAccount}
              onChange={(e) => handleInputChange('toAccount', e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-background"
              placeholder="ES09876543210987654321"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Monto
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-background"
              placeholder="1000.00"
              required
            />
          </div>

          <div>
            <label htmlFor="currency-select" className="block text-sm font-medium mb-1">
              Moneda
            </label>
            <select
              id="currency-select"
              value={formData.currency}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-background"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="BRL">BRL</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Referencia
            </label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => handleInputChange('reference', e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-background"
              placeholder="Transferencia mensual"
            />
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Procesando...' : 'Realizar Transferencia'}
        </Button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="text-red-600 dark:text-red-400 font-medium">Error:</div>
          <div className="text-red-500 dark:text-red-300">{error}</div>
        </div>
      )}

      {result && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="text-green-600 dark:text-green-400 font-medium mb-2">
            Transferencia procesada exitosamente
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">
            ID: {result.journal_id || result.id}
            {result.status && ` | Estado: ${result.status}`}
          </div>
        </div>
      )}
    </div>
  );
}
