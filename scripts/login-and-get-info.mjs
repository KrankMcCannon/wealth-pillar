import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Leggi variabili di ambiente dal file .env
function loadEnvVariables() {
  try {
    const envPath = join(__dirname, '..', '.env');
    const envContent = readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key] = valueParts.join('=');
        }
      }
    });
    
    return envVars;
  } catch (error) {
    console.warn('⚠️  File .env non trovato. Assicurati di aver configurato Supabase.');
    return {};
  }
}

const env = loadEnvVariables();
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Configurazione Supabase mancante!');
  console.log('📝 Crea un file .env nella root del progetto con:');
  console.log('   VITE_SUPABASE_URL=your_supabase_project_url');
  console.log('   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper per input interattivo
function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function loginAndGetUserInfo() {
  try {
    console.log('🔐 Login necessario per accedere alle informazioni utente\n');
    
    const email = await askQuestion('📧 Inserisci la tua email: ');
    const password = await askQuestion('🔑 Inserisci la tua password: ');
    
    console.log('\n🔄 Tentativo di login...');
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim()
    });

    if (authError) {
      console.error('❌ Errore di login:', authError.message);
      return;
    }

    if (!authData.user) {
      console.error('❌ Login fallito: nessun utente restituito');
      return;
    }

    console.log('\n✅ Login riuscito!');
    console.log('📧 Email:', authData.user.email);
    console.log('🔑 User ID:', authData.user.id);
    console.log('⏰ Creato il:', new Date(authData.user.created_at).toLocaleString('it-IT'));
    
    // Ora controlla i dati esistenti
    await checkExistingData();
    
    console.log('\n💡 Prossimi passi:');
    console.log('1. Applica lo schema di autenticazione: npm run setup-auth');
    console.log('2. Associa i dati esistenti: npm run associate-data-logged-in');
    console.log('\n📝 Il tuo User ID è:', authData.user.id);
    console.log('📋 Salvalo per riferimento futuro!');

  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

async function checkExistingData() {
  try {
    console.log('\n📊 Controllo dati esistenti...');
    
    // Controlla people
    const { data: people, error: peopleError } = await supabase
      .from('people')
      .select('id, name, user_id');
    
    if (!peopleError && people) {
      console.log(`👥 People: ${people.length} record`);
      const withoutUserId = people.filter(p => !p.user_id).length;
      if (withoutUserId > 0) {
        console.log(`   ⚠️  ${withoutUserId} record senza user_id`);
      }
    }

    // Controlla accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, name, user_id');
    
    if (!accountsError && accounts) {
      console.log(`💳 Accounts: ${accounts.length} record`);
      const withoutUserId = accounts.filter(a => !a.user_id).length;
      if (withoutUserId > 0) {
        console.log(`   ⚠️  ${withoutUserId} record senza user_id`);
      }
    }

    // Controlla transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('id, description, user_id');
    
    if (!transactionsError && transactions) {
      console.log(`💰 Transactions: ${transactions.length} record`);
      const withoutUserId = transactions.filter(t => !t.user_id).length;
      if (withoutUserId > 0) {
        console.log(`   ⚠️  ${withoutUserId} record senza user_id`);
      }
    }

    // Controlla budgets
    const { data: budgets, error: budgetsError } = await supabase
      .from('budgets')
      .select('id, description, user_id');
    
    if (!budgetsError && budgets) {
      console.log(`📋 Budgets: ${budgets.length} record`);
      const withoutUserId = budgets.filter(b => !b.user_id).length;
      if (withoutUserId > 0) {
        console.log(`   ⚠️  ${withoutUserId} record senza user_id`);
      }
    }

    // Controlla categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, user_id');
    
    if (!categoriesError && categories) {
      console.log(`🏷️  Categories: ${categories.length} record`);
      const withoutUserId = categories.filter(c => !c.user_id).length;
      if (withoutUserId > 0) {
        console.log(`   ⚠️  ${withoutUserId} record senza user_id`);
      }
    }

  } catch (error) {
    console.error('❌ Errore nel controllo dati:', error.message);
  }
}

// Esegui il login e recupero informazioni
await loginAndGetUserInfo();
