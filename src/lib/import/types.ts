export type ImportFormat = 'revolut' | 'credem' | 'household';

export type ImportRowType = 'income' | 'expense';

export type ImportParseContext = {
  fileName: string;
  now?: Date;
};

export type ImportTemplate = {
  id: ImportFormat;
  matches(rows: string[][]): boolean;
  parse(rows: string[][], ctx: ImportParseContext): ParsedImportGroup[];
};

export type NormalizedImportRow = {
  rowId: string;
  date: string;
  description: string;
  amount: number;
  type: ImportRowType;
  currency: string;
  categoryHint?: string;
  rawSource: {
    bank: ImportFormat;
    product?: string;
    causale?: string;
    state?: string;
    excludedReason?: string;
  };
};

export type ParsedImportGroup = {
  format: ImportFormat;
  productKey: string;
  productLabel: string;
  rows: NormalizedImportRow[];
  excludedCount: number;
};

export type ParseImportFileResult = {
  format: ImportFormat;
  groups: ParsedImportGroup[];
};

export type ImportRowStatus = 'new' | 'duplicate' | 'possible-duplicate' | 'excluded';

export type PrepareImportRowInput = {
  rowId: string;
  account_id: string;
  date: string;
  description: string;
  amount: number;
  type: ImportRowType;
  import_hash: string;
  causale?: string;
};

export type PrepareImportRowResult = PrepareImportRowInput & {
  status: ImportRowStatus;
  suggestedCategory: string;
  suggestedRecurringSeriesId?: string;
  suggestedRecurringSeriesDescription?: string;
  likelyInternalTransfer: boolean;
  includeByDefault: boolean;
};

export type CommitImportRowInput = {
  rowId: string;
  description: string;
  amount: number;
  type: ImportRowType;
  category: string;
  date: string;
  account_id: string;
  user_id: string;
  group_id: string;
  import_hash: string;
  recurring_series_id?: string;
};

export type BulkImportResult = {
  inserted: number;
  skipped: number;
};
