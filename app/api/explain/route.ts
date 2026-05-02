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

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    const result = await AIService.generateExplanation(
      domain,
      requestType || 'unknown',
      sizeKB || 0,
      isFirstParty || false,
      classification || 'other',
      accessibilityMode || false
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
