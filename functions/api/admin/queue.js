export async function onRequestGet(context) {
  try {
    const { results } = await context.env.DB.prepare(
      "SELECT id, ticket_number, contributor_name, course_id, title, type, category, size_bytes, original_filename, created_at, status, lock_admin_id, lock_expires_at, version FROM submissions WHERE status = 'pending' ORDER BY created_at ASC"
    ).all();
    
    return new Response(JSON.stringify({ queue: results }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
