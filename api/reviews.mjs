// GET /api/reviews — Google Places (New) reviews for the homepage widget.
// Zero dependencies. Edge-compatible handler, matches the style of chat.mjs.
//
// ENV (one of the two is required):
//   GOOGLE_PLACE_ID     — direct Place ID, e.g. ChIJN1t_tDeuEmsRUsoyG83frY4
//   GOOGLE_PLACE_QUERY  — human-readable query ("The Daly Creative Fremantle WA").
//                         Used when GOOGLE_PLACE_ID is unset. Handy when the
//                         business is hard to find via the Place ID Finder
//                         (e.g. Google's "Daly" → "Daily" autocorrect quirk).
//   GOOGLE_PLACES_API_KEY  — always required.
//   GOOGLE_PLACE_CID    — optional. The listing's Maps CID; defaults to TDC's.
//                         Text-search results are only accepted if their
//                         googleMapsUri carries this CID, so a similarly
//                         named business can never be shown by mistake.
//
// Response:
//   { rating, total, reviews: [{ author, avatar, profileUri, rating, text, relativeTime, lang }], fetchedAt }

const PLACE_DETAILS_URL = (id) => `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`;
const SEARCH_TEXT_URL = 'https://places.googleapis.com/v1/places:searchText';
const DETAILS_FIELD_MASK = 'rating,userRatingCount,reviews';
const SEARCH_FIELD_MASK = 'places.id,places.googleMapsUri,places.rating,places.userRatingCount,places.reviews';
const DEFAULT_CID = '11023459336690584245';
const DEFAULT_PLACE_ID = 'ChIJsTC2N5gf6kARtcpnp9wx-5g'; // The Daly Creative, same listing as the CID above // The Daly Creative (matches the footer review link)
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

// Normalise either a Place Details response or a searchText entry into one shape.
const normalise = (place) => {
  const raw = Array.isArray(place?.reviews) ? place.reviews : [];
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
  return {
    rating: place?.rating || 0,
    total: place?.userRatingCount || 0,
    reviews,
    fetchedAt: new Date().toISOString(),
  };
};

async function fetchByPlaceId(placeId, apiKey) {
  const res = await fetch(PLACE_DETAILS_URL(placeId), {
    method: 'GET',
    headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': DETAILS_FIELD_MASK },
  });
  if (!res.ok) return { error: true, status: res.status, detail: (await res.text()).slice(0, 300) };
  return { place: await res.json() };
}

async function fetchByQuery(query, apiKey, cid) {
  const res = await fetch(SEARCH_TEXT_URL, {
    method: 'POST',
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': SEARCH_FIELD_MASK,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 10, includePureServiceAreaBusinesses: true }),
  });
  if (!res.ok) return { error: true, status: res.status, detail: (await res.text()).slice(0, 300) };
  const resp = await res.json();
  const places = Array.isArray(resp.places) ? resp.places : [];
  // Only accept the result whose Maps link carries our CID. Never fall back to "first result".
  const place = places.find((p) => new RegExp(`[?&]cid=${cid}(\\D|$)`).test(p.googleMapsUri || ''));
  if (!place) {
    console.warn('[reviews] no result matched CID', cid, places.map((p) => p.googleMapsUri));
    return { error: true, status: 404, detail: 'No result matched GOOGLE_PLACE_CID for GOOGLE_PLACE_QUERY' };
  }
  console.info('[reviews] matched place id', place.id, '(set GOOGLE_PLACE_ID to this to skip search)');
  return { place };
}

async function fetchByQueries(queries, apiKey, cid) {
  let last;
  for (const q of [...new Set(queries.filter(Boolean))]) {
    last = await fetchByQuery(q, apiKey, cid);
    if (!last.error || last.status !== 404) return last;
  }
  return last;
}

export async function GET(request) {
  const origin = request.headers.get('origin') || '';
  if (origin && !ALLOWED_ORIGIN.test(origin)) return json({ error: 'Forbidden' }, 403);

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID || DEFAULT_PLACE_ID;
  const placeQuery = process.env.GOOGLE_PLACE_QUERY;
  const placeCid = (process.env.GOOGLE_PLACE_CID || DEFAULT_CID).trim();
  if (!apiKey || (!placeId && !placeQuery)) return json({ error: 'Reviews are not configured yet.' }, 503);

  const now = Date.now();
  if (cache.data && cache.expires > now) {
    return json(cache.data, 200, { 'x-cache': 'HIT' });
  }

  try {
    // Prefer explicit Place ID; fall back to text search by query.
    const result = placeId ? await fetchByPlaceId(placeId, apiKey) : await fetchByQueries([placeQuery, 'The Daly Creative', 'The Daly Creative Perth'], apiKey, placeCid);

    if (result.error) {
      // Fall back to stale cache if we have one — better than a broken section
      if (cache.data) return json(cache.data, 200, { 'x-cache': 'STALE' });
      return json({ error: `Upstream ${result.status}`, detail: result.detail }, result.status === 404 ? 404 : 502);
    }

    const payload = normalise(result.place);
    cache = { data: payload, expires: now + CACHE_TTL_MS };
    return json(payload, 200, { 'x-cache': 'MISS' });
  } catch (err) {
    if (cache.data) return json(cache.data, 200, { 'x-cache': 'STALE-ERR' });
    return json({ error: 'Internal error' }, 500);
  }
}
