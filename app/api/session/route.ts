import { NextRequest, NextResponse } from 'next/server';
import { BrowserPodService } from '@/lib/services/browserpod';
import { NetworkService } from '@/lib/services/network';
import { v4 as uuidv4 } from 'uuid';

// Install uuid: npm install uuid

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const validation = NetworkService.normalizeHttpUrl(url);
    if (!validation.url) {
      return NextResponse.json(
        { error: validation.error || 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Create session
    const sessionId = uuidv4();
    const session = await BrowserPodService.createSession(sessionId, validation.url);
    const fullSession = BrowserPodService.getSession(sessionId);

    return NextResponse.json({
      ...session,
      warning:
        fullSession?.mode === 'mock'
          ? 'BrowserPod live sandbox was unavailable, so the app switched to a safe simulation.'
          : undefined,
    });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

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

    return NextResponse.json({
      sessionId: session.sessionId,
      url: session.url,
      blockedDomains: Array.from(session.blockedDomains),
      blockedResourceTypes: Array.from(session.blockedResourceTypes),
      requests: session.requests,
      blockedRequests: session.blockedRequests,
      pageContent: session.pageContent,
      isHealthRelated: session.isHealthRelated,
      mode: session.mode,
      title: session.title,
      lastError: session.lastError,
      previewImage: session.previewImage,
      createdAt: session.createdAt,
    });
  } catch (error) {
    console.error('Session retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    await BrowserPodService.closeSession(sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
