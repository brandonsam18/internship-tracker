// Specific roles for the Role filter. The data only has broad categories, so
// roles come from keywords in the job title. A posting can have several roles.
// When the title names no role, the data's category (Hardware, Quant, Product)
// is used instead; it is too noisy to trust over the title.

export const ROLES = [
  { id: "software", name: "Software Engineering", titlePattern: /software|\bswe\b|developer|programm/ },
  { id: "backend", name: "Backend", titlePattern: /back[- ]?end|server[- ]side|\bapis?\b/ },
  { id: "frontend", name: "Frontend & Web", titlePattern: /front[- ]?end|\bweb\b|\bui\b(?!\s*\/\s*ux)/ },
  { id: "full-stack", name: "Full Stack", titlePattern: /full[- ]?stack/ },
  { id: "mobile", name: "Mobile (iOS / Android)", titlePattern: /mobile|\bios\b|android/ },
  {
    id: "machine-learning",
    name: "Machine Learning & AI",
    titlePattern: /machine learning|\bml\b|\bai\b|artificial intelligence|deep learning|computer vision|\bnlp\b|\bllms?\b|generative|perception|reinforcement learning|robot learning|applied scien|speech/,
  },
  {
    id: "data-science",
    name: "Data Science & Analytics",
    titlePattern: /data scien|analytic|data analy|business intelligence|statistic/,
  },
  { id: "data-engineering", name: "Data Engineering", titlePattern: /data engineer|data platform|data infra|\betl\b/ },
  {
    id: "cloud-infrastructure",
    name: "Cloud & Infrastructure",
    titlePattern: /cloud|infrastructure|devops|site reliability|\bsre\b|platform engineer|network/,
  },
  { id: "security", name: "Security", titlePattern: /security|cyber/ },
  { id: "embedded", name: "Embedded & Firmware", titlePattern: /embedded|firmware/ },
  {
    id: "hardware",
    name: "Hardware & Electrical",
    titlePattern: /hardware|electrical|\basic\b|\bfpga\b|circuit|silicon|semiconductor|\bvlsi\b|\brf\b/,
    categories: ["Hardware", "Hardware Engineering"],
  },
  { id: "robotics", name: "Robotics", titlePattern: /robot/ },
  { id: "qa-testing", name: "QA & Testing", titlePattern: /\bqa\b|quality assurance|\btest|\bsdet\b/ },
  { id: "research", name: "Research", titlePattern: /research/ },
  { id: "quant", name: "Quant & Trading", titlePattern: /quant|trading|trader/, categories: ["Quant"] },
  {
    id: "product",
    name: "Product Management",
    titlePattern: /product manag|program manag|\bapm\b/,
    categories: ["Product", "Product Management"],
  },
  { id: "design", name: "Design (UI / UX)", titlePattern: /\bux\b|user experience|product design/ },
  { id: "game", name: "Game Development", titlePattern: /\bgames?\b|gameplay/ },
  { id: "co-op", name: "Co-op (any role)", titlePattern: /co-?op\b/ },
];

// Co-op is a kind of position, not a kind of work, so it doesn't stop the category fallback.
const CO_OP_ROLE = ROLES.find((role) => role.id === "co-op");
const WORK_ROLES = ROLES.filter((role) => role !== CO_OP_ROLE);

/** Returns the ids of every role a posting matches. */
export function roleIdsOf(posting) {
  const title = posting.title.toLowerCase();
  let roles = WORK_ROLES.filter((role) => role.titlePattern.test(title));
  if (roles.length === 0) {
    roles = WORK_ROLES.filter((role) => (role.categories ?? []).includes(posting.category));
  }
  if (CO_OP_ROLE.titlePattern.test(title)) roles.push(CO_OP_ROLE);
  return roles.map((role) => role.id);
}
