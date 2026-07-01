const fs = require("fs");
const path = require("path");

const databaseRoot = process.argv[2];
const outputFile = process.argv[3];
const archiveFile = process.argv[4];
const publicAssetsRoot = process.argv[5];
if (!databaseRoot || !outputFile || !archiveFile || !publicAssetsRoot) {
  throw new Error("Usage: node build-public-personnel.js <dossiers-root> <output-file> <archive-file> <public-assets-root>");
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function identityKey(value) {
  return slug(value.replace(/\([^)]*\)/g, "").replace(/\s+-.*$/, "").replace(/^the\s+/i, ""));
}

function clean(value) {
  return value
    .replace(/â€”|â€“/g, "-")
    .replace(/â€™/g, "'")
    .replace(/Â/g, "")
    .replace(/\bThird Age\b/gi, "3120 CE")
    .replace(/\bSecond Age\b/gi, "historic service period")
    .replace(/\s+/g, " ")
    .trim();
}

const blockedText = /\bclassified\b|class\s*[0-4s]|top secret|secret clearance|clearance level|special notes|alert|vulnerab|risk factor|recommend(?:ed|ation)?|psychological|project xeno|project genesis|sleeper agent|active persona|current location classified|combat capabilit|power assessment|weakness|forum|thread|player|roleplay|\brp\b|canon|website|game mechanic/i;
const blockedHeading = /abilit|power|weapon|equipment|clearance|access history|special note|alert|metadata|searchable tag|psychological|combat|threat|classified|operation|mission|incident|investigation|encounter/i;
const allowedHeading = /identification|physical description|biographical data|service record|leadership assessment|operational context|military & government authority|organizational affiliation|personality assessment|known relationship|known contact|current status|3120 ce status|historical service|founding|public history/i;
const blockedKey = /clearance|salary|weight|cup|risk|status recommendation|classified|threat|weapon|ability|power|vulnerab|psychological|special note|metadata/i;

function frontmatter(content, key) {
  const match = content.match(new RegExp(`^${key}:\\s*(.+)$`, "mi"));
  const value = match ? clean(match[1]) : "";
  return value === "---" ? "" : value;
}

function fullName(content, fallback) {
  const dossier = content.match(/^#\s+SRX PERSONNEL DOSSIER:\s*(.+)$/mi);
  const named = content.match(/^\*\*Full Name:\*\*\s*(.+)$/mi);
  const tableNamed = content.match(/^\|\s*\*\*Full Name\*\*\s*\|\s*([^|]+)\|/mi);
  const heading = content.match(/^#\s+(.+)$/m);
  const genericHeading = /^SRX PERSONNEL DOSSIER$/i.test(clean(heading?.[1] || "")) ? "" : heading?.[1];
  return clean(named?.[1] || tableNamed?.[1] || dossier?.[1] || genericHeading || fallback);
}

function parseSections(content) {
  const matches = [...content.matchAll(/^##\s+(.+)$/gm)];
  return matches.map((match, index) => ({
    title: clean(match[1]),
    text: content.slice(match.index + match[0].length, matches[index + 1]?.index || content.length).trim(),
  }));
}

function parsePublicSection(section) {
  if (!allowedHeading.test(section.title) || blockedHeading.test(section.title)) return null;
  const facts = [];
  const notes = [];
  const paragraphs = [];
  let suppress = false;
  const blocks = section.text.split(/\r?\n\s*\r?\n/);
  for (const rawBlock of blocks) {
    const block = clean(rawBlock.replace(/^#{3,6}\s+/gm, ""));
    if (!block) continue;
    const lines = rawBlock.split(/\r?\n/).map(clean).filter(Boolean);
    for (const line of lines) {
      const tableKv = line.match(/^\|\s*\*\*([^*]+)\*\*\s*\|\s*([^|]+)\|$/);
      if (tableKv) {
        suppress = blockedText.test(tableKv[0]) || blockedKey.test(tableKv[1]);
        if (!suppress && facts.length < 10) facts.push([clean(tableKv[1]), clean(tableKv[2])]);
        continue;
      }
      const kv = line.match(/^\*\*([^*]+):\*\*\s*(.+)$/);
      if (kv) {
        suppress = blockedText.test(kv[0]) || blockedKey.test(kv[1]);
        if (!suppress && facts.length < 10) facts.push([clean(kv[1]), clean(kv[2])]);
        continue;
      }
      if (suppress) continue;
      const bullet = line.match(/^[-*]\s+(.+)$/);
      if (bullet && !blockedText.test(bullet[1]) && notes.length < 12) notes.push(clean(bullet[1].replace(/\*\*/g, "")));
    }
    if (!/^[-*]/m.test(rawBlock) && !/^\*\*[^*]+:\*\*/.test(rawBlock)) {
      const paragraph = clean(rawBlock.replace(/\*\*/g, ""));
      if (paragraph.length >= 55 && !blockedText.test(paragraph) && paragraphs.length < 4) paragraphs.push(paragraph);
    }
  }
  if (!facts.length && !notes.length && !paragraphs.length) return null;
  return { title: section.title.replace(/THIRD AGE/gi, "3120 CE"), paragraphs, facts, notes };
}

const archiveSource = fs.readFileSync(archiveFile, "utf8");
const existingIds = new Set([...archiveSource.matchAll(/id:\s*"([^"]+)"/g)].map((match) => match[1]));
const existingSources = new Set([...archiveSource.matchAll(/source:\s*"([^"]+)"/g)].map((match) => match[1]));
const replaceExistingIds = new Set(["alexander-raiku", "zoey-cinclaire", "ayame-silveredge"]);
const replaceExistingSources = new Set([
  "data/srx_database/dossiers/ALEXANDER_RAIKU_DOSSIER.md",
  "data/srx_database/dossiers/ZOEY_CINCLAIRE_DOSSIER.md",
  "data/srx_database/dossiers/XERIA_SILVEREDGE_DOSSIER.md",
]);
const records = [];
const identities = new Set();
const publicIdentityOverrides = {
  "data/srx_database/dossiers/ALEXANDER_RAIKU_DOSSIER.md": { image: "main-npcs-portaits/Alexander-Raiku.png" },
  "data/srx_database/dossiers/XERIA_SILVEREDGE_DOSSIER.md": { id: "ayame-silveredge", title: "Ayame Silveredge" },
};

function addRecord(name, content, source, imagePath = "") {
  const identityOverride = publicIdentityOverrides[source];
  const archiveName = clean(name.replace(/\s*\(Birth Name:.*\)$/i, ""));
  const publicName = identityOverride?.title || archiveName;
  const id = identityOverride?.id || slug(archiveName.replace(/^the\s+/i, ""));
  const identity = identityKey(name);
  const replacesStub = replaceExistingIds.has(id) || replaceExistingSources.has(source);
  if (!id || (!replacesStub && (existingIds.has(id) || existingSources.has(source))) || identities.has(identity)) return;
  const sections = parseSections(content).map(parsePublicSection).filter(Boolean);
  const facts = sections.flatMap((section) => section.facts).filter(([key, value], index, all) => value && !/unknown|not documented|presumed/i.test(value) && all.findIndex(([other]) => other.toLowerCase() === key.toLowerCase()) === index).slice(0, 12);
  const role = facts.find(([key]) => /title|position|role|occupation|personnel type|current office/i.test(key))?.[1];
  const service = sections.find((section) => /service|leadership|biographical/i.test(section.title));
  const resolvedImagePath = identityOverride?.image || imagePath;
  const publicImage = resolvedImagePath && fs.existsSync(path.join(publicAssetsRoot, resolvedImagePath)) ? resolvedImagePath.replaceAll(path.sep, "/") : null;
  let usefulSections = sections.filter((section) => !/identification|physical description/i.test(section.title)).slice(0, 8);
  if (!usefulSections.length && sections.length) {
    usefulSections = [{ ...sections[0], title: "Archived Identification" }];
  }
  records.push({
    id,
    directories: ["people"],
    category: "people",
    title: publicName,
    subtitle: role || "SRX personnel archive record",
    classification: "Authorized Personnel Record",
    imagePath: publicImage,
    imageStatus: publicImage ? null : "No authenticated public portrait is currently assigned.",
    summary: role ? `${publicName} is recorded in the SRX Personnel Archive as ${role}.` : `The SRX Personnel Archive maintains an authorized service record for ${publicName}.`,
    body: service?.paragraphs?.slice(0, 2) || [],
    facts: facts.length >= 4 ? facts : [["Archive Status", "Record retained"], ["Release", "Authorized public extract"], ["Source", "SRX Personnel Archive"], ["Detail Status", usefulSections.length ? "Substantive record" : "Limited surviving record"]],
    sections: usefulSections,
    highlights: (service?.notes || usefulSections.flatMap((section) => section.notes)).slice(0, 6),
    related: [],
    source,
  });
  identities.add(identity);
}

for (const filename of fs.readdirSync(databaseRoot).filter((name) => name.endsWith("_DOSSIER.md"))) {
  const fullPath = path.join(databaseRoot, filename);
  const content = fs.readFileSync(fullPath, "utf8");
  addRecord(fullName(content, filename.replace(/_DOSSIER\.md$/i, "").replaceAll("_", " ")), content, `data/srx_database/dossiers/${filename}`, frontmatter(content, "image"));
}

for (const filename of ["GENERATION_2_DOSSIERS.md", "GENERATION_5_DOSSIERS.md", "GENERATION_6_DOSSIERS.md", "MINIMAL_DOSSIERS.md"]) {
  const fullPath = path.join(databaseRoot, filename);
  const content = fs.readFileSync(fullPath, "utf8");
  const entries = [...content.matchAll(/^#{2,3}\s+(.+)$/gm)];
  entries.forEach((entry, index) => {
    const name = clean(entry[1].replace(/^\[|\]$/g, ""));
    if (/introduction|summary|personnel|minimal data|unidentified|archive/i.test(name)) return;
    const body = content.slice(entry.index, entries[index + 1]?.index || content.length).replace(/^#{2,3}\s+.+\r?\n/, "");
    addRecord(name.replace(/\s*\([^)]*callsign[^)]*\)/i, ""), `## IDENTIFICATION\n${body}`, `data/srx_database/dossiers/${filename}`);
  });
}

const payload = `// Generated public-release personnel records from the SRX Oracle dossier database.\n(() => {\n  const base = "https://raw.githubusercontent.com/HeartlessN3ko/realm-assets/main/";\n  const generated = ${JSON.stringify(records, null, 2)};\n  for (const record of generated) {\n    record.image = record.imagePath ? { path: record.imagePath, alt: "Authenticated public portrait of " + record.title + ".", remote: base + encodeURI(record.imagePath) } : null;\n    delete record.imagePath;\n    const existingIndex = window.SRX_PUBLIC_ARCHIVE.records.findIndex((entry) => entry.id === record.id);\n    if (existingIndex >= 0) window.SRX_PUBLIC_ARCHIVE.records[existingIndex] = record;\n    else window.SRX_PUBLIC_ARCHIVE.records.push(record);\n  }\n})();\n`;
fs.writeFileSync(outputFile, payload);
console.log(`Generated ${records.length} detailed public personnel records.`);
