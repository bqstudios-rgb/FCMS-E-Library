import { hashPassword } from '../../utils/crypto.js';

export async function onRequestPost(context) {
    const { request, env } = context;
    const secret = request.headers.get("x-seed-secret");
    
    if (!env.SEED_SECRET || secret !== env.SEED_SECRET) {
        return new Response("Unauthorized", { status: 401 });
    }
    
    const check = await env.DB.prepare("SELECT COUNT(*) as count FROM admins").first();
    if (check.count > 0) {
        return new Response("Owner exists", { status: 403 });
    }
    
    const body = await request.json();
    const { hash, salt } = await hashPassword(body.password);
    
    await env.DB.prepare("INSERT INTO admins (id, email, password_hash, password_salt, role) VALUES (?, ?, ?, ?, 'owner')")
        .bind(crypto.randomUUID(), body.email, hash, salt)
        .run();
        
    return new Response(JSON.stringify({ success: true }), { 
        status: 201, 
        headers: { "Content-Type": "application/json" } 
    });
}
