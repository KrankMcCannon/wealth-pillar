// Minimal typed builders to model the subset of Supabase Postgrest chain we use

export type SupabaseInsertBuilder<Insert, Row = unknown> = {
  insert: (values: Insert | Insert[]) => {
    select: (columns?: string) => {
      single: () => Promise<{ data: Row | null; error: unknown; count?: number }>;
    };
  };
};

export type SupabaseUpdateBuilder<Update, Row = unknown> = {
  update: (values: Update) => {
    eq: (
      column: string,
      value: string
    ) => {
      select: () => {
        single: () => Promise<{ data: Row | null; error: unknown; count?: number }>;
      };
      single: () => Promise<{ data: Row | null; error: unknown; count?: number }>;
    };
  };
};
