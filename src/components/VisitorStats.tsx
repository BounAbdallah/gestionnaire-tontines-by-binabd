"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { db } from "../../lib/database"
import { formatDate } from "../utils/dateUtils"
import type { Visitor, VisitorStats } from "../types"

interface User {
  role: string
  // Ajoutez d'autres propriétés si nécessaire
}

interface VisitorStatsProps {
  currentUser: User
}

const VisitorStatsComponent: React.FC<VisitorStatsProps> = ({ currentUser }) => {
  const [stats, setStats] = useState<VisitorStats>({
    totalVisiteurs: 0,
    visiteursAujourdhui: 0,
    visiteursCetteSemaine: 0,
    visiteursConnectes: 0,
    visiteursAnonymes: 0,
  })
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showDetails, setShowDetails] = useState<boolean>(false)

  useEffect(() => {
    loadVisitorData()
  }, [])

  const loadVisitorData = async (): Promise<void> => {
    setIsLoading(true)
    try {
      const [statsData, visitorsData] = await Promise.all([db.getVisitorStats(), db.getVisitors(50)])
      setStats(statsData)
      setVisitors(visitorsData)
    } catch (error) {
      console.error("Erreur lors du chargement des données visiteurs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getVisitorTypeIcon = (statut: string): string => {
    return statut === "connecte" ? "👤" : "👻"
  }

  const getVisitorTypeText = (statut: string): string => {
    return statut === "connecte" ? "Connecté" : "Anonyme"
  }

  const getVisitorTypeBadge = (statut: string): string => {
    return statut === "connecte" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
  }

  const getRelativeTime = (dateString: string): string => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "À l'instant"
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`
    return `Il y a ${Math.floor(diffInSeconds / 86400)} j`
  }

  // Seuls les superadmins peuvent voir les statistiques des visiteurs
  if (currentUser?.role !== "super_admin") {
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg sm:text-xl font-semibold text-bleu-nuit flex items-center gap-2">
          📊 Statistiques des Visiteurs
        </h3>
        <div className="flex gap-2">
          <button
            onClick={loadVisitorData}
            disabled={isLoading}
            className="px-3 py-2 bg-bleu-ciel hover:bg-bleu-nuit text-white rounded-lg transition-colors text-sm disabled:opacity-50"
          >
            {isLoading ? "🔄" : "🔄"} Actualiser
          </button>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
          >
            {showDetails ? "📊 Stats" : "📋 Détails"}
          </button>
        </div>
      </div>

      {!showDetails ? (
        // Vue des statistiques
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalVisiteurs}</div>
            <div className="text-sm text-blue-800">Total Visiteurs</div>
          </div>

          <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{stats.visiteursAujourdhui}</div>
            <div className="text-sm text-green-800">Aujourd'hui</div>
          </div>

          <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.visiteursCetteSemaine}</div>
            <div className="text-sm text-purple-800">Cette Semaine</div>
          </div>

          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.visiteursConnectes}</div>
            <div className="text-sm text-orange-800">Connectés</div>
          </div>

          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.visiteursAnonymes}</div>
            <div className="text-sm text-gray-800">Anonymes</div>
          </div>
        </div>
      ) : (
        // Vue des détails des visiteurs
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">Derniers {visitors.length} visiteurs</div>

          <div className="max-h-96 overflow-y-auto space-y-3">
            {visitors.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">👻</div>
                <p className="text-slate-500">Aucun visiteur enregistré</p>
              </div>
            ) : (
              visitors.map((visitor) => (
                <div
                  key={visitor.id}
                  className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    <span className="text-lg">{getVisitorTypeIcon(visitor.statut_visite)}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getVisitorTypeBadge(visitor.statut_visite)}`}
                        >
                          {getVisitorTypeText(visitor.statut_visite)}
                        </span>
                        <span className="text-xs text-slate-500">{getRelativeTime(visitor.date_visite)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                      <div>🌐 IP: {visitor.adresse_ip || "Non disponible"}</div>
                      <div>📱 Page: {visitor.page_visitee || "/"}</div>
                      <div className="sm:col-span-2">
                        🖥️ Navigateur:{" "}
                        {visitor.user_agent ? visitor.user_agent.substring(0, 50) + "..." : "Non disponible"}
                      </div>
                      <div>🕒 {formatDate(visitor.date_visite)}</div>
                      {visitor.utilisateur_id && <div>👤 User ID: {visitor.utilisateur_id}</div>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default VisitorStatsComponent
