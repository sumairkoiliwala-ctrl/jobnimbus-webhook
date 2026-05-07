const JOBNIMBUS_API_KEY = process.env.JOBNIMBUS_API_KEY;
const JOBNIMBUS_API_BASE_URL = "https://app.jobnimbus.com/api1";

async function fetchContacts(path) {
  const response = await fetch(`${JOBNIMBUS_API_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${JOBNIMBUS_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  const rawBody = await response.text();

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    body = rawBody;
  }

  return {
    path,
    status: response.status,
    ok: response.ok,
    body,
  };
}

function simplifyUser(record) {
  return {
    jnid: record.jnid,
    id: record.id || record.jnid,
    display_name: record.display_name,
    first_name: record.first_name,
    last_name: record.last_name,
    email: record.email,
    is_user: record.is_user,
    profile_id: record.profile_id,
    profile_name: record.profile_name,
    owners: record.owners,
  };
}

export default async function handler(req, res) {
  try {
    const tests = [
      "/contacts?is_user=true",
      "/contacts?filter=is_user:true",
      "/contacts?type=user",
      "/contacts?record_type=user",
      "/contacts"
    ];

    const results = [];

    for (const path of tests) {
      const result = await fetchContacts(path);

      let simplifiedUsers = [];

      if (result.ok && result.body && Array.isArray(result.body.results)) {
        simplifiedUsers = result.body.results
          .filter((record) => record.is_user === true)
          .map(simplifyUser);
      }

      results.push({
        path,
        status: result.status,
        ok: result.ok,
        count: result.body?.count,
        users_found: simplifiedUsers.length,
        users: simplifiedUsers,
      });
    }

    return res.status(200).json({
      message: "User finder complete",
      results,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}