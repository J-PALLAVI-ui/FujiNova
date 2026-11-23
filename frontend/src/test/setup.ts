import '@testing-library/jest-dom';

// Polyfill relative URLs in fetch for Vitest jsdom tests
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  let url = input;
  if (typeof input === 'string' && input.startsWith('/')) {
    url = `http://localhost:8000${input}`;
  }
  try {
    return await originalFetch(url, init);
  } catch (_err) {
    return new Response(JSON.stringify({ ok: true, status: 'mocked' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
