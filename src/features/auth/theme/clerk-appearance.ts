import { Theme } from "@clerk/types";

export const clerkAppearance: Theme = {
  layout: {
    socialButtonsPlacement: "top",
    socialButtonsVariant: "blockButton",
    shimmer: true,
  },
  variables: {
    borderRadius: "1rem",
    fontFamily: "var(--font-spline-sans), system-ui, sans-serif",
    fontSize: "0.95rem",
  },
  elements: {
    // Card Container - Glassmorphism
    card: "backdrop-blur-2xl bg-card/70 shadow-[0_8px_32px_rgba(0,0,0,0.08)] ring-1 ring-border/50 rounded-3xl p-2 sm:p-4",
    rootBox: "w-full max-w-sm mx-auto",

    // Header -> Changed to text-primary
    headerTitle: "text-2xl font-bold tracking-tight text-primary font-sans",
    headerSubtitle: "!text-primary text-sm font-medium mt-1.5",

    // Social Buttons -> Changed to text-primary
    socialButtonsBlockButton:
      "relative h-12 bg-card hover:bg-muted/20 border border-border hover:border-primary/30 text-primary transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 rounded-xl group",
    socialButtonsBlockButtonText: "font-semibold text-sm !text-primary",
    socialButtonsProviderIcon: "mr-2 h-5 w-5 opacity-80 group-hover:opacity-100 transition-opacity !text-primary",

    // Dividers
    dividerLine: "bg-border h-[1px]",
    dividerText: "!text-primary text-xs font-semibold uppercase tracking-wider bg-transparent px-3",

    // Inputs -> Changed to text-primary
    formFieldLabel: "!text-primary text-xs font-bold uppercase tracking-wide mb-1.5 ml-1",
    formFieldInput:
      "h-11 bg-card border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-xl transition-all duration-300 !text-primary placeholder:!text-primary/50 font-medium",

    // Primary Button
    formButtonPrimary:
      "h-11 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98] transition-all duration-300 rounded-xl text-sm font-bold uppercase tracking-wide",

    // Footer / Links
    footerAction: "mt-4 text-center",
    footerActionText: "!text-primary font-medium",
    footerActionLink: "text-primary font-bold hover:text-primary/80 transition-colors ml-1",

    // Alerts / Errors -> Changed to semantic destructive colors
    alert: "bg-destructive/10 border-destructive/20 text-destructive rounded-xl",
    alertText: "text-sm font-medium",

    // Identity Preview
    identityPreview: "bg-muted/30 border-border rounded-xl p-3",
    identityPreviewEditButton: "text-primary hover:text-primary/80 font-semibold",

    // Phone Input details
    formFieldInputShowPasswordButton: "!text-primary hover:!text-primary/80 transition-colors",
  },
};
