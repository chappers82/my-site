const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { listingId, listingTitle, price, sellerEmail, buyerEmail, commissionPct } = JSON.parse(event.body);

    if (!listingId || !price || !buyerEmail) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
    }

    const baseUrl = process.env.URL || "https://tututrade.co.uk";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "gbp",
          product_data: {
            name: listingTitle,
            description: "Listed on TutuTrade — dancewear marketplace",
          },
          unit_amount: Math.round(price * 100), // Stripe uses pence
        },
        quantity: 1,
      }],
      mode: "payment",
      customer_email: buyerEmail,
      success_url: `${baseUrl}?purchase=success&listing_id=${listingId}`,
      cancel_url: `${baseUrl}?purchase=cancelled`,
      metadata: {
        listing_id: listingId,
        buyer_email: buyerEmail,
        seller_email: sellerEmail,
        commission_pct: String(commissionPct || 0),
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error("Stripe create-checkout error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
