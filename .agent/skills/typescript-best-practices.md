---
name: TypeScript v5 Best Practices
description: A skill for writing clean, efficient, and modular TypeScript v5 code, emphasizing strict type safety, SOLID/DRY principles, and performance optimization (Big O).
---

# My Skill

I am an expert in TypeScript v5 development, dedicated to producing code that is robust, maintainable, and performant. I focus on leveraging modern TypeScript features while adhering to timeless software engineering principles like SOLID and DRY. I prioritize simplicity and readability ("easiest code possible") but never at the cost of correctness or type safety. I explicitly evaluate time and space complexity (Big O Notation) to ensure applications remain responsive at scale.

# When to use this skill

Use this skill when:

- **Writing business logic**: To ensure logic is type-safe, testable, and strictly typed.
- **Refactoring legacy code**: To remove `any` types, improve type inference, and simplify complex functions.
- **defining data structures**: To choose optimal structures (Map vs Array) based on access patterns.
- **Optimizing performance**: When code seems sluggish or involves processing large datasets.
- **Architecting modules**: To ensure clear separation of concerns and dependency inversion.

**Examples:**

- "Convert this complex utility to use TypeScript Generics with `const` type parameters."
- "Refactor this component to separate the logic (custom hook) from the view, satisfying the Single Responsibility Principle."
- "Optimize this search function from O(n^2) to O(n) or O(1) using a Set or HashMap."
- "Replace these loose object literals with strict interfaces and `readonly` properties."

# How to use it

Follow these guidelines to write high-quality TypeScript v5 code:

### 1. Type Safety First (No `any`)

- **Strict Mode**: Always assume strict mode is on.
- **Avoid `any`**: Use `unknown` if the type is truly not known yet, and narrow it down with type guards.
- **Return Types**: Explicitly define return types for all functions to prevent accidental contract changes.

```ts
// Bad
function getData(input: any) {
  return input.value;
}

// Good
function getData(input: unknown): string | null {
  if (typeof input === "object" && input !== null && "value" in input) {
    return (input as { value: unknown }).value as string; // simplified for example
  }
  return null;
}
```

### 2. Modern TypeScript v5 Features

- Use `const` type parameters for better inference on literal types.
- Use the `satisfies` operator to validate types without widening them.

```ts
// const type parameter
function getProperty<T extends object, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// satisfies
const config = {
  colors: { primary: "red", secondary: "blue" },
} satisfies Record<string, Record<string, string>>;
```

### 3. SOLID & DRY Principles

- **S (Single Responsibility)**: A function or class should do one thing. Extract logic into small, testable utilities.
- **O (Open/Closed)**: Extend functionality via interfaces/generics, not by modifying existing complex code.
- **DRY (Don't Repeat Yourself)**: If you duplicate logic, extract it. If you duplicate types, use utility types (`Pick`, `Omit`, `Partial`).

### 4. Performance & Big O Notation

Always consider the complexity of your algorithms.

- **Prefer Maps/Sets for Lookups**: Using `.find()` in a loop is O(n^2). Using a Map/Set is O(n).
- **Avoid Premature Optimization**, but **Avoid Obvious Bottlenecks**.

```ts
// Bad: O(n * m) complexity
const result = items.filter((item) => otherItems.some((other) => other.id === item.id));

// Good: O(n + m) complexity
const otherIds = new Set(otherItems.map((i) => i.id));
const result = items.filter((item) => otherIds.has(item.id));
```

### 5. Simplicity & Readability

- **Keep it Simple (KISS)**: Write code that is easy to understand. Complexity is technical debt.
- **Immutability**: Prefer `readonly` arrays and properties to prevent side effects.
- **Descriptive Naming**: Variable names should describe _what_ they are, not just their type.

### Checklist for Quality

- [ ] Are `any` types avoided completely?
- [ ] Is strict type checking enabled and valid?
- [ ] Are highly complex logical blocks broken down into smaller functions?
- [ ] Is the algorithmic complexity (Big O) optimized (e.g., avoiding nested loops)?
- [ ] Are `readonly` modifiers used for data that shouldn't change?
