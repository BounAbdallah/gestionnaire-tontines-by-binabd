"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { db } from "../lib/database"
import LoginScreen from "./components/LoginScreen"
import RegistrationScreen from "./components/RegistrationScreen"
import Header from "./components/Header"
import Dashboard from "./components/Dashboard"
import TontinesView from "./components/TontinesView"
import ReportsView from "./components/ReportsView"
import ActivityLogs from "./components/ActivityLogs"
import UserManagement from "./components/UserManagement"
import TontineModal from "./components/TontineModal"
import LoadingSpinner from "./components/LoadingSpinner"
import type { User, Tontine, Statistics, ActivityLog, LoginCredentials, LoginResult, RegistrationData } from "./types"

type ViewType = "dashboard" | "tontines" | "reports" | "logs" | "users"
type AuthMode = "login" | "register"

const App: React.FC = () => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [authMode, setAuthMode] = useState<AuthMode>("login")

  // Main app state
  const [currentView, setCurrentView] = useState<ViewType>("dashboard")
  const [tontines, setTontines] = useState<Tontine[]>([])
  const [statistics, setStatistics] = useState<Statistics>({
    totalTontines: 0,
    totalParticipants: 0,
    totalMontant: 0,
    tontinesActives: 0,
  })
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [selectedTontine, setSelectedTontine] = useState<Tontine | null>(null)

  // Enregistrer le visiteur au chargement de l'application
  useEffect(() => {
    const recordVisitor = async () => {
      try {
        await db.recordVisitor({
          page_visitee: window.location.pathname,
          statut_visite: "anonyme",
        })
      } catch (error) {
        console.error("Erreur lors de l'enregistrement du visiteur:", error)
      }
    }

    recordVisitor()
  }, [])

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async (): Promise<void> => {
      const auth = localStorage.getItem("tontine-auth")
      const user = localStorage.getItem("tontine-user")

      if (auth === "true" && user) {
        const userData = JSON.parse(user)
        setIsAuthenticated(true)
        setCurrentUser(userData)

        // Enregistrer la visite connectée
        await db.recordVisitor({
          page_visitee: window.location.pathname,
          utilisateur_id: userData.id,
          statut_visite: "connecte",
        })

        loadData(userData.id, userData.role === "super_admin")
      }
    }
    checkAuth()
  }, [])

  const loadData = async (userId?: number, isSuperAdmin = false): Promise<void> => {
    setIsLoading(true)

    try {
      // Load tontines - même pour le superadmin, on filtre par son userId
      const tontinesData = await db.getTontines(userId)
      setTontines(tontinesData)

      // Load statistics - même pour le superadmin, on filtre par son userId pour les tontines
      // mais on garde les stats globales pour les utilisateurs
      const stats = await db.getStatistics(isSuperAdmin ? undefined : userId)
      setStatistics(stats)

      // Load activity logs - filtrer par utilisateur si ce n'est pas un superadmin
      const logs = await db.getActivityLogs(20, isSuperAdmin ? undefined : userId)
      setActivityLogs(logs)
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (credentials: LoginCredentials): Promise<LoginResult> => {
    setIsLoading(true)

    try {
      const user = await db.authenticateUser(credentials.username, credentials.password)

      if (user) {
        setIsAuthenticated(true)
        setCurrentUser(user)
        localStorage.setItem("tontine-auth", "true")
        localStorage.setItem("tontine-user", JSON.stringify(user))

        await loadData(user.id, user.role === "super_admin")
        return { success: true, user }
      } else {
        return { success: false, error: "Nom d'utilisateur ou mot de passe incorrect" }
      }
    } catch (error) {
      console.error("Erreur de connexion:", error)
      return { success: false, error: "Erreur de connexion à la base de données" }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (data: RegistrationData): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)

    try {
      const result = await db.registerUser(data)
      return result
    } catch (error) {
      console.error("Erreur d'inscription:", error)
      return { success: false, error: "Erreur lors de l'inscription" }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = (): void => {
    setIsAuthenticated(false)
    setCurrentUser(null)
    localStorage.removeItem("tontine-auth")
    localStorage.removeItem("tontine-user")

    // Clear data
    setTontines([])
    setStatistics({ totalTontines: 0, totalParticipants: 0, totalMontant: 0, tontinesActives: 0 })
    setActivityLogs([])
    setSelectedTontine(null)
    setAuthMode("login")
  }

  const handleTontineSelect = (tontine: Tontine): void => {
    setSelectedTontine(tontine)
  }

  const handleTontineClose = (): void => {
    setSelectedTontine(null)
  }

  const refreshData = (): void => {
    if (currentUser) {
      loadData(currentUser.id, currentUser.role === "super_admin")
    }
  }

  const canAccessUserManagement = (): boolean => {
    return currentUser?.role === "super_admin"
  }

  // Authentication screens
  if (!isAuthenticated) {
    if (authMode === "register") {
      return (
        <RegistrationScreen
          onRegister={handleRegister}
          onBackToLogin={() => setAuthMode("login")}
          isLoading={isLoading}
        />
      )
    }

    return (
      <LoginScreen onLogin={handleLogin} onShowRegistration={() => setAuthMode("register")} isLoading={isLoading} />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={handleLogout}
        currentUser={currentUser}
        canAccessUserManagement={canAccessUserManagement()}
      />

      {isLoading && <LoadingSpinner />}

      <main className="w-full px-4 lg:px-8 py-4 sm:py-8">
        {currentView === "dashboard" && (
          <Dashboard statistics={statistics} tontines={tontines} onTontineSelect={handleTontineSelect} />
        )}

        {currentView === "tontines" && (
          <TontinesView
            tontines={tontines}
            onTontineSelect={handleTontineSelect}
            onRefresh={refreshData}
            currentUser={currentUser!}
          />
        )}

        {currentView === "reports" && <ReportsView tontines={tontines} currentUser={currentUser!} />}

        {currentView === "logs" && <ActivityLogs logs={activityLogs} onRefresh={refreshData} />}

        {currentView === "users" && canAccessUserManagement() && (
          <UserManagement currentUser={currentUser!} onRefresh={refreshData} />
        )}
      </main>

      {selectedTontine && (
        <TontineModal
          tontine={selectedTontine}
          onClose={handleTontineClose}
          onRefresh={refreshData}
          currentUser={currentUser!}
        />
      )}
    </div>
  )
}

export default App
