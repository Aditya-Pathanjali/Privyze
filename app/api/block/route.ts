import { NextRequest, NextResponse } from 'next/server';
import { BrowserPodService } from '@/lib/services/browserpod';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, domains = [], resourceTypes = [], unblock } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const hasDomains = Array.isArray(domains) && domains.length > 0;
    const hasResourceTypes = Array.isArray(resourceTypes) && resourceTypes.length > 0;

    if (!hasDomains && !hasResourceTypes) {
      return NextResponse.json(
        { error: 'At least one domain or resource type is required' },
        { status: 400 }
      );
    }

    if (unblock) {
      await BrowserPodService.unblockDomains(sessionId, domains, resourceTypes);
    } else {
      await BrowserPodService.blockDomains(sessionId, domains, resourceTypes);
    }

    return NextResponse.json({
      success: true,
      message: `${unblock ? 'Unblocked' : 'Blocked'} ${domains.length} domain(s) and ${resourceTypes.length} resource type(s)`,
    });
  } catch (error) {
    console.error('Block/unblock error:', error);
    return NextResponse.json(
      { error: 'Failed to block/unblock domains' },
      { status: 500 }
    );
  }
}
