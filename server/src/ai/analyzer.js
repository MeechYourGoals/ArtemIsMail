const OpenAI = require('openai').default;

const lovableGatewayUrl = process.env.LOVABLE_AI_GATEWAY_URL?.trim() || null;
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Prefer Lovable gateway (no API key needed); fall back to OpenAI if configured
const useLovableGateway = !!lovableGatewayUrl;

const SYSTEM_PROMPT = `You are Artemis, an AI assistant that helps prioritize and respond to emails. You analyze emails and provide:
1. suggestedAction: one of "DRAFT_REPLY" or "ARCHIVE"
2. confidence: "LOW", "MED", or "HIGH"
3. reasoning: brief explanation
4. draftReply: if suggestedAction is DRAFT_REPLY, a professional draft reply; otherwise null

Be concise and professional. Draft replies should be ready to send with minimal edits.`;

async function callLovableGateway(messages) {
  const url = lovableGatewayUrl.replace(/\/$/, '');
  // Support full URL or base URL (append OpenAI-compatible path)
  const endpoint = /\/v1\/chat|completions/.test(url) ? url : `${url}/v1/chat/completions`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.3
    })
  });
  if (!res.ok) throw new Error(`Lovable gateway: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content;
}

async function analyzeEmailWithAI({ subject, body, from, to, customInstructions, knowledgeContext }) {
  const userContent = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    '',
    body
  ].join('\n');

  let systemContent = SYSTEM_PROMPT;
  if (customInstructions?.trim()) {
    systemContent += `\n\nUser's custom instructions:\n${customInstructions}`;
  }
  if (knowledgeContext?.trim()) {
    systemContent += `\n\nRelevant knowledge base:\n${knowledgeContext}`;
  }

  const messages = [
    { role: 'system', content: systemContent },
    { role: 'user', content: userContent }
  ];

  try {
    let text;
    if (useLovableGateway) {
      text = await callLovableGateway(messages);
    } else if (openai) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.3
      });
      text = completion.choices[0]?.message?.content;
    } else {
      return getFallbackDecision(subject, body);
    }

    if (!text) throw new Error('No response from AI');

    const parsed = JSON.parse(text);
    return {
      suggestedAction: parsed.suggestedAction || 'ARCHIVE',
      confidence: parsed.confidence || 'MED',
      reasoning: parsed.reasoning || '',
      draftReply: parsed.draftReply || null
    };
  } catch (err) {
    console.error('AI error:', err);
    return getFallbackDecision(subject, body);
  }
}

function getFallbackDecision(subject, body) {
  const text = `${subject} ${body}`.toLowerCase();
  const isNewsletter = /newsletter|unsubscribe|digest|weekly|daily/.test(text);
  const hasQuestion = /\?|when are you|can you|could you|please/.test(text);

  if (isNewsletter) {
    return {
      suggestedAction: 'ARCHIVE',
      confidence: 'MED',
      reasoning: 'Appears to be a newsletter or automated digest.',
      draftReply: null
    };
  }

  if (hasQuestion) {
    return {
      suggestedAction: 'DRAFT_REPLY',
      confidence: 'LOW',
      reasoning: 'Contains a question; draft reply suggested.',
      draftReply: "Thank you for your message. I'll get back to you shortly with a proper response."
    };
  }

  return {
    suggestedAction: 'ARCHIVE',
    confidence: 'LOW',
    reasoning: 'No AI analysis available. Default to archive.',
    draftReply: null
  };
}

module.exports = { analyzeEmailWithAI };
