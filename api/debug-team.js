const JOBNIMBUS_API_KEY = process.env.JOBNIMBUS_API_KEY;

export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://app.jobnimbus.com/api2/team?activeUserFilter=true",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${JOBNIMBUS_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const rawBody = await response.text();

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      body = rawBody;
    }

    return res.status(200).json({
      message: "JobNimbus api2 team endpoint test",
      status: response.status,
      ok: response.ok,
      body,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}