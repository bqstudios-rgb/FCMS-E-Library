export async function onRequestGet() {
  return new Response(JSON.stringify({ status: "ok", brand: "FCMS Library", subtitle: "Communication and Media Studies", timestamp: Date.now() }), { headers: { 'Content-Type': 'application/json' } });
}
