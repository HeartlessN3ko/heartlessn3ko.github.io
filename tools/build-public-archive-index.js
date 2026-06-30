const fs = require("fs");
const path = require("path");

const databaseRoot = process.argv[2];
const outputFile = process.argv[3];
const archiveDataFile = process.argv[4];
if (!databaseRoot || !outputFile || !archiveDataFile) {
  throw new Error("Usage: node build-public-archive-index.js <database-root> <output-file> <archive-data-file>");
}

const existingSources = new Set(
  [...fs.readFileSync(archiveDataFile, "utf8").matchAll(/source:\s*"([^"]+)"/g)].map((match) => match[1].replaceAll("/", path.sep))
);
const categories = ["dossiers", "factions", "locations", "wanted"];
const categoryLabels = {
  dossiers: "dossier",
  factions: "faction",
  locations: "location",
  wanted: "wanted notice",
};

function slug(value) {
  return value.toLowerCase().replace(/_dossier$/i, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function frontmatterValue(content, key) {
  const match = content.match(new RegExp(`^${key}:[ \\t]*(.*)$`, "mi"));
  return match ? match[1].trim() : "";
}

function recordTitle(content, file) {
  const frontmatterTitle = frontmatterValue(content, "title");
  if (frontmatterTitle) return frontmatterTitle;
  const dossierTitle = content.match(/^# SRX[^:\n]*:\s*(.+)$/mi);
  if (dossierTitle) return dossierTitle[1].trim();
  return path.basename(file, ".md").replace(/_DOSSIER$/i, "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function clearance(content) {
  const frontmatterClass = frontmatterValue(content, "class");
  if (frontmatterClass) return frontmatterClass.split(/[^A-Za-z0-9]/)[0].toUpperCase();
  const legacy = content.match(/\*\*Classification Level:\*\*\s*(?:Class\s*)?([A-Z0-9]+)/i)
    || content.match(/\*\*Classification:\*\*\s*(?:Level|Class)?\s*([A-Z0-9]+)/i);
  return legacy ? legacy[1].toUpperCase() : "RESTRICTED";
}

function clearanceLabel(level) {
  return level === "RESTRICTED" ? "Restricted" : `Class ${level}`;
}

function publicParagraphs(content) {
  return content
    .replace(/^---[\s\S]*?---/m, "")
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.replace(/^#+\s.*$/gm, "").replace(/\*\*/g, "").trim())
    .filter((block) => block.length >= 70 && !/^[-*]\s/m.test(block))
    .slice(0, 2);
}

const records = [];
for (const category of categories) {
  const folder = path.join(databaseRoot, category);
  for (const name of fs.readdirSync(folder).filter((file) => file.endsWith(".md"))) {
    if (name.startsWith("_") || ["README.md", "INDEX.md", "MINIMAL_DOSSIERS.md"].includes(name)) continue;
    const sourceRelative = path.join("data", "srx_database", category, name);
    if (existingSources.has(sourceRelative)) continue;
    const content = fs.readFileSync(path.join(folder, name), "utf8");
    const level = clearance(content);
    if (level === "S" || level.startsWith("TOP")) continue;
    const isPublic = level === "5";
    const accessLabel = clearanceLabel(level);
    const title = recordTitle(content, name);
    const paragraphs = isPublic ? publicParagraphs(content) : [];
    const imagePath = isPublic ? frontmatterValue(content, "image") : "";
    const categoryLabel = categoryLabels[category];
    const directory = category === "wanted" ? "alerts" : category === "dossiers" ? "dossiers" : "knowledge";
    records.push({
      id: `db-${category}-${slug(name.replace(/\.md$/i, ""))}`,
      directories: [directory],
      category: category === "wanted" ? "wanted" : category === "dossiers" ? "dossiers" : category === "factions" ? "factions" : "atlas",
      title,
      subtitle: isPublic ? `Public ${categoryLabel} record` : `Indexed SRX ${categoryLabel} record`,
      classification: isPublic ? "Public Database Record" : `Access Restricted // ${accessLabel}`,
      imagePath: imagePath || null,
      imageStatus: imagePath ? null : isPublic ? "No public image assigned in the SRX database." : "Image withheld at this clearance.",
      summary: isPublic && paragraphs[0] ? paragraphs[0] : `An SRX record for ${title} exists. Its contents require ${accessLabel.toLowerCase()} clearance and are not released through the public terminal.`,
      body: isPublic && paragraphs.length ? paragraphs : ["This terminal confirms the record exists but does not release restricted material.", "Request elevated access through an authorized SRX archive terminal."],
      facts: [["Database Category", category], ["Clearance", accessLabel], ["Public Access", isPublic ? "Released" : "Restricted"]],
      highlights: isPublic ? ["Loaded directly from the SRX Oracle database.", "Public release may be updated as the source record changes."] : ["Record existence confirmed.", "Contents withheld from public access."],
      related: [],
      source: sourceRelative.replaceAll(path.sep, "/"),
    });
  }
}

const payload = `// Generated from the SRX Oracle database. Do not hand-edit.\n(() => {\n  const base = "https://raw.githubusercontent.com/HeartlessN3ko/realm-assets/main/";\n  const generated = ${JSON.stringify(records, null, 2)};\n  generated.forEach((record) => {\n    record.image = record.imagePath ? { path: record.imagePath, alt: record.title + " database image.", local: base + encodeURI(record.imagePath), remote: base + encodeURI(record.imagePath) } : null;\n    delete record.imagePath;\n  });\n  window.SRX_PUBLIC_ARCHIVE.records.push(...generated);\n  window.SRX_PUBLIC_ARCHIVE.databaseRecordCount = ${records.length};\n})();\n`;
fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, payload);
console.log(`Generated ${records.length} additional public-index records.`);
