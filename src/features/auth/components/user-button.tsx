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
} from "@/src/components/ui";
import Image from "next/image";

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
        <Button variant="ghost" className="flex items-center gap-2 px-2 py-1 h-auto">
          <div className="w-8 h-8 rounded-xl overflow-hidden bg-primary/10">
            <Image
              src={avatarUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          {showName && (
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-medium">{""}</span>
              <span className="text-xs capitalize">{""}</span>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{""}</p>
            <p className="text-xs leading-none">{""}</p>
            <p className="text-xs leading-none capitalize">Ruolo: {""}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Profilo</span>
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Impostazioni</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => {}}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Disconnetti</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
