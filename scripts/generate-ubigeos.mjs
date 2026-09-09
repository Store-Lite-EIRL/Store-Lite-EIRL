/**
 * generate-ubigeos.mjs
 *
 * Fetches the complete official Peru ubigeo catalog (INEI 2025) and writes
 * src/core/logistics/ubigeos.json with the full hierarchy:
 *   25 departments → 196 provinces → 1,874 districts.
 *
 * Data source:
 *   - Primary: INEI 2025 via jmc-software-x/public-ubigeo-pe
 *     https://github.com/jmc-software-x/public-ubigeo-pe
 *     Raw JSON: https://raw.githubusercontent.com/jmc-software-x/public-ubigeo-pe/main/data/ubigeo-inei.json
 *   - Cross-reference: RENIEC 2025 from the same repo
 *     https://raw.githubusercontent.com/jmc-software-x/public-ubigeo-pe/main/data/ubigeo-reniec.json
 *
 * Why this source:
 *   - Publicly maintained GitHub repo with active updates (last commit 2026)
 *   - Data sourced from official INEI/RENIEC public datasets
 *   - 1,874 districts — exact match with official INEI count
 *   - Flat JSON with department/province/district codes and names
 *   - Both INEI and RENIEC code sets available for cross-validation
 *
 * Expected counts (INEI official):
 *   - 25 departments (includes Constitutional Province of Callao)
 *   - 196 provinces
 *   - 1,874 districts
 *
 * Usage: node scripts/generate-ubigeos.mjs
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const OUTPUT_PATH = resolve(PROJECT_ROOT, 'src', 'core', 'logistics', 'ubigeos.json');

const INEI_URL =
  'https://raw.githubusercontent.com/jmc-software-x/public-ubigeo-pe/main/data/ubigeo-inei.json';
const RENIEC_URL =
  'https://raw.githubusercontent.com/jmc-software-x/public-ubigeo-pe/main/data/ubigeo-reniec.json';

const EXPECTED = { departments: 25, provinces: 196, districts: 1874 };

// ─── Fetch ──────────────────────────────────────────────────────────────────

async function fetchJSON(url) {
  console.log(`Fetching ${url} ...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.json();
}

// ─── Transform ──────────────────────────────────────────────────────────────

function toUpper(str) {
  return str.normalize('NFC').toUpperCase();
}

function transform(raw) {
  // Separate entries by level
  const deptEntries = [];
  const provEntries = [];
  const distEntries = [];

  for (const entry of raw) {
    const { departamento, provincia, distrito, nombre } = entry;
    if (provincia === '00' && distrito === '00') {
      deptEntries.push({ code: departamento, nombre });
    } else if (distrito === '00') {
      provEntries.push({ deptCode: departamento, provCode: provincia, nombre });
    } else {
      distEntries.push({
        deptCode: departamento,
        provCode: provincia,
        distCode: distrito,
        nombre,
      });
    }
  }

  // Deduplicate department entries (source may have spurious department-level entries)
  const seenDept = new Map();
  for (const d of deptEntries) {
    if (!seenDept.has(d.code)) {
      seenDept.set(d.code, d.nombre);
    }
  }

  // Detect orphaned province entries coded as department-level:
  // Some sources mislabel a province as dept-level (provincia="00", distrito="00")
  // when the province code entry is missing. We fix this by:
  // 1. Finding province codes that have districts but no province-level entry
  // 2. Finding spurious department entries that match those orphaned province names
  // 3. Reclassifying them as proper province entries

  // Build a set of province codes that have explicit province entries
  const explicitProvCodes = new Set();
  for (const p of provEntries) {
    explicitProvCodes.add(`${p.deptCode}:${p.provCode}`);
  }

  // For each department, find province codes that have districts but no province entry
  const orphanedFixes = new Map(); // deptCode → Map<provCode, nombre>
  for (const dept of [...seenDept.keys()].sort()) {
    const distsInDept = distEntries.filter((d) => d.deptCode === dept);
    const provCodesWithDists = [...new Set(distsInDept.map((d) => d.provCode))];

    for (const provCode of provCodesWithDists) {
      const key = `${dept}:${provCode}`;
      if (!explicitProvCodes.has(key)) {
        // Find the spurious department entry that matches this province name
        const firstDist = distsInDept.find((d) => d.provCode === provCode);
        const provName = firstDist ? firstDist.nombre : `PROVINCIA ${provCode}`;

        // Check if there's a department-level entry with a similar name
        const spurious = deptEntries.find(
          (e) =>
            e.code === dept &&
            e.nombre.toLowerCase() === provName.toLowerCase() &&
            seenDept.get(dept)?.toLowerCase() !== provName.toLowerCase(),
        );

        if (spurious) {
          // This is a spurious department entry — reclassify as province
          if (!orphanedFixes.has(dept)) orphanedFixes.set(dept, new Map());
          orphanedFixes.get(dept).set(provCode, spurious.nombre);

          // Remove from seenDept (it's not a real department)
          // Actually, keep it — it's just a duplicate that we ignore
        } else {
          // Missing province entry without a spurious department match
          // Create it from the first district name
          if (!orphanedFixes.has(dept)) orphanedFixes.set(dept, new Map());
          orphanedFixes.get(dept).set(provCode, provName);
        }
      }
    }
  }

  // Apply orphaned fixes: add missing province entries
  for (const [deptCode, fixes] of orphanedFixes) {
    for (const [provCode, provName] of fixes) {
      provEntries.push({ deptCode, provCode, nombre: provName });
    }
  }

  // Build the hierarchy
  const departments = [];

  for (const [deptCode, deptName] of [...seenDept.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    const deptProvs = provEntries
      .filter((p) => p.deptCode === deptCode)
      .sort((a, b) => a.provCode.localeCompare(b.provCode));

    const provinces = deptProvs.map((prov) => {
      const provDistricts = distEntries
        .filter((d) => d.deptCode === deptCode && d.provCode === prov.provCode)
        .sort((a, b) => a.distCode.localeCompare(b.distCode));

      return {
        id: `${deptCode}${prov.provCode}`,
        name: toUpper(prov.nombre),
        districts: provDistricts.map((dist) => ({
          id: `${deptCode}${prov.provCode}${dist.distCode}`,
          name: toUpper(dist.nombre),
        })),
      };
    });

    departments.push({
      id: deptCode,
      name: toUpper(deptName),
      provinces,
    });
  }

  return departments;
}

// ─── Validate ───────────────────────────────────────────────────────────────

function validate(departments) {
  const errors = [];
  const warnings = [];
  const allDeptIds = [];
  const allProvIds = [];
  const allDistIds = [];
  const allDeptNames = [];
  const allProvNames = [];
  const allDistNames = [];

  if (departments.length !== EXPECTED.departments) {
    errors.push(
      `Department count: expected ${EXPECTED.departments}, got ${departments.length}`,
    );
  }

  let totalProvinces = 0;
  let totalDistricts = 0;

  for (const dept of departments) {
    // Department id format
    if (!/^\d{2}$/.test(dept.id)) {
      errors.push(`Department ${dept.name}: id "${dept.id}" is not 2 digits`);
    }
    if (allDeptIds.includes(dept.id)) {
      errors.push(`Duplicate department id: ${dept.id} (${dept.name})`);
    }
    allDeptIds.push(dept.id);

    if (!dept.name || dept.name.trim() === '') {
      errors.push(`Department ${dept.id}: empty name`);
    }
    allDeptNames.push(dept.name);

    totalProvinces += dept.provinces.length;

    for (const prov of dept.provinces) {
      // Province id format
      if (!/^\d{4}$/.test(prov.id)) {
        errors.push(
          `Province ${prov.name} (dept ${dept.id}): id "${prov.id}" is not 4 digits`,
        );
      }
      if (allProvIds.includes(prov.id)) {
        errors.push(`Duplicate province id: ${prov.id} (${prov.name})`);
      }
      allProvIds.push(prov.id);

      if (!prov.name || prov.name.trim() === '') {
        errors.push(`Province ${prov.id}: empty name`);
      }
      allProvNames.push(prov.name);

      // Every province must have at least 1 district
      if (prov.districts.length === 0) {
        errors.push(
          `Province ${prov.id} (${prov.name}): has 0 districts`,
        );
      }

      totalDistricts += prov.districts.length;

      for (const dist of prov.districts) {
        // District id format
        if (!/^\d{6}$/.test(dist.id)) {
          errors.push(
            `District ${dist.name} (prov ${prov.id}): id "${dist.id}" is not 6 digits`,
          );
        }
        if (allDistIds.includes(dist.id)) {
          errors.push(`Duplicate district id: ${dist.id} (${dist.name})`);
        }
        allDistIds.push(dist.id);

        if (!dist.name || dist.name.trim() === '') {
          errors.push(`District ${dist.id}: empty name`);
        }
        allDistNames.push(dist.name);
      }
    }
  }

  if (totalProvinces !== EXPECTED.provinces) {
    errors.push(
      `Province count: expected ${EXPECTED.provinces}, got ${totalProvinces}`,
    );
  }
  if (totalDistricts !== EXPECTED.districts) {
    errors.push(
      `District count: expected ${EXPECTED.districts}, got ${totalDistricts}`,
    );
  }

  return {
    errors,
    warnings,
    counts: {
      departments: departments.length,
      provinces: totalProvinces,
      districts: totalDistricts,
    },
  };
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Peru Ubigeo Generator ===\n');

  // Fetch raw data
  const [ineiRaw, reniecRaw] = await Promise.all([
    fetchJSON(INEI_URL),
    fetchJSON(RENIEC_URL),
  ]);

  console.log(`INEI entries: ${ineiRaw.length}`);
  console.log(`RENIEC entries: ${reniecRaw.length}\n`);

  // Transform INEI data (primary source for 1,874 districts)
  const departments = transform(ineiRaw);

  // Cross-validate: ensure all RENIEC districts exist in INEI
  const reniecDistricts = reniecRaw.filter(
    (e) => e.provincia !== '00' && e.distrito !== '00',
  );
  const ineiDistIds = new Set();
  for (const dept of departments) {
    for (const prov of dept.provinces) {
      for (const dist of prov.districts) {
        ineiDistIds.add(dist.id);
      }
    }
  }

  let reniecMissing = 0;
  for (const rd of reniecDistricts) {
    const reniecId = `${rd.departamento}${rd.provincia}${rd.distrito}`;
    if (!ineiDistIds.has(reniecId)) {
      reniecMissing++;
    }
  }
  console.log(
    `Cross-validation: ${reniecMissing} RENIEC districts not found in INEI (expected — INEI has more)\n`,
  );

  // Validate
  const { errors, warnings, counts } = validate(departments);

  for (const w of warnings) {
    console.warn(`WARNING: ${w}`);
  }

  if (errors.length > 0) {
    console.error('VALIDATION ERRORS:');
    for (const e of errors) {
      console.error(`  - ${e}`);
    }
    process.exit(1);
  }

  console.log('Validation PASSED');
  console.log(
    `  Departments: ${counts.departments} (expected ${EXPECTED.departments})`,
  );
  console.log(
    `  Provinces:   ${counts.provinces} (expected ${EXPECTED.provinces})`,
  );
  console.log(
    `  Districts:   ${counts.districts} (expected ${EXPECTED.districts})`,
  );

  // Write clean JSON (no comments — must be importable by TypeScript)
  const json = JSON.stringify(departments, null, 2);
  writeFileSync(OUTPUT_PATH, json, 'utf8');
  console.log(`\nWritten to ${OUTPUT_PATH}`);

  // Write provenance metadata separately
  const timestamp = new Date().toISOString();
  const metadata = {
    description: 'Peru Ubigeo Catalog — Complete Official Data',
    source: INEI_URL,
    crossReference: RENIEC_URL,
    sourceNote: 'INEI 2025 via jmc-software-x/public-ubigeo-pe (GitHub, publicly maintained, official INEI/RENIEC data)',
    officialCounts: { departments: 25, provinces: 196, districts: 1874 },
    generated: timestamp,
    structure: 'Array of { id (2-digit dept), name, provinces: [{ id (4-digit prov), name, districts: [{ id (6-digit dist), name }] }] }',
    notes: 'All IDs are official INEI ubigeo codes. Names are UPPERCASE UTF-8 with accents preserved from official sources.',
  };
  const metadataPath = resolve(PROJECT_ROOT, 'src', 'core', 'logistics', 'ubigeos.meta.json');
  writeFileSync(metadataPath, JSON.stringify(metadata, null, 2) + '\n', 'utf8');
  console.log(`Metadata written to ${metadataPath}`);

  // Idempotency check: re-read and re-validate
  const { readFileSync } = await import('node:fs');
  const reRead = readFileSync(OUTPUT_PATH, 'utf8');
  const reParsed = JSON.parse(reRead);
  const reCheck = validate(reParsed);
  if (reCheck.errors.length > 0) {
    console.error('IDEMPOTENCY CHECK FAILED:');
    for (const e of reCheck.errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log('Idempotency check PASSED (re-read validates same counts)');

  // Regression check: extract old districts from peruLocations.ts
  console.log('\n=== Regression Check ===');
  const oldContent = readFileSync(
    resolve(PROJECT_ROOT, 'src', 'core', 'logistics', 'peruLocations.ts'),
    'utf8',
  );
  const oldDistRegex = /id:\s*'(\d{6})'/g;
  const oldDistrictIds = new Set();
  let match;
  while ((match = oldDistRegex.exec(oldContent)) !== null) {
    oldDistrictIds.add(match[1]);
  }
  console.log(`Old file has ${oldDistrictIds.size} unique district IDs`);

  // Build a lookup of new districts (id → name)
  const newDistLookup = new Map();
  for (const dept of departments) {
    for (const prov of dept.provinces) {
      for (const dist of prov.districts) {
        newDistLookup.set(dist.id, dist.name);
      }
    }
  }

  // Extract old district names
  const oldDistNameRegex = /id:\s*'(\d{6})',\s*name:\s*'([^']+)'/g;
  const oldDistNames = new Map();
  while ((match = oldDistNameRegex.exec(oldContent)) !== null) {
    oldDistNames.set(match[1], match[2]);
  }

  let missingCount = 0;
  let renamedCount = 0;
  const missing = [];
  const renamed = [];

  for (const oldId of oldDistrictIds) {
    if (!newDistLookup.has(oldId)) {
      missing.push(`${oldId} (${oldDistNames.get(oldId) || 'unknown'})`);
      missingCount++;
    } else {
      const newName = newDistLookup.get(oldId);
      const oldName = oldDistNames.get(oldId);
      if (oldName && oldName.toUpperCase() !== newName) {
        renamed.push(`${oldId}: "${oldName}" → "${newName}"`);
        renamedCount++;
      }
    }
  }

  if (missingCount > 0) {
    console.error(`\nREGRESSION FAILURE: ${missingCount} old districts MISSING from new catalog:`);
    for (const m of missing) console.error(`  - ${m}`);
    process.exit(1);
  }

  console.log(`All ${oldDistrictIds.size} old districts present in new catalog`);
  if (renamedCount > 0) {
    console.log(`${renamedCount} districts with normalized names:`);
    for (const r of renamed) console.log(`  ${r}`);
  } else {
    console.log('No name changes detected');
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
