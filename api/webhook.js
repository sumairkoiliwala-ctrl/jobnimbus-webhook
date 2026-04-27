export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const job = req.body;
  console.log("v3 running - job:", job?.jnid, "status:", job?.status_name);
  return res.status(200).json({ message: "v3 running", jnid: job?.jnid });
}