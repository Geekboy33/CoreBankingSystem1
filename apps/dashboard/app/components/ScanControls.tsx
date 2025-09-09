'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface ScanStatus {
  completeScan: {
    isRunning: boolean;
    status: string;
    lastCheck: string;
  };
  full800GBScan: {
    isRunning: boolean;
    status: string;
    lastCheck: string;
  };
  ethereumScan: {
    isRunning: boolean;
    status: string;
    lastCheck: string;
  };
}

export default function ScanControls() {
  const [scanStatus, setScanStatus] = useState<ScanStatus>({
    completeScan: { isRunning: false, status: 'idle', lastCheck: '' },
    full800GBScan: { isRunning: false, status: 'idle', lastCheck: '' },
    ethereumScan: { isRunning: false, status: 'idle', lastCheck: '' }
  });
  const [loading, setLoading] = useState(false);

  // Verificar estado de escaneos
  const checkScanStatus = async () => {
    try {
      const response = await fetch('/api/scans/status');
      if (response.ok) {
        const status = await response.json();
        setScanStatus(status);
      }
    } catch (error) {
      console.error('Error checking scan status:', error);
    }
  };

  // Iniciar escaneo completo
  const startCompleteScan = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/complete-scan/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Complete scan started:', result);
        // Actualizar estado después de iniciar
        setTimeout(checkScanStatus, 2000);
      }
    } catch (error) {
      console.error('Error starting complete scan:', error);
    } finally {
      setLoading(false);
    }
  };

  // Detener escaneo completo
  const stopCompleteScan = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/complete-scan/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Complete scan stopped:', result);
        // Actualizar estado después de detener
        setTimeout(checkScanStatus, 1000);
      }
    } catch (error) {
      console.error('Error stopping complete scan:', error);
    } finally {
      setLoading(false);
    }
  };

  // Iniciar escaneo 800GB
  const startFullScan = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/full-scan/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Full scan started:', result);
        setTimeout(checkScanStatus, 2000);
      }
    } catch (error) {
      console.error('Error starting full scan:', error);
    } finally {
      setLoading(false);
    }
  };

  // Detener escaneo 800GB
  const stopFullScan = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/full-scan/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Full scan stopped:', result);
        setTimeout(checkScanStatus, 1000);
      }
    } catch (error) {
      console.error('Error stopping full scan:', error);
    } finally {
      setLoading(false);
    }
  };

  // Verificar estado al cargar
  useEffect(() => {
    checkScanStatus();
    const interval = setInterval(checkScanStatus, 5000); // Verificar cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-blue-600 dark:text-blue-400">🎛️ Controles de Escaneo</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Escaneo Completo DTC1B */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Escaneo Completo DTC1B</h3>
            <Badge variant={scanStatus.completeScan.isRunning ? "default" : "outline"}>
              {scanStatus.completeScan.isRunning ? "EJECUTÁNDOSE" : "DETENIDO"}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={startCompleteScan}
              disabled={loading || scanStatus.completeScan.isRunning}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? '🔄 Iniciando...' : '🚀 Iniciar Escaneo Completo'}
            </Button>
            
            <Button 
              onClick={stopCompleteScan}
              disabled={loading || !scanStatus.completeScan.isRunning}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              ⏹️ Detener Escaneo
            </Button>
          </div>
        </div>

        {/* Escaneo 800GB */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Escaneo Completo 800GB</h3>
            <Badge variant={scanStatus.full800GBScan.isRunning ? "default" : "outline"}>
              {scanStatus.full800GBScan.isRunning ? "EJECUTÁNDOSE" : "DETENIDO"}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={startFullScan}
              disabled={loading || scanStatus.full800GBScan.isRunning}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading ? '🔄 Iniciando...' : '📊 Iniciar Escaneo 800GB'}
            </Button>
            
            <Button 
              onClick={stopFullScan}
              disabled={loading || !scanStatus.full800GBScan.isRunning}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              ⏹️ Detener Escaneo
            </Button>
          </div>
        </div>

        {/* Estado del Sistema */}
        <div className="space-y-2">
          <h3 className="font-semibold">Estado del Sistema</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>Última verificación: {new Date(scanStatus.completeScan.lastCheck).toLocaleString()}</p>
            <p>Procesos activos: {scanStatus.completeScan.isRunning ? 'Sí' : 'No'}</p>
          </div>
        </div>

        {/* Botón de Actualización */}
        <div className="flex justify-center">
          <Button 
            onClick={checkScanStatus}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            🔄 Actualizar Estado
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}




