"use client";

import { UserButton as ClerkUserButton } from "@clerk/nextjs";
import { LogOut, Settings, User } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import Image from "next/image";
import { authStyles } from "../theme";

interface UserButtonProps {
  showName?: boolean;
  variant?: "default" | "clerk";
}

export function UserButton({ showName = false, variant = "default" }: UserButtonProps) {
  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent("")}`;

  // Use Clerk's built-in UserButton if specified
  if (variant === "clerk") {
    return (
      <ClerkUserButton
        appearance={{
          elements: {
            avatarBox: "w-8 h-8",
          },
        }}
        showName={showName}
      />
    );
  }

  // Custom user button with dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={authStyles.userButton.trigger}>
          <div className={authStyles.userButton.avatarWrap}>
            <Image
              src={avatarUrl}
              alt=""
              loading="lazy"
              className={authStyles.userButton.avatarImage}
            />
          </div>
          {showName && (
            <div className={authStyles.userButton.nameWrap}>
              <span className={authStyles.userButton.name}>{""}</span>
              <span className={authStyles.userButton.role}>{""}</span>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className={authStyles.userButton.menu}>
        <DropdownMenuLabel>
          <div className={authStyles.userButton.menuLabel}>
            <p className={authStyles.userButton.menuName}>{""}</p>
            <p className={authStyles.userButton.menuEmail}>{""}</p>
            <p className={authStyles.userButton.menuRole}>Ruolo: {""}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <User className={authStyles.userButton.menuIcon} />
          <span>Profilo</span>
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Settings className={authStyles.userButton.menuIcon} />
          <span>Impostazioni</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem className={authStyles.userButton.destructiveItem} onClick={() => {}}>
          <LogOut className={authStyles.userButton.menuIcon} />
          <span>Disconnetti</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
