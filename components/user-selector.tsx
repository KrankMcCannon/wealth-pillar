"use client";

import { memo, useCallback, useMemo } from 'react';
import { User } from "@/lib/types";
import { Users, User as UserIcon, Crown, Star, Heart } from "lucide-react";

interface UserSelectorProps {
  users: User[];
  currentUser: User | null;
  selectedGroupFilter: string;
  onGroupFilterChange: (userId: string) => void;
  className?: string;
  isLoading?: boolean;
}

/**
 * Optimized UserSelector with memoization and modern UX
 * Prevents unnecessary re-renders and improves performance
 */
const UserSelector = memo(({
  users,
  currentUser,
  selectedGroupFilter,
  onGroupFilterChange,
  className = "",
  isLoading = false
}: UserSelectorProps) => {
  // Memoized icon selection
  const getUserIcon = useCallback((userId: string, index: number) => {
    const userIcons = [UserIcon, Crown, Star, Heart];
    if (userId === 'all') return Users;
    return userIcons[index % userIcons.length];
  }, []);

  // Memoized user list with "All Members" option
  const membersList = useMemo(() => {
    return [
      {
        id: 'all',
        name: 'Tutti',
        avatar: '👥',
        isSpecial: true
      },
      ...users.map(user => ({
        id: user.id,
        name: user.name,
        isSpecial: false
      }))
    ];
  }, [users]);

  // Memoized click handler
  const handleMemberClick = useCallback((memberId: string) => {
    if (memberId !== selectedGroupFilter) {
      onGroupFilterChange(memberId);
    }
  }, [selectedGroupFilter, onGroupFilterChange]);

  // Early return for non-admin users
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <section className={`bg-white/80 backdrop-blur-xl p-2 border-b border-slate-200/50 shadow-sm ${className}`}>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 flex items-center gap-3 p-2 rounded-2xl bg-gradient-to-r from-slate-100 to-slate-50 border border-slate-200/50 min-w-[120px] animate-pulse"
            >
              <div className="w-6 h-6 bg-[#7578EC]/20 rounded-full"></div>
              <div className="w-16 h-4 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={`bg-white/80 backdrop-blur-xl py-3 border-b border-slate-200/50 shadow-sm ${className}`}>
      <div
        className="flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400 scrollbar-thumb-rounded-full pl-4"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent',
          height: '44px', // Altezza fissa per il container
        }}
      >
        {membersList.map((member, index) => {
          const IconComponent = getUserIcon(member.id, index);
          const isSelected = selectedGroupFilter === member.id;

          return (
            <button
              key={member.id}
              onClick={() => handleMemberClick(member.id)}
              className={`
                flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-semibold
                whitespace-nowrap transition-all duration-300 group hover:scale-105
                focus:outline-none
                ${isSelected
                  ? "bg-gradient-to-r from-[#7578EC] to-[#6366F1] text-white shadow-lg shadow-[#7578EC]/30 scale-105"
                  : "bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-white hover:text-[#7578EC] hover:shadow-md hover:shadow-slate-200/50"
                }
              `}
              disabled={isLoading}
              aria-pressed={isSelected}
              aria-label={`Seleziona ${member.name}`}
            >
              <div className={`
                flex items-center justify-center w-5 h-5 rounded-full
                transition-all duration-200 group-hover:scale-110
                ${isSelected
                  ? 'bg-white/20 backdrop-blur-sm'
                  : 'bg-[#7578EC]/10'
                }
              `}>
                <IconComponent
                  className={`w-3.5 h-3.5 transition-colors duration-200 ${
                    isSelected ? 'text-white' : 'text-[#7578EC]'
                  }`}
                />
              </div>

              <span className="truncate max-w-[70px] transition-all duration-200">
                {member.name}
              </span>

              {/* Hover indicator only for non-selected */}
              {!isSelected && (
                <div className="w-0 h-2 bg-[#7578EC]/40 rounded-full transition-all duration-300 group-hover:w-2 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selection indicator dots (for visual feedback) */}
      {membersList.length > 3 && (
        <div className="flex justify-center mt-2 gap-1">
          {membersList.slice(0, Math.min(membersList.length, 5)).map((_, index) => (
            <div
              key={index}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                index === membersList.findIndex(m => m.id === selectedGroupFilter)
                  ? 'bg-[#7578EC] w-4'
                  : 'bg-slate-300'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
});

UserSelector.displayName = 'UserSelector';

export default UserSelector;