/**
 * Dummy data that matches the database structure
 * Used for development and testing
 */
import {
  AccountWithBalance,
  BudgetCategory,
  BudgetData,
  BudgetPageBudget,
  BudgetPageTransaction,
  BudgetWithSpent,
  Category,
  ChartData,
  DailyExpenseData,
  DashboardBankAccount,
  DashboardBudget,
  ExpenseData,
  Group,
  GroupMember,
  IncomeData,
  InvestmentHolding,
  MemberData,
  Person,
  Plan,
  TransactionWithAccount,
  UpcomingTransaction
} from './types';
import {
  createBudget,
  createInvestment,
  createTransaction,
  generateDailyExpenses,
  generateExpenseData,
  generateIncomeData,
  generateWeeklyExpenses,
  generateWeeklyIncome,
  getBudgetColor,
  getBudgetIcon,
  getCategoryStats,
  getRandomAmount,
  getRandomDate,
  totalInvestmentValue
} from './utils';

export const dummyGroups: Group[] = [
  {
    id: 'group_1',
    name: 'Famiglia Rossi',
    description: 'Gruppo familiare per la gestione delle finanze domestiche',
    user_id: 'user_clerk_123',
    is_active: true,
    created_at: getRandomDate(new Date('2023-06-01'), new Date('2023-12-01')),
    updated_at: getRandomDate(new Date('2024-01-01'), new Date())
  }
];

export const dummyPeople: Person[] = [
  {
    id: 'person_1',
    name: 'Marco Rossi',
    avatar: '👨‍💼',
    theme_color: '#3B82F6',
    budget_start_date: '2024-01-01',
    budget_periods: [],
    group_id: 'group_1',
    role: 'owner',
    created_at: getRandomDate(new Date('2023-06-01'), new Date('2023-12-01')),
    updated_at: getRandomDate(new Date('2024-08-01'), new Date())
  },
  {
    id: 'person_2',
    name: 'Sofia Rossi',
    avatar: '👩‍💼',
    theme_color: '#10B981',
    budget_start_date: '2024-01-01',
    budget_periods: [],
    group_id: 'group_1',
    role: 'admin',
    created_at: getRandomDate(new Date('2023-07-01'), new Date('2023-12-01')),
    updated_at: getRandomDate(new Date('2024-08-15'), new Date())
  },
  {
    id: 'person_3',
    name: 'Luca Rossi',
    avatar: '👦',
    theme_color: '#F59E0B',
    budget_start_date: '2024-06-01',
    budget_periods: [],
    group_id: 'group_1',
    role: 'member',
    created_at: getRandomDate(new Date('2024-05-01'), new Date('2024-06-01')),
    updated_at: getRandomDate(new Date('2024-08-01'), new Date())
  }
];

export const dummyCategories: Category[] = [
  { id: 'cat_1', name: 'Alimentari', created_at: getRandomDate(new Date('2023-06-01'), new Date('2023-12-01')), updated_at: getRandomDate(new Date('2024-01-01'), new Date()) },
  { id: 'cat_2', name: 'Trasporti', created_at: getRandomDate(new Date('2023-06-01'), new Date('2023-12-01')), updated_at: getRandomDate(new Date('2024-01-01'), new Date()) },
  { id: 'cat_3', name: 'Intrattenimento', created_at: getRandomDate(new Date('2023-06-01'), new Date('2023-12-01')), updated_at: getRandomDate(new Date('2024-01-01'), new Date()) },
  { id: 'cat_4', name: 'Bollette', created_at: getRandomDate(new Date('2023-06-01'), new Date('2023-12-01')), updated_at: getRandomDate(new Date('2024-01-01'), new Date()) },
  { id: 'cat_5', name: 'Stipendio', created_at: getRandomDate(new Date('2023-06-01'), new Date('2023-12-01')), updated_at: getRandomDate(new Date('2024-01-01'), new Date()) },
  { id: 'cat_6', name: 'Shopping', created_at: getRandomDate(new Date('2023-06-01'), new Date('2023-12-01')), updated_at: getRandomDate(new Date('2024-01-01'), new Date()) },
  { id: 'cat_7', name: 'Salute', created_at: getRandomDate(new Date('2023-06-01'), new Date('2023-12-01')), updated_at: getRandomDate(new Date('2024-01-01'), new Date()) },
  { id: 'cat_8', name: 'Casa & Giardino', created_at: getRandomDate(new Date('2023-06-01'), new Date('2023-12-01')), updated_at: getRandomDate(new Date('2024-01-01'), new Date()) },
  { id: 'cat_9', name: 'Educazione', created_at: getRandomDate(new Date('2023-06-01'), new Date('2023-12-01')), updated_at: getRandomDate(new Date('2024-01-01'), new Date()) },
  { id: 'cat_10', name: 'Viaggi', created_at: getRandomDate(new Date('2023-06-01'), new Date('2023-12-01')), updated_at: getRandomDate(new Date('2024-01-01'), new Date()) },
];

export const dummyTransactions: TransactionWithAccount[] = [
  createTransaction('trx_1', 'Stipendio Mensile - Marco', 4750.00, 'entrata', 'Stipendio', 'acc_1', 2),
  createTransaction('trx_2', 'Freelance Web Development', 1200.00, 'entrata', 'Stipendio', 'acc_1', 5),
  createTransaction('trx_3', 'Supermercato Conad', getRandomAmount(80, 150), 'spesa', 'Alimentari', 'acc_1', 1),
  createTransaction('trx_4', 'Esselunga Spesa Settimanale', getRandomAmount(90, 180), 'spesa', 'Alimentari', 'acc_1', 3),
  createTransaction('trx_5', 'Mercato Locale Frutta', getRandomAmount(15, 35), 'spesa', 'Alimentari', 'acc_1', 6),
  createTransaction('trx_6', 'Panificio del Borgo', getRandomAmount(8, 18), 'spesa', 'Alimentari', 'acc_1', 7),
  createTransaction('trx_7', 'Carburante Shell', getRandomAmount(45, 75), 'spesa', 'Trasporti', 'acc_3', 2),
  createTransaction('trx_8', 'Abbonamento ATM Mensile', 39.00, 'spesa', 'Trasporti', 'acc_1', 4),
  createTransaction('trx_9', 'Taxi Aeroporto', getRandomAmount(25, 40), 'spesa', 'Trasporti', 'acc_3', 8),
  createTransaction('trx_10', 'Parcheggio Centro', getRandomAmount(3, 8), 'spesa', 'Trasporti', 'acc_3', 1),
  createTransaction('trx_11', 'Bolletta Elettrica Enel', getRandomAmount(85, 120), 'spesa', 'Bollette', 'acc_1', 5),
  createTransaction('trx_12', 'Bolletta Gas Eni', getRandomAmount(45, 80), 'spesa', 'Bollette', 'acc_1', 10),
  createTransaction('trx_13', 'Internet Fastweb', 29.90, 'spesa', 'Bollette', 'acc_1', 15),
  createTransaction('trx_14', 'Telefono Vodafone', 24.90, 'spesa', 'Bollette', 'acc_1', 12),
  createTransaction('trx_15', 'Netflix Abbonamento', 15.99, 'spesa', 'Intrattenimento', 'acc_3', 3),
  createTransaction('trx_16', 'Cinema UCI', getRandomAmount(18, 32), 'spesa', 'Intrattenimento', 'acc_3', 6),
  createTransaction('trx_17', 'Spotify Premium', 9.99, 'spesa', 'Intrattenimento', 'acc_3', 7),
  createTransaction('trx_18', 'Cena Ristorante Il Convivio', getRandomAmount(65, 95), 'spesa', 'Intrattenimento', 'acc_1', 4),
  createTransaction('trx_19', 'Aperitivo Bar Centrale', getRandomAmount(18, 28), 'spesa', 'Intrattenimento', 'acc_3', 2),
  createTransaction('trx_20', 'Amazon - Elettronica', getRandomAmount(45, 180), 'spesa', 'Shopping', 'acc_3', 8),
  createTransaction('trx_21', 'Zara - Abbigliamento', getRandomAmount(85, 160), 'spesa', 'Shopping', 'acc_3', 14),
  createTransaction('trx_22', 'Decathlon - Sport', getRandomAmount(35, 90), 'spesa', 'Shopping', 'acc_3', 20),
  createTransaction('trx_23', 'Libreria Mondadori', getRandomAmount(15, 35), 'spesa', 'Shopping', 'acc_3', 9),
  createTransaction('trx_24', 'Farmacia Comunale', getRandomAmount(18, 45), 'spesa', 'Salute', 'acc_1', 7),
  createTransaction('trx_25', 'Dentista Dr. Bianchi', 120.00, 'spesa', 'Salute', 'acc_1', 12),
  createTransaction('trx_26', 'Palestra Virgin Active', 89.00, 'spesa', 'Salute', 'acc_1', 1),
  createTransaction('trx_27', 'IKEA - Arredamento', getRandomAmount(125, 350), 'spesa', 'Casa & Giardino', 'acc_1', 18),
  createTransaction('trx_28', 'Leroy Merlin - Giardino', getRandomAmount(45, 120), 'spesa', 'Casa & Giardino', 'acc_1', 25),
  createTransaction('trx_29', 'Bricocenter - Riparazioni', getRandomAmount(25, 85), 'spesa', 'Casa & Giardino', 'acc_1', 11),
  createTransaction('trx_30', 'Corso di Inglese British Council', 340.00, 'spesa', 'Educazione', 'acc_1', 30),
  createTransaction('trx_31', 'Udemy - Corsi Online', 89.99, 'spesa', 'Educazione', 'acc_3', 22),
  createTransaction('trx_32', 'Booking.com - Hotel Roma', getRandomAmount(180, 280), 'spesa', 'Viaggi', 'acc_3', 45),
  createTransaction('trx_33', 'Trenitalia - Milano-Roma', 59.90, 'spesa', 'Viaggi', 'acc_3', 47),
];

const totalIncome = dummyTransactions
  .filter(t => t.type === 'entrata')
  .reduce((sum, t) => sum + t.amount, 0);

const creditCardExpenses = dummyTransactions
  .filter(t => t.account_id === 'acc_3' && t.type === 'spesa')
  .reduce((sum, t) => sum + t.amount, 0);

const checkingAccountNet = dummyTransactions
  .filter(t => t.account_id === 'acc_1')
  .reduce((sum, t) => sum + (t.type === 'entrata' ? t.amount : -t.amount), 0);

export const dummyInvestmentHoldings: InvestmentHolding[] = [
  createInvestment('inv_1', 'person_1', 'Apple Inc.', 'AAPL', 25, 150.25, 189.75, '2023-06-15'),
  createInvestment('inv_2', 'person_1', 'Vanguard S&P 500 ETF', 'VOO', 18, 380.00, 445.30, '2023-03-20'),
  createInvestment('inv_3', 'person_2', 'Microsoft Corporation', 'MSFT', 12, 280.75, 398.85, '2023-04-10'),
  createInvestment('inv_4', 'person_1', 'Tesla Inc.', 'TSLA', 8, 220.00, 198.25, '2023-09-05'),
  createInvestment('inv_5', 'person_1', 'NVIDIA Corporation', 'NVDA', 5, 425.00, 675.50, '2023-11-12'),
  createInvestment('inv_6', 'person_2', 'Amazon.com Inc.', 'AMZN', 10, 145.30, 168.75, '2023-07-22'),
  createInvestment('inv_7', 'person_1', 'iShares MSCI World ETF', 'IWDA', 30, 78.40, 85.20, '2023-05-08'),
  createInvestment('inv_8', 'person_2', 'Alphabet Inc. Class A', 'GOOGL', 7, 125.80, 142.60, '2023-08-15')
];

export const dummyAccounts: AccountWithBalance[] = [
  {
    id: 'acc_1',
    name: 'Conto Corrente Principale',
    type: 'contanti',
    balance: Math.round((8500.00 + checkingAccountNet) * 100) / 100,
    initial_balance: 8500.00,
    person_ids: ['person_1', 'person_2'],
    group_id: 'group_1',
    created_at: getRandomDate(new Date('2023-01-01'), new Date('2023-06-01')),
    updated_at: getRandomDate(new Date(), new Date())
  },
  {
    id: 'acc_2',
    name: 'Conto Risparmio',
    type: 'risparmio',
    balance: 18750.25,
    initial_balance: 15000.00,
    person_ids: ['person_1', 'person_2'],
    group_id: 'group_1',
    created_at: getRandomDate(new Date('2022-08-01'), new Date('2023-01-01')),
    updated_at: getRandomDate(new Date('2024-08-01'), new Date())
  },
  {
    id: 'acc_3',
    name: 'Carta di Credito',
    type: 'contanti',
    balance: Math.round(-creditCardExpenses * 100) / 100,
    initial_balance: 0,
    person_ids: ['person_1'],
    group_id: 'group_1',
    created_at: getRandomDate(new Date('2023-03-01'), new Date('2023-08-01')),
    updated_at: getRandomDate(new Date(), new Date())
  },
  {
    id: 'acc_4',
    name: 'Portafoglio Investimenti',
    type: 'investimenti',
    balance: Math.round(totalInvestmentValue(dummyInvestmentHoldings) * 100) / 100,
    initial_balance: 25000.00,
    person_ids: ['person_1', 'person_2'],
    group_id: 'group_1',
    created_at: getRandomDate(new Date('2023-01-01'), new Date('2023-06-01')),
    updated_at: getRandomDate(new Date('2024-08-01'), new Date())
  },
  {
    id: 'acc_5',
    name: 'Conto Giovani - Luca',
    type: 'contanti',
    balance: 450.30,
    initial_balance: 200.00,
    person_ids: ['person_3'],
    group_id: 'group_1',
    created_at: getRandomDate(new Date('2024-05-01'), new Date('2024-06-01')),
    updated_at: getRandomDate(new Date('2024-08-01'), new Date())
  }
];

export const dummyBudgets: BudgetWithSpent[] = [
  createBudget('bdg_1', 'Budget Spese Quotidiane', 950, 'monthly', ['Alimentari', 'Trasporti'], 'person_1'),
  createBudget('bdg_2', 'Budget Intrattenimento & Svago', 450, 'monthly', ['Intrattenimento', 'Shopping'], 'person_1'),
  createBudget('bdg_3', 'Budget Salute & Benessere', 280, 'monthly', ['Salute'], 'person_2'),
  createBudget('bdg_4', 'Budget Casa & Bollette', 650, 'monthly', ['Bollette', 'Casa & Giardino'], 'person_1'),
  createBudget('bdg_5', 'Budget Educazione & Crescita', 400, 'monthly', ['Educazione'], 'person_1'),
  createBudget('bdg_6', 'Budget Viaggi', 1200, 'monthly', ['Viaggi'], 'person_1'),
  createBudget('bdg_7', 'Budget Risparmio Annuale', 15000, 'annually', [], 'person_1'),
  createBudget('bdg_8', 'Budget Giovani - Luca', 150, 'monthly', ['Shopping', 'Intrattenimento'], 'person_3')
];

export const dashboardBankAccounts: DashboardBankAccount[] = dummyAccounts.slice(0, 4).map((acc, index) => ({
  id: index + 1,
  name: acc.name,
  type: acc.name,
  owner: acc.person_ids.includes('person_1') ? 'Marco Rossi' : 'Sofia Rossi',
  balance: acc.balance,
  icon: acc.type === 'risparmio' ? 'PiggyBank' :
    acc.type === 'investimenti' ? 'TrendingUp' :
      acc.name.includes('Credito') ? 'CreditCard' : 'Building2',
  color: acc.type === 'risparmio' ? 'bg-green-500' :
    acc.type === 'investimenti' ? 'bg-purple-500' :
      acc.balance < 0 ? 'bg-red-500' : 'bg-blue-500'
}));

export const dashboardBudgets: DashboardBudget[] = dummyBudgets.slice(0, 4).map((budget, index) => ({
  id: index + 1,
  name: budget.description.replace('Budget ', ''),
  amount: budget.amount,
  spent: budget.spent_amount || 0,
  color: getBudgetColor(budget.percentage_used || 0),
  icon: getBudgetIcon(budget.description),
  categories: budget.categories.map(getCategoryStats)
}));

export const upcomingTransactions: UpcomingTransaction[] = [
  {
    id: 1,
    title: "Affitto Mensile",
    bankAccount: "Conto Corrente",
    daysRemaining: 2,
    amount: 1450,
    icon: "Home"
  },
  {
    id: 2,
    title: "Bolletta Internet Fastweb",
    bankAccount: "Conto Corrente",
    daysRemaining: 5,
    amount: 29.90,
    icon: "Wifi"
  },
  {
    id: 3,
    title: "Spesa Settimanale",
    bankAccount: "Carta di Credito",
    daysRemaining: 1,
    amount: 85,
    icon: "ShoppingCart"
  },
  {
    id: 4,
    title: "Rata Assicurazione Auto",
    bankAccount: "Conto Corrente",
    daysRemaining: 8,
    amount: 245.80,
    icon: "Car"
  },
  {
    id: 5,
    title: "Palestra Virgin Active",
    bankAccount: "Conto Corrente",
    daysRemaining: 12,
    amount: 89.00,
    icon: "Dumbbell"
  }
];

export const budgetPageBudgets: BudgetPageBudget[] = dummyBudgets.map((budget, index) => ({
  id: index + 1,
  name: budget.description.replace('Budget ', ''),
  amount: budget.amount,
  spent: budget.spent_amount || 0,
  color: getBudgetColor(budget.percentage_used || 0),
  icon: getBudgetIcon(budget.description)
}));

export const budgetExpenseData: number[] = generateWeeklyExpenses();
export const budgetIncomeData: number[] = generateWeeklyIncome();

export const dailyExpenseData: DailyExpenseData[] = generateDailyExpenses();

export const budgetCategories: BudgetCategory[] = [
  { name: "Alimentari", color: "#10b981" },
  { name: "Intrattenimento", color: "#f59e0b" },
  { name: "Shopping", color: "#3b82f6" },
  { name: "Trasporti", color: "#8b5cf6" },
  { name: "Bollette", color: "#ef4444" }
];

export const budgetTransactions: BudgetPageTransaction[] = dummyTransactions
  .filter(t => t.type === 'spesa')
  .slice(0, 15)
  .map((t, index) => ({
    id: index + 1,
    title: t.description,
    category: t.category,
    amount: t.amount,
    date: t.date
  }));

export const transactionsPageData = {
  today: [
    { id: 1, title: "Fresh Foods Market", description: "Fresh Foods Market", category: "Groceries", amount: 45.20, type: "expense" as const, date: "2024-01-31", icon: "🛒", account: "Credit Card" },
    { id: 2, title: "Cinema City", description: "Cinema City", category: "Entertainment", amount: 22.50, type: "expense" as const, date: "2024-01-31", icon: "🎬", account: "Checking" }
  ],
  yesterday: [
    { id: 3, title: "Power Company", description: "Power Company", category: "Utilities", amount: 75.00, type: "expense" as const, date: "2024-01-30", icon: "⚡", account: "Checking" },
    { id: 4, title: "Tech Solutions Inc.", description: "Tech Solutions Inc.", category: "Salary", amount: 3500.00, type: "income" as const, date: "2024-01-30", icon: "💰", account: "Checking" }
  ],
  thisWeek: [
    { id: 5, title: "Gas Station", description: "Gas Station", category: "Transportation", amount: 65.00, type: "expense" as const, date: "2024-01-29", icon: "⛽", account: "Credit Card" },
    { id: 6, title: "Subscription Service", description: "Subscription Service", category: "Entertainment", amount: 9.99, type: "expense" as const, date: "2024-01-28", icon: "📺", account: "Checking" },
    { id: 7, title: "Online Store", description: "Online Store", category: "Shopping", amount: 89.99, type: "expense" as const, date: "2024-01-27", icon: "📦", account: "Credit Card" }
  ]
};

export const upcomingTransactionsList = [
  { id: 1, title: "Affitto Mensile", category: "Housing", amount: 1200, type: "expense" as const, date: "2024-02-01", icon: "🏠", account: "Conto Corrente", daysLeft: 1, memberId: "marco" },
  { id: 2, title: "Bolletta Internet Fastweb", category: "Utilities", amount: 50, type: "expense" as const, date: "2024-02-02", icon: "📶", account: "Conto Corrente", daysLeft: 2, memberId: "sofia" },
  { id: 3, title: "Spesa Settimanale", category: "Groceries", amount: 120, type: "expense" as const, date: "2024-02-03", icon: "🛒", account: "Carta di Credito", daysLeft: 3, memberId: "marco" }
];

export const recurrentTransactions = [
  { id: 1, title: "Netflix Abbonamento", category: "Entertainment", amount: 15.99, frequency: "Monthly", nextDate: "2024-02-05", icon: "📺", account: "Conto Corrente", memberId: "marco" },
  { id: 2, title: "Palestra Virgin Active", category: "Health", amount: 29.99, frequency: "Monthly", nextDate: "2024-02-10", icon: "💪", account: "Conto Corrente", memberId: "marco" },
  { id: 3, title: "Telefono Vodafone", category: "Utilities", amount: 45.00, frequency: "Monthly", nextDate: "2024-02-15", icon: "📱", account: "Conto Corrente", memberId: "sofia" }
];

export const plans: Plan[] = [
  {
    type: 'superadmin',
    name: 'Super Admin',
    description: 'Developer access with full system control',
    features: ['Full system access', 'Database management', 'User management', 'Analytics dashboard'],
  },
  {
    type: 'admin',
    name: 'Admin',
    description: 'Premium features with group management',
    features: ['Premium features', 'Unlimited budgets', 'Advanced analytics', 'Group management', 'Member invites'],
    maxMembers: 10,
  },
  {
    type: 'member',
    name: 'Premium Member',
    description: 'Premium features for personal use',
    features: ['Premium features', 'Unlimited budgets', 'Advanced analytics', 'Data export'],
    maxMembers: 1,
  },
  {
    type: 'free',
    name: 'Free',
    description: 'Basic financial tracking',
    features: ['Basic budgeting', 'Transaction tracking', 'Simple reports'],
    maxMembers: 1,
  },
];

export const currentUserPlan: Plan = plans[1]; // Admin plan

export const groupMembers: GroupMember[] = [
  {
    id: 'member_1',
    name: 'Alex Morgan',
    email: 'alex.morgan@email.com',
    avatar: '👤',
    role: 'admin',
    joinDate: '2024-01-01',
    isActive: true,
  },
  {
    id: 'member_2',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@email.com',
    avatar: '👩‍💼',
    role: 'member',
    joinDate: '2024-01-15',
    isActive: true,
  },
  {
    id: 'member_3',
    name: 'Mike Johnson',
    email: 'mike.johnson@email.com',
    avatar: '👨‍💻',
    role: 'member',
    joinDate: '2024-02-01',
    isActive: false,
  },
];

export const membersData: MemberData[] = [
  {
    id: 'marco',
    name: 'Marco Rossi',
    avatar: '👤',
    color: '#3b82f6',
    accounts: {
      stipendio: 4500.00,
      risparmio: 12350.75,
      contanti: 5000.00 + totalIncome - 300.00,
      investimenti: 25430.80,
    },
    budgets: [
      { category: 'Alimentari & Trasporti', budget: 800, spent: 204.00, remaining: 596.00, percentage: 25.50 },
      { category: 'Intrattenimento & Shopping', budget: 350, spent: 100.48, remaining: 249.52, percentage: 28.71 },
      { category: 'Salute & Bollette', budget: 800, spent: 112.95, remaining: 687.05, percentage: 14.12 },
      { category: 'Risparmio', budget: 3000, spent: 0.00, remaining: 3000.00, percentage: 0.00 },
    ],
    transactions: [
      { id: 1, title: 'Pranzo Ristorante', icon: '🍝', description: 'Pranzo Ristorante', amount: 45.00, type: 'expense', category: 'Alimentari', date: '2025-01-02', account: 'Carta di Credito' },
      { id: 2, title: 'Freelance Project', icon: '💻', description: 'Freelance Project', amount: 800.00, type: 'income', category: 'Stipendio', date: '2025-01-01', account: 'Conto Corrente' },
      { id: 3, title: 'Cinema Ticket', icon: '🎬', description: 'Cinema Ticket', amount: 12.50, type: 'expense', category: 'Intrattenimento', date: '2024-12-30', account: 'Contanti' },
      { id: 4, title: 'Autobus Abbonamento', icon: '🚌', description: 'Autobus Abbonamento', amount: 35.00, type: 'expense', category: 'Trasporti', date: '2025-01-01', account: 'Carta di Credito' },
    ],
  },
  {
    id: 'sofia',
    name: 'Sofia Rossi',
    avatar: '👩‍💼',
    color: '#10b981',
    accounts: {
      stipendio: 0.00,
      risparmio: 12350.75,
      contanti: 5000.00 + totalIncome - 300.00,
      investimenti: 25430.80,
    },
    budgets: [
      { category: 'Alimentari & Trasporti', budget: 400, spent: 0.00, remaining: 400.00, percentage: 0.00 },
      { category: 'Intrattenimento & Shopping', budget: 200, spent: 0.00, remaining: 200.00, percentage: 0.00 },
      { category: 'Salute & Bollette', budget: 300, spent: 0.00, remaining: 300.00, percentage: 0.00 },
      { category: 'Risparmio', budget: 1500, spent: 0.00, remaining: 1500.00, percentage: 0.00 },
    ],
    transactions: [
      { id: 1, title: 'Farmacia Comunale', icon: '💊', description: 'Farmacia Comunale', amount: 23.45, type: 'expense', category: 'Salute', date: '2025-01-02', account: 'Conto Corrente' },
      { id: 2, title: 'Yoga Class', icon: '🧘‍♀️', description: 'Yoga Class', amount: 15.00, type: 'expense', category: 'Salute', date: '2025-01-01', account: 'Contanti' },
      { id: 3, title: 'Book Purchase', icon: '📚', description: 'Book Purchase', amount: 18.50, type: 'expense', category: 'Educazione', date: '2024-12-30', account: 'Carta di Credito' },
    ],
  },
];

const categoryColors: Record<string, string> = {
  'Alimentari': '#10b981',
  'Intrattenimento': '#f59e0b',
  'Shopping': '#3b82f6',
  'Trasporti': '#8b5cf6',
  'Bollette': '#ef4444',
  'Salute': '#06b6d4',
  'Casa & Giardino': '#f97316',
  'Educazione': '#84cc16',
  'Viaggi': '#06b6d4'
};

export const expenseData: ExpenseData[] = generateExpenseData(categoryColors);

export const incomeData: IncomeData[] = generateIncomeData();

export const budgetOverviewData: BudgetData[] = dummyBudgets.slice(0, 6).map(budget => ({
  category: budget.description.replace('Budget ', ''),
  budget: budget.amount,
  spent: budget.spent_amount || 0,
  remaining: budget.remaining_amount || budget.amount,
  percentage: Math.round((budget.percentage_used || 0) * 100) / 100
}));

export const defaultChartData: ChartData = {
  expense: budgetExpenseData,
  income: budgetIncomeData,
  dailyExpenses: dailyExpenseData
};

export const upcomingTransactionsData = {
  all: [
    { id: "1", title: "Rent Payment", bankAccount: "Checking", daysRemaining: 1, amount: 1200, icon: "Home" },
    { id: "2", title: "Internet Bill", bankAccount: "Checking", daysRemaining: 2, amount: 50, icon: "Wifi" }
  ],
  alex: [
    { id: "1", title: "Rent Payment", bankAccount: "Checking", daysRemaining: 1, amount: 1200, icon: "Home" }
  ],
  sarah: [
    { id: "2", title: "Internet Bill", bankAccount: "Checking", daysRemaining: 2, amount: 50, icon: "Wifi" }
  ]
};

export const currentUser = {
    name: "Alex Morgan",
    email: "alex.morgan@email.com",
    phone: "+1 (555) 123-4567",
    role: currentUserPlan.type,
    groupId: "group-1",
    groupName: "My Group"
  };