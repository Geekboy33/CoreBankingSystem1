import { NextResponse } from 'next/server';
import { scanData } from '../start/route';

export async function GET() {
  try {
    return NextResponse.json(scanData);
  } catch (error) {
    console.error('Error obteniendo estado del escaneo:', error);
    return NextResponse.json({ error: 'Error obteniendo estado' }, { status: 500 });
  }
}