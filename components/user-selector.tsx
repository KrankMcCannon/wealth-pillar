"use client";

import { dummyUsers, currentUser } from "@/lib/dummy-data";
import { isAdmin } from "@/lib/utils";

interface UserSelectorProps {
  selectedGroupFilter: string;
  onGroupFilterChange: (groupId: string) => void;
  className?: string;
}

export default function UserSelector({
  selectedGroupFilter,
  onGroupFilterChange,
  className = ""
}: UserSelectorProps) {
  if (!isAdmin(currentUser)) {
    return null;
  }

  return (
    <section className={`bg-white/80 backdrop-blur-xl p-2 border-b border-slate-200/50 shadow-sm ${className}`}>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400 scrollbar-thumb-rounded-full">
        {[{ id: 'all', name: 'Tutti i Membri', avatar: '👥' }, ...dummyUsers].map((member) => (
          <button
            key={member.id}
            onClick={() => onGroupFilterChange(member.id)}
            className={`flex-shrink-0 flex items-center gap-3 p-2 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-300 group hover:scale-105 ${selectedGroupFilter === member.id
                ? "bg-gradient-to-r from-[#7578EC] to-[#6366F1] text-white shadow-lg shadow-[#7578EC]/30 border border-white/20"
                : "bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-white hover:text-[#7578EC] border border-slate-200/50 hover:border-[#7578EC]/40 hover:shadow-md hover:shadow-slate-200/50"
              }`}
          >
            <span className={`text-lg transition-transform duration-200 group-hover:scale-110 ${selectedGroupFilter === member.id ? 'drop-shadow-sm' : ''}`}>{member.avatar}</span>
            <span>{member.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}