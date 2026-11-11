// POST /api/chat — TDC website chat assistant.
// Zero dependencies: talks to Claude through Vercel AI Gateway's OpenAI-compatible endpoint.
// Auth: the project's OIDC token (automatic on Vercel) or an AI_GATEWAY_API_KEY env var.
import { SYSTEM_PROMPT, LEAD_TOOL } from './_knowledge.mjs';

const GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1/chat/completions';
// Tried in order: if a model isn't available on the current Gateway plan (403), the next is used.
const MODELS = (process.env.CHAT_MODELS || 'anthropic/claude-haiku-5.5,anthropic/claude-haiku-4.5').split(',').map((m) => m.trim()).filter(Boolean);
let preferred = 0; // remembered per warm instance
const MAX_MESSAGES = 30;      // whole conversation, both sides
const MAX_CHARS = 1500;       // per message
const ALLOWED_ORIGIN = /^https:\/\/((www\.)?thedalycreative\.(com|net|xyz|info|shop|store)|tdc-website-v27[a-z0-9-]*\.vercel\.app)$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

const clean = (s, n = MAX_CHARS) => String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n);

async function callModel(messages, token, withTools) {
  for (let i = preferred; i < MODELS.length; i++) {
    const res = await requestModel(MODELS[i], messages, token, withTools);
    if (res.status === 403 && i < MODELS.length - 1) { preferred = i + 1; await res.text(); continue; }
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Gateway ${res.status} (${MODELS[i]}): ${detail.slice(0, 300)}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message ?? {};
  }
  throw new Error('No model available');
}

function requestModel(model, messages, token, withTools) {
  return fetch(GATEWAY_URL, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 600,
      temperature: 0.5,
      ...(withTools ? { tools: [LEAD_TOOL], tool_choice: 'auto' } : {}),
    }),
  });
}

export async function POST(request) {
  const origin = request.headers.get('origin') || '';
  if (origin && !ALLOWED_ORIGIN.test(origin)) return json({ error: 'Forbidden' }, 403);

  const token = process.env.AI_GATEWAY_API_KEY || request.headers.get('x-vercel-oidc-token') || process.env.VERCEL_OIDC_TOKEN;
  if (!token) return json({ error: 'Chat is not configured yet.' }, 503);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Bad request' }, 400); }

  const history = Array.isArray(body.messages) ? body.messages.slice(-MAX_MESSAGES) : [];
  const messages = history
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({ role: m.role, content: clean(m.content) }));
  if (!messages.length || messages[messages.length - 1].role !== 'user') return json({ error: 'Bad request' }, 400);

  const leadSent = body.leadSent === true;
  const page = clean(body.page, 120);
  const system =
    SYSTEM_PROMPT +
    `\n\n## Context\nThe visitor is currently on page: ${page || '/'}.` +
    (leadSent ? "\nThis visitor's enquiry has ALREADY been sent to Tim. Do not collect details again; just keep helping." : '');

  const convo = [{ role: 'system', content: system }, ...messages];

  try {
    let msg = await callModel(convo, token, !leadSent);
    let lead = null;

    const call = msg.tool_calls?.find((c) => c.function?.name === 'capture_lead');
    if (call) {
      let args = {};
      try { args = JSON.parse(call.function.arguments || '{}'); } catch { /* fall through */ }
      const email = clean(args.email, 200);
      const valid = clean(args.name, 120) && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      if (valid) {
        lead = {
          name: clean(args.name, 120),
          email,
          phone: clean(args.phone, 40),
          service: clean(args.service, 120),
          summary: clean(args.summary, 1500),
        };
      }
      // Hand the result back so the model can write a natural confirmation.
      convo.push(
        { role: 'assistant', content: msg.content || null, tool_calls: [call] },
        {
          role: 'tool',
          tool_call_id: call.id,
          content: valid ? 'Saved — enquiry is being sent to Tim now.' : 'Not saved: a valid name and email are required. Ask the visitor to check them.',
        },
      );
      msg = await callModel(convo, token, false);
    }

    const reply = clean(msg.content, 4000) || "Sorry, I lost my train of thought there — could you say that again?";
    return json({ reply, lead });
  } catch (err) {
    console.error('[chat]', err.message);
    return json({ error: 'The assistant is having a moment. You can email thedalycreative@gmail.com or call 0414 265 050.' }, 502);
  }
}

export function GET() {
  return json({ ok: true, models: MODELS });
}
