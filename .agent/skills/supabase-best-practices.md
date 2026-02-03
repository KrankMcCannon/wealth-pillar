---
name: Supabase Best Practices
description: A skill for implementing robust, performant, and strongly-typed Supabase interactions, ensuring strict type safety and adherence to official best practices.
---

# My Skill

I am an expert in Supabase architecture and integration. My mission is to ensure that every interaction with your database is secure, efficient, and strictly typed. I forbid the use of `any` in database responses or payloads. I mandate the use of auto-generated TypeScript definitions to guarantee that your code remains in sync with your database schema. I also focus on performance optimizations, such as selecting only necessary columns and handling relationships efficiently.

# When to use this skill

Use this skill when:

- **Initializing a Supabase Client**: Determining the correct client strategy (Client-side vs. Server-side/SSR).
- **Writing Database Queries**: Performing `select`, `insert`, `update`, or `delete` operations.
- **Defining Data Types**: When you need to update or reference the `database.types.ts` file.
- **Handling Auth & RLS**: Ensuring queries respect Row Level Security policies.
- **Debugging Data Issues**: When there is a mismatch between expected and actual data structures.

**Examples:**

- "Generate the TypeScript definitions from the current Supabase project."
- "Write a strongly-typed function to fetch user profiles joining the 'avatars' table."
- "Refactor this query to select only specific fields instead of `*` for better performance."
- "Fix this type error where the inserted payload doesn't match the table schema."

# How to use it

Follow these guidelines to ensure Type-Safe and Efficient Supabase usage:

### 1. Auto-Generate Types (Single Source of Truth)

Never manually define interfaces that mirror your tables. Use the Supabase CLI.
Run: `npx supabase gen types typescript --project-id <your-project-id> --schema public > types/supabase.ts`

### 2. Instantiate with Generic Types

Always inject the `Database` interface into the client creator. This enables autocomplete and type checking for all tables and columns.

```ts
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

// For client-side
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
```

_(Note: If using Next.js SSR, use the `@supabase/ssr` package helpers with the generic type)._

### 3. Strict Query Typing (No `any`)

Let TypeScript infer the return type. Do not cast to `any`.

```ts
// Bad
const { data }: any = await supabase.from("users").select();

// Good
// 'data' is automatically inferred as 'Row<"users">[] | null'
const { data, error } = await supabase.from("users").select("id, username, created_at");

if (error) throw error;
if (!data) return [];

// usages of data[0].username are now type-checked
```

### 4. Efficient Data Fetching

- **Select Specific Columns**: Avoid `.select('*')` if you only need a few fields. This reduces payload size (Big O space optimization).
- **Use Count**: Use `.select('*', { count: 'exact', head: true })` if you only need the number of rows.
- **Relationships**: Use standard joining syntax for related tables.

```ts
const { data } = await supabase.from("posts").select(`
    id,
    title,
    author:users ( username )
  `);
```

### 5. Utility Types for Reusability

Leverage helper types to extract Row or Insert definitions for use in your component props.

```ts
import { Database } from "@/types/supabase";

type Post = Database["public"]["Tables"]["posts"]["Row"];
type NewPost = Database["public"]["Tables"]["posts"]["Insert"];

function PostCard({ post }: { post: Post }) {
  // ...
}
```

### Checklist for Quality

- [ ] Is the client initialized with `<Database>` generic?
- [ ] Are manual type definitions avoided in favor of `database.types.ts`?
- [ ] Are all database calls strictly typed without `as any`?
- [ ] Are queries optimized to select only necessary fields?
- [ ] Is error handling present for every request?
