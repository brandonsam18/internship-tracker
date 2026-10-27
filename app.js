import { METRO_AREAS, STATE_NAMES, isRemoteUs, metroIdOf, stateCodeOf } from "./locations.js";
import { guessCompanyDomain, logoUrl } from "./logos.js";

const LISTINGS_URL =
  "https://raw.githubusercontent.com/SimplifyJobs/Summer2027-Internships/dev/.github/scripts/listings.json";
const APPLIED_STORAGE_KEY = "appliedPostings";
const PAGE_SIZE = 50;
const NEW_POSTING_DAYS = 3;
const SKELETON_CARD_COUNT = 6;
// Smaller icons are blurry when scaled up, so those companies keep their letter.
const MIN_LOGO_PIXELS = 32;
const AVATAR_COLORS = ["#4f46e5", "#0891b2", "#059669", "#d97706", "#db2777", "#7c3aed", "#2563eb", "#dc2626"];

const searchInput = document.getElementById("search-input");
const filtersToggle = document.getElementById("filters-toggle");
const activeFilterCount = document.getElementById("active-filter-count");
const filterPanel = document.getElementById("filter-panel");
const locationSelect = document.getElementById("location-select");
const categorySelect = document.getElementById("category-select");
const degreeSelect = document.getElementById("degree-select");
const termSelect = document.getElementById("term-select");
const statusTabs = document.querySelectorAll(".tab");
const appliedTotal = document.getElementById("applied-total");
const summary = document.getElementById("summary");
const message = document.getElementById("message");
const postingList = document.getElementById("posting-list");
const showMoreButton = document.getElementById("show-more-button");

let allPostings = [];
let appliedPostings = loadAppliedPostings();
let statusFilter = "all";
let visibleCount = PAGE_SIZE;

// Maps id -> ISO date string of when the user marked it applied.
function loadAppliedPostings() {
  try {
    return JSON.parse(localStorage.getItem(APPLIED_STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

function saveAppliedPostings() {
  try {
    localStorage.setItem(APPLIED_STORAGE_KEY, JSON.stringify(appliedPostings));
  } catch {
    showMessage("Couldn't save your applications in this browser (private mode?).", true);
  }
}

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
  message.hidden = false;
}

function matchesFilters(posting) {
  const query = searchInput.value.trim().toLowerCase();
  if (query) {
    const text = `${posting.company_name} ${posting.title}`.toLowerCase();
    if (!text.includes(query)) return false;
  }

  // Location values look like "all", "remote", "metro:<id>", or "state:<code>".
  const [locationKind, locationValue] = locationSelect.value.split(":");
  if (locationKind === "remote" && !posting.isRemoteUs) return false;
  if (locationKind === "metro" && !posting.metroIds.has(locationValue)) return false;
  if (locationKind === "state" && !posting.stateCodes.has(locationValue)) return false;

  if (categorySelect.value !== "all" && posting.category !== categorySelect.value) return false;
  if (termSelect.value !== "all" && !posting.terms.includes(termSelect.value)) return false;
  // Postings that don't list a degree aren't ruled out, so they match every degree.
  if (degreeSelect.value !== "all" && posting.degrees.length > 0 && !posting.degrees.includes(degreeSelect.value)) {
    return false;
  }

  const isApplied = posting.id in appliedPostings;
  if (statusFilter === "applied" && !isApplied) return false;
  if (statusFilter === "not-applied" && isApplied) return false;

  return true;
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatPostedAge(postedSeconds) {
  const days = Math.floor((Date.now() / 1000 - postedSeconds) / 86400);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return formatDate(new Date(postedSeconds * 1000));
}

function avatarColor(companyName) {
  let hash = 0;
  for (const character of companyName) {
    hash = (hash * 31 + character.charCodeAt(0)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

// Colored first letter, replaced by the company's logo once it loads.
function createAvatar(posting) {
  const avatar = createElement("div", "avatar");
  avatar.style.backgroundColor = avatarColor(posting.company_name);
  avatar.setAttribute("aria-hidden", "true");
  avatar.append(createElement("span", "avatar-letter", posting.company_name.trim().charAt(0).toUpperCase()));

  const domain = guessCompanyDomain(posting.company_name, posting.url);
  if (!domain) return avatar;
  // The logo stays invisible in the badge until it loads, so a missing logo never shows as a broken image.
  const logo = createElement("img", "avatar-logo");
  logo.alt = "";
  logo.loading = "lazy";
  logo.addEventListener("load", () => {
    if (logo.naturalWidth < MIN_LOGO_PIXELS) return;
    avatar.classList.add("has-logo");
    avatar.style.backgroundColor = "";
  });
  logo.src = logoUrl(domain);
  avatar.append(logo);
  return avatar;
}

function createTag(text, variant = "") {
  return createElement("span", `tag ${variant}`.trim(), text);
}

// Short tag text for the degrees a posting accepts, or null if it doesn't list any.
function degreeTagText(degrees) {
  if (degrees.length === 0) return null;
  if (degrees.length === 1 && degrees[0] !== "Bachelor's") return `${degrees[0]} only`;
  return degrees.join(" · ");
}

const SPONSORSHIP_TAGS = {
  "Does Not Offer Sponsorship": "No visa sponsorship",
  "U.S. Citizenship is Required": "U.S. citizens only",
  "Offers Sponsorship": "Sponsors visas",
};

function createPostingItem(posting) {
  const appliedDate = appliedPostings[posting.id];
  const item = createElement("li", "posting");
  item.classList.toggle("applied", Boolean(appliedDate));

  const avatar = createAvatar(posting);

  const info = createElement("div", "posting-info");
  const heading = createElement("div", "posting-heading");
  heading.append(createElement("h2", "title", posting.title));
  info.append(createElement("p", "company", posting.company_name), heading);

  const tags = createElement("div", "tags");
  const locationText =
    posting.locations.length > 2
      ? `${posting.locations.slice(0, 2).join(" · ")} +${posting.locations.length - 2} more`
      : posting.locations.join(" · ");
  if (locationText) tags.append(createTag(locationText));
  for (const term of posting.terms.filter((term) => term !== "N/A")) {
    tags.append(createTag(term));
  }
  const degreeText = degreeTagText(posting.degrees);
  if (degreeText) {
    const acceptsBachelors = posting.degrees.includes("Bachelor's") || posting.degrees.includes("Associate's");
    tags.append(createTag(`🎓 ${degreeText}`, acceptsBachelors ? "tag-requirement" : "tag-warning"));
  }
  const sponsorshipText = SPONSORSHIP_TAGS[posting.sponsorship];
  if (sponsorshipText) tags.append(createTag(sponsorshipText, "tag-warning"));
  const ageDays = (Date.now() / 1000 - posting.date_posted) / 86400;
  if (ageDays < NEW_POSTING_DAYS) tags.append(createTag("New", "tag-new"));
  info.append(tags);

  const actions = createElement("div", "posting-actions");
  actions.append(createElement("span", "posted", formatPostedAge(posting.date_posted)));

  const applyLink = createElement("a", "button button-secondary", "Apply ↗");
  applyLink.href = posting.url;
  applyLink.target = "_blank";
  applyLink.rel = "noopener";
  applyLink.setAttribute("aria-label", `Apply to ${posting.title} at ${posting.company_name} (opens in a new tab)`);

  const appliedButton = createElement(
    "button",
    "button applied-button",
    appliedDate ? `✓ Applied ${formatDate(new Date(appliedDate))}` : "Mark applied",
  );
  appliedButton.type = "button";
  appliedButton.setAttribute("aria-pressed", String(Boolean(appliedDate)));
  appliedButton.addEventListener("click", () => toggleApplied(posting.id));

  const buttons = createElement("div", "posting-buttons");
  buttons.append(applyLink, appliedButton);
  actions.append(buttons);

  item.append(avatar, info, actions);
  return item;
}

function createSkeletonItem() {
  const item = createElement("li", "posting skeleton");
  item.setAttribute("aria-hidden", "true");
  const info = createElement("div", "posting-info");
  info.append(createElement("div", "skeleton-line short"), createElement("div", "skeleton-line"));
  item.append(createElement("div", "avatar"), info);
  return item;
}

function toggleApplied(postingId) {
  if (postingId in appliedPostings) {
    delete appliedPostings[postingId];
  } else {
    appliedPostings[postingId] = new Date().toISOString();
  }
  saveAppliedPostings();
  render();
}

function updateFilterCount() {
  const activeCount = [locationSelect, categorySelect, degreeSelect, termSelect].filter((select) => select.value !== "all").length;
  activeFilterCount.textContent = String(activeCount);
  activeFilterCount.hidden = activeCount === 0;
}

function render() {
  const matching = allPostings.filter(matchesFilters);
  const appliedCount = Object.keys(appliedPostings).length;
  appliedTotal.textContent = String(appliedCount);
  const noun = matching.length === 1 ? "internship" : "internships";
  summary.textContent = `${matching.length.toLocaleString()} ${noun}`;
  updateFilterCount();

  postingList.replaceChildren(...matching.slice(0, visibleCount).map(createPostingItem));
  showMoreButton.hidden = matching.length <= visibleCount;

  if (matching.length === 0) {
    const emptyText =
      statusFilter === "applied" && appliedCount === 0
        ? "No applications yet. Press \"Mark applied\" on a posting after you apply, and it will show up here."
        : "No internships match these filters. Try clearing the search or picking \"Anywhere\".";
    showMessage(emptyText);
  } else {
    message.hidden = true;
  }
}

function fillSelect(select, values) {
  for (const value of values) {
    select.append(new Option(value, value));
  }
}

function countBy(postings, getKeys) {
  const counts = new Map();
  for (const posting of postings) {
    for (const key of getKeys(posting)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

function createOptionGroup(label, options) {
  const group = document.createElement("optgroup");
  group.label = label;
  for (const [text, value, count] of options) {
    group.append(new Option(`${text} (${count.toLocaleString()})`, value));
  }
  return group;
}

// Adds metro areas and states that have at least one posting, with posting counts.
function fillLocationSelect() {
  const remoteCount = allPostings.filter((posting) => posting.isRemoteUs).length;
  locationSelect.querySelector('option[value="remote"]').textContent = `Remote in the US (${remoteCount})`;

  const metroCounts = countBy(allPostings, (posting) => posting.metroIds);
  const metroOptions = METRO_AREAS.filter((metro) => metroCounts.has(metro.id)).map((metro) => [
    metro.name,
    `metro:${metro.id}`,
    metroCounts.get(metro.id),
  ]);

  const stateCounts = countBy(allPostings, (posting) => posting.stateCodes);
  const stateOptions = Object.entries(STATE_NAMES)
    .filter(([code]) => stateCounts.has(code))
    .sort(([, nameA], [, nameB]) => nameA.localeCompare(nameB))
    .map(([code, name]) => [name, `state:${code}`, stateCounts.get(code)]);

  locationSelect.append(createOptionGroup("Metro areas", metroOptions), createOptionGroup("States", stateOptions));
}

function resetAndRender() {
  visibleCount = PAGE_SIZE;
  render();
}

function selectStatusTab(selectedTab) {
  for (const tab of statusTabs) {
    tab.setAttribute("aria-selected", String(tab === selectedTab));
  }
  statusFilter = selectedTab.dataset.status;
  resetAndRender();
}

async function loadPostings() {
  postingList.replaceChildren(...Array.from({ length: SKELETON_CARD_COUNT }, createSkeletonItem));
  summary.textContent = "Loading the latest internships…";
  try {
    const response = await fetch(LISTINGS_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const listings = await response.json();
    allPostings = listings
      .filter((posting) => posting.active && posting.is_visible !== false)
      .sort((a, b) => b.date_posted - a.date_posted);
    for (const posting of allPostings) {
      posting.stateCodes = new Set(posting.locations.map(stateCodeOf).filter(Boolean));
      posting.metroIds = new Set(posting.locations.map(metroIdOf).filter(Boolean));
      posting.isRemoteUs = posting.locations.some(isRemoteUs);
      posting.degrees ??= [];
    }
  } catch (error) {
    postingList.replaceChildren();
    summary.textContent = "";
    showMessage(`Couldn't load internships (${error.message}). Check your connection and refresh the page.`, true);
    return;
  }

  const categoryCounts = new Map();
  const terms = new Set();
  for (const posting of allPostings) {
    categoryCounts.set(posting.category, (categoryCounts.get(posting.category) ?? 0) + 1);
    posting.terms.forEach((term) => terms.add(term));
  }
  // Hide rare categories that are just spelling variants of the main ones.
  fillSelect(
    categorySelect,
    [...categoryCounts].filter(([, count]) => count >= 50).map(([category]) => category).sort(),
  );
  fillSelect(termSelect, [...terms].filter((term) => term !== "N/A").sort());
  fillLocationSelect();

  render();
}

for (const control of [locationSelect, categorySelect, degreeSelect, termSelect]) {
  control.addEventListener("change", resetAndRender);
}
for (const tab of statusTabs) {
  tab.addEventListener("click", () => selectStatusTab(tab));
}
searchInput.addEventListener("input", resetAndRender);
filtersToggle.addEventListener("click", () => {
  const isOpen = filterPanel.classList.toggle("open");
  filtersToggle.setAttribute("aria-expanded", String(isOpen));
});
showMoreButton.addEventListener("click", () => {
  visibleCount += PAGE_SIZE;
  render();
});

loadPostings();
