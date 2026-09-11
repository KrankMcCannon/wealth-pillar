# STRUCTURE

Whole-app, mobile-first, **scannable** density on operator screens. Auth and empty states may go a step sparser. One job per surface.

## Surfaces

| Surface | Route / host | Job (one sentence) | Type | Density | Primary action | Controls |
|---|---|---|---|---|---|---|
| Sign in | `/sign-in` | Authenticate to the household workspace. | page | sparse | Continue with provider / email | Clerk fields, OAuth block buttons |
| Sign up | `/sign-up` | Create an account. | page | sparse | Sign up | Clerk fields, OAuth |
| Onboarding | `/onboarding` | Name the group, add at least one account, optionally a first budget. | wizard | scannable | Continue / Finish | Text, account fields, skip on budgets |
| Home | `/home` | Answer “can I spend?”, then show period track, commitments, recent posts. | page | scannable | Open accounts (spendable) | Segmented user scope; links into budgets / ledger |
| Accounts | `/accounts` | See where spendable and reserve live; add or edit a account. | page | scannable | Add account | List rows → edit sheet; FAB |
| Transactions | `/transactions` | Review and record money that moved. | page | scannable | Add transaction | Tabs (ledger / recurring); filter chips + drawer; FAB |
| Recurring (tab) | `/transactions` (tab) | See committed series that already claim spendable. | module | scannable | Add series | Same page tabs |
| Budgets | `/budgets` | See if this period is on track by category. | page | scannable | Add budget | Period header; list; overflow; FAB |
| Budget detail | `/budgets/[budgetId]` | Inspect one category budget. | page | scannable | Edit budget | Back header; chart module |
| Close period | budgets overlay | Close the current budget period. | modal | compact | Close period | Confirm |
| Edit closing date | budgets overlay | Change when the period ends. | modal | compact | Save date | Date field |
| Investments | `/investments` | Track retail holdings (illustrative, not advice). | page | scannable | Add holding | Tabs (portfolio / sandbox); FAB |
| Add investment | investments overlay | Record a holding. | drawer | scannable | Save | Combobox (share), number, date |
| Reports | `/reports` | Understand inflow vs outflow for a window. | page | scannable | Open a period | Time chips; user scope |
| Riserva | `/reports` module | See net spendable↔reserve flow for the report window. | module | scannable | View movements | Same time chips + UserSelector; link into ledger |
| Period detail | `/reports/periods/[periodId]` | Read one closed period against its budget snapshot. | page | scannable | Back to reports | Modules only |
| Settings | `/settings` | Profile, group, preferences. | page | scannable | Edit the tapped row | Rows → sheets; theme switch |
| Currency / language / timezone | settings overlay | Pick one preference. | modal | compact | Confirm | Searchable select (long lists) |
| Profile / group / invite / categories | settings overlay | Edit household membership or category list. | drawer | scannable | Save | Text, radios, lists |
| Transaction form | ledger overlay | Create or edit one movement. | drawer | scannable | Save transaction | Amount, radios (type), combobox (category), date, account select |
| Account form | accounts overlay | Create or edit one account. | drawer | scannable | Save account | Text, radio cards (type), number |
| Budget form | budgets overlay | Create or edit one category budget. | drawer | scannable | Save budget | Category, amount, period fields |
| Category form | settings / forms | Create or edit a category. | drawer | compact | Save category | Text, icon picker |
| Import CSV | transactions overlay | Import Revolut/Credem rows with dedup. | wizard sheet | scannable | Import | File, preview table |
| Filters | transactions overlay | Narrow the ledger. | drawer | scannable | Apply filters | Date range, multi-selects |
| Date picker | forms | Set a single date. | drawer | compact | Confirm date | Calendar + typed value |
| Confirm | global | Confirm a destructive or costly act. | dialog | sparse | Named verb + object | Two buttons |
| Auth / page error | `error.tsx` | Recover from a failed load. | page | sparse | Try again | Button |

## Navigation

Primary jobs (bottom bar, five tabs): **Home**, **Transactions**, **Budgets**, **Investments**, **Reports**.

Not in the primary nav:

- **Accounts** — drill-in from the home spendable figure (the home job is “can I spend?”, not “manage products”).
- **Settings** — header icon, every dashboard page.
- Auth and onboarding — outside the shell.

Do not use a dropdown for these destinations. Nested budget and period routes keep the parent tab current.

Header chrome is one bar: page title (app name on Home) and Settings. Back is only on drill-ins — Accounts, Settings, budget detail, period detail. Primary tabs do not use Back.

## Controls

| Choice | Control |
|---|---|
| Whose money am I looking at? (few people) | Segmented / avatar toggle (`UserSelector`) |
| Ledger vs recurring; portfolio vs sandbox | Tabs (same object, alternate views) |
| Report time window (few presets) | Chip / segmented |
| Custom date range | Date drawer (typeable) |
| Transaction type (in / out / transfer) | Radio group |
| Account type (4) | Radio cards |
| Category (long) | Combobox |
| Share ticker (unknown set) | Combobox |
| Theme light/dark | Switch (immediate) |
| Currency, language, timezone | Searchable select in a sheet |
| On/off inside a form that still Saves | Checkbox, not a switch |
| Add on a list page | FAB → sheet, not a new primary nav item |

## Out of scope

Marketing landing, desktop-only layouts, a sixth primary tab, gamification, brokerage trade tickets.

## Source

authored
