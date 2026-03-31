exports.handler = async () => {
  const { createClient } = require("@supabase/supabase-js");
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // Expire listings past their expires_at
  const { data: toExpire } = await supabase
    .from("listings")
    .select("id, title, seller_email, expires_at")
    .eq("expired", false)
    .eq("sold", false)
    .lt("expires_at", new Date().toISOString());

  if (toExpire?.length) {
    await supabase.from("listings").update({ expired: true }).in("id", toExpire.map(l => l.id));
    for (const l of toExpire) {
      await supabase.from("notifications").insert([{
        user_email: l.seller_email,
        type: "listing_expiring",
        title: "⏰ Your listing has expired",
        body: `"${l.title}" has been archived after 60 days. Log in to renew it.`,
        listing_id: l.id,
      }]);
    }
  }

  // Warn listings expiring within 7 days
  const sevenDays = new Date(Date.now() + 7*24*60*60*1000).toISOString();
  const { data: toWarn } = await supabase
    .from("listings")
    .select("id, title, seller_email, expires_at")
    .eq("expired", false)
    .eq("expiry_warned", false)
    .eq("sold", false)
    .lt("expires_at", sevenDays)
    .gt("expires_at", new Date().toISOString());

  if (toWarn?.length) {
    await supabase.from("listings").update({ expiry_warned: true }).in("id", toWarn.map(l => l.id));
    for (const l of toWarn) {
      const daysLeft = Math.ceil((new Date(l.expires_at) - new Date()) / 86400000);
      await supabase.from("notifications").insert([{
        user_email: l.seller_email,
        type: "listing_expiring",
        title: "⏳ Listing expiring soon",
        body: `"${l.title}" will be archived in ${daysLeft} day${daysLeft!==1?"s":""} unless you renew it.`,
        listing_id: l.id,
      }]);
    }
  }

  return { statusCode: 200, body: JSON.stringify({ expired: toExpire?.length || 0, warned: toWarn?.length || 0 }) };
};
