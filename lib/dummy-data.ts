import {
  Account,
  Budget,
  Category,
  Group,
  InvestmentHolding,
  Transaction,
  User
} from './types';

const getRandomDate = (start: Date, end: Date): Date => {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date;
};

const getRandomAmount = (min: number, max: number): number => {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
};

const createGroup = (
  id: string,
  name: string,
  description: string,
  user_ids: string[],
  plan: { type: 'premium' | 'free'; name: string },
  days_ago: number = 1,
  is_active: boolean = true
): Group => {
  const date = new Date();
  date.setDate(date.getDate() - days_ago);
  const created_at = getRandomDate(new Date(date.getTime() - 3600000), date);

  return {
    id,
    name,
    description,
    user_ids,
    plan,
    is_active,
    created_at,
    updated_at: created_at,
  };
};

const createUser = (
  id: string,
  name: string,
  email: string,
  avatar: string,
  theme_color: string,
  budget_start_date: number,
  budget_periods: { start_date: Date; end_date: Date }[] | null,
  group_id: string,
  role: 'superadmin' | 'admin' | 'member',
  days_ago: number = 1
): User => {
  const date = new Date();
  date.setDate(date.getDate() - days_ago);
  const created_at = getRandomDate(new Date(date.getTime() - 3600000), date);

  return {
    id,
    name,
    email,
    avatar,
    theme_color,
    budget_start_date,
    budget_periods,
    group_id,
    role,
    created_at,
    updated_at: created_at
  };
};

const createCategory = (id: string, key: string): Category => {
  const date = new Date();
  date.setDate(date.getDate());
  const created_at = getRandomDate(new Date(date.getTime() - 3600000), date);
  const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    id,
    label,
    key,
    created_at,
    updated_at: created_at
  };
};

const createTransaction = (
  id: string,
  description: string,
  amount: number,
  type: 'income' | 'expense',
  category: string,
  user_id: string,
  account_id: string,
  to_account_id: string | null,
  linked_transaction_ids: string[] | [],
  status: 'not_reconciled' | 'partly_reconciled' | 'reconciled' = 'not_reconciled',
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly' = 'monthly',
  days_ago: number = 1
): Transaction => {
  const date = new Date();
  date.setDate(date.getDate() - days_ago);
  const created_at = getRandomDate(new Date(date.getTime() - 3600000), date);

  return {
    id,
    description,
    amount: Math.round(amount * 100) / 100,
    type,
    category,
    user_id,
    date,
    account_id,
    to_account_id,
    linked_transaction_ids,
    status,
    frequency,
    created_at: created_at,
    updated_at: created_at
  };
};

const createAccount = (
  id: string,
  name: string,
  type: 'payroll' | 'savings' | 'cash' | 'investments',
  user_ids: string[],
  group_id: string,
  days_ago: number = 1
): Account => {
  const date = new Date();
  date.setDate(date.getDate() - days_ago);
  const created_at = getRandomDate(new Date(date.getTime() - 3600000), date);

  return {
    id,
    name,
    type,
    user_ids,
    group_id,
    created_at,
    updated_at: created_at
  };
};

const createBudget = (
  id: string,
  description: string,
  amount: number,
  type: 'monthly' | 'annually',
  categories: string[],
  user_id: string,
  icon: string,
  days_ago: number = 1
): Budget => {
  const date = new Date();
  date.setDate(date.getDate() - days_ago);
  const created_at = getRandomDate(new Date(date.getTime() - 3600000), date);

  return {
    id,
    description,
    amount,
    type,
    categories,
    user_id,
    icon,
    created_at,
    updated_at: created_at,
  };
};

const createInvestment = (
  id: string,
  user_id: string,
  name: string,
  symbol: string,
  quantity: number,
  purchase_price: number,
  current_price: number,
  purchase_date: Date,
  days_ago: number = 1
): InvestmentHolding => {
  const date = new Date();
  date.setDate(date.getDate() - days_ago);
  const created_at = getRandomDate(new Date(purchase_date), date);
  
  return {
    id,
    user_id,
    name,
    symbol,
    quantity,
    purchase_price: Math.round(purchase_price * 100) / 100,
    current_price: Math.round(current_price * 100) / 100,
    purchase_date,
    group_id: 'group_1',
    created_at,
    updated_at: created_at,
  };
};

export const dummyGroups: Group[] = [
  createGroup('group_1', 'Famiglia Valentini', 'Gruppo familiare per la gestione delle finanze domestiche', ['user_1'], { type: 'premium', name: 'Abbonamento Premium' }),
];

export const dummyUsers: User[] = [
  createUser('user_1', 'Edoardo Valentini', 'edoardo.valentini@example.com', '👨‍💼', '#3B82F6', 1, [], 'group_1', 'admin'),
  createUser('user_2', 'Ivana Piscitelli', 'ivana.piscitelli@example.com', '👩‍💼', '#10B981', 15, [], 'group_1', 'member'),
];

export const currentUser = dummyUsers[0];

export const dummyCategories: Category[] = [
  createCategory('cat_1', 'parrucchiere'),
  createCategory('cat_2', 'trasferimento'),
  createCategory('cat_3', 'altro'),
  createCategory('cat_4', 'bonifico'),
  createCategory('cat_5', 'abbonamenti_tv'),
  createCategory('cat_6', 'veterinario'),
  createCategory('cat_7', 'bollo_auto'),
  createCategory('cat_8', 'contanti'),
  createCategory('cat_9', 'cibo_fuori'),
  createCategory('cat_10', 'investimenti'),
  createCategory('cat_11', 'yuup_thor'),
  createCategory('cat_12', 'palestra'),
  createCategory('cat_13', 'spesa'),
  createCategory('cat_14', 'bolletta_acqua'),
  createCategory('cat_15', 'medicine_thor'),
  createCategory('cat_16', 'bolletta_tari'),
  createCategory('cat_17', 'medicine'),
  createCategory('cat_18', 'ricarica_telefono'),
  createCategory('cat_19', 'regali'),
  createCategory('cat_20', 'bolletta_tim'),
  createCategory('cat_21', 'estetista'),
  createCategory('cat_22', 'tagliando_auto'),
  createCategory('cat_23', 'stipendio'),
  createCategory('cat_24', 'vestiti'),
  createCategory('cat_25', 'visite_mediche'),
  createCategory('cat_26', 'risparmi'),
  createCategory('cat_27', 'skincare'),
  createCategory('cat_28', 'haircare'),
  createCategory('cat_29', 'taglio_thor'),
  createCategory('cat_30', 'cibo_thor'),
  createCategory('cat_31', 'eventi'),
  createCategory('cat_32', 'rata_auto'),
  createCategory('cat_33', 'bolletta_gas'),
  createCategory('cat_34', 'bolletta_depuratore'),
  createCategory('cat_35', 'analisi_mediche'),
  createCategory('cat_36', 'bolletta_luce'),
  createCategory('cat_37', 'abbonamenti_necessari'),
  createCategory('cat_38', 'cibo_asporto'),
  createCategory('cat_39', 'benzina')
];

export const dummyCategoryIcons: Record<string, string> = {
  'parrucchiere': '💇‍♀️',
  'trasferimento': '💸',
  'altro': '📋',
  'bonifico': '🏦',
  'abbonamenti_tv': '📺',
  'veterinario': '🐕',
  'bollo_auto': '🚗',
  'contanti': '💵',
  'cibo_fuori': '🍽️',
  'investimenti': '📈',
  'yuup_thor': '🐕',
  'palestra': '🏋️‍♂️',
  'spesa': '🛒',
  'bolletta_acqua': '💧',
  'medicine_thor': '💊',
  'bolletta_tari': '🗑️',
  'medicine': '💊',
  'ricarica_telefono': '📱',
  'regali': '🎁',
  'bolletta_tim': '📞',
  'estetista': '💅',
  'tagliando_auto': '🔧',
  'stipendio': '💰',
  'vestiti': '👕',
  'visite_mediche': '🩺',
  'risparmi': '🏦',
  'skincare': '🧴',
  'haircare': '🧴',
  'taglio_thor': '✂️',
  'cibo_thor': '🐕',
  'eventi': '🎉',
  'rata_auto': '🚙',
  'bolletta_gas': '🔥',
  'bolletta_depuratore': '💧',
  'analisi_mediche': '🧪',
  'bolletta_luce': '💡',
  'abbonamenti_necessari': '📋',
  'cibo_asporto': '🥡',
  'benzina': '⛽'
};

export const dummyCategoryColors: Record<string, string> = {
  // Categorie specifiche - Cura personale (tonalità rosa/viola)
  'parrucchiere': '#ec4899',
  'estetista': '#f472b6',
  'skincare': '#d946ef',
  'haircare': '#c084fc',
  'taglio_thor': '#a855f7',
  
  // Categorie finanziarie (tonalità verdi)
  'trasferimento': '#059669',
  'bonifico': '#047857',
  'contanti': '#065f46',
  'investimenti': '#064e3b',
  'risparmi': '#022c22',
  'rata_auto': '#166534',
  
  // Bollette specifiche (tonalità rosse)
  'bolletta_acqua': '#dc2626',
  'bolletta_tari': '#b91c1c',
  'bolletta_tim': '#991b1b',
  'bolletta_gas': '#7f1d1d',
  'bolletta_luce': '#fbbf24',
  'bolletta_depuratore': '#3b82f6',
  
  // Salute e medicina (tonalità blu/cyan)
  'medicine': '#0891b2',
  'medicine_thor': '#0e7490',
  'visite_mediche': '#155e75',
  'analisi_mediche': '#0c4a6e',
  'veterinario': '#075985',
  'palestra': '#0369a1',
  
  // Cibo e alimentari (tonalità verdi)
  'cibo_fuori': '#16a34a',
  'cibo_asporto': '#15803d',
  'cibo_thor': '#166534',
  'spesa': '#14532d',
  
  // Auto e trasporti (tonalità viola)
  'bollo_auto': '#7c3aed',
  'tagliando_auto': '#6d28d9',
  'benzina': '#5b21b6',
  
  // Shopping e abbigliamento (tonalità blu)
  'vestiti': '#2563eb',
  'regali': '#1d4ed8',
  'abbonamenti_tv': '#1e40af',
  'abbonamenti_necessari': '#1e3a8a',
  
  // Tecnologia (tonalità indaco)
  'ricarica_telefono': '#4338ca',
  'yuup_thor': '#3730a3',
  
  // Altri/varie (tonalità neutre)
  'altro': '#6b7280',
  'eventi': '#f59e0b',
  'stipendio': '#10b981'
};

export const dummyTransactions: Transaction[] = [
  createTransaction('trx_1', 'Stipendio Mensile', 2200.00, 'income', 'stipendio', 'user_1', 'acc_1', null, [], 'not_reconciled', 'monthly', 2),
  createTransaction('trx_2', 'Esselunga Spesa Settimanale', getRandomAmount(90, 180), 'expense', 'spesa', 'user_1', 'acc_1', null, [], 'not_reconciled', 'monthly', 3),
  createTransaction('trx_3', 'Mercato Locale Frutta', getRandomAmount(15, 35), 'expense', 'spesa', 'user_2', 'acc_1', null, [], 'not_reconciled', 'monthly', 6),
  createTransaction('trx_4', 'Carburante Shell', getRandomAmount(45, 75), 'expense', 'rata_auto', 'user_1', 'acc_3', null, [], 'not_reconciled', 'monthly', 2),
  createTransaction('trx_5', 'Abbonamento ATM Mensile', 39.00, 'expense', 'benzina', 'user_2', 'acc_1', null, [], 'not_reconciled', 'monthly', 4),
  createTransaction('trx_6', 'Parcheggio Centro', getRandomAmount(3, 8), 'expense', 'bolletta_tim', 'user_1', 'acc_3', null, [], 'not_reconciled', 'monthly', 1),
  createTransaction('trx_7', 'Bolletta Elettrica Enel', getRandomAmount(85, 120), 'expense', 'bolletta_acqua', 'user_2', 'acc_1', null, [], 'not_reconciled', 'monthly', 5),
  createTransaction('trx_8', 'Internet Fastweb', 29.90, 'expense', 'visite_mediche', 'user_1', 'acc_1', null, [], 'not_reconciled', 'monthly', 15),
  createTransaction('trx_9', 'Telefono Vodafone', 24.90, 'expense', 'estetista', 'user_2', 'acc_1', null, [], 'not_reconciled', 'monthly', 12),
  createTransaction('trx_10', 'Cinema UCI', getRandomAmount(18, 32), 'expense', 'abbonamenti_tv', 'user_1', 'acc_3', null, [], 'not_reconciled', 'monthly', 6),
  createTransaction('trx_11', 'Spotify Premium', 9.99, 'expense', 'abbonamenti_necessari', 'user_2', 'acc_3', null, [], 'not_reconciled', 'monthly', 7),
  createTransaction('trx_12', 'Aperitivo Bar Centrale', getRandomAmount(18, 28), 'expense', 'cibo_fuori', 'user_1', 'acc_3', null, [], 'not_reconciled', 'monthly', 2),
  createTransaction('trx_13', 'Amazon - Elettronica', getRandomAmount(45, 180), 'expense', 'spesa', 'user_2', 'acc_3', null, [], 'not_reconciled', 'monthly', 8),
  createTransaction('trx_14', 'Decathlon - Sport', getRandomAmount(35, 90), 'expense', 'spesa', 'user_1', 'acc_3', null, [], 'not_reconciled', 'monthly', 20),
  createTransaction('trx_15', 'Libreria Mondadori', getRandomAmount(15, 35), 'expense', 'spesa', 'user_2', 'acc_3', null, [], 'not_reconciled', 'monthly', 9),
  createTransaction('trx_16', 'Dentista Dr. Bianchi', 120.00, 'expense', 'medicine', 'user_1', 'acc_1', null, [], 'not_reconciled', 'monthly', 12),
  createTransaction('trx_17', 'Palestra Virgin Active', 89.00, 'expense', 'medicine', 'user_2', 'acc_1', null, [], 'not_reconciled', 'monthly', 1),
  createTransaction('trx_18', 'Leroy Merlin - Giardino', getRandomAmount(45, 120), 'expense', 'cibo_asporto', 'user_1', 'acc_1', null, [], 'not_reconciled', 'monthly', 25),
  createTransaction('trx_19', 'Bricocenter - Riparazioni', getRandomAmount(25, 85), 'expense', 'cibo_asporto', 'user_2', 'acc_1', null, [], 'not_reconciled', 'monthly', 11),
  createTransaction('trx_20', 'Udemy - Corsi Online', 89.99, 'expense', 'veterinario', 'user_1', 'acc_3', null, [], 'not_reconciled', 'monthly', 22),
  createTransaction('trx_21', 'Booking.com - Hotel Roma', getRandomAmount(180, 280), 'expense', 'cibo_fuori', 'user_2', 'acc_3', null, [], 'not_reconciled', 'monthly', 45),
];

export const dummyInvestmentHoldings: InvestmentHolding[] = [
  createInvestment('inv_1', 'user_1', 'Apple Inc.', 'AAPL', 25, 150.25, 189.75, new Date('2023-06-15')),
  createInvestment('inv_2', 'user_1', 'Vanguard S&P 500 ETF', 'VOO', 18, 380.00, 445.30, new Date('2023-03-20')),
  createInvestment('inv_3', 'user_2', 'Microsoft Corporation', 'MSFT', 12, 280.75, 398.85, new Date('2023-04-10')),
  createInvestment('inv_4', 'user_1', 'Tesla Inc.', 'TSLA', 8, 220.00, 198.25, new Date('2023-09-05')),
  createInvestment('inv_5', 'user_1', 'NVIDIA Corporation', 'NVDA', 5, 425.00, 675.50, new Date('2023-11-12')),
  createInvestment('inv_6', 'user_2', 'Amazon.com Inc.', 'AMZN', 10, 145.30, 168.75, new Date('2023-07-22')),
  createInvestment('inv_7', 'user_1', 'iShares MSCI World ETF', 'IWDA', 30, 78.40, 85.20, new Date('2023-05-08')),
  createInvestment('inv_8', 'user_2', 'Alphabet Inc. Class A', 'GOOGL', 7, 125.80, 142.60, new Date('2023-08-15'))
];

export const dummyAccounts: Account[] = [
  createAccount('acc_1', 'Conto Corrente Principale', 'payroll', ['user_1', 'user_2'], 'group_1'),
  createAccount('acc_2', 'Conto Risparmio', 'savings', ['user_1', 'user_2'], 'group_1'),
  createAccount('acc_4', 'Portafoglio Investimenti', 'investments', ['user_1', 'user_2'], 'group_1'),
];

export const dummyBudgets: Budget[] = [
  createBudget('bdg_1', 'Spese Necessarie', 1500, 'monthly', ['veterinario', 'bollo_auto', 'yuup_thor', 'spesa', 'bolletta_acqua', 'medicine_thor', 'bolletta_tari', 'medicine', 'ricarica_telefono', 'bolletta_tim', 'tagliando_auto', 'visite_mediche', 'taglio_thor', 'cibo_thor', 'rata_auto', 'bolletta_gas', 'bolletta_depuratore', 'analisi_mediche', 'bolletta_luce', 'benzina', 'abbonamenti_necessari'], 'user_1', '🛒'),
  createBudget('bdg_2', 'Spese non Necessarie', 750, 'monthly', ['abbonamenti_tv', 'parrucchiere', 'cibo_fuori', 'palestra', 'estetista', 'vestiti', 'skincare', 'haircare', 'cibo_asporto'], 'user_1', '🎉'),
  createBudget('bdg_3', 'Spese Personali', 3250, 'monthly', ['investimenti', 'regali', 'eventi'], 'user_2', '🩺'),
];