'use client';

import { UserButton as ClerkUserButton } from '@clerk/nextjs';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, User } from 'lucide-react';

interface UserButtonProps {
  showName?: boolean;
  variant?: 'default' | 'clerk';
}

export function UserButton({ showName = false, variant = 'default' }: UserButtonProps) {
  const { user, signOut, isAuthenticated } = useAuth();

  // If not authenticated, don't show anything
  if (!isAuthenticated || !user) {
    return null;
  }

  // Use Clerk's built-in UserButton if specified
  if (variant === 'clerk') {
    return (
      <ClerkUserButton
        appearance={{
          elements: {
            avatarBox: 'w-8 h-8',
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
          <Avatar className="w-8 h-8">
            <AvatarImage
              src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
              alt={user.name}
              sizes="32px"
            />
          </Avatar>
          {showName && (
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-medium">{user.name}</span>
              <span className="text-xs capitalize">{user.role}</span>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none">
              {user.email}
            </p>
            <p className="text-xs leading-none capitalize">
              Ruolo: {user.role}
            </p>
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

        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Disconnetti</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
