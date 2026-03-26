/**
 * Run after `npm start` (server on PORT, default 3000):
 *   node examples/api-client.example.mjs
 *
 * Template: GET health (expect 200) + POST JSON { text: "hello world" }.
 */

const base = `http://localhost:${process.env.PORT || 3000}`;

async function main() {
  // --- GET /health_check → expect 200 ---
  const healthRes = await fetch(`${base}/health_check`);
  if (healthRes.status !== 200) {
    throw new Error(`health_check: expected 200, got ${healthRes.status}`);
  }
  const healthJson = await healthRes.json();
  console.log('GET /health_check', healthRes.status, healthJson);

  // --- POST /echo with { text: "hello world" } → expect 200 ---
  const postRes = await fetch(`${base}/echo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'hello world' }),
  });
  if (postRes.status !== 200) {
    throw new Error(`/echo: expected 200, got ${postRes.status}`);
  }
  const postJson = await postRes.json();
  console.log('POST /echo', postRes.status, postJson);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
