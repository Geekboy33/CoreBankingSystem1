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




