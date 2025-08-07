#!/usr/bin/env node

/**
 * Script di Migrazione Diretta
 * Migra i dati da db.json a Supabase tramite CLI
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function loadMigrationService() {
  try {
    // Verifica se esiste il file compilato JS
    const jsPath = '../lib/supabase/index.js';
    const tsPath = '../lib/supabase/index.ts';
    
    // Prova prima con il file JS compilato
    try {
      const { migrationService } = await import(jsPath);
      return migrationService;
    } catch (jsError) {
      log.warning('File JS compilato non trovato, provo con il progetto buildato...');
      
      // Prova con il build in dist
      try {
        const { migrationService } = await import('../dist/lib/supabase/index.js');
        return migrationService;
      } catch (distError) {
        throw new Error('Nessun modulo trovato. Esegui "yarn build" per compilare il progetto.');
      }
    }
  } catch (error) {
    log.error(`Impossibile caricare il servizio di migrazione: ${error.message}`);
    log.info('Soluzioni possibili:');
    log.info('1. Esegui "yarn build" per compilare il progetto');
    log.info('2. Assicurati che Supabase sia configurato correttamente');
    process.exit(1);
  }
}

async function checkSupabaseConnection() {
  try {
    // Prova con diversi path per il modulo Supabase
    let supabaseModule;
    try {
      supabaseModule = await import('../lib/supabase/index.js');
    } catch (jsError) {
      try {
        supabaseModule = await import('../dist/lib/supabase/index.js');
      } catch (distError) {
        throw new Error('Modulo Supabase non trovato. Esegui "yarn build".');
      }
    }
    
    const { testSupabaseConnection, isSupabaseConfigured } = supabaseModule;
    
    if (!isSupabaseConfigured()) {
      log.error('Supabase non è configurato');
      return false;
    }

    const result = await testSupabaseConnection();
    if (result.success) {
      log.success('Connessione Supabase attiva');
      return true;
    } else {
      log.error(`Connessione Supabase fallita: ${result.message}`);
      return false;
    }
  } catch (error) {
    log.error(`Errore test connessione: ${error.message}`);
    return false;
  }
}

async function runMigration() {
  log.title('\n🚀 Wealth Pillar - Migrazione Diretta a Supabase');
  log.title('='.repeat(50));

  // 1. Verifica directory di lavoro - usa la directory corrente del processo
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

  // 4. Test connessione Supabase
  log.step('🔗 Test connessione Supabase...');
  const isConnected = await checkSupabaseConnection();
  
  if (!isConnected) {
    log.error('Impossibile connettersi a Supabase');
    log.info('Verifica le credenziali nel file .env');
    process.exit(1);
  }

  // 5. Conferma migrazione
  console.log('\n' + '='.repeat(50));
  log.warning('⚠️  ATTENZIONE: Questa operazione migrerà tutti i dati nel database Supabase');
  log.info('Se esistono già dati, potrebbero verificarsi conflitti');
  console.log('='.repeat(50));
  
  const shouldProceed = await askQuestion('\nVuoi procedere con la migrazione? (y/n): ');
  if (shouldProceed.toLowerCase() !== 'y') {
    log.info('Migrazione annullata');
    process.exit(0);
  }

  // 6. Opzione per cancellare dati esistenti
  const shouldClear = await askQuestion('\nVuoi eliminare tutti i dati esistenti prima della migrazione? (y/n): ');
  
  // 7. Esegui migrazione
  log.step('🚀 Avvio migrazione...');
  
  try {
    const migrationService = await loadMigrationService();
    
    // Clear data se richiesto
    if (shouldClear.toLowerCase() === 'y') {
      log.step('🗑️  Eliminazione dati esistenti...');
      const cleared = await migrationService.clearAllData();
      if (cleared) {
        log.success('Dati esistenti eliminati');
      } else {
        log.warning('Errore durante l\'eliminazione, ma procedo comunque');
      }
    }
    
    // Migrazione
    log.step('📦 Migrazione in corso...');
    const result = await migrationService.migrateFromJSON(jsonData);
    
    // Risultati
    console.log('\n' + '='.repeat(50));
    if (result.success) {
      log.success('🎉 MIGRAZIONE COMPLETATA CON SUCCESSO!');
    } else {
      log.warning('⚠️  Migrazione completata con errori');
    }
    console.log('='.repeat(50));
    
    console.log('\n📊 Statistiche migrazione:');
    console.log(`   👥 Persone migrate: ${result.migrated.people}`);
    console.log(`   🏦 Account migrati: ${result.migrated.accounts}`);
    console.log(`   💸 Transazioni migrate: ${result.migrated.transactions}`);
    console.log(`   💰 Budget migrati: ${result.migrated.budgets}`);
    console.log(`   🏷️  Categorie migrate: ${result.migrated.categories}`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ Errori riscontrati:');
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    // 8. Validazione
    log.step('🔍 Validazione dati migrati...');
    const validation = await migrationService.validateMigration();
    
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
