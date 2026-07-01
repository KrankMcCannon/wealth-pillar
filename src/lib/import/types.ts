export type ImportBankFormat = 'revolut' | 'credem';

export type ImportRowType = 'income' | 'expense';

export type NormalizedImportRow = {
  rowId: string;
  date: string;
  description: string;
  amount: number;
  type: ImportRowType;
  currency: string;
  rawSource: {
    bank: ImportBankFormat;
    product?: string;
    causale?: string;
    state?: string;
    excludedReason?: string;
  };
};

export type ParsedImportGroup = {
  format: ImportBankFormat;
  productKey: string;
  productLabel: string;
  rows: NormalizedImportRow[];
  excludedCount: number;
};

export type ParseImportFileResult = {
  format: ImportBankFormat;
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
