'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/formatters';

export default function Charts() {
  const { balances } = useStore();
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || balances.length === 0) return;

    // Usar datos reales del ledger
    const chartData = balances.map(balance => ({
      currency: balance.currency,
      amount: balance.amount,
      change24h: balance.change24h,
      changePercent: balance.changePercent
    }));

    // Crear un gráfico simple con CSS
    const chartHtml = `
      <div class="space-y-4">
        ${chartData.map(data => `
          <div class="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div class="flex items-center space-x-3">
              <div class="w-4 h-4 rounded-full bg-brand"></div>
              <span class="font-medium">${data.currency}</span>
            </div>
            <div class="text-right">
              <div class="font-semibold">${formatCurrency(data.amount, data.currency)}</div>
              ${data.changePercent !== 0 ? `
                <div class="text-sm ${data.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}">
                  ${data.changePercent >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}%
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    chartRef.current.innerHTML = chartHtml;
  }, [balances]);

  if (balances.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        No hay datos de balance disponibles
      </div>
    );
  }

  return (
    <div ref={chartRef} className="w-full h-full">
      {/* El contenido se renderiza dinámicamente */}
    </div>
  );
}
