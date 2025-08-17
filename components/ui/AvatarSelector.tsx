import { memo } from "react";
import { FINANCE_AVATARS, getAvailableAvatars } from "../../constants";
import { Person } from "../../types";

interface AvatarSelectorProps {
  people: Person[];
  selectedAvatarId?: string;
  onAvatarSelect: (avatarId: string) => void;
  currentPersonId?: string; // Per escludere la persona corrente durante la modifica
  disabled?: boolean;
}

export const AvatarSelector = memo<AvatarSelectorProps>(
  ({ people, selectedAvatarId, onAvatarSelect, currentPersonId, disabled = false }) => {
    const availableAvatars = getAvailableAvatars(people, currentPersonId);

    return (
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Seleziona Avatar</label>

        {/* Vista Mobile - Carosello orizzontale */}
        <div className="block sm:hidden">
          <div className="flex gap-3 overflow-x-auto py-2 scrollbar-hide">
            {availableAvatars.map((avatar) => (
              <button
                key={avatar.id}
                type="button"
                onClick={() => onAvatarSelect(avatar.id)}
                disabled={disabled}
                className={`flex-shrink-0 relative group p-3 rounded-xl border-2 transition-all duration-200 min-w-[80px] ${
                  selectedAvatarId === avatar.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-105"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md"
                } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                title={avatar.id}
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm bg-gray-100 dark:bg-gray-700">
                    {avatar.icon}
                  </div>
                </div>
                {selectedAvatarId === avatar.id && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Vista Desktop - Griglia */}
        <div className="hidden sm:grid sm:grid-cols-5 gap-3 py-2">
          {availableAvatars.map((avatar) => (
            <button
              key={avatar.id}
              type="button"
              onClick={() => onAvatarSelect(avatar.id)}
              disabled={disabled}
              className={`relative group p-3 rounded-xl border-2 transition-all duration-200 ${
                selectedAvatarId === avatar.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-105"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md"
              } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              title={avatar.id}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm bg-gray-100 dark:bg-gray-700">
                  {avatar.icon}
                </div>
              </div>
              {selectedAvatarId === avatar.id && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {availableAvatars.length === 0 && (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tutti gli avatar sono già stati assegnati</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Rimuovi un avatar da un'altra persona per poterlo selezionare
            </p>
          </div>
        )}
      </div>
    );
  }
);

AvatarSelector.displayName = "AvatarSelector";
