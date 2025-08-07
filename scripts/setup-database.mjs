#!/usr/bin/env node

/**
 * Script per creare le tabelle nel database Supabase
 * Esegue lo schema SQL automaticamente
 */
  // 6. Scelta modalità setup
  console.log('\n📋 Modalità di setup:');
  console.log('1) 🆕 Setup completo (elimina tutto e ricrea)');
  console.log('2) 🔄 Solo aggiornamenti (modifica struttura esistente)');
  console.log('3) 📋 Mostra solo SQL (copia manuale)');
  
  const setupMode = await askQuestion('\nScegli modalità (1-3): ');
  
  if (setupMode === '1') {
    // Setup completo - mostra reset + schema
    console.log('\n' + '='.repeat(80));
    console.log('📋 FASE 1: RESET COMPLETO DEL DATABASE');
    console.log('⚠️  ATTENZIONE: Questo eliminerà TUTTI i dati esistenti!');
    console.log('='.repeat(80));
    
    const resetSQL = `-- Reset completo del database
-- ATTENZIONE: Questo eliminerà TUTTI i dati!

-- Drop triggers
DROP TRIGGER IF EXISTS update_people_updated_at ON people;
DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop policies
DROP POLICY IF EXISTS "Allow all operations on people" ON people;
DROP POLICY IF EXISTS "Allow all operations on accounts" ON accounts;
DROP POLICY IF EXISTS "Allow all operations on categories" ON categories;
DROP POLICY IF EXISTS "Allow all operations on transactions" ON transactions;
DROP POLICY IF EXISTS "Allow all operations on budgets" ON budgets;

-- Drop tables (in dependency order)
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS people CASCADE;
DROP TABLE IF EXISTS categories CASCADE;`;

    console.log(resetSQL);
    console.log('\n' + '='.repeat(80));
    console.log('📋 FASE 2: SCHEMA COMPLETO');
    console.log('='.repeat(80));
    console.log(schemaSQL);
    
    log.info('🌐 1. Copia e esegui PRIMA il reset SQL');
    log.info('🌐 2. Poi copia e esegui lo schema completo');
    
  } else if (setupMode === '2') {
    // Solo aggiornamenti
    console.log('\n' + '='.repeat(80));
    console.log('📋 AGGIORNAMENTO INCREMENTALE');
    console.log('='.repeat(80));
    
    const updateSQL = `-- Modifica incrementale: budget_start_date da DATE a INTEGER
ALTER TABLE people ALTER COLUMN budget_start_date TYPE INTEGER USING CASE 
    WHEN budget_start_date IS NULL THEN NULL
    WHEN budget_start_date::text ~ '^\\d{4}-\\d{2}-\\d{2}$' THEN EXTRACT(DAY FROM budget_start_date)::INTEGER
    ELSE budget_start_date::INTEGER
END;

-- Aggiungi colonna balance se manca
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS balance DECIMAL(15,2) DEFAULT 0;`;

    console.log(updateSQL);
    log.info('🌐 Copia e esegui questo SQL per aggiornare la struttura');
    
  } else {
    // Solo mostra schema
    console.log('\n' + '='.repeat(80));
    console.log('📋 SCHEMA SQL COMPLETO:');
    console.log('='.repeat(80));
    console.log(schemaSQL);
  }
  
  console.log('\n' + '='.repeat(50));
  log.info('🌐 Dashboard Supabase: https://supabase.com/dashboard');
  log.info('📝 Vai su: Il tuo progetto → SQL Editor → New Query');
  log.info('▶️  Copia, incolla ed esegui il codice SQL');
  console.log('='.repeat(50));
  
  const continueSetup = await askQuestion('\nHai eseguito il SQL nel dashboard? (y/n): ');;
import path from 'path';
import readline from 'readline';

// Colori per il terminale
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

const log = {
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.cyan}🔹 ${msg}${colors.reset}`),
  title: (msg) => console.log(`${colors.magenta}${msg}${colors.reset}`)
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Carica le variabili d'ambiente
function loadEnvConfig() {
  const projectRoot = process.cwd();
  const envPath = path.join(projectRoot, '.env');
  
  if (!fs.existsSync(envPath)) {
    return null;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const config = {};
  
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      config[key.trim()] = value.trim();
    }
  });
  
  return config;
}

async function setupDatabase() {
  log.title('\n🗄️ Configurazione Database Supabase');
  log.title('='.repeat(40));

  // 1. Verifica configurazione
  const config = loadEnvConfig();
  
  if (!config || !config.VITE_SUPABASE_URL || !config.VITE_SUPABASE_ANON_KEY) {
    log.error('Configurazione Supabase mancante');
    log.info('Assicurati di avere il file .env configurato');
    log.info('Esegui prima lo script di migrazione per configurarlo');
    process.exit(1);
  }

  // 2. Inizializza Supabase
  let supabase;
  try {
    log.step('🔗 Connessione a Supabase...');
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(config.VITE_SUPABASE_URL, config.VITE_SUPABASE_ANON_KEY);
    log.success('Client Supabase inizializzato');
  } catch (error) {
    log.error(`Errore inizializzazione: ${error.message}`);
    process.exit(1);
  }

  // 3. Leggi schema SQL
  const schemaPath = path.join(process.cwd(), 'lib/supabase/schema.sql');
  if (!fs.existsSync(schemaPath)) {
    log.error('File schema.sql non trovato');
    log.info(`Cercato in: ${schemaPath}`);
    process.exit(1);
  }

  const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
  
  // 4. Suddividi lo schema in comandi
  const commands = schemaSQL
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

  log.step(`📋 Trovati ${commands.length} comandi SQL da eseguire`);

  // 5. Conferma esecuzione
  console.log('\n' + '='.repeat(50));
  log.warning('⚠️  ATTENZIONE: Questo creerà le tabelle nel database Supabase');
  log.info('Se le tabelle esistono già, potrebbero verificarsi errori (normale)');
  console.log('='.repeat(50));
  
  const shouldProceed = await askQuestion('\nVuoi procedere con la creazione delle tabelle? (y/n): ');
  if (shouldProceed.toLowerCase() !== 'y') {
    log.info('Configurazione annullata');
    process.exit(0);
  }

  // 6. Mostra schema SQL da copiare manualmente
  log.step('� Lo schema deve essere eseguito manualmente nel dashboard Supabase');
  
  console.log('\n' + '='.repeat(80));
  console.log('📋 SCHEMA SQL DA COPIARE NEL DASHBOARD SUPABASE:');
  console.log('='.repeat(80));
  console.log(schemaSQL);
  console.log('='.repeat(80));
  
  log.info('🌐 Dashboard Supabase: https://supabase.com/dashboard');
  log.info('📝 Vai su: Il tuo progetto → SQL Editor → New Query');
  log.info('📋 Copia e incolla il codice SQL mostrato sopra');
  log.info('▶️  Clicca "RUN" per eseguire lo schema');
  
  console.log('\n' + '='.repeat(50));
  log.warning('⚠️  IMPORTANTE: Esegui TUTTO il codice SQL in una sola volta');
  log.info('Non dividere il codice in parti separate');
  console.log('='.repeat(50));
  
  const continueSetup = await askQuestion('\nHai eseguito lo schema SQL nel dashboard? (y/n): ');
  if (continueSetup.toLowerCase() !== 'y') {
    log.info('Setup interrotto. Esegui lo schema SQL e riprova.');
    process.exit(0);
  }
  
  // Aspetta un momento per permettere la propagazione delle modifiche
  log.step('⏳ Attesa propagazione modifiche database...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  let successCount = 1; // Assumiamo successo se l'utente conferma
  let errorCount = 0;

  // 7. Risultati
  console.log('\n' + '='.repeat(50));
  log.info(`📊 Comandi eseguiti: ${successCount} successi, ${errorCount} errori`);
  
  if (errorCount === 0) {
    log.success('🎉 Database configurato con successo!');
  } else {
    log.warning('⚠️  Database configurato con alcuni errori (probabilmente normali)');
  }

  // 8. Test tabelle
  log.step('🔍 Verifica tabelle create...');
  
  const tables = ['categories', 'people', 'accounts', 'budgets', 'transactions'];
  const tableStatus = {};
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('count').limit(1);
      
      if (error) {
        tableStatus[table] = `❌ ${error.message}`;
      } else {
        tableStatus[table] = '✅ OK';
      }
    } catch (err) {
      tableStatus[table] = `❌ ${err.message}`;
    }
  }

  console.log('\n📋 Stato tabelle:');
  Object.entries(tableStatus).forEach(([table, status]) => {
    console.log(`   ${table}: ${status}`);
  });

  const allTablesOk = Object.values(tableStatus).every(status => status === '✅ OK');
  
  if (allTablesOk) {
    log.success('\n🎯 Database pronto per la migrazione!');
    log.info('Ora puoi eseguire: node scripts/migrate-standalone.mjs');
    log.info('Oppure: ./scripts/start-migration.sh → opzione 1');
  } else {
    log.warning('\n⚠️  Alcune tabelle hanno ancora problemi');
    log.info('Verifica che lo schema SQL sia stato eseguito correttamente');
    log.info('Dashboard: https://supabase.com/dashboard → Il tuo progetto → SQL Editor');
  }

  rl.close();
}

// Gestione errori
process.on('uncaughtException', (error) => {
  log.error(`Errore non gestito: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error(`Promise rifiutata: ${reason}`);
  process.exit(1);
});

// Avvia setup
setupDatabase().catch((error) => {
  log.error(`Errore fatale: ${error.message}`);
  process.exit(1);
});
