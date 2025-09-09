import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

interface SwapTransaction {
  id: string;
  fromCurrency: string;
  fromAmount: number;
  toCurrency: string;
  toAmount: number;
  exchangeRate: number;
  gasFee: number;
  transactionHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  walletAddress: string;
}

export async function POST(request: NextRequest) {
  try {
    const { swapTransaction, walletAddress, gasPrice }: {
      swapTransaction: SwapTransaction;
      walletAddress: string;
      gasPrice: number;
    } = await request.json();

    if (!swapTransaction || !walletAddress) {
      return NextResponse.json(
        { error: 'Datos de swap y dirección de wallet requeridos' },
        { status: 400 }
      );
    }

    // Obtener configuración de Ethereum desde localStorage (en el frontend) o variables de entorno
    const config = JSON.parse(process.env.ETHEREUM_CONFIG || '{}');
    
    if (!config.provider || !config.apiKey) {
      return NextResponse.json(
        { error: 'Configuración de Ethereum no encontrada. Configura primero las APIs.' },
        { status: 400 }
      );
    }

    // Construir URL RPC según la configuración
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
        
      case 'custom':
        rpcUrl = config.customRpcUrl;
        break;
        
      default:
        return NextResponse.json(
          { error: 'Provider no válido' },
          { status: 400 }
        );
    }

    // Crear provider con la configuración
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Crear wallet (en producción usar wallet seguro)
    const wallet = new ethers.Wallet(config.walletPrivateKey || 'YOUR_PRIVATE_KEY', provider);
    
    // Calcular cantidad de ETH a enviar
    const ethAmount = ethers.parseEther(swapTransaction.toAmount.toString());
    
    // Crear transacción
    const transaction = {
      to: walletAddress,
      value: ethAmount,
      gasLimit: 21000,
      gasPrice: ethers.parseUnits(gasPrice.toString(), 'gwei')
    };

    // Enviar transacción
    const tx = await wallet.sendTransaction(transaction);
    
    // Esperar confirmación
    const receipt = await tx.wait();

    // Verificar que receipt no sea null
    if (!receipt) {
      throw new Error('Transaction receipt is null');
    }

    // Actualizar estado de la transacción
    const updatedSwapTransaction = {
      ...swapTransaction,
      transactionHash: receipt.hash,
      status: receipt.status === 1 ? 'confirmed' : 'failed',
      gasFee: parseFloat(ethers.formatEther(receipt.gasUsed * receipt.gasPrice))
    };

    // Guardar transacción en archivo JSON (en producción usar base de datos)
    const fs = require('fs');
    const path = require('path');
    
    const swapDataPath = path.join(process.cwd(), '..', '..', 'extracted-data', 'ethereum-swaps.json');
    
    let swaps = [];
    if (fs.existsSync(swapDataPath)) {
      try {
        swaps = JSON.parse(fs.readFileSync(swapDataPath, 'utf8'));
      } catch (error) {
        console.error('Error reading swaps file:', error);
      }
    }
    
    swaps.push(updatedSwapTransaction);
    fs.writeFileSync(swapDataPath, JSON.stringify(swaps, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Swap ejecutado exitosamente',
      transactionHash: receipt.hash,
      swapTransaction: updatedSwapTransaction,
      gasUsed: receipt.gasUsed.toString(),
      blockNumber: receipt.blockNumber,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error executing swap:', error);
    
    // Si es un error de red o gas, intentar con gas más alto
    if (error instanceof Error && error.message.includes('gas')) {
      return NextResponse.json({
        error: 'Error de gas. Intenta con un gas price más alto.',
        details: error.message,
        suggestion: 'Aumenta el gas price a 30-50 Gwei'
      }, { status: 400 });
    }
    
    return NextResponse.json({
      error: 'Error ejecutando swap',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// GET endpoint para obtener historial de swaps
export async function GET() {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const swapDataPath = path.join(process.cwd(), '..', '..', 'extracted-data', 'ethereum-swaps.json');
    
    if (!fs.existsSync(swapDataPath)) {
      return NextResponse.json({
        swaps: [],
        message: 'No hay swaps registrados'
      });
    }

    const swaps = JSON.parse(fs.readFileSync(swapDataPath, 'utf8'));
    
    return NextResponse.json({
      swaps,
      total: swaps.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error reading swaps:', error);
    return NextResponse.json(
      { error: 'Error leyendo historial de swaps' },
      { status: 500 }
    );
  }
}
