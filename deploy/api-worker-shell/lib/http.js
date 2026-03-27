export function applyCorsHeaders(headers, env, request) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = (env.APP_CORS_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const fallbackOrigin = env.APP_FRONTEND_URL ?? '*';
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : fallbackOrigin;
  headers.set('Access-Control-Allow-Origin', allowOrigin);
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Access-Control-Allow-Headers', 'content-type, authorization');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  headers.set('Vary', 'Origin');
}

export function jsonResponse(status, payload, env, request, extraHeaders = {}) {
  const headers = new Headers({
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...extraHeaders,
  });
  applyCorsHeaders(headers, env, request);
  return new Response(JSON.stringify(payload), { status, headers });
}

export function redirectResponse(location, env, request, cookies = []) {
  const headers = new Headers({
    location,
    'cache-control': 'no-store',
  });
  applyCorsHeaders(headers, env, request);
  for (const cookie of cookies) {
    headers.append('set-cookie', cookie);
  }
  return new Response(null, { status: 302, headers });
}

export function handlePreflight(env, request) {
  const headers = new Headers();
  applyCorsHeaders(headers, env, request);
  return new Response(null, { status: 204, headers });
}
