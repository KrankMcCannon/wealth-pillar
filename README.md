# Wealth Pillar - Personal Finance Manager

**Wealth Pillar** è un'applicazione completa per la gestione delle finanze personali, progettata per offrire un controllo totale e intelligente sui tuoi soldi. Con funzionalità avanzate di riconciliazione delle transazioni, intelligenza artificiale per la categorizzazione automatica e dashboard intuitive, Wealth Pillar diventa il tuo fidato compagno finanziario.

## 🚀 Caratteristiche Principali

### 💰 Gestione Completa delle Finanze

- **Multi-utente**: Gestisci le finanze di più persone in un'unica applicazione
- **Account multipli**: Organizza conti correnti, risparmi, contanti e investimenti
- **Transazioni intelligenti**: Categorizzazione automatica e suggerimenti AI-powered
- **Budget dinamici**: Monitoraggio in tempo reale delle spese con indicatori visivi

### 🔄 Sistema di Riconciliazione Avanzato

- **Riconciliazione intelligente**: Collega automaticamente transazioni correlate
- **Logica padre/figlio**: Determina gerarchie di transazioni basate su importo, data e timestamp
- **Stato transazioni**: Visualizza chiaramente importi disponibili, parziali o completati
- **Editing visuale**: Modifica transazioni riconciliate con indicatori chiari e colorati

### 📊 Dashboard e Analytics

- **Panoramica in tempo reale**: Bilanci aggiornati e spese categorizzate
- **Grafici interattivi**: Visualizzazione delle spese con grafici a torta
- **Budget tracking**: Monitoraggio percentuale dei budget mensili
- **Transazioni recenti**: Vista rapida delle ultime attività finanziarie

### 🎨 Esperienza Utente

- **Temi personalizzabili**: Ogni utente può scegliere il proprio colore tema
- **Dark/Light mode**: Interfaccia adattiva per ogni momento della giornata
- **Design mobile-first**: Ottimizzato per dispositivi mobili con navbar in basso e sidebar responsive
- **Layout responsive**: Sidebar fissa su desktop, overlay su tablet/mobile con hamburger menu
- **Viste adattive**: Tabelle su desktop, cards su mobile per una migliore esperienza touch
- **Accessibilità**: Progettato seguendo le migliori pratiche di accessibilità

### 🤖 Intelligenza Artificiale

- **Categorizzazione automatica**: Gemini AI analizza le descrizioni per suggerire categorie
- **Apprendimento adattivo**: L'AI migliora nel tempo basandosi sulle tue abitudini
- **Suggerimenti smart**: Consigli per ottimizzare spese e risparmi

## 🛠️ Tecnologie Utilizzate

- **Frontend**: React 19 + TypeScript
- **Routing**: React Router DOM
- **UI/UX**: Tailwind CSS per design moderno e responsivo
- **Charts**: Recharts per visualizzazioni dati interattive
- **AI Integration**: Google Gemini API per funzionalità intelligenti
- **Data Storage**: JSON Server per sviluppo locale
- **Build Tool**: Vite per sviluppo veloce e build ottimizzate

## 📱 Design Mobile-First

Wealth Pillar è stato completamente ridisegnato con un approccio **mobile-first** per offrire la migliore esperienza utente su tutti i dispositivi:

### 🎯 Caratteristiche Responsive

- **Navbar in basso**: Navigazione ottimizzata per dispositivi mobili con icone intuitive
- **Sidebar responsive**: Fissa su desktop, overlay con hamburger menu su tablet/mobile
- **Viste adattive**: Tabelle su desktop, cards su mobile per transazioni e dati
- **Touch-friendly**: Pulsanti e interazioni ottimizzate per schermi touch
- **Breakpoint intelligenti**: Transizioni fluide tra mobile (≤768px), tablet (769-1024px) e desktop (≥1025px)

### 🎨 Componenti Responsive

- **Home**: Grid adattivo per account e metriche
- **Transazioni**: Vista a cards su mobile, tabella su desktop
- **Budget**: Cards espandibili con layout ottimizzato per mobile
- **Filtri**: Form responsive con layout a colonne adattivo
- **Modali**: Dimensioni e posizionamento ottimizzati per ogni dispositivo
- **Bottoni**: Touch targets ottimizzati (44px minimo) con padding responsive
- **Onboarding**: Layout a colonne su mobile, form ottimizzati per touch
- **Impostazioni**: Tabelle responsive con vista cards su mobile
- **Gruppi**: Bottoni full-width su mobile, layout adattivo
- **Loading/Error**: Stati di caricamento e errore ottimizzati per mobile

## 🚀 Installazione e Avvio

**Prerequisiti:** Node.js (versione 18 o superiore)

### Installazione

```bash
# Clona il repository
git clone https://github.com/KrankMcCannon/wealth-pillar.git
cd wealth-pillar

# Installa le dipendenze
npm install
```

### Configurazione

1. Copia il file `.env.local.example` in `.env.local`
2. Aggiungi la tua chiave API di Gemini in `.env.local`:
   ```
   GEMINI_API_KEY=la_tua_chiave_api_gemini
   ```

### Avvio dell'applicazione

```bash
# Avvia il server dei dati (in un terminale)
npm run server

# Avvia l'applicazione (in un altro terminale)
npm run dev
```

L'applicazione sarà disponibile su `http://localhost:5173`
Il server dati sarà disponibile su `http://localhost:3001`

## 📱 Come Utilizzare Wealth Pillar

### Primo Avvio

1. **Aggiungi persone**: Crea profili per tutti gli utenti che gestiranno le finanze
2. **Configura account**: Aggiungi conti correnti, carte, contanti e conti investimenti
3. **Inizia a tracciare**: Inserisci le prime transazioni per iniziare

### Gestione Quotidiana

- **Home**: Monitora bilanci e spese dal pannello principale
- **Transazioni**: Aggiungi, modifica e riconcilia le transazioni
- **Budget**: Imposta e monitora i budget mensili per categoria
- **Investimenti**: Traccia il portfolio di investimenti
- **Report**: Analizza le tendenze finanziarie

### Funzionalità Avanzate

- **Riconciliazione**: Collega transazioni correlate (es. bonifici tra conti)
- **AI Categorization**: Lascia che l'AI suggerisca categorie appropriate
- **Multi-persona**: Gestisci finanze familiari o aziendali
- **Temi personalizzati**: Personalizza l'interfaccia per ogni utente

## 🏗️ Architettura del Progetto

```
wealth-pillar/
├── components/           # Componenti React riutilizzabili
│   ├── pages/           # Pagine principali dell'app
│   ├── ui/              # Componenti UI base
│   └── modals/          # Componenti modal
├── hooks/               # Custom React hooks
├── services/            # Servizi API e utilità
├── types/               # Definizioni TypeScript
├── data/                # Database locale (JSON)
└── constants/           # Costanti e configurazioni
```

## 🤝 Contribuire

Wealth Pillar è un progetto open source e accoglie contributi dalla community!

1. **Fork** il repository
2. **Crea** un branch per la tua feature (`git checkout -b feature/nuova-funzionalita`)
3. **Commit** le tue modifiche (`git commit -m 'Aggiunge nuova funzionalità'`)
4. **Push** il branch (`git push origin feature/nuova-funzionalita`)
5. **Apri** una Pull Request

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi il file [LICENSE](LICENSE) per i dettagli.

## 👨‍💻 Autore

**Edoardo Valentini** - [edoardov.vli@gmail.com](mailto:edoardov.vli@gmail.com)

---

_Wealth Pillar - Il tuo pilastro per una gestione finanziaria solida e intelligente_ 💪💰
