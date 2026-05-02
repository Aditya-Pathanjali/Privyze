import { NextRequest, NextResponse } from 'next/server';
import { BrowserPodService } from '@/lib/services/browserpod';
import { NetworkService } from '@/lib/services/network';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const session = BrowserPodService.getSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const requests = session.requests;
    const aggregated = Object.values(session.aggregatedDomains || {}).sort((a, b) => b.totalSize - a.totalSize);
    const trackerStats = NetworkService.calculateTrackerStats(aggregated);

    return NextResponse.json({
      sessionId,
      requests: requests.slice(-50), // Last 50 requests
      blockedRequests: session.blockedRequests.slice(-50),
      aggregated,
      mode: session.mode,
      title: session.title,
      previewImage: session.previewImage,
      blockedDomains: Array.from(session.blockedDomains),
      blockedResourceTypes: Array.from(session.blockedResourceTypes),
      stats: {
        totalRequests: session.totalRequests || 0,
        totalSize: session.totalSize || 0,
        blockedRequests: session.totalBlockedRequests || 0,
        blockedSize: session.totalBlockedSize || 0,
        ...trackerStats,
        isHealthRelated: session.isHealthRelated,
      },
    });
  } catch (error) {
    console.error('Network retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve network data' },
      { status: 500 }
    );
  }
}
