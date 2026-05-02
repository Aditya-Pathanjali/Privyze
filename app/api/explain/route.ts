import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/services/ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      domain,
      requestType,
      sizeKB,
      isFirstParty,
      classification,
      accessibilityMode,
    } = body;

    if (typeof domain !== 'string' || !domain.trim()) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    const safeSizeKB =
      typeof sizeKB === 'number' && Number.isFinite(sizeKB)
        ? Math.max(0, sizeKB)
        : 0;

    const result = await AIService.generateExplanation(
      domain.trim(),
      typeof requestType === 'string' && requestType ? requestType : 'unknown',
      safeSizeKB,
      Boolean(isFirstParty),
      typeof classification === 'string' && classification ? classification : 'other',
      Boolean(accessibilityMode)
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Explain error:', error);
    return NextResponse.json(
      { error: 'Failed to generate explanation' },
      { status: 500 }
    );
  }
}
