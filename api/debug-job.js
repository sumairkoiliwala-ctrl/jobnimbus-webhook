const JOBNIMBUS_API_KEY = process.env.JOBNIMBUS_API_KEY;
const JOBNIMBUS_API_URL = "https://app.jobnimbus.com/api1/jobs";

export default async function handler(req, res) {
  try {
    const { jnid } = req.query;

    if (!jnid) {
      return res.status(400).json({
        error: "Missing jnid. Use /api/debug-job?jnid=REAL_JOB_ID",
      });
    }

    const response = await fetch(`${JOBNIMBUS_API_URL}/${jnid}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${JOBNIMBUS_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json({
      jnid: data.jnid,
      status_name: data.status_name,
      record_type_name: data.record_type_name,
      owners: data.owners || [],
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}