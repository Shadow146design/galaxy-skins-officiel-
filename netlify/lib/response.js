export function jsonResponse(data, { status = 200, cookies = [] } = {}) {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  for (const c of cookies) headers.append('Set-Cookie', c);
  return new Response(JSON.stringify(data), { status, headers });
}

export function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, { status });
}
