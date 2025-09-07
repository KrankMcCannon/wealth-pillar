"use client";

import { User } from "@/lib/types";
import { Users, User as UserIcon, Crown, Star, Heart } from "lucide-react";

interface UserSelectorProps {
  users: User[];
  currentUser: User | null;
  selectedGroupFilter: string;
  onGroupFilterChange: (groupId: string) => void;
  className?: string;
}

export default function UserSelector({
  users,
  currentUser,
  selectedGroupFilter,
  onGroupFilterChange,
  className = ""
}: UserSelectorProps) {
  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  // Funzione per scegliere l'icona appropriata per ogni utente
  const getUserIcon = (userId: string, index: number) => {
    const userIcons = [UserIcon, Crown, Star, Heart];
    if (userId === 'all') return Users;
    return userIcons[index % userIcons.length];
  };

  return (
    <section className={`bg-white/80 backdrop-blur-xl p-2 border-b border-slate-200/50 shadow-sm ${className}`}>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400 scrollbar-thumb-rounded-full">
        {[{ id: 'all', name: 'Tutti i Membri', avatar: '👥' }, ...users].map((member, index) => {
          const IconComponent = getUserIcon(member.id, index);
          return (
            <button
              key={member.id}
              onClick={() => onGroupFilterChange(member.id)}
              className={`flex-shrink-0 flex items-center gap-3 p-2 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-300 group hover:scale-105 ${selectedGroupFilter === member.id
                  ? "bg-gradient-to-r from-[#7578EC] to-[#6366F1] text-white shadow-lg shadow-[#7578EC]/30 border border-white/20"
                  : "bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-white hover:text-[#7578EC] border border-slate-200/50 hover:border-[#7578EC]/40 hover:shadow-md hover:shadow-slate-200/50"
                }`}
            >
              <div className={`flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 group-hover:scale-110 ${
                selectedGroupFilter === member.id
                  ? 'bg-white/20 backdrop-blur-sm'
                  : 'bg-[#7578EC]/10'
              }`}>
                {member.id === 'all' ? (
                  <Users className={`w-4 h-4 ${selectedGroupFilter === member.id ? 'text-white' : 'text-[#7578EC]'}`} />
                ) : (
                  <IconComponent className={`w-4 h-4 ${selectedGroupFilter === member.id ? 'text-white' : 'text-[#7578EC]'}`} />
                )}
              </div>
              <span className="truncate max-w-[80px] sm:max-w-[100px]">
                {member.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
