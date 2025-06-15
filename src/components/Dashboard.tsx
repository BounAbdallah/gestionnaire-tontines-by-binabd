"use client"

import type React from "react"
import { formatDateShort, getProgressPercentage } from "../utils/dateUtils"
import type { Statistics, Tontine } from "../types"
import VisitorStatsComponent from "./VisitorStats"

interface DashboardProps {
  statistics: Statistics
  tontines: Tontine[]
  onTontineSelect: (tontine: Tontine) => void
}

interface StatCard {
  title: string
  value: string | number
  color: string
  textColor: string
}

const Dashboard: React.FC<DashboardProps> = ({ statistics, tontines, onTontineSelect }) => {
  const statCards: StatCard[] = [
    {
      title: "Total Tontines",
      value: statistics.totalTontines,
      color: "border-bleu-ciel",
      textColor: "text-bleu-ciel",
    },
    {
      title: "Participants Actifs",
      value: statistics.totalParticipants,
      color: "border-bleu-nuit",
      textColor: "text-bleu-nuit",
    },
    {
      title: "Tontines Actives",
      value: statistics.tontinesActives,
      color: "border-green-500",
      textColor: "text-green-600",
    },
    {
      title: "Montant Total",
      value: `${statistics.totalMontant.toLocaleString()} FC`,
      color: "border-gray-400",
      textColor: "text-gray-600",
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className={`bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 ${stat.color}`}>
            <h3 className="text-base sm:text-lg font-semibold text-bleu-nuit mb-2">{stat.title}</h3>
            <p className={`text-2xl sm:text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Visitor Statistics - Only for Super Admin */}
      {statistics.totalUtilisateurs !== undefined && <VisitorStatsComponent currentUser={{ role: "super_admin" }} />}

      {/* Database Status */}
      {/* <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold text-bleu-nuit mb-4 flex items-center gap-2">
          🗄️ État de la Base de Données
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-800">SQLite Connecté</span>
            </div>
            <p className="text-xs text-green-600 mt-1">Base de données opérationnelle</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-800">Tables Créées</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">Structure initialisée</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm font-medium text-purple-800">Logs Actifs</span>
            </div>
            <p className="text-xs text-purple-600 mt-1">Traçabilité complète</p>
          </div>
        </div>
      </div> */}

      {/* Active Tontines */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold text-bleu-nuit mb-4">Tontines Actives</h3>
        <div className="space-y-3 sm:space-y-4">
          {tontines.map((tontine) => (
            <div
              key={tontine.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-slate-50 rounded-lg"
            >
              <div className="flex-1">
                <h4 className="font-semibold text-slate-800 text-sm sm:text-base">{tontine.nom}</h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  {tontine.nombreParticipants} participants - {tontine.montant.toLocaleString()} FC/mois
                </p>
                <p className="text-xs sm:text-sm text-slate-600">
                  Durée: {tontine.duree} mois - Du {formatDateShort(tontine.dateDebut)} au{" "}
                  {formatDateShort(tontine.dateFin)}
                </p>
                <div className="flex items-center mt-2">
                  <div className="w-24 sm:w-32 bg-gray-200 rounded-full h-2 mr-2">
                    <div
                      className="bg-bleu-ciel h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage(tontine)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-slate-600">{getProgressPercentage(tontine)}%</span>
                </div>
              </div>
              <button
                onClick={() => onTontineSelect(tontine)}
                className="px-3 sm:px-4 py-2 bg-bleu-ciel hover:bg-bleu-nuit text-white rounded-lg transition-colors text-sm w-full sm:w-auto"
              >
                Gérer
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
