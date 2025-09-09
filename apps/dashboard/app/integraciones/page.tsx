'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

interface Integration {
  id: string;
  name: string;
  type: 'ethereum' | 'dtc1b' | 'banking' | 'exchange' | 'api';
  status: 'connected' | 'disconnected' | 'error' | 'maintenance';
  lastSync: string;
  endpoint: string;
  description: string;
  health: 'healthy' | 'warning' | 'critical';
  uptime: number;
  responseTime?: number;
}

export default function IntegracionesPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const response = await fetch('/api/v1/integrations/status');
        if (response.ok) {
          const data = await response.json();
          setIntegrations(data.integrations || []);
        } else {
          // Datos de ejemplo basados en dtc1b
          setIntegrations([
            {
              id: '1',
              name: 'DTC1B Data Source',
              type: 'dtc1b',
              status: 'connected',
              lastSync: '2024-01-15T10:30:00Z',
              endpoint: 'file:///E:/dtc1b/',
              description: 'Fuente principal de datos bancarios DTC1B',
              health: 'healthy',
              uptime: 99.9,
              responseTime: 45
            },
            {
              id: '2',
              name: 'Ethereum Network',
              type: 'ethereum',
              status: 'connected',
              lastSync: '2024-01-15T10:29:00Z',
              endpoint: 'https://mainnet.infura.io/v3/...',
              description: 'Conexión a la red Ethereum principal',
              health: 'healthy',
              uptime: 99.8,
              responseTime: 120
            },
            {
              id: '3',
              name: 'Banking API Core',
              type: 'banking',
              status: 'connected',
              lastSync: '2024-01-15T10:28:00Z',
              endpoint: 'http://localhost:8080/api/v1',
              description: 'API principal del sistema bancario',
              health: 'healthy',
              uptime: 99.5,
              responseTime: 25
            },
            {
              id: '4',
              name: 'Exchange Integration',
              type: 'exchange',
              status: 'error',
              lastSync: '2024-01-14T15:45:00Z',
              endpoint: 'https://api.exchange.com/v1',
              description: 'Integración con exchange de criptomonedas',
              health: 'critical',
              uptime: 85.2,
              responseTime: 5000
            },
            {
              id: '5',
              name: 'External Banking API',
              type: 'api',
              status: 'maintenance',
              lastSync: '2024-01-13T09:20:00Z',
              endpoint: 'https://banking-api.external.com',
              description: 'API externa para servicios bancarios',
              health: 'warning',
              uptime: 95.8,
              responseTime: 200
            }
          ]);
        }
      } catch (error) {
        console.error('Error cargando integraciones:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIntegrations();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'disconnected': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ethereum': return 'Ethereum';
      case 'dtc1b': return 'DTC1B';
      case 'banking': return 'Bancario';
      case 'exchange': return 'Exchange';
      case 'api': return 'API Externa';
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ethereum': return '⛓️';
      case 'dtc1b': return '🏦';
      case 'banking': return '💳';
      case 'exchange': return '📈';
      case 'api': return '🔌';
      default: return '🔗';
    }
  };

  const testConnection = async (integration: Integration) => {
    try {
      const response = await fetch(`/api/integrations/test/${integration.id}`, {
        method: 'POST'
      });
      if (response.ok) {
        // Actualizar estado de la integración
        setIntegrations(prev => prev.map(int => 
          int.id === integration.id 
            ? { ...int, status: 'connected', health: 'healthy' }
            : int
        ));
      }
    } catch (error) {
      console.error('Error testing connection:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Integraciones</h1>
        <Button className="bg-brand hover:bg-brand/90">
          Nueva Integración
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Integraciones */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Estado de Integraciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedIntegration(integration)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{getTypeIcon(integration.type)}</span>
                        <div>
                          <h3 className="font-semibold">{integration.name}</h3>
                          <p className="text-sm text-muted-foreground">{integration.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {getTypeLabel(integration.type)} • {integration.endpoint}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Última sincronización: {new Date(integration.lastSync).toLocaleString('es-ES')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(integration.status)}>
                          {integration.status}
                        </Badge>
                        <Badge className={getHealthColor(integration.health)}>
                          {integration.health}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          Uptime: {integration.uptime}%
                        </p>
                        {integration.responseTime && (
                          <p className="text-sm text-muted-foreground">
                            {integration.responseTime}ms
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detalles de Integración Seleccionada */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Detalles de Integración</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedIntegration ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                    <p className="font-semibold">{selectedIntegration.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                    <p>{getTypeLabel(selectedIntegration.type)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Estado</label>
                    <Badge className={getStatusColor(selectedIntegration.status)}>
                      {selectedIntegration.status}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Salud</label>
                    <Badge className={getHealthColor(selectedIntegration.health)}>
                      {selectedIntegration.health}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Endpoint</label>
                    <p className="text-sm break-all">{selectedIntegration.endpoint}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                    <p>{selectedIntegration.description}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Uptime</label>
                    <p className="text-2xl font-bold text-brand">{selectedIntegration.uptime}%</p>
                  </div>
                  {selectedIntegration.responseTime && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tiempo de Respuesta</label>
                      <p>{selectedIntegration.responseTime}ms</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Última Sincronización</label>
                    <p>{new Date(selectedIntegration.lastSync).toLocaleString('es-ES')}</p>
                  </div>
                  <div className="pt-4 space-y-2">
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => testConnection(selectedIntegration)}
                    >
                      Probar Conexión
                    </Button>
                    <Button className="w-full" variant="outline">
                      Ver Logs
                    </Button>
                    <Button className="w-full" variant="outline">
                      Configurar
                    </Button>
                    <Button className="w-full" variant="outline">
                      Reconectar
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Selecciona una integración para ver los detalles
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Resumen de Integraciones */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Integraciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {integrations.filter(i => i.status === 'connected').length}
              </p>
              <p className="text-sm text-muted-foreground">Conectadas</p>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {integrations.filter(i => i.status === 'error').length}
              </p>
              <p className="text-sm text-muted-foreground">Con Errores</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {integrations.filter(i => i.status === 'maintenance').length}
              </p>
              <p className="text-sm text-muted-foreground">Mantenimiento</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {integrations.length}
              </p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Panel de Monitoreo en Tiempo Real */}
      <Card>
        <CardHeader>
          <CardTitle>Monitoreo en Tiempo Real</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {integrations.map((integration) => (
              <div key={integration.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getTypeIcon(integration.type)}</span>
                  <div>
                    <p className="font-medium">{integration.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {integration.responseTime ? `${integration.responseTime}ms` : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    integration.health === 'healthy' ? 'bg-green-500' :
                    integration.health === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <Badge className={getStatusColor(integration.status)}>
                    {integration.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


