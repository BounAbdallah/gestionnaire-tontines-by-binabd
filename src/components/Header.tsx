"use client"

import type React from "react"

type ViewType = "dashboard" | "tontines" | "reports" | "logs"

interface HeaderProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
  onLogout: () => void
}

interface NavItem {
  id: ViewType
  label: string
}

const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, onLogout }) => {
  const navItems: NavItem[] = [
    { id: "dashboard", label: "Tableau de bord" },
    { id: "tontines", label: "Tontines" },
    { id: "reports", label: "Rapports" },
    { id: "logs", label: "Activité" },
  ]

  return (
    <header className="bg-bleu-nuit text-white shadow-lg">
      <div className="w-full px-4 lg:px-8 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-center sm:text-left">Gestion des Tontines</h1>
            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">By bin_abd 😇</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                    currentView === item.id
                      ? "bg-bleu-ciel text-white"
                      : "bg-gray-700 hover:bg-bleu-ciel hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              onClick={onLogout}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
