import { NextRequest, NextResponse } from 'next/server';
import { BrowserPodService } from '@/lib/services/browserpod';
import { NetworkRequest } from '@/lib/types';

const VALID_RESOURCE_TYPES = new Set<NetworkRequest['type']>([
  'xhr',
  'fetch',
  'script',
  'image',
  'stylesheet',
  'document',
  'other',
]);

function cleanDomains(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .filter((domain): domain is string => typeof domain === 'string')
        .map((domain) => domain.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function cleanResourceTypes(value: unknown): NetworkRequest['type'][] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value.filter(
        (type): type is NetworkRequest['type'] =>
          typeof type === 'string' && VALID_RESOURCE_TYPES.has(type as NetworkRequest['type'])
      )
    )
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';
    const domains = cleanDomains(body.domains);
    const resourceTypes = cleanResourceTypes(body.resourceTypes);
    const unblock = Boolean(body.unblock);

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const hasDomains = domains.length > 0;
    const hasResourceTypes = resourceTypes.length > 0;

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
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to block/unblock domains' },
      { status: 500 }
    );
  }
}
