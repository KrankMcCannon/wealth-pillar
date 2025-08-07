#!/usr/bin/env node

/**
 * Migration Script - CLI Tool
 * Script da terminale per migrare dati da db.json a Supabase
 */

const fs = require('fs');
const path = require('path');

// Simulazione delle funzioni di migrazione (da sostituire con import reali)
console.log('🚀 Strumento di Migrazione Supabase');
console.log('=====================================');

async function runMigration() {
  try {
    // 1. Verifica che il file db.json esista
    const dbJsonPath = path.join(process.cwd(), 'data', 'db.json');

    if (!fs.existsSync(dbJsonPath)) {
      console.error('❌ File db.json non trovato in:', dbJsonPath);
      console.log('💡 Assicurati di essere nella cartella root del progetto');
      process.exit(1);
    }

    console.log('✅ File db.json trovato:', dbJsonPath);

    // 2. Leggi i dati JSON
    const jsonData = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));

    console.log('📊 Dati da migrare:');
    console.log(`   - Persone: ${jsonData.people?.length || 0}`);
    console.log(`   - Account: ${jsonData.accounts?.length || 0}`);
    console.log(`   - Transazioni: ${jsonData.transactions?.length || 0}`);
    console.log(`   - Budget: ${jsonData.budgets?.length || 0}`);
    console.log(`   - Categorie: ${jsonData.categories?.length || 0}`);

    // 3. Verifica configurazione Supabase
    const hasEnvFile = fs.existsSync('.env');
    console.log(`\n🔧 File .env: ${hasEnvFile ? '✅ Trovato' : '❌ Non trovato'}`);

    if (!hasEnvFile) {
      console.log('\n⚠️  Per procedere con la migrazione:');
      console.log('1. Crea un file .env nella root del progetto');
      console.log('2. Aggiungi le tue credenziali Supabase:');
      console.log('   VITE_SUPABASE_URL=https://your-project.supabase.co');
      console.log('   VITE_SUPABASE_ANON_KEY=your-anon-key');
      console.log('\n📚 Per configurare e migrare, esegui: ./scripts/start-migration.sh');
      process.exit(1);
    }

    // 4. Istruzioni per la migrazione
    console.log('\n🎯 Per eseguire la migrazione:');
    console.log('\n📋 Migrazione Script (Consigliata):');
    console.log('1. Esegui: ./scripts/start-migration.sh');
    console.log('2. Scegli "Migrazione diretta"');
    console.log('3. Segui le istruzioni guidate');

    console.log('\n📋 Migrazione Diretta:');
    console.log('1. Esegui: node scripts/migrate-direct.mjs');
    console.log('2. Lo script ti guiderà attraverso tutto il processo');

    console.log('\n📋 Codice JavaScript (Manuale):');
    console.log('```javascript');
    console.log('import { migrationService } from \'./lib/supabase\';');
    console.log('');
    console.log('// Migra da file JSON');
    console.log('const result = await migrationService.migrateFromJSONFile(\'/data/db.json\');');
    console.log('console.log(\'Migrazione completata:\', result);');
    console.log('```');

    console.log('\n✨ Script di migrazione disponibili:');
    console.log('   • scripts/start-migration.sh (Script interattivo)');
    console.log('   • scripts/migrate-direct.mjs (Migrazione diretta)');
    console.log('   • scripts/migrate-data.cjs (Solo analisi)');

  } catch (error) {
    console.error('❌ Errore durante l\'analisi:', error.message);
    process.exit(1);
  }
}

// Esegui lo script
runMigration();
