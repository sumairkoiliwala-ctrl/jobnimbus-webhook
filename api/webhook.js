// ============================================================
// JobNimbus → Vercel Webhook Handler v2
// Logs full payload + updates job status on field changes
// ============================================================

const JOBNIMBUS_API_KEY = process.env.JOBNIMBUS_API_KEY;
const JOBNIMBUS_API_URL = "https://app.jobnimbus.com/api1/jobs";

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

    // ── LOG FULL PAYLOAD ──────────────────────────────────────
    console.log("=== JOBNIMBUS WEBHOOK RECEIVED ===");
    console.log("Full payload:", JSON.stringify(job, null, 2));
    console.log("=== END PAYLOAD ===");

    if (!job || !job.jnid) {
      console.log("ERROR: Missing jnid in payload");
      return res.status(400).json({ error: "Invalid payload — missing jnid" });
    }

    const jnid = job.jnid;
    console.log(`Job ID: ${jnid}`);
    console.log(`Job Type: ${job.record_type_name}`);
    console.log(`Job Status: ${job.status_name}`);
    console.log(`All keys in payload: ${Object.keys(job).join(", ")}`);

    // ── FIELD → STATUS MAP ────────────────────────────────────
    // We log all field values to find the correct key names
    const fieldsToCheck = [
      "cf_JobInspectionStatus",
      "Inspection Status",
      "inspection_status",
      "InspectionStatus",
      "cf_inspection_status",
      "cf_JobInspectionDate",
      "Inspection Date",
      "inspection_date",
      "cf_JobInspectionCompleted",
      "Inspection Completed",
      "cf_JobAdjusterDate",
      "Adjuster Date",
      "adjuster_date",
      "cf_JobBuildScheduledDate",
      "Build Scheduled Date",
      "cf_JobBuildCompleteDate",
      "Build Complete Date",
    ];

    console.log("=== CHECKING FIELD VALUES ===");
    for (const field of fieldsToCheck) {
      if (job[field] !== undefined) {
        console.log(`FOUND → ${field}: ${job[field]}`);
      }
    }
    console.log("=== END FIELD CHECK ===");

    return res.status(200).json({
      message: "Webhook received and logged — check Vercel logs for payload",
      jnid,
      received_keys: Object.keys(job),
    });

  } catch (error) {
    console.error("Webhook handler error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}