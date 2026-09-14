import type { ImportFormat, ImportParseContext, ImportTemplate, ParseImportFileResult } from './types';
import { matchesCredemRows, parseCredemRows } from './credem.parser';
import { matchesHouseholdRows, parseHouseholdRows } from './household.parser';
import { matchesRevolutRows, parseRevolutRows } from './revolut.parser';
import { resolveImportYear } from './import-row-utils';

export const credemTemplate: ImportTemplate = {
  id: 'credem',
  matches: matchesCredemRows,
  parse: (rows) => parseCredemRows(rows),
};

export const revolutTemplate: ImportTemplate = {
  id: 'revolut',
  matches: matchesRevolutRows,
  parse: (rows) => parseRevolutRows(rows),
};

export const householdTemplate: ImportTemplate = {
  id: 'household',
  matches: matchesHouseholdRows,
  parse: (rows, ctx) =>
    parseHouseholdRows(rows, { year: resolveImportYear(ctx.fileName, ctx.now) }),
};

export const IMPORT_TEMPLATES: readonly ImportTemplate[] = [
  credemTemplate,
  revolutTemplate,
  householdTemplate,
];

export function detectFormatFromRows(rows: string[][]): ImportFormat | null {
  return IMPORT_TEMPLATES.find((template) => template.matches(rows))?.id ?? null;
}

export function parseImportRows(
  rows: string[][],
  ctx: ImportParseContext
): ParseImportFileResult {
  const template = IMPORT_TEMPLATES.find((candidate) => candidate.matches(rows));
  if (!template) {
    throw new Error('Unsupported import format');
  }

  const groups = template.parse(rows, ctx);
  if (groups.length === 0) {
    throw new Error('No importable transactions found in file');
  }

  return { format: template.id, groups };
}
