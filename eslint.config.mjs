import neostandard from 'neostandard';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';
import pluginPrettier from 'eslint-plugin-prettier';

const eslintConfig = [
  // Neostandard baseline (ESLint 9 flat config, TypeScript, no style rules = Prettier)
  ...neostandard({
    ts: true,
    noStyle: true,
  }),

  // Next.js presets (React, React Hooks, TypeScript)
  ...nextCoreWebVitals,
  ...nextTypescript,

  // Ignored paths
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      '.agents/**',
      'next-env.d.ts',
      '*.min.js',
    ],
  },

  // TypeScript type-aware linting (only for .ts/.tsx with project)
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    },
  },

  // TypeScript and quality rules
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/prefer-as-const': 'error',

      // General quality
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],

      // React Hooks (already configured by next/core-web-vitals)
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Prettier integration (must be last)
  prettier,
  {
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      'prettier/prettier': [
        'error',
        {
          semi: true,
          singleQuote: true,
          tabWidth: 2,
          trailingComma: 'es5',
          printWidth: 100,
          bracketSpacing: true,
          arrowParens: 'always',
          endOfLine: 'lf',
        },
      ],
    },
  },
];

export default eslintConfig;
