#!/bin/bash

# 🔄 Script di Avvio Migrazione Supabase
# Queecho ""
echo "🎯 Opzioni di migrazione:"
echo ""
echo "1) 🚀 Migrazione diretta (Consigliato)"
echo "   - Script guidato con interfaccia CLI"
echo "   - Migrazione completa automatica"
echo ""
echo "2) 🗄️ Setup Database"
echo "   - Crea le tabelle nel database Supabase"
echo "   - Da eseguire prima della migrazione"
echo ""
echo "3) 📊 Solo analisi dati"
echo "   - Analizza i dati senza migrare"
echo ""
echo "4) 📖 Leggere la guida completa"
echo "   - Apre MIGRATION_GUIDE.md"
echo ""

read -p "Scegli un'opzione (1-4): " choiceuida attraverso il processo di migrazione

echo "🚀 Wealth Pillar - Migrazione Supabase"
echo "======================================"
echo ""

# Verifica se siamo nella directory corretta
if [ ! -f "package.json" ]; then
    echo "❌ Errore: Esegui questo script dalla root del progetto"
    exit 1
fi

# Verifica se db.json esiste
if [ ! -f "data/db.json" ]; then
    echo "❌ Errore: File data/db.json non trovato"
    exit 1
fi

echo "✅ Progetto trovato"

# Analizza i dati JSON
echo "📊 Analisi dati da migrare..."
node scripts/migrate-data.cjs

# Verifica se .env esiste
if [ ! -f ".env" ]; then
    echo ""
    echo "⚠️  File .env non trovato!"
    echo ""
    read -p "Vuoi creare il file .env ora? (y/n): " create_env

    if [ "$create_env" = "y" ] || [ "$create_env" = "Y" ]; then
        echo ""
        echo "🔧 Configurazione Supabase"
        echo "Per ottenere queste informazioni:"
        echo "1. Vai su https://supabase.com/dashboard"
        echo "2. Seleziona il tuo progetto"
        echo "3. Vai su Settings > API"
        echo ""
        
        read -p "Inserisci l'URL del progetto Supabase: " supabase_url
        read -p "Inserisci la chiave anonima (anon key): " supabase_key

        cat > .env << EOF
# Configurazione Supabase
VITE_SUPABASE_URL=$supabase_url
VITE_SUPABASE_ANON_KEY=$supabase_key
EOF

        echo "✅ File .env creato!"
    else
        echo "❌ Configurazione Supabase necessaria per continuare"
        exit 1
    fi
fi

echo ""
echo "🎯 Opzioni di migrazione:"
echo ""
echo "1) � Migrazione diretta (Consigliato)"
echo "   - Script guidato con interfaccia CLI"
echo "   - Migrazione completa automatica"
echo ""
echo "2) � Solo analisi dati"
echo "   - Analizza i dati senza migrare"
echo ""
echo "3) 📖 Leggere la guida completa"
echo "   - Apre MIGRATION_GUIDE.md"
echo ""

read -p "Scegli un'opzione (1-3): " choice

case $choice in
    1)
        echo "🚀 Avvio migrazione diretta..."
        echo ""
        echo "Lo script ti guiderà attraverso tutto il processo:"
        echo "• Verifica configurazione Supabase"
        echo "• Analisi dati da migrare"
        echo "• Migrazione guidata"
        echo "• Validazione risultati"
        echo ""
        node scripts/migrate-standalone.mjs
        ;;
    2)
        echo "�️ Setup database Supabase..."
        echo ""
        echo "Questo script creerà le tabelle necessarie:"
        echo "• people (persone)"
        echo "• accounts (account)"
        echo "• categories (categorie)" 
        echo "• budgets (budget)"
        echo "• transactions (transazioni)"
        echo ""
        node scripts/setup-database.mjs
        ;;
    3)
        echo "�📊 Analisi dati senza migrazione..."
        node scripts/migrate-data.cjs
        ;;
    4)
        echo "📖 Aprendo la guida alla migrazione..."
        if command -v code >/dev/null 2>&1; then
            code MIGRATION_GUIDE.md
        elif command -v open >/dev/null 2>&1; then
            open MIGRATION_GUIDE.md
        else
            echo "📄 Leggi il file: MIGRATION_GUIDE.md"
        fi
        ;;
    *)
        echo "❌ Opzione non valida"
        echo "📚 Leggi MIGRATION_GUIDE.md per istruzioni dettagliate"
        ;;
esac
