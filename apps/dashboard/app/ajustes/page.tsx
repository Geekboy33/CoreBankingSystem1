'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

interface SystemConfig {
  id: string;
  category: 'database' | 'api' | 'security' | 'notifications' | 'performance';
  name: string;
  value: string | number | boolean;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  options?: string[];
  required: boolean;
}

export default function AjustesPage() {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('database');

  useEffect(() => {
    // Configuraciones del sistema basadas en dtc1b
    setConfigs([
      // Base de Datos
      {
        id: '1',
        category: 'database',
        name: 'DB_HOST',
        value: 'localhost',
        description: 'Host de la base de datos PostgreSQL',
        type: 'string',
        required: true
      },
      {
        id: '2',
        category: 'database',
        name: 'DB_PORT',
        value: 5432,
        description: 'Puerto de la base de datos',
        type: 'number',
        required: true
      },
      {
        id: '3',
        category: 'database',
        name: 'DB_USER',
        value: 'core',
        description: 'Usuario de la base de datos',
        type: 'string',
        required: true
      },
      {
        id: '4',
        category: 'database',
        name: 'DB_NAME',
        value: 'corebank',
        description: 'Nombre de la base de datos',
        type: 'string',
        required: true
      },
      {
        id: '5',
        category: 'database',
        name: 'DB_POOL_SIZE',
        value: 20,
        description: 'Tamaño del pool de conexiones',
        type: 'number',
        required: false
      },
      
      // API
      {
        id: '6',
        category: 'api',
        name: 'API_PORT',
        value: 8080,
        description: 'Puerto del servidor API',
        type: 'number',
        required: true
      },
      {
        id: '7',
        category: 'api',
        name: 'API_RATE_LIMIT',
        value: 1000,
        description: 'Límite de requests por minuto',
        type: 'number',
        required: false
      },
      {
        id: '8',
        category: 'api',
        name: 'API_TIMEOUT',
        value: 30000,
        description: 'Timeout de requests en milisegundos',
        type: 'number',
        required: false
      },
      {
        id: '9',
        category: 'api',
        name: 'CORS_ENABLED',
        value: true,
        description: 'Habilitar CORS para el API',
        type: 'boolean',
        required: false
      },
      
      // Seguridad
      {
        id: '10',
        category: 'security',
        name: 'JWT_SECRET',
        value: 'your-secret-key',
        description: 'Clave secreta para JWT',
        type: 'string',
        required: true
      },
      {
        id: '11',
        category: 'security',
        name: 'ENCRYPTION_KEY',
        value: 'encryption-key-32-chars',
        description: 'Clave de encriptación',
        type: 'string',
        required: true
      },
      {
        id: '12',
        category: 'security',
        name: 'SESSION_TIMEOUT',
        value: 3600,
        description: 'Timeout de sesión en segundos',
        type: 'number',
        required: false
      },
      {
        id: '13',
        category: 'security',
        name: 'REQUIRE_2FA',
        value: false,
        description: 'Requerir autenticación de dos factores',
        type: 'boolean',
        required: false
      },
      
      // Notificaciones
      {
        id: '14',
        category: 'notifications',
        name: 'EMAIL_ENABLED',
        value: true,
        description: 'Habilitar notificaciones por email',
        type: 'boolean',
        required: false
      },
      {
        id: '15',
        category: 'notifications',
        name: 'SMS_ENABLED',
        value: false,
        description: 'Habilitar notificaciones por SMS',
        type: 'boolean',
        required: false
      },
      {
        id: '16',
        category: 'notifications',
        name: 'PUSH_ENABLED',
        value: true,
        description: 'Habilitar notificaciones push',
        type: 'boolean',
        required: false
      },
      
      // Rendimiento
      {
        id: '17',
        category: 'performance',
        name: 'CACHE_ENABLED',
        value: true,
        description: 'Habilitar caché de datos',
        type: 'boolean',
        required: false
      },
      {
        id: '18',
        category: 'performance',
        name: 'CACHE_TTL',
        value: 300,
        description: 'TTL del caché en segundos',
        type: 'number',
        required: false
      },
      {
        id: '19',
        category: 'performance',
        name: 'MAX_CONCURRENT_REQUESTS',
        value: 100,
        description: 'Máximo de requests concurrentes',
        type: 'number',
        required: false
      }
    ]);
    setLoading(false);
  }, []);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'database': return 'Base de Datos';
      case 'api': return 'API';
      case 'security': return 'Seguridad';
      case 'notifications': return 'Notificaciones';
      case 'performance': return 'Rendimiento';
      default: return category;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'database': return '🗄️';
      case 'api': return '🔌';
      case 'security': return '🔒';
      case 'notifications': return '🔔';
      case 'performance': return '⚡';
      default: return '⚙️';
    }
  };

  const updateConfig = (id: string, value: string | number | boolean) => {
    setConfigs(prev => prev.map(config => 
      config.id === id ? { ...config, value } : config
    ));
  };

  const saveConfigs = async () => {
    try {
      const response = await fetch('/api/system/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs })
      });
      
      if (response.ok) {
        alert('Configuraciones guardadas exitosamente');
      } else {
        alert('Error al guardar configuraciones');
      }
    } catch (error) {
      alert('Error al guardar configuraciones');
    }
  };

  const resetConfigs = () => {
    if (confirm('¿Estás seguro de que quieres resetear todas las configuraciones?')) {
      window.location.reload();
    }
  };

  const filteredConfigs = configs.filter(config => config.category === activeTab);

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
        <h1 className="text-3xl font-bold">Ajustes del Sistema</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetConfigs}>
            Resetear
          </Button>
          <Button className="bg-brand hover:bg-brand/90" onClick={saveConfigs}>
            Guardar Cambios
          </Button>
        </div>
      </div>

      {/* Pestañas de Categorías */}
      <Card>
        <CardHeader>
          <CardTitle>Configuraciones por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-6">
            {['database', 'api', 'security', 'notifications', 'performance'].map((category) => (
              <Button
                key={category}
                variant={activeTab === category ? 'default' : 'outline'}
                onClick={() => setActiveTab(category)}
                className="flex items-center gap-2"
              >
                <span>{getCategoryIcon(category)}</span>
                {getCategoryLabel(category)}
              </Button>
            ))}
          </div>

          {/* Configuraciones de la Categoría Activa */}
          <div className="space-y-4">
            {filteredConfigs.map((config) => (
              <div key={config.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{config.name}</h3>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                  </div>
                  {config.required && (
                    <Badge variant="destructive">Requerido</Badge>
                  )}
                </div>
                
                <div className="mt-3">
                  {config.type === 'boolean' ? (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.value as boolean}
                        onChange={(e) => updateConfig(config.id, e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Habilitado</span>
                    </label>
                  ) : config.type === 'number' ? (
                    <input
                      type="number"
                      value={config.value as number}
                      onChange={(e) => updateConfig(config.id, parseInt(e.target.value))}
                      className="w-full p-2 border rounded-md"
                    />
                  ) : config.type === 'select' ? (
                    <select
                      value={config.value as string}
                      onChange={(e) => updateConfig(config.id, e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      {config.options?.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={config.value as string}
                      onChange={(e) => updateConfig(config.id, e.target.value)}
                      className="w-full p-2 border rounded-md"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Estado del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Estado del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">Online</p>
              <p className="text-sm text-muted-foreground">Estado del Servidor</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">99.9%</p>
              <p className="text-sm text-muted-foreground">Uptime</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">45ms</p>
              <p className="text-sm text-muted-foreground">Tiempo de Respuesta</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Logs del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
            <div>[2024-01-15 10:30:00] INFO: Sistema iniciado correctamente</div>
            <div>[2024-01-15 10:30:01] INFO: Base de datos conectada</div>
            <div>[2024-01-15 10:30:02] INFO: API servidor iniciado en puerto 8080</div>
            <div>[2024-01-15 10:30:03] INFO: Dashboard iniciado en puerto 3000</div>
            <div>[2024-01-15 10:30:04] INFO: DTC1B data source conectado</div>
            <div>[2024-01-15 10:30:05] INFO: Ethereum network conectado</div>
            <div>[2024-01-15 10:30:06] INFO: Todas las integraciones activas</div>
            <div>[2024-01-15 10:30:07] INFO: Sistema listo para operaciones</div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-20">
              <div className="text-center">
                <div className="text-2xl mb-2">🔄</div>
                <div>Reiniciar Servicios</div>
              </div>
            </Button>
            <Button variant="outline" className="h-20">
              <div className="text-center">
                <div className="text-2xl mb-2">💾</div>
                <div>Respaldar Datos</div>
              </div>
            </Button>
            <Button variant="outline" className="h-20">
              <div className="text-center">
                <div className="text-2xl mb-2">📊</div>
                <div>Generar Reporte</div>
              </div>
            </Button>
            <Button variant="outline" className="h-20">
              <div className="text-center">
                <div className="text-2xl mb-2">🔍</div>
                <div>Diagnóstico</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

