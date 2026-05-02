import { GoogleGenerativeAI } from '@google/generative-ai';

type ExplanationResult = {
  explanation: string;
  source: 'gemini' | 'local';
  confidence: 'high' | 'medium';
};

function createClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  return apiKey ? new GoogleGenerativeAI(apiKey) : null;
}

function getGeminiModelName() {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

function humanClassification(classification: string) {
  switch (classification) {
    case 'ads':
      return 'ad delivery';
    case 'analytics':
      return 'analytics';
    case 'tracker':
      return 'cross-site tracking';
    case 'api':
      return 'site functionality';
    case 'cdn':
      return 'asset delivery';
    default:
      return 'background site activity';
  }
}

function buildFallbackExplanation(
  domain: string,
  classification: string,
  requestType: string,
  sizeKB: number,
  isFirstParty: boolean,
  accessibilityMode: boolean
) {
  const label = humanClassification(classification);
  const ownership = isFirstParty ? 'the site itself' : 'another company';

  if (accessibilityMode) {
    return `${domain} is being used for ${label}. It looks like ${ownership} is handling a ${requestType} request of about ${sizeKB} KB, which means data is moving even if you do not see it on screen.`;
  }

  return `${domain} appears to support ${label}. This ${requestType} request is about ${sizeKB} KB and is handled by ${ownership}, so it may either help the page work or send browsing data to an outside service.`;
}

export class AIService {
  static async generateExplanation(
    domain: string,
    requestType: string,
    sizeKB: number,
    isFirstParty: boolean,
    classification: string,
    accessibilityMode = false
  ): Promise<ExplanationResult> {
    const fallback = buildFallbackExplanation(
      domain,
      classification,
      requestType,
      sizeKB,
      isFirstParty,
      accessibilityMode
    );

    const client = createClient();
    if (!client) {
      return {
        explanation: fallback,
        source: 'local',
        confidence: 'medium',
      };
    }

    const tone = accessibilityMode
      ? 'Use plain English, short sentences, and avoid jargon.'
      : 'Be concise, specific, and human-readable.';

    const prompt = `You explain website network activity to non-technical users.

${tone}

Observed request:
- domain: ${domain}
- type: ${requestType}
- size: ${sizeKB} KB
- first-party: ${isFirstParty ? 'yes' : 'no'}
- classification: ${classification}

Return exactly 2 sentences:
1. What this request most likely does.
2. Why the user should care from a privacy or functionality perspective.

Do not invent facts beyond the observed fields.`;

    try {
      const model = client.getGenerativeModel({ model: getGeminiModelName() });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 140 }
      });
      const text = result.response.text().trim();

      return {
        explanation: text || fallback,
        source: text ? 'gemini' : 'local',
        confidence: text ? 'high' : 'medium',
      };
    } catch (error) {
      console.error('AI explanation fallback triggered:', error);
      return {
        explanation: fallback,
        source: 'local',
        confidence: 'medium',
      };
    }
  }

  static async generateSummary(
    trackers: { domain: string; classification: string }[],
    totalSizeKB: number,
    accessibilityMode = false
  ): Promise<string> {
    if (trackers.length === 0) {
      return accessibilityMode
        ? 'This page looks fairly quiet so far. I do not see strong signs of outside tracking yet.'
        : 'This page looks relatively quiet so far, with no obvious tracker-heavy activity yet.';
    }

    const top = trackers.slice(0, 3).map((tracker) => tracker.domain).join(', ');
    return accessibilityMode
      ? `The page is sharing data with ${top}. That usually means outside services are helping measure visits or deliver ads, adding about ${Math.round(totalSizeKB)} KB of transfer so far.`
      : `The most notable external traffic is going to ${top}. That suggests the page is relying on outside analytics or advertising services, adding roughly ${Math.round(totalSizeKB)} KB of transfer so far.`;
  }

  static async generateHealthcareAdvice(): Promise<string> {
    return 'Health-related browsing can reveal sensitive interests or conditions. Stronger blocking helps reduce how much symptom, treatment, or diagnosis-related activity reaches outside services.';
  }
}
