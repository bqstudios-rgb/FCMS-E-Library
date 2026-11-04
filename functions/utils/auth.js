export async function verifyTurnstile(env, token, ip) {
  if (!token) return false;
  try {
    const formData = new FormData();
    formData.append('secret', env.TURNSTILE_SECRET);
    formData.append('response', token);
    if (ip) formData.append('remoteip', ip);
    
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    return data.success;
  } catch (e) {
    return false;
  }
}
