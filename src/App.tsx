
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { db } from "../lib/database"
import LoginScreen from "./components/LoginScreen"
import Header from "./components/Header"
import Dashboard from "./components/Dashboard"
import TontinesView from "./components/TontinesView"
import ReportsView from "./components/ReportsView"
import ActivityLogs from "./components/ActivityLogs"
import TontineModal from "./components/TontineModal"
import LoadingSpinner from "./components/LoadingSpinner"
import type { User, Tontine, Statistics, ActivityLog, LoginCredentials, LoginResult } from "./types"

type ViewType = "dashboard" | "tontines" | "reports" | "logs"

const App: React.FC = () => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

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

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = (): void => {
      const auth = localStorage.getItem("tontine-auth")
      const user = localStorage.getItem("tontine-user")

      if (auth === "true" && user) {
        setIsAuthenticated(true)
        setCurrentUser(JSON.parse(user))
        loadData()
      }
    }
    checkAuth()
  }, [])

  const loadData = async (): Promise<void> => {
    setIsLoading(true)

    try {
      // Load tontines
      const tontinesData = await db.getTontines()
      setTontines(tontinesData)

      // Load statistics
      const stats = await db.getStatistics()
      setStatistics(stats)

      // Load activity logs
      const logs = await db.getActivityLogs()
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

        await loadData()
        return { success: true }
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
  }

  const handleTontineSelect = (tontine: Tontine): void => {
    setSelectedTontine(tontine)
  }

  const handleTontineClose = (): void => {
    setSelectedTontine(null)
  }

  const refreshData = (): void => {
    loadData()
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} isLoading={isLoading} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <Header currentView={currentView} onViewChange={setCurrentView} onLogout={handleLogout} />

      {isLoading && <LoadingSpinner />}

      <main className="w-full px-4 lg:px-8 py-4 sm:py-8">
        {currentView === "dashboard" && (
          <Dashboard statistics={statistics} tontines={tontines} onTontineSelect={handleTontineSelect} />
        )}

        {currentView === "tontines" && (
          <TontinesView tontines={tontines} onTontineSelect={handleTontineSelect} onRefresh={refreshData} />
        )}

        {currentView === "reports" && <ReportsView tontines={tontines} />}

        {currentView === "logs" && <ActivityLogs logs={activityLogs} />}
      </main>

      {selectedTontine && (
        <TontineModal tontine={selectedTontine} onClose={handleTontineClose} onRefresh={refreshData} />
      )}
    </div>
  )
}

export default App
