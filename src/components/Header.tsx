"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { User } from "../types"

type ViewType = "dashboard" | "tontines" | "reports" | "logs" | "users"

interface HeaderProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
  onLogout: () => void
  currentUser: User | null
  canAccessUserManagement: boolean
}

interface NavItem {
  id: ViewType
  label: string
  icon: string
  requiresSuperAdmin?: boolean
  badge?: number
}

const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onLogout,
  currentUser,
  canAccessUserManagement,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Gestion du scroll pour l'effet sticky
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Fermer les menus quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = () => {
      setShowUserMenu(false)
      setIsMobileMenuOpen(false)
    }
    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])

  const navItems: NavItem[] = [
    { id: "dashboard", label: "Tableau de bord", icon: "🏠" },
    { id: "tontines", label: "Mes Tontines", icon: "💰" },
    { id: "reports", label: "Rapports", icon: "📊" },
    { id: "logs", label: "Activité", icon: "📝" },
    { id: "users", label: "Utilisateurs", icon: "👥", requiresSuperAdmin: true },
  ]

  const filteredNavItems = navItems.filter((item) => !item.requiresSuperAdmin || canAccessUserManagement)

  const getRoleDisplay = (role: string): string => {
    const roles: Record<string, string> = {
      super_admin: "Super Admin",
      admin: "Administrateur",
      user: "Utilisateur",
    }
    return roles[role] || role
  }

  const getRoleBadgeColor = (role: string): string => {
    const colors: Record<string, string> = {
      super_admin: "from-purple-500 to-purple-600",
      admin: "from-blue-500 to-blue-600",
      user: "from-green-500 to-green-600",
    }
    return colors[role] || "from-gray-500 to-gray-600"
  }

  const getViewTitle = (view: ViewType): string => {
    const titles: Record<ViewType, string> = {
      dashboard: "Tableau de bord",
      tontines: "Gestion des Tontines",
      reports: "Rapports et Analyses",
      logs: "Journal d'Activité",
      users: "Gestion des Utilisateurs",
    }
    return titles[view]
  }

  const getUserInitials = (user: User): string => {
    return `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase()
  }

  const toggleMobileMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const toggleUserMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowUserMenu(!showUserMenu)
  }

  const handleNavClick = (view: ViewType) => {
    onViewChange(view)
    setIsMobileMenuOpen(false)
  }

  const handleLogout = () => {
    setShowUserMenu(false)
    onLogout()
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-bleu-nuit/95 backdrop-blur-md shadow-xl border-b border-white/10"
            : "bg-gradient-to-r from-bleu-nuit via-bleu-nuit to-blue-900 shadow-lg"
        }`}
      >
        <div className="w-full px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo et Titre */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-bleu-ciel to-blue-400 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-xl lg:text-2xl">💰</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg lg:text-xl font-bold text-white">Gestion des Tontines</h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs bg-gradient-to-r from-green-400 to-emerald-500 text-white px-2 py-0.5 rounded-full font-medium">
                      By Bin Abdallah ✨
                    </span>
                    <span className="text-xs text-blue-200">v1.0</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Desktop */}
            <nav className="hidden lg:flex items-center gap-2">
              {filteredNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm group ${
                    currentView === item.id
                      ? "bg-gradient-to-r from-bleu-ciel to-blue-400 text-white shadow-lg scale-105"
                      : "text-blue-100 hover:bg-white/10 hover:text-white hover:scale-105"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.id === "users" && canAccessUserManagement && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900 text-xs px-1.5 py-0.5 rounded-full font-bold">
                      Admin
                    </span>
                  )}
                  {currentView === item.id && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
                  )}
                </button>
              ))}
            </nav>

            {/* Actions Desktop */}
            <div className="hidden lg:flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                <span className="text-xl">🔔</span>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-400 to-red-500 rounded-full animate-pulse"></div>
              </button>

              {/* User Menu */}
              {currentUser && (
                <div className="relative">
                  <button
                    onClick={toggleUserMenu}
                    className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-xl transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 bg-gradient-to-br ${getRoleBadgeColor(currentUser.role)} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg`}
                      >
                        {getUserInitials(currentUser)}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium text-white">
                          {currentUser.prenom} {currentUser.nom}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${getRoleBadgeColor(currentUser.role)}`}
                          >
                            {getRoleDisplay(currentUser.role)}
                          </span>
                          {currentUser.role === "user" && (
                            <span className="text-xs text-blue-200">
                              {currentUser.tontines_creees}/{currentUser.limite_tontines}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-blue-200 transition-transform duration-200 ${showUserMenu ? "rotate-180" : ""}`}
                    >
                      ▼
                    </span>
                  </button>

                  {/* Dropdown User Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 animate-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="font-medium text-gray-900">
                          {currentUser.prenom} {currentUser.nom}
                        </div>
                        <div className="text-sm text-gray-500">{currentUser.email}</div>
                      </div>
                      <div className="py-2">
                        {/* <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                          <span>👤</span>
                          <span>Mon Profil</span>
                        </button>
                        <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                          <span>⚙️</span>
                          <span>Paramètres</span>
                        </button> */}
                        {/* <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                          <span>🌙</span>
                          <span>Mode Sombre</span>
                        </button> */}
                      </div>
                      <div className="border-t border-gray-100 py-2">
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-3 font-medium"
                        >
                          <span>🚪</span>
                          <span>Déconnexion</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bouton Menu Mobile */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200"
            >
              <div className="flex flex-col gap-1">
                <span
                  className={`w-5 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? "rotate-45 translate-y-1.5" : ""}`}
                ></span>
                <span
                  className={`w-5 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? "opacity-0" : ""}`}
                ></span>
                <span
                  className={`w-5 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""}`}
                ></span>
              </div>
            </button>
          </div>

          {/* Menu Mobile */}
          <div
            className={`lg:hidden overflow-hidden transition-all duration-300 ${isMobileMenuOpen ? "max-h-screen pb-4" : "max-h-0"}`}
          >
            <div className="border-t border-white/10 pt-4">
              {/* User Info Mobile */}
              {currentUser && (
                <div className="bg-white/5 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${getRoleBadgeColor(currentUser.role)} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}
                    >
                      {getUserInitials(currentUser)}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">
                        {currentUser.prenom} {currentUser.nom}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${getRoleBadgeColor(currentUser.role)}`}
                        >
                          {getRoleDisplay(currentUser.role)}
                        </span>
                        {currentUser.role === "user" && (
                          <span className="text-xs text-blue-200">
                            {currentUser.tontines_creees}/{currentUser.limite_tontines} tontines
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Mobile */}
              <nav className="grid grid-cols-2 gap-3 mb-4">
                {filteredNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 ${
                      currentView === item.id
                        ? "bg-gradient-to-r from-bleu-ciel to-blue-400 text-white shadow-lg"
                        : "bg-white/5 text-blue-100 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-sm font-medium text-center">{item.label}</span>
                    {item.id === "users" && canAccessUserManagement && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900 text-xs px-1.5 py-0.5 rounded-full font-bold">
                        Admin
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              {/* Actions Mobile */}
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-200 text-blue-100 hover:text-white">
                  <span>🔔</span>
                  <span className="text-sm">Notifications</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 p-3 bg-red-500/20 hover:bg-red-500/30 rounded-xl transition-all duration-200 text-red-200 hover:text-white"
                >
                  <span>🚪</span>
                  <span className="text-sm">Déconnexion</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="fixed top-16 lg:top-20 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="w-full px-4 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">🏠</span>
            <span className="text-gray-500">Accueil</span>
            <span className="text-gray-400">›</span>
            <span className="text-bleu-nuit font-medium">{getViewTitle(currentView)}</span>
          </div>
        </div>
      </div>

      {/* Spacer pour compenser le header fixe */}
      <div className="h-16 lg:h-20"></div>
      <div className="h-12"></div>
    </>
  )
}

export default Header
