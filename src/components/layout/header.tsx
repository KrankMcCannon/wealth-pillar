"use client";

import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Settings,
    Bell,
    Plus,
    CreditCard,
    PieChart,
    Tag,
    RefreshCw,
    Crown
} from "lucide-react";
import { cn } from "@/lib";

// UI Components
import { Button, ThemeToggle, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui";

// New Modal State Management
import { useModalState } from "@/lib/navigation/url-state";

// Constants
import { STICKY_HEADER_BASE } from "@/lib/utils/ui-constants";
import { stickyHeaderStyles } from "@/styles/system";

interface HeaderProps {
    // Navigation & Display
    title?: string;
    subtitle?: string;
    showBack?: boolean;
    isDashboard?: boolean;
    className?: string;

    // User info for display only
    currentUser?: {
        name?: string;
        role?: string;
    };

    // Show action menu
    showActions?: boolean;

    // Extra menu items (optional)
    extraMenuItems?: { label: string; icon: React.ElementType; onClick: () => void }[];

    // Callbacks
    onBack?: () => void;
}

// Action Menu Component - Separate to avoid hook issues when NuqsAdapter isn't available
function ActionMenu({ extraMenuItems = [] }: Readonly<{ extraMenuItems?: { label: string; icon: React.ElementType; onClick: () => void }[] }>) {
    const { openModal } = useModalState();

    const actionItems = [
        {
            label: "Nuova Transazione",
            icon: CreditCard,
            onClick: () => openModal('transaction'),
        },
        {
            label: "Nuovo Budget",
            icon: PieChart,
            onClick: () => openModal('budget'),
        },
        {
            label: "Nuova Categoria",
            icon: Tag,
            onClick: () => openModal('category'),
        },
        {
            label: "Ricorrente",
            icon: RefreshCw,
            onClick: () => openModal('recurring'),
        },
        {
            label: "Nuovo Account",
            icon: CreditCard,
            onClick: () => openModal('account'),
        },
        ...extraMenuItems
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="default"
                    size="icon"
                    className="h-11 w-11 bg-primary text-primary-foreground rounded-full shadow-sm hover:bg-primary/90"
                >
                    <Plus className="h-5.5 w-5.5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                {actionItems.map((item) => (
                    <DropdownMenuItem key={item.label} onClick={item.onClick}>
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function Header({
    title,
    subtitle,
    showBack = false,
    isDashboard = false,
    className,
    currentUser,
    showActions = false,
    extraMenuItems = [],
    onBack,
}: Readonly<HeaderProps>) {
    const router = useRouter();

    // Navigation Handler
    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    return (
        <header
            className={cn(
                STICKY_HEADER_BASE,
                stickyHeaderStyles.base,
                "px-4 py-2 z-40 transition-all duration-200",
                className
            )}
        >
            <div className="flex items-center justify-between w-full mx-auto">
                {/* LEFT SECTION: Back Button or Dashboard Info */}
                <div className="flex items-center gap-4">
                    {isDashboard && currentUser && (
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-base border-2 border-background shadow-sm overflow-hidden">
                                    {currentUser?.name?.substring(0, 2).toUpperCase()}
                                </div>
                                {currentUser?.role === 'admin' && (
                                    <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5 border-2 border-background shadow-sm" title="Premium">
                                        <Crown className="h-3 w-3 text-white fill-white" />
                                    </div>
                                )}
                            </div>
                            <div className="hidden sm:block leading-none">
                                <p className="text-base font-semibold text-foreground truncate max-w-[140px]">
                                    {currentUser?.name}
                                </p>
                                <p className="text-xs text-muted-foreground font-medium mt-0.5 capitalize">
                                    {currentUser?.role === 'admin' ? 'Premium Plan' : 'Standard Plan'}
                                </p>
                            </div>
                        </div>
                    )}

                    {!isDashboard && (
                        // Subpage View: Back Button & Title
                        <div className="flex items-center gap-3">
                            {showBack && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Torna indietro"
                                    className="h-10 w-10 -ml-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={handleBack}
                                >
                                    <ArrowLeft className="h-5.5 w-5.5" />
                                </Button>
                            )}
                            <div>
                                {title && (
                                    <h1 className="text-xl font-semibold text-foreground leading-tight">
                                        {title}
                                    </h1>
                                )}
                                {subtitle && (
                                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT SECTION: Actions */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* 1. Add Actions */}
                    {showActions && <ActionMenu extraMenuItems={extraMenuItems} />}

                    {/* 2. Notifications */}
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Notifiche"
                        className="h-10 w-10 rounded-full text-primary hover:bg-primary/5"
                    >
                        <Bell className="h-5.5 w-5.5" />
                    </Button>

                    {/* 3. Settings */}
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Impostazioni"
                        className="h-10 w-10 rounded-full text-primary hover:bg-primary/5"
                        onClick={() => router.push('/settings')}
                    >
                        <Settings className="h-5.5 w-5.5" />
                    </Button>

                    {/* 4. Portfolio Badge */}
                    {isDashboard && (
                        <div className="flex items-center px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-green-600 text-sm font-semibold">
                            <span>↗ +2.5%</span>
                        </div>
                    )}

                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
