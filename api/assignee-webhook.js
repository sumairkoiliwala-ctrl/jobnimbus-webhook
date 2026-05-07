const JOBNIMBUS_API_KEY = process.env.JOBNIMBUS_API_KEY;
const JOBNIMBUS_API_URL = "https://app.jobnimbus.com/api1/jobs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const job = req.body;

  if (!job || !job.jnid) {
    return res.status(400).json({
      error: "Missing jnid",
    });
  }

  if (!job.status_name) {
    return res.status(400).json({
      error: "Missing status_name",
      jnid: job.jnid,
    });
  }

  return res.status(200).json({
    message: "Assignee webhook received job data",
    jnid: job.jnid,
    status_name: job.status_name,
  });
}