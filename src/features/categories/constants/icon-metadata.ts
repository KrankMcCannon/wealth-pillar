/**
 * Icon Metadata Configuration
 *
 * This file contains metadata for all available icons including:
 * - Icon component references from Lucide React
 * - Categories for organization
 * - Keywords for fuzzy search
 * - Tags for filtering
 *
 * Adding a new icon:
 * 1. Import the icon from 'lucide-react'
 * 2. Add an entry to ICON_METADATA array
 * 3. Include relevant keywords for searchability
 */

import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export type IconCategory =
  | "all"
  | "finance"
  | "shopping"
  | "transport"
  | "home"
  | "health"
  | "entertainment"
  | "work"
  | "utilities"
  | "nature"
  | "people"
  | "misc";

export interface IconMetadata {
  /** Icon component name (must match Lucide React export) */
  name: string;
  /** Icon component from Lucide React */
  component: LucideIcon;
  /** Primary category */
  category: Exclude<IconCategory, "all">;
  /** Search keywords (Italian and common terms) */
  keywords: string[];
  /** Additional tags for filtering */
  tags: string[];
}

export interface CategoryInfo {
  key: IconCategory;
  label: string;
  description: string;
}

// ============================================================================
// CATEGORIES
// ============================================================================

export const CATEGORIES: CategoryInfo[] = [
  { key: "all", label: "Tutti", description: "Tutte le icone disponibili" },
  { key: "finance", label: "Finanza", description: "Denaro, banche, investimenti" },
  { key: "shopping", label: "Shopping", description: "Acquisti, cibo, ristoranti" },
  { key: "transport", label: "Trasporti", description: "Auto, trasporti pubblici, viaggi" },
  { key: "home", label: "Casa", description: "Casa, mobili, elettrodomestici" },
  { key: "health", label: "Salute", description: "Salute, fitness, benessere" },
  { key: "entertainment", label: "Svago", description: "Intrattenimento, hobby, eventi" },
  { key: "work", label: "Lavoro", description: "Ufficio, tecnologia, comunicazione" },
  { key: "utilities", label: "Utilità", description: "Servizi, strumenti, sicurezza" },
  { key: "nature", label: "Natura", description: "Tempo, piante, ambiente" },
  { key: "people", label: "Persone", description: "Utenti, gruppi, relazioni" },
  { key: "misc", label: "Altro", description: "Altre icone utili" },
];

// ============================================================================
// ICON METADATA
// ============================================================================

export const ICON_METADATA: IconMetadata[] = [
  // FINANCE (Finanza)
  {
    name: "Wallet",
    component: LucideIcons.Wallet,
    category: "finance",
    keywords: ["portafoglio", "denaro", "soldi", "money", "wallet", "purse", "cash"],
    tags: ["payment", "money"],
  },
  {
    name: "CreditCard",
    component: LucideIcons.CreditCard,
    category: "finance",
    keywords: ["carta", "credito", "debito", "pagamento", "card", "payment", "bank"],
    tags: ["payment", "bank"],
  },
  {
    name: "Banknote",
    component: LucideIcons.Banknote,
    category: "finance",
    keywords: ["banconota", "soldi", "denaro", "contanti", "cash", "money", "bill"],
    tags: ["money", "cash"],
  },
  {
    name: "PiggyBank",
    component: LucideIcons.PiggyBank,
    category: "finance",
    keywords: ["salvadanaio", "risparmio", "savings", "save", "money", "piggy"],
    tags: ["savings", "money"],
  },
  {
    name: "TrendingUp",
    component: LucideIcons.TrendingUp,
    category: "finance",
    keywords: ["crescita", "aumento", "profitto", "trend", "up", "growth", "profit", "gain"],
    tags: ["trend", "growth"],
  },
  {
    name: "TrendingDown",
    component: LucideIcons.TrendingDown,
    category: "finance",
    keywords: ["decrescita", "perdita", "calo", "trend", "down", "loss", "decline"],
    tags: ["trend", "loss"],
  },
  {
    name: "DollarSign",
    component: LucideIcons.DollarSign,
    category: "finance",
    keywords: ["dollaro", "usd", "valuta", "money", "currency", "dollar"],
    tags: ["currency", "money"],
  },
  {
    name: "Euro",
    component: LucideIcons.Euro,
    category: "finance",
    keywords: ["euro", "eur", "valuta", "money", "currency", "european"],
    tags: ["currency", "money"],
  },
  {
    name: "CircleDollarSign",
    component: LucideIcons.CircleDollarSign,
    category: "finance",
    keywords: ["dollaro", "soldi", "money", "currency", "payment", "price"],
    tags: ["currency", "money"],
  },
  {
    name: "Landmark",
    component: LucideIcons.Landmark,
    category: "finance",
    keywords: ["banca", "istituto", "bank", "building", "government", "institution"],
    tags: ["bank", "institution"],
  },
  {
    name: "Receipt",
    component: LucideIcons.Receipt,
    category: "finance",
    keywords: ["ricevuta", "scontrino", "fattura", "receipt", "bill", "invoice"],
    tags: ["payment", "document"],
  },
  {
    name: "Calculator",
    component: LucideIcons.Calculator,
    category: "finance",
    keywords: ["calcolatrice", "calcolo", "contabilità", "calculator", "math", "accounting"],
    tags: ["tool", "accounting"],
  },

  // SHOPPING (Shopping)
  {
    name: "ShoppingCart",
    component: LucideIcons.ShoppingCart,
    category: "shopping",
    keywords: ["carrello", "spesa", "shopping", "cart", "grocery", "purchase"],
    tags: ["shopping", "purchase"],
  },
  {
    name: "ShoppingBag",
    component: LucideIcons.ShoppingBag,
    category: "shopping",
    keywords: ["borsa", "sacchetto", "shopping", "bag", "purchase", "store"],
    tags: ["shopping", "purchase"],
  },
  {
    name: "Store",
    component: LucideIcons.Store,
    category: "shopping",
    keywords: ["negozio", "shop", "store", "market", "retail", "commerce"],
    tags: ["shopping", "business"],
  },
  {
    name: "Coffee",
    component: LucideIcons.Coffee,
    category: "shopping",
    keywords: ["caffè", "bar", "bevanda", "coffee", "drink", "cafe", "espresso"],
    tags: ["food", "drink"],
  },
  {
    name: "UtensilsCrossed",
    component: LucideIcons.UtensilsCrossed,
    category: "shopping",
    keywords: ["ristorante", "cibo", "pasto", "restaurant", "food", "dining", "meal"],
    tags: ["food", "dining"],
  },
  {
    name: "Pizza",
    component: LucideIcons.Pizza,
    category: "shopping",
    keywords: ["pizza", "cibo", "fast food", "food", "italian", "takeout"],
    tags: ["food", "meal"],
  },
  {
    name: "Wine",
    component: LucideIcons.Wine,
    category: "shopping",
    keywords: ["vino", "alcol", "bevanda", "wine", "alcohol", "drink", "bar"],
    tags: ["drink", "alcohol"],
  },
  {
    name: "IceCream",
    component: LucideIcons.IceCream,
    category: "shopping",
    keywords: ["gelato", "dolce", "dessert", "ice cream", "sweet", "frozen"],
    tags: ["food", "dessert"],
  },
  {
    name: "Sandwich",
    component: LucideIcons.Sandwich,
    category: "shopping",
    keywords: ["panino", "cibo", "sandwich", "food", "lunch", "snack"],
    tags: ["food", "meal"],
  },
  {
    name: "Apple",
    component: LucideIcons.Apple,
    category: "shopping",
    keywords: ["mela", "frutta", "cibo", "apple", "fruit", "food", "healthy"],
    tags: ["food", "fruit"],
  },
  {
    name: "Beef",
    component: LucideIcons.Beef,
    category: "shopping",
    keywords: ["carne", "bistecca", "beef", "meat", "steak", "food", "protein"],
    tags: ["food", "meat"],
  },
  {
    name: "Fish",
    component: LucideIcons.Fish,
    category: "shopping",
    keywords: ["pesce", "seafood", "fish", "food", "pescato"],
    tags: ["food", "seafood"],
  },

  // TRANSPORT (Trasporti)
  {
    name: "Car",
    component: LucideIcons.Car,
    category: "transport",
    keywords: ["auto", "macchina", "veicolo", "car", "vehicle", "automobile", "drive"],
    tags: ["transport", "vehicle"],
  },
  {
    name: "Bus",
    component: LucideIcons.Bus,
    category: "transport",
    keywords: ["autobus", "trasporto pubblico", "bus", "public transport", "coach"],
    tags: ["transport", "public"],
  },
  {
    name: "Train",
    component: LucideIcons.Train,
    category: "transport",
    keywords: ["treno", "ferrovia", "train", "railway", "metro", "subway"],
    tags: ["transport", "public"],
  },
  {
    name: "Plane",
    component: LucideIcons.Plane,
    category: "transport",
    keywords: ["aereo", "volo", "viaggio", "plane", "flight", "travel", "airport"],
    tags: ["transport", "travel"],
  },
  {
    name: "Ship",
    component: LucideIcons.Ship,
    category: "transport",
    keywords: ["nave", "barca", "crociera", "ship", "boat", "cruise", "sea"],
    tags: ["transport", "travel"],
  },
  {
    name: "Bike",
    component: LucideIcons.Bike,
    category: "transport",
    keywords: ["bici", "bicicletta", "bike", "bicycle", "cycling", "pedal"],
    tags: ["transport", "sport"],
  },
  {
    name: "Fuel",
    component: LucideIcons.Fuel,
    category: "transport",
    keywords: ["carburante", "benzina", "diesel", "fuel", "gas", "petrol", "station"],
    tags: ["transport", "vehicle"],
  },
  {
    name: "ParkingCircle",
    component: LucideIcons.ParkingCircle,
    category: "transport",
    keywords: ["parcheggio", "parking", "park", "car park", "garage"],
    tags: ["transport", "vehicle"],
  },

  // HOME (Casa)
  {
    name: "Home",
    component: LucideIcons.Home,
    category: "home",
    keywords: ["casa", "abitazione", "home", "house", "residence", "dwelling"],
    tags: ["building", "residence"],
  },
  {
    name: "Building",
    component: LucideIcons.Building,
    category: "home",
    keywords: ["edificio", "palazzo", "condominio", "building", "apartment", "flat"],
    tags: ["building", "residence"],
  },
  {
    name: "Building2",
    component: LucideIcons.Building2,
    category: "home",
    keywords: ["edificio", "ufficio", "building", "office", "corporate", "business"],
    tags: ["building", "office"],
  },
  {
    name: "Sofa",
    component: LucideIcons.Sofa,
    category: "home",
    keywords: ["divano", "arredamento", "sofa", "couch", "furniture", "living room"],
    tags: ["furniture", "living"],
  },
  {
    name: "Bed",
    component: LucideIcons.Bed,
    category: "home",
    keywords: ["letto", "camera", "dormire", "bed", "bedroom", "sleep", "rest"],
    tags: ["furniture", "bedroom"],
  },
  {
    name: "Lamp",
    component: LucideIcons.Lamp,
    category: "home",
    keywords: ["lampada", "luce", "illuminazione", "lamp", "light", "lighting"],
    tags: ["furniture", "light"],
  },
  {
    name: "Tv",
    component: LucideIcons.Tv,
    category: "home",
    keywords: ["tv", "televisione", "schermo", "television", "screen", "monitor"],
    tags: ["electronics", "entertainment"],
  },
  {
    name: "Refrigerator",
    component: LucideIcons.Refrigerator,
    category: "home",
    keywords: ["frigo", "frigorifero", "refrigerator", "fridge", "appliance", "kitchen"],
    tags: ["appliance", "kitchen"],
  },
  {
    name: "WashingMachine",
    component: LucideIcons.WashingMachine,
    category: "home",
    keywords: ["lavatrice", "elettrodomestico", "washing machine", "laundry", "appliance"],
    tags: ["appliance", "laundry"],
  },
  {
    name: "AirVent",
    component: LucideIcons.AirVent,
    category: "home",
    keywords: ["ventilazione", "aria", "condizionatore", "vent", "air", "ac", "hvac"],
    tags: ["appliance", "climate"],
  },
  {
    name: "Lightbulb",
    component: LucideIcons.Lightbulb,
    category: "home",
    keywords: ["lampadina", "luce", "idea", "lightbulb", "light", "bulb", "energy"],
    tags: ["light", "energy"],
  },
  {
    name: "Hammer",
    component: LucideIcons.Hammer,
    category: "home",
    keywords: ["martello", "attrezzo", "riparazione", "hammer", "tool", "repair", "diy"],
    tags: ["tool", "repair"],
  },

  // HEALTH (Salute)
  {
    name: "Heart",
    component: LucideIcons.Heart,
    category: "health",
    keywords: ["cuore", "amore", "salute", "heart", "love", "health", "favorite"],
    tags: ["health", "emotion"],
  },
  {
    name: "Activity",
    component: LucideIcons.Activity,
    category: "health",
    keywords: ["attività", "battito", "fitness", "activity", "heartbeat", "pulse", "health"],
    tags: ["health", "fitness"],
  },
  {
    name: "Dumbbell",
    component: LucideIcons.Dumbbell,
    category: "health",
    keywords: ["pesi", "palestra", "fitness", "dumbbell", "gym", "exercise", "workout"],
    tags: ["fitness", "sport"],
  },
  {
    name: "Stethoscope",
    component: LucideIcons.Stethoscope,
    category: "health",
    keywords: ["stetoscopio", "medico", "dottore", "stethoscope", "doctor", "medical"],
    tags: ["medical", "health"],
  },
  {
    name: "Pill",
    component: LucideIcons.Pill,
    category: "health",
    keywords: ["pillola", "medicina", "farmaco", "pill", "medicine", "drug", "pharmacy"],
    tags: ["medical", "medicine"],
  },
  {
    name: "Syringe",
    component: LucideIcons.Syringe,
    category: "health",
    keywords: ["siringa", "iniezione", "vaccino", "syringe", "injection", "vaccine", "medical"],
    tags: ["medical", "health"],
  },

  // ENTERTAINMENT (Svago)
  {
    name: "Film",
    component: LucideIcons.Film,
    category: "entertainment",
    keywords: ["film", "cinema", "movie", "video", "entertainment"],
    tags: ["entertainment", "media"],
  },
  {
    name: "Music",
    component: LucideIcons.Music,
    category: "entertainment",
    keywords: ["musica", "canzone", "music", "song", "audio", "sound"],
    tags: ["entertainment", "audio"],
  },
  {
    name: "Tv2",
    component: LucideIcons.Tv2,
    category: "entertainment",
    keywords: ["tv", "televisione", "streaming", "television", "screen", "watch"],
    tags: ["entertainment", "media"],
  },
  {
    name: "Gamepad2",
    component: LucideIcons.Gamepad2,
    category: "entertainment",
    keywords: ["videogioco", "gioco", "controller", "gamepad", "gaming", "console", "play"],
    tags: ["entertainment", "gaming"],
  },
  {
    name: "Ticket",
    component: LucideIcons.Ticket,
    category: "entertainment",
    keywords: ["biglietto", "evento", "ticket", "event", "concert", "show"],
    tags: ["entertainment", "event"],
  },
  {
    name: "Trophy",
    component: LucideIcons.Trophy,
    category: "entertainment",
    keywords: ["trofeo", "premio", "vittoria", "trophy", "award", "win", "achievement"],
    tags: ["achievement", "sport"],
  },
  {
    name: "Medal",
    component: LucideIcons.Medal,
    category: "entertainment",
    keywords: ["medaglia", "premio", "medal", "award", "achievement", "winner"],
    tags: ["achievement", "sport"],
  },
  {
    name: "PartyPopper",
    component: LucideIcons.PartyPopper,
    category: "entertainment",
    keywords: ["festa", "celebrazione", "party", "celebration", "confetti", "event"],
    tags: ["entertainment", "celebration"],
  },
  {
    name: "Gift",
    component: LucideIcons.Gift,
    category: "entertainment",
    keywords: ["regalo", "presente", "gift", "present", "surprise", "birthday"],
    tags: ["event", "celebration"],
  },
  {
    name: "Sparkles",
    component: LucideIcons.Sparkles,
    category: "entertainment",
    keywords: ["scintille", "brillante", "sparkles", "shine", "stars", "magic"],
    tags: ["effect", "celebration"],
  },
  {
    name: "Camera",
    component: LucideIcons.Camera,
    category: "entertainment",
    keywords: ["fotocamera", "foto", "camera", "photo", "photography", "picture"],
    tags: ["media", "photography"],
  },
  {
    name: "Headphones",
    component: LucideIcons.Headphones,
    category: "entertainment",
    keywords: ["cuffie", "audio", "headphones", "music", "sound", "listen"],
    tags: ["audio", "music"],
  },

  // WORK (Lavoro)
  {
    name: "GraduationCap",
    component: LucideIcons.GraduationCap,
    category: "work",
    keywords: ["laurea", "università", "studio", "graduation", "education", "school", "university"],
    tags: ["education", "learning"],
  },
  {
    name: "BookOpen",
    component: LucideIcons.BookOpen,
    category: "work",
    keywords: ["libro", "lettura", "studio", "book", "read", "learning", "education"],
    tags: ["education", "reading"],
  },
  {
    name: "Book",
    component: LucideIcons.Book,
    category: "work",
    keywords: ["libro", "manuale", "book", "manual", "guide", "documentation"],
    tags: ["education", "documentation"],
  },
  {
    name: "Briefcase",
    component: LucideIcons.Briefcase,
    category: "work",
    keywords: ["valigetta", "lavoro", "ufficio", "briefcase", "work", "business", "office"],
    tags: ["business", "work"],
  },
  {
    name: "Laptop",
    component: LucideIcons.Laptop,
    category: "work",
    keywords: ["laptop", "computer", "portatile", "notebook", "work", "technology"],
    tags: ["technology", "work"],
  },
  {
    name: "Monitor",
    component: LucideIcons.Monitor,
    category: "work",
    keywords: ["monitor", "schermo", "display", "screen", "computer", "desktop"],
    tags: ["technology", "work"],
  },
  {
    name: "Smartphone",
    component: LucideIcons.Smartphone,
    category: "work",
    keywords: ["smartphone", "cellulare", "telefono", "phone", "mobile", "device"],
    tags: ["technology", "communication"],
  },
  {
    name: "Phone",
    component: LucideIcons.Phone,
    category: "work",
    keywords: ["telefono", "chiamata", "phone", "call", "contact", "communication"],
    tags: ["communication", "contact"],
  },
  {
    name: "Mail",
    component: LucideIcons.Mail,
    category: "work",
    keywords: ["email", "posta", "messaggio", "mail", "message", "inbox", "communication"],
    tags: ["communication", "email"],
  },
  {
    name: "FileText",
    component: LucideIcons.FileText,
    category: "work",
    keywords: ["file", "documento", "testo", "document", "text", "paper", "report"],
    tags: ["document", "file"],
  },
  {
    name: "Folder",
    component: LucideIcons.Folder,
    category: "work",
    keywords: ["cartella", "directory", "folder", "directory", "files", "organize"],
    tags: ["file", "organization"],
  },
  {
    name: "Printer",
    component: LucideIcons.Printer,
    category: "work",
    keywords: ["stampante", "stampa", "printer", "print", "paper", "office"],
    tags: ["office", "equipment"],
  },

  // UTILITIES (Utilità)
  {
    name: "Zap",
    component: LucideIcons.Zap,
    category: "utilities",
    keywords: ["elettricità", "energia", "fulmine", "electricity", "energy", "power", "lightning"],
    tags: ["utility", "energy"],
  },
  {
    name: "Droplet",
    component: LucideIcons.Droplet,
    category: "utilities",
    keywords: ["acqua", "goccia", "water", "drop", "liquid", "utility"],
    tags: ["utility", "water"],
  },
  {
    name: "Wifi",
    component: LucideIcons.Wifi,
    category: "utilities",
    keywords: ["wifi", "internet", "connessione", "wireless", "network", "connection"],
    tags: ["utility", "internet"],
  },
  {
    name: "CloudRain",
    component: LucideIcons.CloudRain,
    category: "utilities",
    keywords: ["pioggia", "nuvola", "rain", "cloud", "weather", "water"],
    tags: ["weather", "utility"],
  },
  {
    name: "Shield",
    component: LucideIcons.Shield,
    category: "utilities",
    keywords: ["scudo", "protezione", "sicurezza", "shield", "protection", "security", "safe"],
    tags: ["security", "protection"],
  },
  {
    name: "Lock",
    component: LucideIcons.Lock,
    category: "utilities",
    keywords: ["lucchetto", "sicurezza", "lock", "security", "secure", "private", "closed"],
    tags: ["security", "privacy"],
  },
  {
    name: "Key",
    component: LucideIcons.Key,
    category: "utilities",
    keywords: ["chiave", "accesso", "key", "access", "unlock", "password", "security"],
    tags: ["security", "access"],
  },
  {
    name: "Bell",
    component: LucideIcons.Bell,
    category: "utilities",
    keywords: ["campana", "notifica", "bell", "notification", "alert", "reminder"],
    tags: ["notification", "alert"],
  },
  {
    name: "Settings",
    component: LucideIcons.Settings,
    category: "utilities",
    keywords: ["impostazioni", "configurazione", "settings", "config", "preferences", "options"],
    tags: ["settings", "tool"],
  },
  {
    name: "Wrench",
    component: LucideIcons.Wrench,
    category: "utilities",
    keywords: ["chiave inglese", "riparazione", "attrezzo", "strumento", "wrench", "repair", "tool", "fix", "maintenance"],
    tags: ["tool", "repair"],
  },
  {
    name: "Scissors",
    component: LucideIcons.Scissors,
    category: "utilities",
    keywords: ["forbici", "taglio", "scissors", "cut", "tool", "trim"],
    tags: ["tool", "cut"],
  },

  // NATURE (Natura)
  {
    name: "Sun",
    component: LucideIcons.Sun,
    category: "nature",
    keywords: ["sole", "giorno", "sun", "day", "weather", "sunny", "bright"],
    tags: ["weather", "nature"],
  },
  {
    name: "Moon",
    component: LucideIcons.Moon,
    category: "nature",
    keywords: ["luna", "notte", "moon", "night", "dark", "evening"],
    tags: ["weather", "nature"],
  },
  {
    name: "CloudSun",
    component: LucideIcons.CloudSun,
    category: "nature",
    keywords: ["nuvola", "sole", "cloud", "sun", "weather", "partly cloudy"],
    tags: ["weather", "nature"],
  },
  {
    name: "CloudSnow",
    component: LucideIcons.CloudSnow,
    category: "nature",
    keywords: ["neve", "nuvola", "snow", "cloud", "weather", "winter", "cold"],
    tags: ["weather", "nature"],
  },
  {
    name: "Snowflake",
    component: LucideIcons.Snowflake,
    category: "nature",
    keywords: ["fiocco di neve", "inverno", "snowflake", "winter", "cold", "ice"],
    tags: ["weather", "nature"],
  },
  {
    name: "Wind",
    component: LucideIcons.Wind,
    category: "nature",
    keywords: ["vento", "aria", "wind", "air", "weather", "breeze"],
    tags: ["weather", "nature"],
  },
  {
    name: "Leaf",
    component: LucideIcons.Leaf,
    category: "nature",
    keywords: ["foglia", "natura", "leaf", "nature", "plant", "green", "eco"],
    tags: ["nature", "plant"],
  },
  {
    name: "Trees",
    component: LucideIcons.Trees,
    category: "nature",
    keywords: ["albero", "alberi", "natura", "tree", "trees", "nature", "plant", "forest", "eco"],
    tags: ["nature", "plant"],
  },
  {
    name: "Flower",
    component: LucideIcons.Flower,
    category: "nature",
    keywords: ["fiore", "natura", "flower", "nature", "plant", "blossom", "garden"],
    tags: ["nature", "plant"],
  },
  {
    name: "Sprout",
    component: LucideIcons.Sprout,
    category: "nature",
    keywords: ["germoglio", "pianta", "sprout", "plant", "growth", "seed", "green"],
    tags: ["nature", "plant"],
  },

  // PEOPLE (Persone)
  {
    name: "User",
    component: LucideIcons.User,
    category: "people",
    keywords: ["utente", "persona", "profilo", "user", "person", "profile", "account"],
    tags: ["people", "profile"],
  },
  {
    name: "Users",
    component: LucideIcons.Users,
    category: "people",
    keywords: ["utenti", "persone", "gruppo", "users", "people", "group", "team"],
    tags: ["people", "group"],
  },
  {
    name: "Baby",
    component: LucideIcons.Baby,
    category: "people",
    keywords: ["bambino", "neonato", "baby", "infant", "child", "kid"],
    tags: ["people", "family"],
  },
  {
    name: "UserCircle",
    component: LucideIcons.UserCircle,
    category: "people",
    keywords: ["utente", "profilo", "avatar", "user", "profile", "account", "circle"],
    tags: ["people", "profile"],
  },
  {
    name: "HeartHandshake",
    component: LucideIcons.HeartHandshake,
    category: "people",
    keywords: ["stretta di mano", "accordo", "handshake", "agreement", "deal", "partnership"],
    tags: ["people", "business"],
  },
  {
    name: "MessageCircle",
    component: LucideIcons.MessageCircle,
    category: "people",
    keywords: ["messaggio", "chat", "message", "chat", "conversation", "talk"],
    tags: ["communication", "people"],
  },
  {
    name: "PhoneCall",
    component: LucideIcons.PhoneCall,
    category: "people",
    keywords: ["chiamata", "telefono", "call", "phone", "contact", "communication"],
    tags: ["communication", "people"],
  },

  // MISC (Altro)
  {
    name: "Star",
    component: LucideIcons.Star,
    category: "misc",
    keywords: ["stella", "preferito", "star", "favorite", "rating", "important"],
    tags: ["favorite", "rating"],
  },
  {
    name: "Flag",
    component: LucideIcons.Flag,
    category: "misc",
    keywords: ["bandiera", "segnalatore", "flag", "marker", "report", "important"],
    tags: ["marker", "important"],
  },
  {
    name: "Tag",
    component: LucideIcons.Tag,
    category: "misc",
    keywords: ["etichetta", "tag", "label", "category", "price"],
    tags: ["label", "category"],
  },
  {
    name: "Bookmark",
    component: LucideIcons.Bookmark,
    category: "misc",
    keywords: ["segnalibro", "salvato", "bookmark", "save", "favorite", "marked"],
    tags: ["save", "favorite"],
  },
  {
    name: "Clock",
    component: LucideIcons.Clock,
    category: "misc",
    keywords: ["orologio", "tempo", "ora", "clock", "time", "hour", "watch"],
    tags: ["time", "utility"],
  },
  {
    name: "Calendar",
    component: LucideIcons.Calendar,
    category: "misc",
    keywords: ["calendario", "data", "calendar", "date", "schedule", "event"],
    tags: ["time", "schedule"],
  },
  {
    name: "MapPin",
    component: LucideIcons.MapPin,
    category: "misc",
    keywords: ["posizione", "luogo", "pin", "location", "place", "map", "marker"],
    tags: ["location", "map"],
  },
  {
    name: "Navigation",
    component: LucideIcons.Navigation,
    category: "misc",
    keywords: ["navigazione", "direzione", "navigation", "direction", "compass", "gps"],
    tags: ["location", "direction"],
  },
  {
    name: "Compass",
    component: LucideIcons.Compass,
    category: "misc",
    keywords: ["bussola", "direzione", "compass", "direction", "navigation", "north"],
    tags: ["location", "direction"],
  },
  {
    name: "Globe",
    component: LucideIcons.Globe,
    category: "misc",
    keywords: ["globo", "mondo", "internet", "globe", "world", "earth", "international"],
    tags: ["world", "internet"],
  },
  {
    name: "Package",
    component: LucideIcons.Package,
    category: "misc",
    keywords: ["pacco", "consegna", "package", "delivery", "box", "shipment"],
    tags: ["delivery", "shipping"],
  },
  {
    name: "Box",
    component: LucideIcons.Box,
    category: "misc",
    keywords: ["scatola", "contenitore", "box", "container", "storage", "package"],
    tags: ["storage", "container"],
  },
  {
    name: "Archive",
    component: LucideIcons.Archive,
    category: "misc",
    keywords: ["archivio", "archiviazione", "archive", "storage", "backup", "save"],
    tags: ["storage", "archive"],
  },
  {
    name: "Trash",
    component: LucideIcons.Trash,
    category: "misc",
    keywords: ["cestino", "elimina", "cancella", "trash", "delete", "remove", "bin"],
    tags: ["delete", "remove"],
  },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all icons for a specific category
 */
export function getIconsByCategory(category: IconCategory): IconMetadata[] {
  if (category === "all") {
    return ICON_METADATA;
  }
  return ICON_METADATA.filter((icon) => icon.category === category);
}

/**
 * Get icon metadata by name
 */
export function getIconByName(name: string): IconMetadata | undefined {
  return ICON_METADATA.find((icon) => icon.name === name);
}

/**
 * Get all unique tags
 */
export function getAllTags(): string[] {
  const tags = new Set<string>();
  ICON_METADATA.forEach((icon) => {
    icon.tags.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort((a, b) => a.localeCompare(b));
}

/**
 * Get icon count by category
 */
export function getIconCountByCategory(): Record<IconCategory, number> {
  const counts: Record<string, number> = {
    all: ICON_METADATA.length,
  };

  ICON_METADATA.forEach((icon) => {
    counts[icon.category] = (counts[icon.category] || 0) + 1;
  });

  return counts as Record<IconCategory, number>;
}
