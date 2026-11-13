export async function notifyTelegram(env, message) {
  try {
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_OWNER_ID) return;

    await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_OWNER_ID,
          text: message
        })
      }
    );
  } catch (error) {
    console.error('Telegram notification failed:', error);
  }
}
