const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const ADMIN_EMAIL = "grant.chaplin@hotmail.com";
const SITE_URL = process.env.URL || "https://tututrade.co.uk";

async function sendEmail(to, subject, html) {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "TutuTrade <hello@tututrade.co.uk>",
        to: [to],
        subject,
        html,
      }),
    });
    if (!res.ok) console.error("Email send failed:", await res.text());
  } catch (e) {
    console.error("Email error:", e);
  }
}

const emailWrap = (content) => `
  <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:2rem;background:#1a1228;color:#f0eaf8;border-radius:12px">
    <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1.5rem">
      <div style="width:34px;height:34px;background:linear-gradient(135deg,#c9a96e,#e8a0b4);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1rem">🩰</div>
      <div style="font-family:Georgia,serif;font-size:1.2rem;color:#e8d5aa">TutuTrade</div>
    </div>
    ${content}
    <div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #3d2f5c;font-size:.72rem;color:#8a7a9e">
      <a href="${SITE_URL}" style="color:#c9a96e">tututrade.co.uk</a>
    </div>
  </div>
`;

exports.handler = async (event) => {
  // Stripe requires the raw body for signature verification
  const body = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;

  const sig = event.headers["stripe-signature"];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object;
    const { listing_id, buyer_email, seller_email, commission_pct } = session.metadata;
    const amountPaid = (session.amount_total / 100).toFixed(2);
    const commissionPct = parseFloat(commission_pct || 0);
    const commission = (amountPaid * commissionPct / 100).toFixed(2);
    const sellerReceives = (amountPaid - commission).toFixed(2);

    // 1. Mark listing as sold in DB
    const { error: updateErr } = await supabase
      .from("listings")
      .update({ sold: true, sold_at: new Date().toISOString() })
      .eq("id", listing_id);

    if (updateErr) console.error("Failed to mark sold:", updateErr);

    // 2. Fetch listing details for emails
    const { data: listing } = await supabase
      .from("listings")
      .select("*")
      .eq("id", listing_id)
      .single();

    const title = listing?.title || "Item";
    const sellerName = listing?.seller_name || "Seller";
    const sellerPaypal = listing?.seller_paypal || seller_email;

    // 3. Email buyer — payment confirmed
    await sendEmail(
      buyer_email,
      `✅ Purchase confirmed — ${title}`,
      emailWrap(`
        <h2 style="color:#c9a96e;margin-bottom:1rem">Payment confirmed! 🎉</h2>
        <p style="color:#a892c4;margin-bottom:1rem">
          You've successfully purchased <strong style="color:#f0eaf8">${title}</strong> for <strong style="color:#6fcf97">£${amountPaid}</strong>.
        </p>
        <p style="color:#a892c4;margin-bottom:1.25rem">
          The seller will be in touch to arrange collection or postage.
          You can message them directly on <a href="${SITE_URL}" style="color:#c9a96e">TutuTrade</a>.
        </p>
        <a href="${SITE_URL}" style="display:inline-block;padding:.75rem 1.5rem;background:#c9a96e;color:#1a1228;border-radius:8px;text-decoration:none;font-weight:600">
          Go to TutuTrade →
        </a>
      `)
    );

    // 4. Email seller — item sold, payout coming
    await sendEmail(
      seller_email,
      `🎉 Your item sold — ${title}`,
      emailWrap(`
        <h2 style="color:#c9a96e;margin-bottom:1rem">Your item sold! 🎉</h2>
        <p style="color:#a892c4;margin-bottom:1rem">
          <strong style="color:#f0eaf8">${title}</strong> has been purchased for <strong style="color:#6fcf97">£${amountPaid}</strong>.
        </p>
        <div style="padding:1rem;background:#2d2142;border-left:3px solid #6fcf97;border-radius:6px;margin-bottom:1.25rem">
          <div style="color:#a892c4;font-size:.82rem;margin-bottom:.35rem">Your payout (after ${commissionPct}% platform fee)</div>
          <div style="color:#6fcf97;font-size:1.4rem;font-weight:700">£${sellerReceives}</div>
          <div style="color:#a892c4;font-size:.75rem;margin-top:.25rem">Sent to ${sellerPaypal} within 24 hours</div>
        </div>
        <p style="color:#a892c4;margin-bottom:1.25rem">
          Please arrange collection or postage with the buyer via
          <a href="${SITE_URL}" style="color:#c9a96e">TutuTrade messages</a>.
        </p>
        <a href="${SITE_URL}" style="display:inline-block;padding:.75rem 1.5rem;background:#c9a96e;color:#1a1228;border-radius:8px;text-decoration:none;font-weight:600">
          Go to TutuTrade →
        </a>
      `)
    );

    // 5. Email admin (Grant) — action required: pay seller
    await sendEmail(
      ADMIN_EMAIL,
      `💰 New sale: ${title} — £${amountPaid} | Pay seller £${sellerReceives}`,
      `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:2rem;background:#0d0a14;color:#f0eaf8;border-radius:12px">
          <h2 style="color:#c9a96e;margin-bottom:1rem">🩰 TutuTrade — New Sale!</h2>
          <p style="color:#8a7a9e;margin-bottom:1.5rem">Payment received. Action required: pay the seller.</p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem">
            <tr><td style="padding:.5rem;color:#8a7a9e;border-bottom:1px solid #2e2340">Item</td><td style="padding:.5rem;border-bottom:1px solid #2e2340"><strong>${title}</strong></td></tr>
            <tr><td style="padding:.5rem;color:#8a7a9e;border-bottom:1px solid #2e2340">Seller</td><td style="padding:.5rem;border-bottom:1px solid #2e2340">${sellerName} (${seller_email})</td></tr>
            <tr><td style="padding:.5rem;color:#8a7a9e;border-bottom:1px solid #2e2340">Buyer</td><td style="padding:.5rem;border-bottom:1px solid #2e2340">${buyer_email}</td></tr>
            <tr><td style="padding:.5rem;color:#8a7a9e;border-bottom:1px solid #2e2340">Sale price</td><td style="padding:.5rem;border-bottom:1px solid #2e2340">£${amountPaid}</td></tr>
            <tr><td style="padding:.5rem;color:#8a7a9e;border-bottom:1px solid #2e2340">Your commission (${commissionPct}%)</td><td style="padding:.5rem;border-bottom:1px solid #2e2340;color:#c9a96e"><strong>£${commission}</strong></td></tr>
            <tr><td style="padding:.5rem;color:#8a7a9e">PAY SELLER</td><td style="padding:.5rem;color:#6fcf97;font-size:1.2rem"><strong>£${sellerReceives}</strong></td></tr>
          </table>
          <a href="https://www.paypal.com/send?recipient=${encodeURIComponent(sellerPaypal)}&amount=${sellerReceives}&currency_code=GBP"
             style="display:inline-block;padding:.85rem 1.75rem;background:#0070ba;color:white;border-radius:8px;text-decoration:none;font-weight:600;font-size:1rem">
            Pay £${sellerReceives} to ${sellerPaypal} via PayPal →
          </a>
        </div>
      `
    );

    // 6. In-app notification to seller
    await supabase.from("notifications").insert([{
      user_email: seller_email,
      type: "item_sold",
      title: "🎉 Your item sold!",
      body: `"${title}" sold for £${amountPaid}. You'll receive £${sellerReceives} within 24 hours.`,
      listing_id: listing_id,
    }]);

    console.log(`Sale processed: ${title} — £${amountPaid}, seller payout £${sellerReceives} to ${sellerPaypal}`);
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
