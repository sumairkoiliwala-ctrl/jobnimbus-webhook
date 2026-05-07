const JOBNIMBUS_API_KEY = process.env.JOBNIMBUS_API_KEY;
const JOBNIMBUS_API_BASE_URL = "https://app.jobnimbus.com/api1";

const TEST_ENDPOINTS = [
  "/users",
  "/team",
  "/teams",
  "/groups",
  "/settings/groups",
  "/settings/team",
  "/settings/users",
  "/profile",
  "/me",
];

async function testEndpoint(path) {
  try {
    const response = await fetch(`${JOBNIMBUS_API_BASE_URL}${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${JOBNIMBUS_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const rawBody = await response.text();

    let parsedBody;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      parsedBody = rawBody;
    }

    return {
      path,
      status: response.status,
      ok: response.ok,
      body: parsedBody,
    };
  } catch (error) {
    return {
      path,
      ok: false,
      error: error.message,
    };
  }
}

export default async function handler(req, res) {
  try {
    const results = [];

    for (const path of TEST_ENDPOINTS) {
      const result = await testEndpoint(path);
      results.push(result);
    }

    return res.status(200).json({
      message: "JobNimbus endpoint probe complete",
      results,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}