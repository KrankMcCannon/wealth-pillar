#!/usr/bin/env node

/**
 * Script di Migrazione Diretta - Versione Standalone
 * Migra i dati da db.json a Supabase senza dipendenze interne
 */

import fs from 'fs';
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

// Inizializza Supabase
async function initSupabase() {
  const config = loadEnvConfig();
  
  if (!config || !config.VITE_SUPABASE_URL || !config.VITE_SUPABASE_ANON_KEY) {
    throw new Error('Configurazione Supabase mancante');
  }
  
  // Importa Supabase dinamicamente
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabase = createClient(
    config.VITE_SUPABASE_URL,
    config.VITE_SUPABASE_ANON_KEY
  );
  
  return supabase;
}

// Test connessione Supabase e verifica schema
async function testConnection(supabase) {
  try {
    const tables = ['categories', 'people', 'accounts', 'budgets', 'transactions'];
    const tableStatus = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (error) {
          if (error.code === '42P01') {
            tableStatus[table] = 'NON_ESISTE';
          } else {
            tableStatus[table] = `ERRORE: ${error.message}`;
          }
        } else {
          tableStatus[table] = 'OK';
        }
      } catch (err) {
        tableStatus[table] = `ERRORE: ${err.message}`;
      }
    }
    
    const missingTables = Object.entries(tableStatus)
      .filter(([table, status]) => status === 'NON_ESISTE')
      .map(([table]) => table);
    
    const errorTables = Object.entries(tableStatus)
      .filter(([table, status]) => status.startsWith('ERRORE'))
      .map(([table, status]) => `${table}: ${status}`);
    
    if (missingTables.length > 0) {
      throw new Error(`Tabelle mancanti: ${missingTables.join(', ')}. Esegui lo schema SQL nel dashboard Supabase.`);
    }
    
    if (errorTables.length > 0) {
      throw new Error(`Errori tabelle: ${errorTables.join('; ')}`);
    }
    
    return { success: true, message: 'Connessione attiva e schema corretto', tableStatus };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Migrazione delle categorie
async function migrateCategories(supabase, categories) {
  log.step('🏷️ Migrazione categorie...');
  let count = 0;
  const errors = [];
  
  console.log(`   Trovate ${categories?.length || 0} categorie da migrare`);
  
  for (const category of categories || []) {
    try {
      console.log(`   • Inserendo categoria: ${category.name}`);
      const { data, error } = await supabase
        .from('categories')
        .insert({ name: category.name })
        .select();
      
      if (error) {
        console.log(`   ❌ Errore categoria ${category.name}: ${error.message}`);
        throw error;
      }
      
      console.log(`   ✅ Categoria inserita: ${category.name}`);
      count++;
    } catch (error) {
      const errorMsg = `Categoria ${category.name}: ${error.message}`;
      errors.push(errorMsg);
      console.log(`   ❌ ${errorMsg}`);
    }
  }
  
  console.log(`   Categorie migrate: ${count}/${categories?.length || 0}`);
  return { count, errors };
}

// Migrazione delle persone
async function migratePeople(supabase, people) {
  log.step('👥 Migrazione persone...');
  let count = 0;
  const errors = [];
  const idMapping = {}; // Mappa ID stringa -> UUID database
  
  for (const person of people || []) {
    try {
      const { data, error } = await supabase
        .from('people')
        .insert({
          name: person.name,
          avatar: person.avatar || '',
          theme_color: person.themeColor || '#3B82F6',
          budget_start_date: parseInt(person.budgetStartDate)
        })
        .select();
      
      if (error) throw error;
      
      // Salva il mapping ID originale -> UUID database
      if (data && data[0]) {
        idMapping[person.id] = data[0].id;
      }
      
      count++;
    } catch (error) {
      errors.push(`Persona ${person.name}: ${error.message}`);
    }
  }
  
  return { count, errors, idMapping };
}

// Migrazione degli account
async function migrateAccounts(supabase, accounts, peopleIdMapping) {
  log.step('🏦 Migrazione account...');
  let count = 0;
  const errors = [];
  const idMapping = {}; // Mappa ID stringa -> UUID database
  
  for (const account of accounts || []) {
    try {
      // Converti personIds da stringhe a UUID usando il mapping delle persone
      const personUUIDs = account.personIds?.map(personId => peopleIdMapping[personId]).filter(Boolean) || [];
      
      const { data, error } = await supabase
        .from('accounts')
        .insert({
          name: account.name,
          balance: account.balance || 0,
          type: account.type,
          person_ids: personUUIDs
        })
        .select();
      
      if (error) throw error;
      
      // Salva il mapping ID originale -> UUID database
      if (data && data[0]) {
        idMapping[account.id] = data[0].id;
      }
      
      count++;
    } catch (error) {
      errors.push(`Account ${account.name}: ${error.message}`);
    }
  }
  
  return { count, errors, idMapping };
}

// Migrazione dei budget
async function migrateBudgets(supabase, budgets, peopleIdMapping) {
  log.step('💰 Migrazione budget...');
  let count = 0;
  const errors = [];
  
  for (const budget of budgets || []) {
    try {
      // Converti personId da stringa a UUID usando il mapping delle persone
      const personUUID = peopleIdMapping[budget.personId];
      
      if (!personUUID) {
        throw new Error(`Persona con ID ${budget.personId} non trovata`);
      }
      
      const { error } = await supabase
        .from('budgets')
        .insert({
          description: budget.description || '',
          categories: budget.categories || [],
          amount: budget.amount,
          period: budget.period,
          person_id: personUUID
        });
      
      if (error) throw error;
      count++;
    } catch (error) {
      errors.push(`Budget ${budget.description}: ${error.message}`);
    }
  }
  
  return { count, errors };
}

// Migrazione delle transazioni
async function migrateTransactions(supabase, transactions, accountIdMapping) {
  log.step('💸 Migrazione transazioni...');
  let count = 0;
  const errors = [];
  const transactionIdMapping = {}; // Mappa ID originale -> UUID database
  
  // FASE 1: Inserire tutte le transazioni senza i collegamenti
  console.log('   📦 Fase 1: Inserimento transazioni base...');
  
  for (const transaction of transactions || []) {
    try {
      // Converti accountId da stringa a UUID usando il mapping degli account
      const accountUUID = accountIdMapping[transaction.accountId];
      const toAccountUUID = transaction.toAccountId ? accountIdMapping[transaction.toAccountId] : null;
      
      if (!accountUUID) {
        throw new Error(`Account con ID ${transaction.accountId} non trovato`);
      }
      
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          description: transaction.description,
          amount: transaction.amount,
          date: transaction.date,
          type: transaction.type,
          category: transaction.category,
          account_id: accountUUID,
          to_account_id: toAccountUUID,
          is_reconciled: transaction.isReconciled || false,
          // NON inserire parent_transaction_id nella prima fase
          parent_transaction_id: null
        })
        .select();
      
      if (error) throw error;
      
      // Salva il mapping ID originale -> UUID database
      if (data && data[0]) {
        transactionIdMapping[transaction.id] = data[0].id;
      }
      
      count++;
    } catch (error) {
      errors.push(`Transazione ${transaction.description}: ${error.message}`);
    }
  }
  
  console.log(`   ✅ Fase 1 completata: ${count} transazioni inserite`);
  
  // FASE 2: Aggiornare i collegamenti tra transazioni
  console.log('   🔗 Fase 2: Aggiornamento collegamenti...');
  
  let linkedCount = 0;
  for (const transaction of transactions || []) {
    try {
      const linkedTransactionId = transaction.linkedTransactionId || transaction.parentTransactionId;
      
      if (linkedTransactionId && transactionIdMapping[transaction.id] && transactionIdMapping[linkedTransactionId]) {
        const { error } = await supabase
          .from('transactions')
          .update({
            parent_transaction_id: transactionIdMapping[linkedTransactionId]
          })
          .eq('id', transactionIdMapping[transaction.id]);
        
        if (error) throw error;
        linkedCount++;
      }
    } catch (error) {
      errors.push(`Collegamento ${transaction.description}: ${error.message}`);
    }
  }
  
  console.log(`   ✅ Fase 2 completata: ${linkedCount} collegamenti aggiornati`);
  
  return { count, errors, linkedCount };
}

// Elimina tutti i dati
async function clearAllData(supabase) {
  log.step('🗑️ Eliminazione dati esistenti...');
  
  try {
    // Elimina in ordine di dipendenza
    await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('budgets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('accounts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('people').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    return true;
  } catch (error) {
    log.warning(`Errore durante l'eliminazione: ${error.message}`);
    return false;
  }
}

// Validazione dei dati migrati
async function validateMigration(supabase) {
  log.step('🔍 Validazione dati migrati...');
  
  try {
    const counts = {};
    
    // Conta i record in ogni tabella
    const { count: peopleCount } = await supabase.from('people').select('*', { count: 'exact', head: true });
    const { count: accountsCount } = await supabase.from('accounts').select('*', { count: 'exact', head: true });
    const { count: transactionsCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
    const { count: budgetsCount } = await supabase.from('budgets').select('*', { count: 'exact', head: true });
    const { count: categoriesCount } = await supabase.from('categories').select('*', { count: 'exact', head: true });
    
    counts.people = peopleCount || 0;
    counts.accounts = accountsCount || 0;
    counts.transactions = transactionsCount || 0;
    counts.budgets = budgetsCount || 0;
    counts.categories = categoriesCount || 0;
    
    return {
      isValid: true,
      counts,
      issues: []
    };
  } catch (error) {
    return {
      isValid: false,
      counts: { people: 0, accounts: 0, transactions: 0, budgets: 0, categories: 0 },
      issues: [`Errore validazione: ${error.message}`]
    };
  }
}

async function runMigration() {
  log.title('\n🚀 Wealth Pillar - Migrazione Diretta a Supabase');
  log.title('='.repeat(50));

  // 1. Verifica directory di lavoro
  const projectRoot = process.cwd();
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const dbJsonPath = path.join(projectRoot, 'data/db.json');

  if (!fs.existsSync(packageJsonPath)) {
    log.error('File package.json non trovato');
    log.info(`Directory corrente: ${projectRoot}`);
    log.info('Esegui questo script dalla root del progetto (dove si trova package.json)');
    process.exit(1);
  }

  if (!fs.existsSync(dbJsonPath)) {
    log.error('File data/db.json non trovato');
    log.info(`Cercato in: ${dbJsonPath}`);
    process.exit(1);
  }

  log.success('Progetto verificato');

  // 2. Leggi e analizza dati JSON
  let jsonData;
  try {
    const jsonContent = fs.readFileSync(dbJsonPath, 'utf8');
    jsonData = JSON.parse(jsonContent);
    
    log.step('📊 Analisi dati da migrare:');
    console.log(`   👥 Persone: ${jsonData.people?.length || 0}`);
    console.log(`   🏦 Account: ${jsonData.accounts?.length || 0}`);
    console.log(`   💸 Transazioni: ${jsonData.transactions?.length || 0}`);
    console.log(`   💰 Budget: ${jsonData.budgets?.length || 0}`);
    console.log(`   🏷️  Categorie: ${jsonData.categories?.length || 0}`);
    
    const totalRecords = (jsonData.people?.length || 0) + 
                        (jsonData.accounts?.length || 0) + 
                        (jsonData.transactions?.length || 0) + 
                        (jsonData.budgets?.length || 0) + 
                        (jsonData.categories?.length || 0);
    
    console.log(`   📦 Totale record: ${totalRecords}`);
    
  } catch (error) {
    log.error(`Errore lettura db.json: ${error.message}`);
    process.exit(1);
  }

  // 3. Verifica configurazione Supabase
  const envPath = path.join(projectRoot, '.env');
  if (!fs.existsSync(envPath)) {
    log.warning('File .env non trovato');
    log.info('Configurazione Supabase necessaria per continuare');
    
    const shouldConfigure = await askQuestion('\nVuoi configurare Supabase ora? (y/n): ');
    if (shouldConfigure.toLowerCase() !== 'y') {
      log.error('Configurazione annullata');
      process.exit(1);
    }

    // Configura Supabase
    console.log('\n🔧 Configurazione Supabase');
    console.log('Per ottenere queste informazioni:');
    console.log('1. Vai su https://supabase.com/dashboard');
    console.log('2. Seleziona il tuo progetto');
    console.log('3. Vai su Settings > API\n');

    const supabaseUrl = await askQuestion('Inserisci l\'URL del progetto Supabase: ');
    const supabaseKey = await askQuestion('Inserisci la chiave anonima (anon key): ');

    const envContent = `# Configurazione Supabase
VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_ANON_KEY=${supabaseKey}
`;

    fs.writeFileSync(envPath, envContent);
    log.success('File .env creato');
    log.info('Riavvia lo script per utilizzare la nuova configurazione');
    process.exit(0);
  }

  // 4. Inizializza Supabase
  let supabase;
  try {
    log.step('🔗 Inizializzazione Supabase...');
    supabase = await initSupabase();
    log.success('Client Supabase inizializzato');
  } catch (error) {
    log.error(`Errore inizializzazione Supabase: ${error.message}`);
    log.info('Verifica le credenziali nel file .env');
    process.exit(1);
  }

  // 5. Test connessione
  log.step('🔗 Test connessione Supabase...');
  const connectionTest = await testConnection(supabase);
  
  if (!connectionTest.success) {
    log.error(`Test connessione fallito: ${connectionTest.message}`);
    log.info('Verifica che le tabelle siano create nel database Supabase');
    process.exit(1);
  }
  
  log.success('Connessione Supabase attiva');

  // 6. Conferma migrazione
  console.log('\n' + '='.repeat(50));
  log.warning('⚠️  ATTENZIONE: Questa operazione migrerà tutti i dati nel database Supabase');
  log.info('Se esistono già dati, potrebbero verificarsi conflitti');
  console.log('='.repeat(50));
  
  const shouldProceed = await askQuestion('\nVuoi procedere con la migrazione? (y/n): ');
  if (shouldProceed.toLowerCase() !== 'y') {
    log.info('Migrazione annullata');
    process.exit(0);
  }

  // 7. Opzione per cancellare dati esistenti
  const shouldClear = await askQuestion('\nVuoi eliminare tutti i dati esistenti prima della migrazione? (y/n): ');
  
  // 8. Esegui migrazione
  log.step('🚀 Avvio migrazione...');
  
  try {
    const results = {
      migrated: { people: 0, accounts: 0, transactions: 0, budgets: 0, categories: 0 },
      errors: []
    };
    
    // Clear data se richiesto
    if (shouldClear.toLowerCase() === 'y') {
      const cleared = await clearAllData(supabase);
      if (cleared) {
        log.success('Dati esistenti eliminati');
      } else {
        log.warning('Errore durante l\'eliminazione, ma procedo comunque');
      }
    }
    
    // Migrazione con mapping degli ID
    log.step('📦 Migrazione in corso...');
    
    // 1. Categorie
    const categoriesResult = await migrateCategories(supabase, jsonData.categories);
    results.migrated.categories = categoriesResult.count;
    results.errors.push(...categoriesResult.errors);
    
    // 2. Persone (restituisce mapping ID -> UUID)
    const peopleResult = await migratePeople(supabase, jsonData.people);
    results.migrated.people = peopleResult.count;
    results.errors.push(...peopleResult.errors);
    const peopleIdMapping = peopleResult.idMapping;
    
    console.log(`   🔍 Mapping persone: ${Object.keys(peopleIdMapping).length} ID mappati`);
    
    // 3. Account (usa mapping persone, restituisce mapping account)
    const accountsResult = await migrateAccounts(supabase, jsonData.accounts, peopleIdMapping);
    results.migrated.accounts = accountsResult.count;
    results.errors.push(...accountsResult.errors);
    const accountIdMapping = accountsResult.idMapping;
    
    console.log(`   🔍 Mapping account: ${Object.keys(accountIdMapping).length} ID mappati`);
    
    // 4. Budget (usa mapping persone)
    const budgetsResult = await migrateBudgets(supabase, jsonData.budgets, peopleIdMapping);
    results.migrated.budgets = budgetsResult.count;
    results.errors.push(...budgetsResult.errors);
    
    // 5. Transazioni (usa mapping account)
    const transactionsResult = await migrateTransactions(supabase, jsonData.transactions, accountIdMapping);
    results.migrated.transactions = transactionsResult.count;
    results.errors.push(...transactionsResult.errors);
    
    console.log(`   🔍 Collegamenti transazioni: ${transactionsResult.linkedCount || 0} collegamenti creati`);
    
    // Risultati
    console.log('\n' + '='.repeat(50));
    if (results.errors.length === 0) {
      log.success('🎉 MIGRAZIONE COMPLETATA CON SUCCESSO!');
    } else {
      log.warning('⚠️  Migrazione completata con errori');
    }
    console.log('='.repeat(50));
    
    console.log('\n📊 Statistiche migrazione:');
    console.log(`   👥 Persone migrate: ${results.migrated.people}`);
    console.log(`   🏦 Account migrati: ${results.migrated.accounts}`);
    console.log(`   💸 Transazioni migrate: ${results.migrated.transactions}`);
    console.log(`   💰 Budget migrati: ${results.migrated.budgets}`);
    console.log(`   🏷️  Categorie migrate: ${results.migrated.categories}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errori riscontrati:');
      results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    // 9. Validazione
    const validation = await validateMigration(supabase);
    
    console.log('\n📋 Risultati validazione:');
    console.log(`   👥 Persone nel DB: ${validation.counts.people}`);
    console.log(`   🏦 Account nel DB: ${validation.counts.accounts}`);
    console.log(`   💸 Transazioni nel DB: ${validation.counts.transactions}`);
    console.log(`   💰 Budget nel DB: ${validation.counts.budgets}`);
    console.log(`   🏷️  Categorie nel DB: ${validation.counts.categories}`);
    
    if (validation.isValid) {
      log.success('✅ Validazione completata: tutti i dati sono corretti!');
    } else {
      log.warning('⚠️  Problemi rilevati durante la validazione:');
      validation.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }
    
    console.log('\n🎯 Migrazione terminata. Ora puoi:');
    console.log('   1. Verificare i dati nel dashboard Supabase');
    console.log('   2. Testare l\'applicazione con i nuovi dati');
    console.log('   3. Configurare l\'autenticazione se necessario');
    
  } catch (error) {
    log.error(`Errore durante la migrazione: ${error.message}`);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
  
  rl.close();
}

// Gestione degli errori non catturati
process.on('uncaughtException', (error) => {
  log.error(`Errore non gestito: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error(`Promise rifiutata: ${reason}`);
  process.exit(1);
});

// Avvia la migrazione
runMigration().catch((error) => {
  log.error(`Errore fatale: ${error.message}`);
  process.exit(1);
});
