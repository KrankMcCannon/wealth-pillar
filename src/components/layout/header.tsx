"use client";

import { useState } from "react";
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
import { User, Account, Category } from "@/lib/types";
import { cn } from "@/lib";

// UI Components
import { Button, ThemeToggle, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui";
import { TransactionForm } from "@/features/transactions/components/transaction-form";
import { BudgetForm } from "@/features/budgets/components/budget-form";
import { CategoryForm } from "@/features/categories/components/category-form";
import { RecurringSeriesForm } from "@/features/recurring/components/recurring-series-form";

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

    // Data for Forms & Display
    data?: {
        currentUser: User & { role: string }; // Extended User type for dashboard
        groupUsers: User[];
        accounts: Account[];
        categories: Category[];
        groupId: string;
    };

    extraMenuItems?: { label: string; icon: React.ElementType; onClick: () => void }[];
    // Callbacks (Optional overrides, otherwise internal logic is used)
    onBack?: () => void;
}

export function Header({
    title,
    subtitle,
    showBack = false,
    isDashboard = false,
    className,
    data,
    extraMenuItems = [],
    onBack,
}: HeaderProps) {
    const router = useRouter();

    // Modal States
    const [isTransactionOpen, setIsTransactionOpen] = useState(false);
    const [isBudgetOpen, setIsBudgetOpen] = useState(false);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isRecurringOpen, setIsRecurringOpen] = useState(false);

    // Navigation Handler
    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    // Action Menu Items
    const actionItems = [
        {
            label: "Nuova Transazione",
            icon: CreditCard,
            onClick: () => setIsTransactionOpen(true),
        },
        {
            label: "Nuovo Budget",
            icon: PieChart,
            onClick: () => setIsBudgetOpen(true),
        },
        {
            label: "Nuova Categoria",
            icon: Tag,
            onClick: () => setIsCategoryOpen(true),
        },
        {
            label: "Ricorrente",
            icon: RefreshCw,
            onClick: () => setIsRecurringOpen(true),
        },
        ...extraMenuItems
    ];

    // Render "Add" Action Menu (Desktop Dropdown / Mobile Drawer handled by responsive UI or simple Dropdown for now)
    // Note: For simplicity and consistency, a Dropdown works well on both, but a Drawer is often better on mobile.
    // We'll use a Dropdown for now as it's cleaner for a header action.
    const renderAddAction = () => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="icon" className="h-9 w-9 bg-primary/10 text-primary hover:bg-primary/20 rounded-full">
                    <Plus className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl border-border/50 backdrop-blur-xl">
                {actionItems.map((item, idx) => (
                    <DropdownMenuItem
                        key={idx}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer focus:bg-primary/5 focus:text-primary"
                        onClick={item.onClick}
                    >
                        <item.icon className="h-4 w-4" />
                        <span className="font-medium">{item.label}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
        <>
            <header
                className={cn(
                    STICKY_HEADER_BASE,
                    stickyHeaderStyles.base,
                    "px-4 py-3 z-30 transition-all duration-200",
                    className
                )}
            >
                <div className="flex items-center justify-between w-full mx-auto">
                    {/* LEFT SECTION: Back Button or Dashboard Info */}
                    <div className="flex items-center gap-4">
                        {isDashboard && data?.currentUser && (
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-sm border-2 border-background shadow-sm overflow-hidden">
                                        {data.currentUser.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    {data.currentUser.role === 'admin' && (
                                        <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5 border-2 border-background shadow-sm" title="Premium">
                                            <Crown className="h-2.5 w-2.5 text-white fill-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="hidden sm:block leading-none">
                                    <p className="text-sm font-semibold text-foreground truncate max-w-[120px]">{data.currentUser.name}</p>
                                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5 capitalize">
                                        {data.currentUser.role === 'admin' ? 'Premium Plan' : 'Standard Plan'}
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
                                        className="h-9 w-9 -ml-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={handleBack}
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </Button>
                                )}
                                <div>
                                    {title && <h1 className="text-lg font-semibold text-foreground leading-tight">{title}</h1>}
                                    {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT SECTION: Actions */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Common Actions Order: Add, Notifications, Settings, Toggle */}

                        {/* 1. Add Actions */}
                        {data && renderAddAction()}

                        {/* 2. Notifications */}
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Notifiche"
                            className="h-9 w-9 rounded-full text-primary hover:bg-primary/5"
                        >
                            <Bell className="h-5 w-5" />
                        </Button>

                        {/* 3. Settings */}
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Impostazioni"
                            className="h-9 w-9 rounded-full text-primary hover:bg-primary/5"
                            onClick={() => router.push('/settings')}
                        >
                            <Settings className="h-5 w-5" />
                        </Button>

                        {/* 4. Portfolio Badge */}
                        {isDashboard && (
                            <div className="flex items-center px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-green-600 text-xs font-semibold">
                                <span>↗ +2.5%</span>
                            </div>
                        )}

                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* --- MODALS - Only render if data is available --- */}

            {data && (
                <>
                    {/* Transaction Form Modal */}
                    <TransactionForm
                        isOpen={isTransactionOpen}
                        onOpenChange={setIsTransactionOpen}
                        mode="create"
                        currentUser={data.currentUser}
                        groupUsers={data.groupUsers}
                        accounts={data.accounts}
                        categories={data.categories}
                        groupId={data.groupId}
                        onSuccess={() => {
                            // Optional: Show toast or handle success
                            setIsTransactionOpen(false);
                            router.refresh();
                        }}
                    />

                    {/* Budget Form Modal */}
                    <BudgetForm
                        isOpen={isBudgetOpen}
                        onOpenChange={setIsBudgetOpen}
                        mode="create"
                        currentUser={data.currentUser}
                        groupUsers={data.groupUsers}
                        categories={data.categories}
                        // Needs fixing: BudgetForm expects {id, name} for groupUsers, but we have User[]
                        // But User has id and name, so it should be fine if types overlap.
                        onSuccess={() => {
                            setIsBudgetOpen(false);
                            router.refresh();
                        }}
                    />

                    {/* Category Form Modal */}
                    <CategoryForm
                        isOpen={isCategoryOpen}
                        onOpenChange={setIsCategoryOpen}
                        mode="create"
                        groupId={data.groupId}
                        onSuccess={() => {
                            setIsCategoryOpen(false);
                            router.refresh();
                        }}
                    />

                    {/* Recurring Series Form Modal */}
                    <RecurringSeriesForm
                        isOpen={isRecurringOpen}
                        onOpenChange={setIsRecurringOpen}
                        mode="create"
                        currentUser={data.currentUser}
                        groupUsers={data.groupUsers}
                        accounts={data.accounts}
                        categories={data.categories}
                        onSuccess={() => {
                            setIsRecurringOpen(false);
                            router.refresh();
                        }}
                    />
                </>
            )}

        </>
    );
}
