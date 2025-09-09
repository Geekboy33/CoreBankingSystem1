# Script para Implementar Mejoras Críticas del Dashboard
$ErrorActionPreference = 'Stop'

Write-Host "=== IMPLEMENTANDO MEJORAS CRÍTICAS DEL DASHBOARD ===" -ForegroundColor Cyan

# 1. Crear endpoint para datos reales de DTC1B
Write-Host "`n1. Creando endpoint para datos reales de DTC1B..." -ForegroundColor Yellow

$realDataEndpoint = @"
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), '..', '..', 'extracted-data');
    const realData = {
      balances: [],
      transactions: [],
      accounts: [],
      timestamp: new Date().toISOString(),
      source: 'DTC1B_REAL_DATA'
    };

    // Leer archivos reales de DTC1B
    const files = [
      'complete-total-balances-scan.json',
      'dtc1b-scan-results.json',
      'dtc1b-robust-scan-results.json'
    ];

    for (const file of files) {
      const filePath = path.join(dataDir, file);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const cleanContent = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
          const data = JSON.parse(cleanContent);
          
          // Extraer datos reales
          if (data.balances) {
            realData.balances.push(...data.balances);
          }
          if (data.transactions) {
            realData.transactions.push(...data.transactions);
          }
          if (data.accounts) {
            realData.accounts.push(...data.accounts);
          }
        } catch (error) {
          console.error(`Error reading ${file}:`, error);
        }
      }
    }

    return NextResponse.json(realData);
  } catch (error) {
    console.error('Error in real DTC1B data API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
"@

$realDataPath = "apps\dashboard\app\api\v1\data\real-dtc1b\route.ts"
$realDataEndpoint | Out-File -Encoding utf8 $realDataPath
Write-Host "✅ Endpoint creado: $realDataPath" -ForegroundColor Green

# 2. Crear endpoint de configuración Ethereum
Write-Host "`n2. Creando endpoint de configuración Ethereum..." -ForegroundColor Yellow

$ethereumConfigEndpoint = @"
import { NextResponse } from 'next/server';

let ethereumConfig = {
  rpcUrl: '',
  walletAddress: '',
  privateKey: '',
  configured: false
};

export async function GET() {
  return NextResponse.json({
    configured: ethereumConfig.configured,
    hasRpcUrl: !!ethereumConfig.rpcUrl,
    hasWallet: !!ethereumConfig.walletAddress,
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    ethereumConfig = {
      rpcUrl: body.rpcUrl || '',
      walletAddress: body.walletAddress || '',
      privateKey: body.privateKey || '',
      configured: !!(body.rpcUrl && body.walletAddress)
    };

    return NextResponse.json({
      success: true,
      configured: ethereumConfig.configured,
      message: 'Configuración Ethereum actualizada'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error en configuración' },
      { status: 500 }
    );
  }
}
"@

$ethereumConfigPath = "apps\dashboard\app\api\ethereum\config\route.ts"
$ethereumConfigEndpoint | Out-File -Encoding utf8 $ethereumConfigPath
Write-Host "✅ Endpoint creado: $ethereumConfigPath" -ForegroundColor Green

# 3. Mejorar endpoint de scripts
Write-Host "`n3. Mejorando endpoint de scripts..." -ForegroundColor Yellow

$scriptsEndpoint = @"
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scriptName, parameters = {} } = body;

    if (!scriptName) {
      return NextResponse.json(
        { error: 'Nombre de script requerido' },
        { status: 400 }
      );
    }

    const scriptPath = path.join(process.cwd(), '..', '..', scriptName);
    
    // Verificar que el script existe
    const fs = require('fs');
    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json(
        { error: 'Script no encontrado' },
        { status: 404 }
      );
    }

    // Ejecutar script
    exec(`powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error('Error ejecutando script:', error);
        return;
      }
      if (stderr) {
        console.error('Stderr:', stderr);
        return;
      }
      console.log('Script ejecutado:', stdout);
    });

    return NextResponse.json({
      success: true,
      message: 'Script ejecutado correctamente',
      scriptName,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in scripts API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
"@

$scriptsPath = "apps\dashboard\app\api\scripts\execute\route.ts"
$scriptsEndpoint | Out-File -Encoding utf8 $scriptsPath
Write-Host "✅ Endpoint mejorado: $scriptsPath" -ForegroundColor Green

# 4. Crear componente optimizado
Write-Host "`n4. Creando componente optimizado..." -ForegroundColor Yellow

$optimizedComponent = @"
'use client';

import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface OptimizedDataViewerProps {
  data: any[];
  title: string;
  type: 'balances' | 'transactions' | 'accounts';
}

const OptimizedDataViewer = memo(({ data, title, type }: OptimizedDataViewerProps) => {
  const processedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map(item => ({
      ...item,
      id: item.id || Math.random().toString(36).substr(2, 9),
      timestamp: item.timestamp || new Date().toISOString()
    }));
  }, [data]);

  const renderItem = (item: any) => {
    switch (type) {
      case 'balances':
        return (
          <div key={item.id} className="flex justify-between items-center p-2 border rounded">
            <span>{item.Currency || item.currency}</span>
            <Badge variant="outline">{item.Balance || item.amount || 0}</Badge>
          </div>
        );
      case 'transactions':
        return (
          <div key={item.id} className="flex justify-between items-center p-2 border rounded">
            <span>{item.Amount || item.amount || 0}</span>
            <Badge variant="outline">{item.Currency || item.currency}</Badge>
          </div>
        );
      case 'accounts':
        return (
          <div key={item.id} className="flex justify-between items-center p-2 border rounded">
            <span>{item.AccountNumber || item.accountNumber || 'N/A'}</span>
            <Badge variant="outline">{item.Position || item.position || 0}</Badge>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {processedData.length > 0 ? (
            processedData.map(renderItem)
          ) : (
            <p className="text-muted-foreground">No hay datos disponibles</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

OptimizedDataViewer.displayName = 'OptimizedDataViewer';

export default OptimizedDataViewer;
"@

$optimizedComponentPath = "apps\dashboard\app\components\OptimizedDataViewer.tsx"
$optimizedComponent | Out-File -Encoding utf8 $optimizedComponentPath
Write-Host "✅ Componente optimizado creado: $optimizedComponentPath" -ForegroundColor Green

# 5. Crear hook personalizado para datos
Write-Host "`n5. Creando hook personalizado..." -ForegroundColor Yellow

$customHook = @"
'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseRealDataOptions {
  endpoint: string;
  refreshInterval?: number;
  enabled?: boolean;
}

export function useRealData<T>({ endpoint, refreshInterval = 5000, enabled = true }: UseRealDataOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [endpoint, enabled]);

  useEffect(() => {
    fetchData();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refreshInterval]);

  return { data, loading, error, refetch: fetchData };
}
"@

$customHookPath = "apps\dashboard\app\hooks\useRealData.ts"
$customHook | Out-File -Encoding utf8 $customHookPath
Write-Host "✅ Hook personalizado creado: $customHookPath" -ForegroundColor Green

Write-Host "`n=== MEJORAS IMPLEMENTADAS ===" -ForegroundColor Green
Write-Host "✅ Endpoint para datos reales de DTC1B" -ForegroundColor Green
Write-Host "✅ Configuración de Ethereum" -ForegroundColor Green
Write-Host "✅ Endpoint de scripts mejorado" -ForegroundColor Green
Write-Host "✅ Componente optimizado" -ForegroundColor Green
Write-Host "✅ Hook personalizado para datos" -ForegroundColor Green

Write-Host "`n=== PRÓXIMOS PASOS ===" -ForegroundColor Cyan
Write-Host "1. Reiniciar el dashboard para cargar los nuevos endpoints" -ForegroundColor Yellow
Write-Host "2. Probar los nuevos endpoints:" -ForegroundColor Yellow
Write-Host "   - GET /api/v1/data/real-dtc1b" -ForegroundColor White
Write-Host "   - GET /api/ethereum/config" -ForegroundColor White
Write-Host "   - POST /api/scripts/execute" -ForegroundColor White
Write-Host "3. Integrar el componente optimizado en el dashboard" -ForegroundColor Yellow
Write-Host "4. Usar el hook personalizado para datos en tiempo real" -ForegroundColor Yellow




