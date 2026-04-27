const JOBNIMBUS_API_KEY = process.env.JOBNIMBUS_API_KEY;
const JOBNIMBUS_API_URL = "https://app.jobnimbus.com/api1/jobs";

const FIELD_STATUS_MAP = [
  {
    field: "Inspection Status",
    value: "Scheduled",
    record_type_name: "Storm Restoration \u2013 Sales",
    status_name: "Inspection Scheduled \u2013 Awaiting Appointment",
  },
  {
    field: "Inspection Status",
    value: "Completed",
    record_type_name: "Storm Restoration \u2013 Sales",
    status_name: "Inspection Complete \u2013 Awaiting Review",
  },
  {
    field: "Adjuster Date",
    value: "filled",
    record_type_name: "Storm Restoration \u2013 Claim",
    status_name: "Adjuster Date Set \u2013 Homeowner Notified",
  },
  {
    field: "Build Scheduled Date",
    value: "filled",
    record_type_name: "Storm Restoration \u2013 Production",
    status_name: "Build Scheduled",
  },
  {
    field: "Build Complete Date",
    value: "filled",
    record_type_name: "Storm Restoration \u2013 Production",
    status_name: "Build Complete",
  },
];

async function updateJobStatus(jnid, record_type_name, status_name) {
  const response = await fetch(`${JOBNIMBUS_API_URL}/${jnid}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${JOBNIMBUS_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ record_type_name, status_name }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`API Error ${response.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

function isFilled(value) {
  return value !== null && value !== undefined && value !== "" && value !== 0;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const job = req.body;
    if (!job || !job.jnid) {
      return res.status(400).json({ error: "Missing jnid" });
    }
    const jnid = job.jnid;
    console.log(`Job: ${jnid} | Type: ${job.record_type_name} | Status: ${job.status_name}`);
    const results = [];
    for (const mapping of FIELD_STATUS_MAP) {
      const fieldValue = job[mapping.field];
      let shouldUpdate = mapping.value === "filled" ? isFilled(fieldValue) : fieldValue === mapping.value;
      if (shouldUpdate && job.record_type_name === mapping.record_type_name) {
        if (job.status_name === mapping.status_name) {
          console.log(`Already at: ${mapping.status_name}`);
          continue;
        }
        console.log(`Updating ${jnid} → ${mapping.status_name}`);
        const result = await updateJobStatus(jnid, mapping.record_type_name, mapping.status_name);
        results.push({ field: mapping.field, status_updated_to: mapping.status_name, success: true });
        console.log(`✅ Updated: ${mapping.status_name}`);
        break;
      }
    }
    if (results.length === 0) {
      return res.status(200).json({ message: "No matching conditions", jnid });
    }
    return res.status(200).json({ message: "Status updated", jnid, updates: results });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}