import { memo } from "react";
import { useSettingsModals } from "../../hooks/data/useSettings";
import { useFinance } from "../../hooks/core/useFinance";
import { useAuth } from "../../contexts/AuthContext";
import { usePersonFilter } from "../../hooks/data/usePersonFilter";
import { UserProfileSection, AccountManagementSection, BudgetManagementSection } from "../settings";
import { GroupSettings } from "../groups";
import { useGroups } from "../../hooks/features/groups/useGroups";
import { AddAccountModal, EditAccountModal, EditPersonModal, EditBudgetModal } from "../modals";

export const SettingsPage = memo(() => {
  const { user, signOut } = useAuth();
  const { people, accounts, budgets, getCalculatedBalanceSync } = useFinance();
  const { getPersonName } = usePersonFilter();
  const { currentGroup } = useGroups();

  const {
    isAddAccountModalOpen,
    openAddAccountModal,
    closeAddAccountModal,
    isEditAccountModalOpen,
    selectedAccount,
    openEditAccountModal,
    closeEditAccountModal,
    isEditPersonModalOpen,
    selectedPerson,
    openEditPersonModal,
    closeEditPersonModal,
    isEditBudgetModalOpen,
    selectedBudget,
    openEditBudgetModal,
    closeEditBudgetModal,
  } = useSettingsModals();

  const handleUpdateGroup = async (updates: { name?: string; description?: string }) => {
    // Implementazione aggiornamento gruppo
  };

  const handleDeleteGroup = async () => {
    // Implementazione eliminazione gruppo
  };

  return (
    <div className="space-y-6 lg:space-y-8 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Impostazioni</h1>
        <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
          Gestisci il tuo profilo, account e preferenze
        </p>
      </div>

      {/* Sezione Informazioni Account */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informazioni Account</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              {user?.imageUrl && (
                <img src={user.imageUrl} alt={user.fullName || "Avatar"} className="w-12 h-12 rounded-full" />
              )}
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white">{user?.fullName || "Utente"}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{user?.emailAddress}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={signOut}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                Disconnetti
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sezione Gruppo */}
      <GroupSettings
        group={currentGroup}
        isLoading={false}
        onUpdateGroup={handleUpdateGroup}
        onDeleteGroup={handleDeleteGroup}
      />

      {/* Sezione Profilo Utente */}
      <UserProfileSection people={people} onEditPerson={openEditPersonModal} />

      {/* Sezione Gestione Account */}
      <AccountManagementSection
        accounts={accounts}
        isAllView={false}
        onEditAccount={openEditAccountModal}
        onAddAccount={openAddAccountModal}
        getPersonName={getPersonName}
        getCalculatedBalanceSync={getCalculatedBalanceSync}
      />

      {/* Sezione Gestione Budget */}
      <BudgetManagementSection
        budgets={budgets}
        isAllView={false}
        onEditBudget={openEditBudgetModal}
        getPersonName={getPersonName}
      />

      {/* Modali */}
      <AddAccountModal isOpen={isAddAccountModalOpen} onClose={closeAddAccountModal} />

      <EditAccountModal isOpen={isEditAccountModalOpen} onClose={closeEditAccountModal} account={selectedAccount} />

      <EditPersonModal isOpen={isEditPersonModalOpen} onClose={closeEditPersonModal} person={selectedPerson} />

      <EditBudgetModal isOpen={isEditBudgetModalOpen} onClose={closeEditBudgetModal} budget={selectedBudget} />
    </div>
  );
});
