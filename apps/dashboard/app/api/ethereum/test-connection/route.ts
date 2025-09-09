import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

interface EthereumConfig {
  provider: 'infura' | 'alchemy' | 'custom';
  apiKey: string;
  network: 'mainnet' | 'goerli' | 'sepolia' | 'polygon' | 'arbitrum';
  customRpcUrl: string;
  walletPrivateKey: string;
  walletAddress: string;
}

export async function POST(request: NextRequest) {
  try {
    const config: EthereumConfig = await request.json();

    if (!config) {
      return NextResponse.json(
        { error: 'Configuración requerida' },
        { status: 400 }
      );
    }

    let provider: ethers.JsonRpcProvider;
    let rpcUrl: string;

    // Construir URL RPC según el provider
    switch (config.provider) {
      case 'infura':
        if (!config.apiKey) {
          return NextResponse.json(
            { error: 'API Key de Infura requerida' },
            { status: 400 }
          );
        }
        
        const infuraNetworks: { [key: string]: string } = {
          'mainnet': 'mainnet',
          'goerli': 'goerli',
          'sepolia': 'sepolia',
          'polygon': 'polygon-mainnet',
          'arbitrum': 'arbitrum-mainnet'
        };
        
        const infuraNetwork = infuraNetworks[config.network] || 'mainnet';
        rpcUrl = `https://${infuraNetwork}.infura.io/v3/${config.apiKey}`;
        break;

      case 'alchemy':
        if (!config.apiKey) {
          return NextResponse.json(
            { error: 'API Key de Alchemy requerida' },
            { status: 400 }
          );
        }
        
        const alchemyNetworks: { [key: string]: string } = {
          'mainnet': 'eth-mainnet',
          'goerli': 'eth-goerli',
          'sepolia': 'eth-sepolia',
          'polygon': 'polygon-mainnet',
          'arbitrum': 'arb-mainnet'
        };
        
        const alchemyNetwork = alchemyNetworks[config.network] || 'eth-mainnet';
        rpcUrl = `https://${alchemyNetwork}.g.alchemy.com/v2/${config.apiKey}`;
        break;

      case 'custom':
        if (!config.customRpcUrl) {
          return NextResponse.json(
            { error: 'URL RPC personalizada requerida' },
            { status: 400 }
          );
        }
        rpcUrl = config.customRpcUrl;
        break;

      default:
        return NextResponse.json(
          { error: 'Provider no válido' },
          { status: 400 }
        );
    }

    // Crear provider
    provider = new ethers.JsonRpcProvider(rpcUrl);

    // Probar conexión
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    const feeData = await provider.getFeeData();

    // Verificar wallet si se proporcionó
    let walletBalance = '0';
    if (config.walletAddress) {
      try {
        const balance = await provider.getBalance(config.walletAddress);
        walletBalance = ethers.formatEther(balance);
      } catch (error) {
        console.warn('Error obteniendo balance del wallet:', error);
      }
    }

    // Verificar private key si se proporcionó
    let walletAddress = '';
    if (config.walletPrivateKey) {
      try {
        const wallet = new ethers.Wallet(config.walletPrivateKey, provider);
        walletAddress = wallet.address;
      } catch (error) {
        console.warn('Error verificando private key:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Conexión exitosa',
      networkId: Number(network.chainId),
      networkName: network.name,
      blockNumber,
      gasPrice: ethers.formatUnits(feeData.gasPrice || 0, 'gwei'),
      walletBalance,
      walletAddress,
      rpcUrl: rpcUrl.replace(config.apiKey, '***'), // Ocultar API key en respuesta
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error testing connection:', error);
    
    let errorMessage = 'Error desconocido';
    
    if (error instanceof Error) {
      if (error.message.includes('invalid project id') || error.message.includes('invalid api key')) {
        errorMessage = 'API Key inválida. Verifica que sea correcta.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Error de red. Verifica tu conexión a internet.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Timeout de conexión. Intenta con otro provider.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Error de conexión',
        message: errorMessage,
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// GET endpoint para obtener información de la red actual
export async function GET() {
  try {
    // Intentar conectar con configuración guardada
    const config = JSON.parse(process.env.ETHEREUM_CONFIG || '{}');
    
    if (!config.provider || !config.apiKey) {
      return NextResponse.json({
        error: 'No hay configuración de Ethereum disponible',
        message: 'Configura primero las APIs de Ethereum'
      }, { status: 404 });
    }

    let rpcUrl: string;
    
    switch (config.provider) {
      case 'infura':
        const infuraNetworks: { [key: string]: string } = {
          'mainnet': 'mainnet',
          'goerli': 'goerli',
          'sepolia': 'sepolia',
          'polygon': 'polygon-mainnet',
          'arbitrum': 'arbitrum-mainnet'
        };
        const infuraNetwork = infuraNetworks[config.network] || 'mainnet';
        rpcUrl = `https://${infuraNetwork}.infura.io/v3/${config.apiKey}`;
        break;
        
      case 'alchemy':
        const alchemyNetworks: { [key: string]: string } = {
          'mainnet': 'eth-mainnet',
          'goerli': 'eth-goerli',
          'sepolia': 'eth-sepolia',
          'polygon': 'polygon-mainnet',
          'arbitrum': 'arb-mainnet'
        };
        const alchemyNetwork = alchemyNetworks[config.network] || 'eth-mainnet';
        rpcUrl = `https://${alchemyNetwork}.g.alchemy.com/v2/${config.apiKey}`;
        break;
        
      default:
        return NextResponse.json({
          error: 'Provider no configurado'
        }, { status: 400 });
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    const feeData = await provider.getFeeData();

    return NextResponse.json({
      success: true,
      networkId: Number(network.chainId),
      networkName: network.name,
      blockNumber,
      gasPrice: ethers.formatUnits(feeData.gasPrice || 0, 'gwei'),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting network info:', error);
    return NextResponse.json(
      { 
        error: 'Error obteniendo información de la red',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}





