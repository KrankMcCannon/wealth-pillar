import { memo } from 'react';
import type { GroupWithMemberCount } from '../../lib/supabase/services/groups.service';
import { useGroupSettings } from '../../hooks/features/groups/useGroupSettings';

interface GroupSettingsProps {
    group: GroupWithMemberCount | null;
    isLoading: boolean;
    onUpdateGroup: (updates: { name?: string; description?: string }) => void;
    onDeleteGroup: () => void;
    className?: string;
}

/**
 * GroupSettings Component
 */
export const GroupSettings = memo<GroupSettingsProps>(({
    group,
    isLoading,
    onUpdateGroup,
    onDeleteGroup,
    className = ''
}) => {
    const {
        isEditing,
        setIsEditing,
        formData,
        setFormData,
        showDeleteConfirm,
        setShowDeleteConfirm,
        handleSave,
        handleCancel,
        handleDelete,
    } = useGroupSettings(
        group,
        onUpdateGroup,
        onDeleteGroup
    );

    if (isLoading) {
        return (
            <div className={`animate-pulse space-y-4 ${className}`}>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
        );
    }

    if (!group) {
        return (
            <div className={`text-center p-8 ${className}`}>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Il mio gruppo
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        Non hai ancora un gruppo associato al tuo account.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Il mio gruppo
                </h2>

                {/* Group Info */}
                <div className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nome gruppo
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                placeholder="Nome del gruppo"
                            />
                        ) : (
                            <p className="text-gray-900 dark:text-gray-100 font-medium">
                                {group.name}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Descrizione
                        </label>
                        {isEditing ? (
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                placeholder="Descrizione del gruppo (opzionale)"
                            />
                        ) : (
                            <p className="text-gray-600 dark:text-gray-400">
                                {group.description || 'Nessuna descrizione'}
                            </p>
                        )}
                    </div>

                    {/* Member count */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Persone nel gruppo
                        </label>
                        <p className="text-gray-600 dark:text-gray-400">
                            {group.member_count} {group.member_count === 1 ? 'persona' : 'persone'}
                        </p>
                    </div>

                    {/* Created date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Creato il
                        </label>
                        <p className="text-gray-600 dark:text-gray-400">
                            {new Date(group.created_at).toLocaleDateString('it-IT', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    {isEditing ? (
                        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                            <button
                                onClick={handleSave}
                                disabled={!formData.name.trim()}
                                className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                                Salva
                            </button>
                            <button
                                onClick={handleCancel}
                                className="w-full sm:w-auto px-4 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                            >
                                Annulla
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:justify-between">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                Modifica il mio gruppo
                            </button>

                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                            >
                                Elimina il mio gruppo
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete confirmation modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-lg p-4 sm:p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Conferma eliminazione
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm sm:text-base">
                            Sei sicuro di voler eliminare il tuo gruppo "{group.name}"?
                            Questa azione non può essere annullata e tutti i dati associati al gruppo verranno rimossi.
                        </p>
                        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                            <button
                                onClick={handleDelete}
                                className="w-full sm:flex-1 px-4 py-3 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                            >
                                Elimina
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="w-full sm:flex-1 px-4 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                            >
                                Annulla
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});