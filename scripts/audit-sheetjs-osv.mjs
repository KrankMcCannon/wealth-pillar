import { readFile } from 'node:fs/promises';

const serviceUrl = 'https://api.osv.dev/v1/query';
// OSV's npm records have no fixed event because these fixes were released only
// by SheetJS. The release thresholds come from the official vendor advisories.
const officialVendorFixes = new Map([
  [
    'GHSA-4r6h-8v6p-xvw6',
    { version: '0.19.3', url: 'https://cdn.sheetjs.com/advisories/CVE-2023-30533' },
  ],
  [
    'GHSA-5pgg-2g8v-p4x9',
    { version: '0.20.2', url: 'https://cdn.sheetjs.com/advisories/CVE-2024-22363' },
  ],
]);

function compareVersions(left, right) {
  const a = left.split('.').map(Number);
  const b = right.split('.').map(Number);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference) return Math.sign(difference);
  }
  return 0;
}

async function main() {
  let manifest;
  let installed;
  try {
    [manifest, installed] = await Promise.all([
      readFile(new URL('../package.json', import.meta.url), 'utf8').then(JSON.parse),
      readFile(new URL('../node_modules/xlsx/package.json', import.meta.url), 'utf8').then(
        JSON.parse
      ),
    ]);
  } catch (error) {
    console.error(`SheetJS audit setup error: ${error.message}`);
    process.exitCode = 2;
    return;
  }

  if (!manifest.dependencies?.xlsx?.startsWith('file:vendor/xlsx-')) {
    console.error('SheetJS audit setup error: xlsx must resolve from the vendored tarball.');
    process.exitCode = 2;
    return;
  }

  const version = installed.version;
  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version)) {
    console.error('SheetJS audit setup error: installed package has no valid version.');
    process.exitCode = 2;
    return;
  }

  let response;
  try {
    response = await fetch(serviceUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ package: { name: 'xlsx', ecosystem: 'npm' }, version }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    console.error(`OSV service error for xlsx@${version}: ${error.message}`);
    process.exitCode = 2;
    return;
  }

  if (!response.ok) {
    console.error(`OSV service error for xlsx@${version}: HTTP ${response.status}`);
    process.exitCode = 2;
    return;
  }

  let result;
  try {
    result = await response.json();
  } catch (error) {
    console.error(`OSV service error for xlsx@${version}: invalid JSON (${error.message})`);
    process.exitCode = 2;
    return;
  }

  if (result.vulns !== undefined && !Array.isArray(result.vulns)) {
    console.error(`OSV service error for xlsx@${version}: invalid response schema`);
    process.exitCode = 2;
    return;
  }

  const vulnerabilities = result.vulns ?? [];
  if (vulnerabilities.length) {
    const applicable = [];
    for (const vulnerability of vulnerabilities) {
      const id = vulnerability.id ?? 'Unknown advisory';
      const fix = officialVendorFixes.get(id);
      if (fix && compareVersions(version, fix.version) >= 0) {
        console.warn(
          `OSV npm record ${id} returned for xlsx@${version}; official SheetJS fix ${fix.version} or later: ${fix.url}`
        );
      } else {
        applicable.push(vulnerability);
      }
    }
    if (applicable.length) {
      for (const vulnerability of applicable) {
        console.error(
          `${vulnerability.id ?? 'Unknown advisory'}: ${vulnerability.summary ?? 'No summary'}`
        );
      }
      console.error(
        `OSV reported ${applicable.length} applicable advisory result(s) for xlsx@${version}.`
      );
      process.exitCode = 1;
      return;
    }
    console.warn(
      `OSV returned ${vulnerabilities.length} npm record(s); vendor-fixed records are not applicable.`
    );
    return;
  }

  console.warn(`OSV found no advisories for xlsx@${version}.`);
}

await main();
