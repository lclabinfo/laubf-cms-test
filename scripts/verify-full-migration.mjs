import 'dotenv/config';
import pg from 'pg';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {},
    failures: {
      invalidJson: [],
      garbledContent: [],
      flagMismatch: [],
      rawHtml: [],
    },
    deepInspection: [],
    fontMarkSamples: [],
  };

  // Fetch all non-deleted BibleStudy entries
  const { rows } = await pool.query(`
    SELECT id, title, slug, questions, answers, transcript,
           "hasQuestions", "hasAnswers", "hasTranscript", "dateFor"
    FROM "BibleStudy"
    WHERE "deletedAt" IS NULL
    ORDER BY "dateFor" ASC NULLS LAST
  `);

  console.log(`Total BibleStudy entries (non-deleted): ${rows.length}`);
  report.summary.totalEntries = rows.length;

  let passAll = 0;
  let failFormat = 0;
  let failGarbled = 0;
  let failFlags = 0;
  let failHtml = 0;

  const contentFields = ['questions', 'answers', 'transcript'];
  const flagFields = ['hasQuestions', 'hasAnswers', 'hasTranscript'];

  // Binary/garbled content patterns
  const garbledPatterns = [
    /[\x00-\x08\x0B\x0C\x0E-\x1F]/,  // control chars (excluding \t \n \r)
    /\uFFFD{3,}/,                       // replacement chars
    /\\x[0-9a-f]{2}\\x[0-9a-f]{2}/i,  // hex escape sequences
  ];

  for (const row of rows) {
    let entryPassed = true;

    for (let i = 0; i < contentFields.length; i++) {
      const field = contentFields[i];
      const flagField = flagFields[i];
      const content = row[field];
      const flag = row[flagField];

      // --- Check 4: Raw HTML ---
      if (content != null && typeof content === 'string') {
        const trimmed = content.trim();
        if (/^<[a-zA-Z]/.test(trimmed)) {
          failHtml++;
          entryPassed = false;
          report.failures.rawHtml.push({
            id: row.id,
            title: row.title,
            field,
            preview: trimmed.substring(0, 120),
          });
        }
      }

      // --- Check 1: Valid JSON format ---
      if (content != null) {
        let contentStr = typeof content === 'string' ? content : JSON.stringify(content);
        try {
          const parsed = typeof content === 'string' ? JSON.parse(content) : content;
          if (!parsed || parsed.type !== 'doc') {
            failFormat++;
            entryPassed = false;
            report.failures.invalidJson.push({
              id: row.id,
              title: row.title,
              field,
              reason: 'Missing type:"doc" at root',
              preview: contentStr.substring(0, 100),
            });
          }
        } catch (e) {
          failFormat++;
          entryPassed = false;
          report.failures.invalidJson.push({
            id: row.id,
            title: row.title,
            field,
            reason: `JSON parse error: ${e.message}`,
            preview: contentStr.substring(0, 100),
          });
        }
      }

      // --- Check 2: Garbled content ---
      if (content != null) {
        let contentStr = typeof content === 'string' ? content : JSON.stringify(content);
        for (const pattern of garbledPatterns) {
          if (pattern.test(contentStr)) {
            failGarbled++;
            entryPassed = false;
            const match = contentStr.match(pattern);
            report.failures.garbledContent.push({
              id: row.id,
              title: row.title,
              field,
              pattern: pattern.toString(),
              matchAt: match?.index,
              preview: contentStr.substring(Math.max(0, (match?.index || 0) - 20), (match?.index || 0) + 40),
            });
            break; // one match per field is enough
          }
        }
      }

      // --- Check 3: Flag consistency ---
      const hasContent = content != null && (typeof content === 'object'
        ? (content.content && content.content.length > 0)
        : (content.trim().length > 0 && content.trim() !== '{"type":"doc","content":[]}'));

      if (flag !== hasContent) {
        // More careful check: parse and see if there's actual text
        let actuallyHasContent = false;
        if (content != null) {
          try {
            const parsed = typeof content === 'string' ? JSON.parse(content) : content;
            actuallyHasContent = parsed?.content?.length > 0 && hasTextContent(parsed);
          } catch {
            actuallyHasContent = false;
          }
        }
        if (flag !== actuallyHasContent) {
          failFlags++;
          entryPassed = false;
          report.failures.flagMismatch.push({
            id: row.id,
            title: row.title,
            field,
            flagField,
            flagValue: flag,
            contentIsNull: content == null,
            contentHasData: actuallyHasContent,
          });
        }
      }
    }

    if (entryPassed) passAll++;
  }

  report.summary.passAll = passAll;
  report.summary.failFormat = failFormat;
  report.summary.failGarbled = failGarbled;
  report.summary.failFlags = failFlags;
  report.summary.failHtml = failHtml;

  // --- Deep inspection of 20 random entries ---
  console.log('\nDeep-inspecting 20 random entries...');
  const shuffled = [...rows].sort(() => Math.random() - 0.5);
  const sample = shuffled.slice(0, 20);

  for (const row of sample) {
    const inspection = {
      id: row.id,
      title: row.title,
      dateFor: row.dateFor,
      fields: {},
    };

    for (const field of contentFields) {
      const content = row[field];
      if (content == null) {
        inspection.fields[field] = { status: 'null' };
        continue;
      }

      try {
        const parsed = typeof content === 'string' ? JSON.parse(content) : content;
        const fieldReport = {
          status: 'valid',
          isDoc: parsed?.type === 'doc',
          contentNodeCount: parsed?.content?.length || 0,
          hasTextContent: hasTextContent(parsed),
          hasFontMarks: false,
          fontFamilies: [],
          hasTextAlign: false,
          textAlignValues: [],
          hasLineHeight: false,
          hasIndent: false,
        };

        // Walk the tree
        walkNodes(parsed, (node) => {
          // Check text alignment
          if (node.attrs?.textAlign) {
            fieldReport.hasTextAlign = true;
            if (!fieldReport.textAlignValues.includes(node.attrs.textAlign)) {
              fieldReport.textAlignValues.push(node.attrs.textAlign);
            }
          }
          // Check indent
          if (node.attrs?.indent) {
            fieldReport.hasIndent = true;
          }
          // Check marks on text nodes
          if (node.marks) {
            for (const mark of node.marks) {
              if (mark.type === 'textStyle' && mark.attrs?.fontFamily) {
                fieldReport.hasFontMarks = true;
                if (!fieldReport.fontFamilies.includes(mark.attrs.fontFamily)) {
                  fieldReport.fontFamilies.push(mark.attrs.fontFamily);
                }
              }
              if (mark.type === 'textStyle' && mark.attrs?.lineHeight) {
                fieldReport.hasLineHeight = true;
              }
            }
          }
        });

        inspection.fields[field] = fieldReport;
      } catch (e) {
        inspection.fields[field] = { status: 'parse_error', error: e.message };
      }
    }

    report.deepInspection.push(inspection);
  }

  // --- Font mark survey across ALL entries ---
  console.log('\nSurveying font marks across all entries...');
  let entriesWithFontMarks = 0;
  let entriesWithAlignment = 0;
  let entriesWithLineHeight = 0;
  const allFontFamilies = new Set();

  for (const row of rows) {
    let hasFonts = false;
    let hasAlign = false;
    let hasLH = false;

    for (const field of contentFields) {
      const content = row[field];
      if (content == null) continue;
      try {
        const parsed = typeof content === 'string' ? JSON.parse(content) : content;
        walkNodes(parsed, (node) => {
          if (node.attrs?.textAlign) hasAlign = true;
          if (node.marks) {
            for (const mark of node.marks) {
              if (mark.type === 'textStyle' && mark.attrs?.fontFamily) {
                hasFonts = true;
                allFontFamilies.add(mark.attrs.fontFamily);
              }
              if (mark.type === 'textStyle' && mark.attrs?.lineHeight) {
                hasLH = true;
              }
            }
          }
        });
      } catch { /* skip */ }
    }
    if (hasFonts) entriesWithFontMarks++;
    if (hasAlign) entriesWithAlignment++;
    if (hasLH) entriesWithLineHeight++;
  }

  report.summary.entriesWithFontMarks = entriesWithFontMarks;
  report.summary.entriesWithAlignment = entriesWithAlignment;
  report.summary.entriesWithLineHeight = entriesWithLineHeight;
  report.summary.allFontFamilies = [...allFontFamilies];

  // Print summary
  console.log('\n=== VERIFICATION REPORT ===');
  console.log(`Total entries: ${rows.length}`);
  console.log(`Pass all checks: ${passAll}`);
  console.log(`Fail format: ${failFormat}`);
  console.log(`Fail garbled: ${failGarbled}`);
  console.log(`Fail flag mismatch: ${failFlags}`);
  console.log(`Fail raw HTML: ${failHtml}`);
  console.log(`\nEntries with font marks: ${entriesWithFontMarks}`);
  console.log(`Entries with text alignment: ${entriesWithAlignment}`);
  console.log(`Entries with line-height: ${entriesWithLineHeight}`);
  console.log(`Font families found: ${[...allFontFamilies].join(', ') || 'none'}`);

  if (report.failures.invalidJson.length > 0) {
    console.log(`\n--- Invalid JSON (${report.failures.invalidJson.length}) ---`);
    for (const f of report.failures.invalidJson.slice(0, 10)) {
      console.log(`  ${f.title} [${f.field}]: ${f.reason}`);
    }
  }
  if (report.failures.rawHtml.length > 0) {
    console.log(`\n--- Raw HTML (${report.failures.rawHtml.length}) ---`);
    for (const f of report.failures.rawHtml.slice(0, 10)) {
      console.log(`  ${f.title} [${f.field}]: ${f.preview}`);
    }
  }
  if (report.failures.garbledContent.length > 0) {
    console.log(`\n--- Garbled Content (${report.failures.garbledContent.length}) ---`);
    for (const f of report.failures.garbledContent.slice(0, 10)) {
      console.log(`  ${f.title} [${f.field}]: pattern=${f.pattern}`);
    }
  }
  if (report.failures.flagMismatch.length > 0) {
    console.log(`\n--- Flag Mismatch (${report.failures.flagMismatch.length}) ---`);
    for (const f of report.failures.flagMismatch.slice(0, 10)) {
      console.log(`  ${f.title} [${f.flagField}]: flag=${f.flagValue}, hasContent=${f.contentHasData}`);
    }
  }

  // Write report
  const reportPath = join(__dirname, 'verification-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport written to ${reportPath}`);

  await pool.end();
}

function hasTextContent(node) {
  if (!node) return false;
  if (node.type === 'text' && node.text?.trim()) return true;
  if (node.content) {
    for (const child of node.content) {
      if (hasTextContent(child)) return true;
    }
  }
  return false;
}

function walkNodes(node, callback) {
  if (!node) return;
  callback(node);
  if (node.content) {
    for (const child of node.content) {
      walkNodes(child, callback);
    }
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
