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
    Crown,
    TrendingUp
} from "lucide-react";
import { cn } from "@/lib";
import { headerStyles } from "./theme/header-styles";

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

    // Investment data for header badge
    investmentSummary?: {
        totalReturnPercent: number;
    } | null;

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
        {
            label: "Nuovo Investimento",
            icon: TrendingUp,
            onClick: () => openModal('investment'),
        },
        ...extraMenuItems
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="default"
                    size="icon"
                    className={headerStyles.actions.actionButton}
                >
                    <Plus className={headerStyles.actions.actionIcon} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={headerStyles.actions.menu}>
                {actionItems.map((item) => (
                    <DropdownMenuItem key={item.label} onClick={item.onClick}>
                        <item.icon className={headerStyles.actions.menuIcon} />
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
    investmentSummary,
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
                headerStyles.container,
                className
            )}
        >
            <div className={headerStyles.inner}>
                {/* LEFT SECTION: Back Button or Dashboard Info */}
                <div className={headerStyles.left}>
                    {isDashboard && currentUser && (
                        <>
                            <div className={headerStyles.dashboard.wrapper}>
                                <div className={headerStyles.dashboard.avatarWrap}>
                                    <div className={headerStyles.dashboard.avatar}>
                                        {currentUser?.name?.substring(0, 2).toUpperCase()}
                                    </div>
                                    {currentUser?.role === 'admin' && (
                                        <div className={headerStyles.dashboard.crownWrap} title="Premium">
                                            <Crown className={headerStyles.dashboard.crownIcon} />
                                        </div>
                                    )}
                                </div>
                                <div className={headerStyles.dashboard.userInfo}>
                                    <p className={headerStyles.dashboard.userName}>
                                        {currentUser?.name}
                                    </p>
                                    <p className={headerStyles.dashboard.userRole}>
                                        {currentUser?.role === 'admin' ? 'Premium Plan' : 'Standard Plan'}
                                    </p>
                                </div>
                            </div>

                            {investmentSummary && (
                                <div className={`${headerStyles.actions.badge} ${investmentSummary.totalReturnPercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    <span>
                                        {investmentSummary.totalReturnPercent >= 0 ? '↗' : '↘'}{' '}
                                        {investmentSummary.totalReturnPercent >= 0 ? '+' : ''}
                                        {investmentSummary.totalReturnPercent.toFixed(2)}%
                                    </span>
                                </div>
                            )}
                        </>
                    )}

                    {!isDashboard && (
                        // Subpage View: Back Button & Title
                        <div className={headerStyles.subpage.wrapper}>
                            {showBack && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Torna indietro"
                                    className={headerStyles.subpage.backButton}
                                    onClick={handleBack}
                                >
                                    <ArrowLeft className={headerStyles.subpage.backIcon} />
                                </Button>
                            )}
                            <div>
                                {title && (
                                    <h1 className={headerStyles.subpage.title}>
                                        {title}
                                    </h1>
                                )}
                                {subtitle && (
                                    <p className={headerStyles.subpage.subtitle}>{subtitle}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT SECTION: Actions */}
                <div className={headerStyles.actions.wrapper}>
                    {/* 1. Add Actions */}
                    {showActions && <ActionMenu extraMenuItems={extraMenuItems} />}

                    {/* 2. Notifications */}
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Notifiche"
                        className={headerStyles.actions.iconButton}
                    >
                        <Bell className={headerStyles.actions.icon} />
                    </Button>

                    {/* 3. Settings */}
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Impostazioni"
                        className={headerStyles.actions.iconButton}
                        onClick={() => router.push('/settings')}
                    >
                        <Settings className={headerStyles.actions.icon} />
                    </Button>

                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
