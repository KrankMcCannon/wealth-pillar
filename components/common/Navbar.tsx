import React from "react";
import { NavLink } from "react-router-dom";
import { HomeIcon, TransactionIcon, InvestmentIcon, SettingsIcon, UserGroupIcon, ChartBarIcon } from ".";
import { useFinance } from "../../hooks";
import { useAuth } from "../../contexts/AuthContext";

const NavItem: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => {
  const inactiveClass =
    "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white";

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${
          isActive ? "text-white" : inactiveClass
        } flex items-center p-3 my-1 transition-colors duration-200 rounded-lg`
      }
      style={({ isActive }) => ({ backgroundColor: isActive ? "var(--theme-color)" : "transparent" })}
    >
      {children}
    </NavLink>
  );
};

const PersonSelector: React.FC = () => {
  const { people, selectedPersonId, selectPerson } = useFinance();
  const defaultAvatar = "https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff";

  const selectedPerson = people.find((p) => p.id === selectedPersonId);

  return (
    <div className="mb-8">
      <div className="flex items-center mb-4">
        <div className="p-2 rounded-lg" style={{ backgroundColor: "var(--theme-color)" }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold ml-3 text-gray-800 dark:text-white">Wealth Pillar</h1>
      </div>

      {/* Selettore Persona */}
      {people.length > 1 && (
        <div className="mb-4">
          <label htmlFor="person-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Seleziona Persona
          </label>
          <div className="relative">
            <select
              id="person-select"
              className="w-full p-3 pr-10 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none shadow-sm"
              value={selectedPersonId}
              onChange={(e) => selectPerson(e.target.value)}
            >
              <option value="all">👥 Tutte le persone</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  👤 {person.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Card Persona Selezionata */}
      <NavLink to="/settings" className="block cursor-pointer group" aria-label="Vai alle impostazioni">
        <div className="flex items-center p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600">
          {selectedPersonId === "all" ? (
            <>
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <UserGroupIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3 flex-1">
                <p className="font-semibold text-gray-800 dark:text-white">Tutte le persone</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {people.length} {people.length === 1 ? "persona" : "persone"} configurate
                </p>
              </div>
            </>
          ) : selectedPerson ? (
            <>
              <img
                src={selectedPerson.avatar || defaultAvatar}
                alt={selectedPerson.name}
                className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-600"
              />
              <div className="ml-3 flex-1">
                <p className="font-semibold text-gray-800 dark:text-white">{selectedPerson.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Vai alle impostazioni</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-gray-500 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="font-semibold text-gray-800 dark:text-white">Nessuna persona</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Configura le persone</p>
              </div>
            </>
          )}

          {/* Icona freccia */}
          <div className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </NavLink>
    </div>
  );
};

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 w-64 min-h-screen p-4">
      <PersonSelector />

      <div className="space-y-2">
        <NavItem to="/">
          <HomeIcon className="w-5 h-5 mr-3" />
          Home
        </NavItem>

        <NavItem to="/transactions">
          <TransactionIcon className="w-5 h-5 mr-3" />
          Transazioni
        </NavItem>

        <NavItem to="/investments">
          <InvestmentIcon className="w-5 h-5 mr-3" />
          Investimenti
        </NavItem>

        <NavItem to="/reports">
          <ChartBarIcon className="w-5 h-5 mr-3" />
          Report
        </NavItem>

        <NavItem to="/settings">
          <SettingsIcon className="w-5 h-5 mr-3" />
          Impostazioni
        </NavItem>
      </div>

      {user && (
        <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user.emailAddress}</p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full text-left p-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Esci
          </button>
        </div>
      )}
    </nav>
  );
};
