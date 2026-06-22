const buckets = new Map();

const blockedTerms = [
  "casino",
  "crypto",
  "viagra",
  "loan",
  "porn",
  "seo backlink",
  "rank higher",
  "whatsapp marketing",
  "telegram",
];

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

function allowed(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const maxHits = 5;
  const current = buckets.get(ip) || { count: 0, resetAt: now + windowMs };

  if (now > current.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  current.count += 1;
  buckets.set(ip, current);
  return current.count <= maxHits;
}

function badPayload(body) {
  const text = [body.name, body.reply, body.phone, body.trade, body.message]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return blockedTerms.some((term) => text.includes(term));
}

async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret,
      response: token,
      remoteip: ip,
    }),
  });

  if (!response.ok) return false;
  const result = await response.json();
  return Boolean(result.success);
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false });
  }

  const webhook = process.env.CONTACT_WEBHOOK_URL;
  if (!webhook) {
    return res.status(503).json({ ok: false });
  }

  const ip = clientIp(req);
  if (!allowed(ip)) {
    return res.status(429).json({ ok: false });
  }

  const body = req.body || {};
  const started = Number(body.started || 0);
  const elapsed = Date.now() - started;

  if (body.company_url || !started || elapsed < 3500 || elapsed > 60 * 60 * 1000) {
    return res.status(400).json({ ok: false });
  }

  if (!body.name || !body.reply || !body.message || badPayload(body)) {
    return res.status(400).json({ ok: false });
  }

  const turnstileOk = await verifyTurnstile(body.turnstileToken, ip);
  if (!turnstileOk) {
    return res.status(403).json({ ok: false });
  }

  const payload = {
    source: "gebaeudetechnik-muriqi.de",
    receivedAt: new Date().toISOString(),
    ip,
    name: String(body.name).slice(0, 160),
    reply: String(body.reply).slice(0, 200),
    phone: String(body.phone || "").slice(0, 80),
    trade: String(body.trade || "").slice(0, 80),
    message: String(body.message).slice(0, 4000),
  };

  const response = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return res.status(502).json({ ok: false });
  }

  return res.status(200).json({ ok: true });
};
