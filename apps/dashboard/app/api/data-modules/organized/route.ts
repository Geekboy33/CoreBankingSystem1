import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface DataModule {
  id: string;
  name: string;
  type: 'balances' | 'transactions' | 'accounts' | 'wallets' | 'users' | 'crypto';
  status: 'active' | 'processing' | 'ready' | 'error';
  dataCount: number;
  totalValue: number;
  currency: string;
  lastUpdated: string;
  swapEnabled: boolean;
  priority: number;
}

interface OrganizedData {
  modules: DataModule[];
  totalModules: number;
  activeModules: number;
  totalDataPoints: number;
  totalValue: number;
  lastOrganization: string;
}

// GET endpoint para obtener datos organizados
export async function GET(request: NextRequest) {
  try {
    const organizedDataPath = path.join(process.cwd(), '..', '..', 'extracted-data', 'organized-modules.json');
    
    if (fs.existsSync(organizedDataPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(organizedDataPath, 'utf8'));
        return NextResponse.json(data);
      } catch (error) {
        console.error('Error parsing organized data:', error);
      }
    }

    // Crear datos organizados por defecto
    const defaultData: OrganizedData = {
      modules: [
        {
          id: 'module_balances_eur',
          name: 'Balances EUR',
          type: 'balances',
          status: 'ready',
          dataCount: 505,
          totalValue: 1891.0,
          currency: 'EUR',
          lastUpdated: new Date().toISOString(),
          swapEnabled: true,
          priority: 1
        },
        {
          id: 'module_balances_usd',
          name: 'Balances USD',
          type: 'balances',
          status: 'ready',
          dataCount: 505,
          totalValue: 854.0,
          currency: 'USD',
          lastUpdated: new Date().toISOString(),
          swapEnabled: true,
          priority: 2
        },
        {
          id: 'module_balances_gbp',
          name: 'Balances GBP',
          type: 'balances',
          status: 'ready',
          dataCount: 505,
          totalValue: 949.0,
          currency: 'GBP',
          lastUpdated: new Date().toISOString(),
          swapEnabled: true,
          priority: 3
        },
        {
          id: 'module_crypto_btc',
          name: 'Crypto BTC',
          type: 'crypto',
          status: 'ready',
          dataCount: 1,
          totalValue: 0.001073,
          currency: 'BTC',
          lastUpdated: new Date().toISOString(),
          swapEnabled: true,
          priority: 4
        },
        {
          id: 'module_crypto_eth',
          name: 'Crypto ETH',
          type: 'crypto',
          status: 'ready',
          dataCount: 1,
          totalValue: 0.0163,
          currency: 'ETH',
          lastUpdated: new Date().toISOString(),
          swapEnabled: true,
          priority: 5
        },
        {
          id: 'module_transactions',
          name: 'Transacciones',
          type: 'transactions',
          status: 'processing',
          dataCount: 0,
          totalValue: 0,
          currency: 'EUR',
          lastUpdated: new Date().toISOString(),
          swapEnabled: false,
          priority: 6
        },
        {
          id: 'module_accounts',
          name: 'Cuentas Bancarias',
          type: 'accounts',
          status: 'processing',
          dataCount: 0,
          totalValue: 0,
          currency: 'EUR',
          lastUpdated: new Date().toISOString(),
          swapEnabled: false,
          priority: 7
        },
        {
          id: 'module_wallets',
          name: 'Wallets Ethereum',
          type: 'wallets',
          status: 'ready',
          dataCount: 0,
          totalValue: 0,
          currency: 'ETH',
          lastUpdated: new Date().toISOString(),
          swapEnabled: true,
          priority: 8
        }
      ],
      totalModules: 8,
      activeModules: 6,
      totalDataPoints: 1016,
      totalValue: 3694.0,
      lastOrganization: new Date().toISOString()
    };

    return NextResponse.json(defaultData);

  } catch (error) {
    console.error('Error in data modules organized API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}