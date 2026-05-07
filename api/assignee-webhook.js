const JOBNIMBUS_API_KEY = process.env.JOBNIMBUS_API_KEY;
const JOBNIMBUS_API_URL = "https://app.jobnimbus.com/api1/jobs";

const STATUS_GROUP_MAP = {
  "New Lead – Uncontacted": ["Sales Rep"],
  "Contact Attempted – Awaiting Response": ["Sales Rep"],
  "Contact Made – Pre-Qualified": ["Sales Rep"],
  "Inspection Scheduled – Awaiting Appointment": ["Sales Rep"],
  "Inspection Confirmed – 24hr Reminder Sent": ["Sales Rep"],
  "Inspection Complete – Awaiting Review": ["Sales Rep"],
  "Photos Uploaded – QC Complete": ["Sales Rep"],
  "Damage Found – Contingency Needed": ["Sales Rep"],
  "Contingency Signed – Awaiting Claim Filing": ["Sales Rep"],

  "Claim Filed – Awaiting Adjuster Date": ["Project Managers"],
  "Adjuster Date Set – Homeowner Notified": ["Project Managers"],
  "Adjuster Meeting Complete – Awaiting Estimate": ["Project Managers"],

  "Estimate Received – Initial Review": ["Estimator"],
  "Supplement Needed": ["Estimator"],
  "Supplement Submitted – Awaiting Response": ["Estimator"],
  "Supplement Rejected / Partial Approval": ["Estimator"],
  "Supplement Approved – Full Scope Confirmed": ["Estimator"],

  "Permit Pending": ["Production Coordinator"],
  "Mortgage Check / Funding Verified": ["Finance", "Production Coordinator"],
  "Material Selection Complete – Awaiting Order": ["Production Coordinator"],
  "Material Order Placed": ["Production Coordinator"],
  "Build Scheduled": ["Production Coordinator"],

  "Build Complete": ["Production Manager"],

  "Awaiting Final Walkthrough": ["Project Managers"],
  "Walkthrough Complete – Punch List in Progress": ["Project Managers"],
  "Punch List Complete – Awaiting Invoice": ["Finance"],
  "Final Payment Received & Lien Waiver Signed": ["Finance"],

  "CSAT Survey & Referral Program Sent": ["Marketing"],
  "Warranty Registered": ["Production Coordinator"],

  "Claim Denied": ["Project Managers"],
  "Re-Inspection Required": ["Project Managers"],
  "Appeal in Progress": ["Estimator", "Project Managers"],
  "Job Cancelled / Closed-Lost": ["Sales Rep"],
};

const GROUP_OWNER_MAP = {
  "Sales Rep": [
    { id: "mmdza6lby9ssyqk3hmu0p34" }, // Ashley Hahne
    { id: "f0289953141744e3aff019ac894e9b21" }, // Grayson Colton
  ],
};

function normalizeStatus(value) {
  return String(value || "")
    .replace(/–/g, "-")
    .replace(/—/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function getOwnersByStatus(statusName) {
  const normalizedIncomingStatus = normalizeStatus(statusName);

  const matchedStatus = Object.keys(STATUS_GROUP_MAP).find((mappedStatus) => {
    return normalizeStatus(mappedStatus) === normalizedIncomingStatus;
  });

  const groups = matchedStatus ? STATUS_GROUP_MAP[matchedStatus] : [];

  const owners = groups.flatMap((groupName) => {
    return GROUP_OWNER_MAP[groupName] || [];
  });

  return {
    matchedStatus,
    groups,
    owners,
  };
}

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

  const { matchedStatus, groups, owners } = getOwnersByStatus(job.status_name);

  return res.status(200).json({
    message: "Status mapped to assignee owners",
    jnid: job.jnid,
    status_name: job.status_name,
    matched_status: matchedStatus || null,
    groups,
    owners,
  });
}