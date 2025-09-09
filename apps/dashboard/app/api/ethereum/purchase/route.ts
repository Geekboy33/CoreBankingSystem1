import { NextRequest, NextResponse } from 'next/server';

interface PurchaseOrder {
  id: string;
  fromCurrency: string;
  fromAmount: number;
  ethAmount: number;
  exchangeRate: number;
  fee: number;
  totalCost: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transactionHash: string;
  timestamp: string;
  provider: string;
}

export async function POST(request: NextRequest) {
  try {
    const { purchaseOrder, provider }: {
      purchaseOrder: PurchaseOrder;
      provider: string;
    } = await request.json();

    if (!purchaseOrder || !provider) {
      return NextResponse.json(
        { error: 'Orden de compra y provider requeridos' },
        { status: 400 }
      );
    }

    // Simular procesamiento de compra según el provider
    let result;
    
    switch (provider) {
      case 'coinbase':
        result = await processCoinbasePurchase(purchaseOrder);
        break;
      case 'binance':
        result = await processBinancePurchase(purchaseOrder);
        break;
      case 'kraken':
        result = await processKrakenPurchase(purchaseOrder);
        break;
      default:
        return NextResponse.json(
          { error: 'Provider no válido' },
          { status: 400 }
        );
    }

    // Guardar orden de compra
    await savePurchaseOrder(purchaseOrder);

    return NextResponse.json({
      success: true,
      message: 'Compra procesada exitosamente',
      transactionHash: result.transactionHash,
      purchaseOrder: {
        ...purchaseOrder,
        status: 'completed',
        transactionHash: result.transactionHash
      },
      provider: provider,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing purchase:', error);
    
    return NextResponse.json({
      error: 'Error procesando compra',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// Simular compra en Coinbase Pro
async function processCoinbasePurchase(order: PurchaseOrder) {
  // En un entorno real, aquí harías la llamada a la API de Coinbase Pro
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simular delay
  
  return {
    transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
    orderId: 'cb_' + Math.random().toString(36).substr(2, 9),
    status: 'completed',
    fee: order.fee,
    ethReceived: order.ethAmount
  };
}

// Simular compra en Binance
async function processBinancePurchase(order: PurchaseOrder) {
  // En un entorno real, aquí harías la llamada a la API de Binance
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay más rápido
  
  return {
    transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
    orderId: 'bn_' + Math.random().toString(36).substr(2, 9),
    status: 'completed',
    fee: order.fee,
    ethReceived: order.ethAmount
  };
}

// Simular compra en Kraken
async function processKrakenPurchase(order: PurchaseOrder) {
  // En un entorno real, aquí harías la llamada a la API de Kraken
  await new Promise(resolve => setTimeout(resolve, 3000)); // Simular delay más lento
  
  return {
    transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
    orderId: 'kr_' + Math.random().toString(36).substr(2, 9),
    status: 'completed',
    fee: order.fee,
    ethReceived: order.ethAmount
  };
}

// Guardar orden de compra en archivo JSON
async function savePurchaseOrder(order: PurchaseOrder) {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const purchasesPath = path.join(process.cwd(), '..', '..', 'extracted-data', 'ethereum-purchases.json');
    
    let purchases = [];
    if (fs.existsSync(purchasesPath)) {
      try {
        purchases = JSON.parse(fs.readFileSync(purchasesPath, 'utf8'));
      } catch (error) {
        console.error('Error reading purchases file:', error);
      }
    }
    
    purchases.push(order);
    fs.writeFileSync(purchasesPath, JSON.stringify(purchases, null, 2));
    
  } catch (error) {
    console.error('Error saving purchase order:', error);
  }
}

// GET endpoint para obtener historial de compras
export async function GET() {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const purchasesPath = path.join(process.cwd(), '..', '..', 'extracted-data', 'ethereum-purchases.json');
    
    if (!fs.existsSync(purchasesPath)) {
      return NextResponse.json({
        purchases: [],
        message: 'No hay compras registradas'
      });
    }

    const purchases = JSON.parse(fs.readFileSync(purchasesPath, 'utf8'));
    
    return NextResponse.json({
      purchases,
      total: purchases.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error reading purchases:', error);
    return NextResponse.json(
      { error: 'Error leyendo historial de compras' },
      { status: 500 }
    );
  }
}





