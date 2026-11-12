// GET /api/reviews — Google Places (New) reviews for the homepage widget.
// Zero dependencies. Edge-compatible handler, matches the style of chat.mjs.
//
// ENV required:
//   GOOGLE_PLACES_API_KEY  — from Google Cloud Console (Places API (New) enabled)
//   GOOGLE_PLACE_ID        — e.g. ChIJN1t_tDeuEmsRUsoyG83frY4
//
// Response:
//   { rating, total, reviews: [{ author, avatar, profileUri, rating, text, relativeTime, lang }], fetchedAt }

const PLACES_URL = (id) => `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`;
const FIELD_MASK = 'rating,userRatingCount,reviews';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours in warm instance memory
const MIN_STARS = 4;                     // hide 1–3 star reviews
const MAX_REVIEWS = 5;                   // API returns at most 5
const ALLOWED_ORIGIN = /^https:\/\/((www\.)?thedalycreative\.(com|net|xyz|info|shop|store)|tdc-website-v27[a-z0-9-]*\.vercel\.app)$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

let cache = { data: null, expires: 0 };

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      ...headers,
    },
  });

export async function GET(request) {
  const origin = request.headers.get('origin') || '';
  if (origin && !ALLOWED_ORIGIN.test(origin)) return json({ error: 'Forbidden' }, 403);

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!apiKey || !placeId) return json({ error: 'Reviews are not configured yet.' }, 503);

  const now = Date.now();
  if (cache.data && cache.expires > now) {
    return json(cache.data, 200, { 'x-cache': 'HIT' });
  }

  try {
    const res = await fetch(PLACES_URL(placeId), {
      method: 'GET',
      headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': FIELD_MASK },
    });

    if (!res.ok) {
      const detail = await res.text();
      // Fall back to stale cache if we have one — better than a broken section
      if (cache.data) return json(cache.data, 200, { 'x-cache': 'STALE' });
      return json({ error: `Upstream ${res.status}`, detail: detail.slice(0, 300) }, 502);
    }

    const data = await res.json();
    const raw = Array.isArray(data.reviews) ? data.reviews : [];
    const reviews = raw
      .filter((r) => (r.rating || 0) >= MIN_STARS)
      .slice(0, MAX_REVIEWS)
      .map((r) => ({
        author: r.authorAttribution?.displayName || 'Google reviewer',
        avatar: r.authorAttribution?.photoUri || null,
        profileUri: r.authorAttribution?.uri || null,
        rating: r.rating || 0,
        text: (r.text?.text || r.originalText?.text || '').slice(0, 700),
        relativeTime: r.relativePublishTimeDescription || '',
        lang: r.text?.languageCode || r.originalText?.languageCode || 'en',
      }));

    const payload = {
      rating: data.rating || 0,
      total: data.userRatingCount || 0,
      reviews,
      fetchedAt: new Date().toISOString(),
    };

    cache = { data: payload, expires: now + CACHE_TTL_MS };
    return json(payload, 200, { 'x-cache': 'MISS' });
  } catch (err) {
    if (cache.data) return json(cache.data, 200, { 'x-cache': 'STALE-ERR' });
    return json({ error: 'Internal error' }, 500);
  }
}
