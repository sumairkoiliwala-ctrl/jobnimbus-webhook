// ============================================================
// JobNimbus → Vercel Webhook Handler
// Updates job status when custom fields are modified
// ============================================================
// SETUP:
// 1. Add JOBNIMBUS_API_KEY to Vercel environment variables
// 2. Add this webhook URL in JobNimbus:
//    Settings → Integrations → Webhooks → + Add Webhook
//    URL: https://YOUR-VERCEL-URL/api/webhook
//    Events: Job Modified
// ============================================================

const JOBNIMBUS_API_KEY = process.env.JOBNIMBUS_API_KEY; // Add in Vercel dashboard
const JOBNIMBUS_API_URL = "https://app.jobnimbus.com/api1/jobs";

// ── Property → Status Mapping ────────────────────────────────
const FIELD_STATUS_MAP = [
  {
    field: "cf_JobInspectionStatus",
    value: "Scheduled",
    record_type_name: "Storm Restoration – Sales",
    status_name: "Inspection Scheduled – Awaiting Appointment",
  },
  {
    field: "cf_JobInspectionStatus",
    value: "Completed",
    record_type_name: "Storm Restoration – Sales",
    status_name: "Inspection Complete – Awaiting Review",
  },
  {
    field: "cf_JobInspectionDate",
    value: "filled",
    record_type_name: "Storm Restoration – Sales",
    status_name: "Inspection Scheduled – Awaiting Appointment",
  },
  {
    field: "cf_JobInspectionCompleted",
    value: "filled",
    record_type_name: "Storm Restoration – Sales",
    status_name: "Inspection Complete – Awaiting Review",
  },
  {
    field: "cf_JobAdjusterDate",
    value: "filled",
    record_type_name: "Storm Restoration – Claim",
    status_name: "Adjuster Date Set – Homeowner Notified",
  },
  {
    field: "cf_JobBuildScheduledDate",
    value: "filled",
    record_type_name: "Storm Restoration – Production",
    status_name: "Build Scheduled",
  },
  {
    field: "cf_JobBuildCompleteDate",
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
    body: JSON.stringify({
      record_type_name,
      status_name,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`API Error ${response.status}: ${JSON.stringify(data)}`);
  }

  return data;
}

// ── Check if field is filled ──────────────────────────────────
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

    if (!job || !job.jnid) {
      return res.status(400).json({ error: "Invalid payload — missing jnid" });
    }

    const jnid = job.jnid;
    const results = [];

    console.log(`Processing webhook for job: ${jnid}`);
    console.log(`Job type: ${job.record_type_name}`);
    console.log(`Job status: ${job.status_name}`);

    for (const mapping of FIELD_STATUS_MAP) {
      const fieldValue = job[mapping.field];

      let shouldUpdate = false;

      if (mapping.value === "filled") {
        shouldUpdate = isFilled(fieldValue);
      } else {
        shouldUpdate = fieldValue === mapping.value;
      }

      if (
        shouldUpdate &&
        job.record_type_name === mapping.record_type_name
      ) {
        if (job.status_name === mapping.status_name) {
          console.log(`Skipping — already at status: ${mapping.status_name}`);
          continue;
        }

        console.log(`Updating job ${jnid} → ${mapping.status_name}`);

        const result = await updateJobStatus(
          jnid,
          mapping.record_type_name,
          mapping.status_name
        );

        results.push({
          field: mapping.field,
          status_name: mapping.status_name,
          success: true,
          result,
        });

        break;
      }
    }

    if (results.length === 0) {
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
    console.error("Webhook handler error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
