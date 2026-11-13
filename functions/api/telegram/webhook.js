import { json } from '../../utils/auth.js';

const GB = 1073741824;

function formatBytes(bytes) {
  return `${(Number(bytes) / GB).toFixed(3)} GB`;
}

async function getCommandReply(command, env) {
  const db = env.DB;

  switch (command) {
    case '/start':
    case '/help':
      return `FCMS LIBRARY MONITOR

Available commands:

/status — System health
/stats — Library statistics
/uploads — Pending submissions
/storage — Storage and bandwidth
/logs — Recent admin activity
/help — Show commands`;

    case '/status': {
      await db.prepare('SELECT 1').first();

      const storageReady = Boolean(
        env.AWS_ACCESS_KEY_ID &&
        env.AWS_SECRET_ACCESS_KEY &&
        env.AWS_ENDPOINT_URL_S3 &&
        env.AWS_REGION &&
        env.DBRIJ_BUCKET
      );

      return `SYSTEM STATUS

Database: ONLINE
Storage configuration: ${storageReady ? 'CONFIGURED' : 'INCOMPLETE'}
Telegram monitor: ONLINE

Note: Storage configuration does not confirm live storage availability.`;
    }

    case '/stats': {
      const [p, a, d, f] = await db.batch([
        db.prepare("SELECT COUNT(*) AS n FROM submissions WHERE status = 'pending'"),
        db.prepare('SELECT COUNT(*) AS n FROM materials'),
        db.prepare('SELECT COALESCE(SUM(count), 0) AS n FROM download_counts'),
        db.prepare('SELECT COUNT(*) AS n FROM feedback')
      ]);

      return `LIBRARY STATISTICS

Pending submissions: ${p.results[0].n}
Approved materials: ${a.results[0].n}
Total downloads: ${d.results[0].n}
Feedback entries: ${f.results[0].n}`;
    }

    case '/uploads': {
      const result = await db.prepare(
        "SELECT COUNT(*) AS n FROM submissions WHERE status = 'pending'"
      ).first();

      return `SUBMISSION MONITOR

Pending submissions: ${result.n}

Use the FCMS admin dashboard to review and process submissions.`;
    }

    case '/storage': {
      const month = new Date().toISOString().slice(0, 7) + '%';

      const [s, m, d, c] = await db.batch([
        db.prepare("SELECT COUNT(*) AS files, COALESCE(SUM(CASE WHEN r2_original_key = COALESCE(r2_compressed_key, '') THEN 0 ELSE size_bytes END), 0) + COALESCE(SUM(compressed_size_bytes), 0) AS bytes FROM submissions"),
        db.prepare('SELECT COALESCE(SUM(bytes), 0) AS n FROM egress_log WHERE date LIKE ?').bind(month),
        db.prepare("SELECT COALESCE(SUM(bytes), 0) AS n FROM egress_log WHERE date >= date('now', '-30 day')"),
        db.prepare("SELECT COALESCE(SUM(count), 0) AS n FROM download_counts WHERE date >= date('now', '-30 day')")
      ]);

      return `STORAGE & BANDWIDTH

Tracked files: ${s.results[0].files}
Estimated storage: ${formatBytes(s.results[0].bytes)}
Storage limit: 5 GB

Bandwidth this month: ${formatBytes(m.results[0].n)}
Bandwidth (30 days): ${formatBytes(d.results[0].n)}
Bandwidth limit: 10 GB

Downloads (30 days): ${c.results[0].n}

Note: Storage is estimated from database records, not a live bucket measurement.`;
    }

    case '/logs': {
      const result = await db.prepare(
        'SELECT action, target_type, timestamp FROM activity_log ORDER BY timestamp DESC LIMIT 8'
      ).all();

      if (!result.results.length) return 'No admin activity recorded yet.';

      return 'RECENT ADMIN ACTIVITY\n\n' +
        result.results.map((entry, i) =>
          `${i + 1}. ${entry.action} | ${entry.target_type || 'N/A'}\n${entry.timestamp}`
        ).join('\n\n');
    }

    default:
      return 'Unknown command. Send /help to see available commands.';
  }
}

export async function onRequestPost({ request, env }) {
  const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');

  if (!secret || secret !== env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const update = await request.json();
    const message = update.message;

    if (!message?.text || String(message.from?.id) !== String(env.TELEGRAM_OWNER_ID)) {
      return json({ ok: true });
    }

    const command = message.text.trim().split(/\s+/)[0].split('@')[0];

    let reply;

    try {
      reply = await getCommandReply(command, env);
    } catch (error) {
      console.error('Telegram command failed:', error);
      reply = 'Unable to retrieve the requested information. Check the Cloudflare logs.';
    }

    const response = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_OWNER_ID,
          text: reply
        })
      }
    );

    if (!response.ok) {
      console.error('Telegram API rejected the message:', await response.text());
    }

    return json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return json({ ok: false }, 500);
  }
}
