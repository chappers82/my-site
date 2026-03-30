exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const apiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set");
    return { statusCode: 500, body: JSON.stringify({ error: "Email service not configured" }) };
  }

  try {
    const { to, subject, html } = JSON.parse(event.body);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "TutuTrade <hello@tututrade.co.uk>",
        to: [to],
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend error:", data);
      return { statusCode: response.status, body: JSON.stringify(data) };
    }

    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (error) {
    console.error("Email function error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
