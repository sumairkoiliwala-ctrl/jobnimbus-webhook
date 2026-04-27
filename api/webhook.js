// ============================================================
// JobNimbus → Vercel Webhook Handler v3
// Correct field names confirmed from live payload
// ============================================================

const JOBNIMBUS_API_KEY = process.env.JOBNIMBUS_API_KEY;
const JOBNIMBUS_API_URL = "https://app.jobnimbus.com/api1/jobs";

// ── Field → Status Mapping (exact field names from payload) ──
const FIELD_STATUS_MAP = [
  {
    field: "Inspection Status",
    value: "Scheduled",
    record_type_name: "Storm Restoration – Sales",
    status_name: "Inspection Scheduled – Awaiting Appointment",
  },
  {
    field: "Inspection Status",
    value: "Completed",
    record_type_name: "Storm Restoration – Sales",
    status_name: "Inspection Complete – Awaiting Review",
  },
  {
    field: "Inspection Date",
    value: "filled",
    record_type_name: "Storm Restoration – Sales",
    status_name: "Inspection Scheduled – Awaiting Appointment",
  },
  {
    field: "Inspection Completed",
    value: "filled",
    record_type_name: "Storm Restoration – Sales",
    status_name: "Inspection Complete – Awaiting Review",
  },
  {
    field: "Adjuster Date",
    value: "filled",
    record_type_name: "Storm Restoration – Claim",
    status_name: "Adjuster Date Set – Homeowner Notified",
  },
  {
    field: "Build Scheduled Date",
    value: "filled",
    record_type_name: "Storm Restoration – Production",
    status_name: "Build Scheduled",
  },
  {
    field: "Build Complete Date",
    value: "filled",
    record_type_name: "Storm Restoration – Production",
    status_name: "Build Complete",
  },
];

// ── Update Job Status via API ─────────────────────────────────
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

// ── Main Handler ──────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const job = req.body;

    console.log(`Webhook received — Job: ${job?.jnid} | Type: ${job?.record_type_name} | Status: ${job?.status_name}`);

    if (!job || !job.jnid) {
      return res.status(400).json({ error: "Invalid payload — missing jnid" });
    }

    const jnid = job.jnid;
    const results = [];

    for (const mapping of FIELD_STATUS_MAP) {
      const fieldValue = job[mapping.field];

      let shouldUpdate = false;

      if (mapping.value === "filled") {
        shouldUpdate = isFilled(fieldValue);
      } else {
        shouldUpdate = fieldValue === mapping.value;
      }

      if (shouldUpdate && job.record_type_name === mapping.record_type_name) {

        // Skip if already on target status
        if (job.status_name === mapping.status_name) {
          console.log(`Skipping — already at: ${mapping.status_name}`);
          continue;
        }

        console.log(`Updating job ${jnid}: ${job.status_name} → ${mapping.status_name}`);

        const result = await updateJobStatus(
          jnid,
          mapping.record_type_name,
          mapping.status_name
        );

        results.push({
          field: mapping.field,
          value: fieldValue,
          status_updated_to: mapping.status_name,
          success: true,
        });

        console.log(`✅ Success: Job ${jnid} → ${mapping.status_name}`);

        // Break after first match
        break;
      }
    }

    if (results.length === 0) {
      console.log(`No matching conditions for job ${jnid}`);
      return res.status(200).json({
        message: "No matching field conditions — no update needed",
        jnid,
      });
    }

    return res.status(200).json({
      message: "Job status updated successfully",
      jnid,
      updates: results,
    });

  } catch (error) {
    console.error("Webhook error:", error.message);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}