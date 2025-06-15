"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { formatDate } from "../utils/dateUtils"
import { db } from "../../lib/database"
import type { ActivityLog } from "../types"

interface ActivityLogsProps {
  logs: ActivityLog[]
  onRefresh?: () => void
}

type FilterType =
  | "all"
  | "creation_tontine"
  | "modification_tontine"
  | "suppression_tontine"
  | "ajout_participant"
  | "suppression_participant"
  | "modification_paiement"
  | "definition_beneficiaire"
  | "connexion"

const ActivityLogs: React.FC<ActivityLogsProps> = ({ logs: initialLogs, onRefresh }) => {
  const [logs, setLogs] = useState<ActivityLog[]>(initialLogs)
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>(initialLogs)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [filterType, setFilterType] = useState<FilterType>("all")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false)

  // Rafraîchissement automatique
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null

    if (autoRefresh) {
      interval = setInterval(async () => {
        await refreshLogs()
      }, 5000) // Rafraîchir toutes les 5 secondes
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  // Filtrage et recherche
  useEffect(() => {
    // Au chargement initial, s'assurer que les logs sont filtrés correctement
    const loadFilteredLogs = async () => {
      const user = localStorage.getItem("tontine-user")
      if (user) {
        const userData = JSON.parse(user)
        if (userData.role !== "super_admin") {
          // Recharger les logs filtrés pour les utilisateurs normaux
          const filteredLogs = await db.getActivityLogs(100, userData.id)
          setLogs(filteredLogs)
        }
      }
    }

    loadFilteredLogs()
  }, [])

  useEffect(() => {
    let filtered = logs

    // Filtrer par type d'action
    if (filterType !== "all") {
      filtered = filtered.filter((log) => log.action === filterType)
    }

    // Filtrer par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (log.username && log.username.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    setFilteredLogs(filtered)
  }, [logs, filterType, searchTerm])

  const refreshLogs = async (): Promise<void> => {
    setIsLoading(true)
    try {
      // Récupérer l'utilisateur actuel depuis le localStorage pour déterminer s'il faut filtrer
      const user = localStorage.getItem("tontine-user")
      let userId: number | undefined = undefined

      if (user) {
        const userData = JSON.parse(user)
        // Si ce n'est pas un superadmin, filtrer par userId
        if (userData.role !== "super_admin") {
          userId = userData.id
        }
      }

      const newLogs = await db.getActivityLogs(100, userId)
      setLogs(newLogs)
      onRefresh?.()
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des logs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearLogs = async (): Promise<void> => {
    if (window.confirm("Êtes-vous sûr de vouloir effacer tous les logs d'activité ?")) {
      try {
        localStorage.removeItem("activity-logs")
        setLogs([])
        onRefresh?.()
      } catch (error) {
        console.error("Erreur lors de la suppression des logs:", error)
      }
    }
  }

  const formatActionText = (action: string): string => {
    const actions: Record<string, string> = {
      creation_tontine: "Création de tontine",
      modification_tontine: "Modification de tontine",
      suppression_tontine: "Suppression de tontine",
      ajout_participant: "Ajout de participant",
      suppression_participant: "Suppression de participant",
      modification_paiement: "Modification de paiement",
      definition_beneficiaire: "Définition de bénéficiaire",
      connexion: "Connexion utilisateur",
    }
    return actions[action] || action
  }

  const getActionIcon = (action: string): string => {
    const icons: Record<string, string> = {
      creation_tontine: "➕",
      modification_tontine: "✏️",
      suppression_tontine: "🗑️",
      ajout_participant: "👤",
      suppression_participant: "👤",
      modification_paiement: "💰",
      definition_beneficiaire: "🏆",
      connexion: "🔐",
    }
    return icons[action] || "📝"
  }

  const getActionColor = (action: string): string => {
    const colors: Record<string, string> = {
      creation_tontine: "bg-green-100 text-green-800",
      modification_tontine: "bg-blue-100 text-blue-800",
      suppression_tontine: "bg-red-100 text-red-800",
      ajout_participant: "bg-purple-100 text-purple-800",
      suppression_participant: "bg-orange-100 text-orange-800",
      modification_paiement: "bg-yellow-100 text-yellow-800",
      definition_beneficiaire: "bg-indigo-100 text-indigo-800",
      connexion: "bg-gray-100 text-gray-800",
    }
    return colors[action] || "bg-slate-100 text-slate-800"
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        {/* Header avec contrôles */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-lg sm:text-xl font-semibold text-bleu-nuit flex items-center gap-2">
              📋 Journal d'Activité
            </h3>
            {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-bleu-ciel"></div>}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={refreshLogs}
              disabled={isLoading}
              className="px-3 py-2 bg-bleu-ciel hover:bg-bleu-nuit text-white rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              🔄 Actualiser
            </button>

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                autoRefresh
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
            >
              {autoRefresh ? "🔴 Auto" : "⚪ Auto"}
            </button>

            <button
              onClick={clearLogs}
              className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
            >
              🗑️ Effacer
            </button>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Rechercher</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher dans les logs..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-bleu-ciel focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Filtrer par type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-bleu-ciel focus:border-transparent text-sm"
            >
              <option value="all">Toutes les actions</option>
              <option value="creation_tontine">Création de tontine</option>
              <option value="modification_tontine">Modification de tontine</option>
              <option value="suppression_tontine">Suppression de tontine</option>
              <option value="ajout_participant">Ajout de participant</option>
              <option value="suppression_participant">Suppression de participant</option>
              <option value="modification_paiement">Modification de paiement</option>
              <option value="definition_beneficiaire">Définition de bénéficiaire</option>
              <option value="connexion">Connexion utilisateur</option>
            </select>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-slate-800">{logs.length}</div>
            <div className="text-xs text-slate-600">Total</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-slate-800">{filteredLogs.length}</div>
            <div className="text-xs text-slate-600">Filtrés</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-slate-800">
              {
                logs.filter((log) => {
                  const logDate = new Date(log.dateAction)
                  const today = new Date()
                  return logDate.toDateString() === today.toDateString()
                }).length
              }
            </div>
            <div className="text-xs text-slate-600">Aujourd'hui</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-slate-800">{autoRefresh ? "🟢" : "🔴"}</div>
            <div className="text-xs text-slate-600">Auto-refresh</div>
          </div>
        </div>

        {/* Liste des logs */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📋</div>
              <p className="text-slate-500">
                {searchTerm || filterType !== "all"
                  ? "Aucun log ne correspond aux critères de recherche"
                  : "Aucune activité enregistrée"}
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  <span className="text-lg">{getActionIcon(log.action)}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {formatActionText(log.action)}
                        </span>
                        <span className="text-xs text-slate-500">{getRelativeTime(log.dateAction)}</span>
                      </div>

                      <p className="text-sm text-slate-700 mb-2">{log.details}</p>

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>👤 {log.username || "Système"}</span>
                        {log.tontineId && <span>🏷️ ID: {log.tontineId.substring(0, 8)}...</span>}
                        <span>🕒 {formatDate(log.dateAction)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer avec informations */}
        {filteredLogs.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500">
              Affichage de {filteredLogs.length} log{filteredLogs.length > 1 ? "s" : ""} sur {logs.length} total
              {autoRefresh && " • Actualisation automatique activée"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityLogs
