"use client"

import type React from "react"
import { useState } from "react"
import { db } from "../../lib/database"
import { formatDateShort } from "../utils/dateUtils"
import TontineForm from "./TontineForm"
import type { Tontine, TontineStatus } from "../types"

interface TontinesViewProps {
  tontines: Tontine[]
  onTontineSelect: (tontine: Tontine) => void
  onRefresh: () => void
}

const TontinesView: React.FC<TontinesViewProps> = ({ tontines, onTontineSelect, onRefresh }) => {
  const [editingTontine, setEditingTontine] = useState<Tontine | null>(null)

  const getTontineStatus = (tontine: Tontine): TontineStatus => {
    if (!tontine.dateDebut || tontine.participants.length === 0) return "En attente"

    const startDate = new Date(tontine.dateDebut)
    const currentDate = new Date()
    const endDate = new Date(tontine.dateFin)

    if (currentDate < startDate) return "À venir"
    if (currentDate > endDate) return "Terminée"
    return "Active"
  }

  const getTontineStatusClass = (tontine: Tontine): string => {
    const status = getTontineStatus(tontine)
    const classes: Record<TontineStatus, string> = {
      "En attente": "px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full",
      "À venir": "px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full",
      Active: "px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full",
      Terminée: "px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full",
    }
    return classes[status]
  }

  const handleEdit = (tontine: Tontine): void => {
    setEditingTontine(tontine)
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette tontine ?")) {
      try {
        await db.deleteTontine(id)
        onRefresh()
      } catch (error) {
        console.error("Erreur lors de la suppression:", error)
        alert("Erreur lors de la suppression de la tontine")
      }
    }
  }

  const handleFormSuccess = (): void => {
    setEditingTontine(null)
    onRefresh()
  }

  const handleCancelEdit = (): void => {
    setEditingTontine(null)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Create/Edit Tontine Form */}
      <TontineForm editingTontine={editingTontine} onSuccess={handleFormSuccess} onCancel={handleCancelEdit} />

      {/* Tontines List */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold text-bleu-nuit mb-4">Liste des Tontines</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-2 sm:px-4 font-semibold text-slate-700 text-sm">Nom</th>
                <th className="text-left py-3 px-2 sm:px-4 font-semibold text-slate-700 text-sm">Montant</th>
                <th className="text-left py-3 px-2 sm:px-4 font-semibold text-slate-700 text-sm">Participants</th>
                <th className="text-left py-3 px-2 sm:px-4 font-semibold text-slate-700 text-sm">Durée</th>
                <th className="text-left py-3 px-2 sm:px-4 font-semibold text-slate-700 text-sm">Période</th>
                <th className="text-left py-3 px-2 sm:px-4 font-semibold text-slate-700 text-sm">Statut</th>
                <th className="text-left py-3 px-2 sm:px-4 font-semibold text-slate-700 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tontines.map((tontine) => (
                <tr key={tontine.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-2 sm:px-4">
                    <div>
                      <div className="font-medium text-slate-800 text-sm">{tontine.nom}</div>
                      <div className="text-xs text-slate-600 hidden sm:block">{tontine.description}</div>
                    </div>
                  </td>
                  <td className="py-3 px-2 sm:px-4 text-slate-700 text-sm">{tontine.montant.toLocaleString()} FC</td>
                  <td className="py-3 px-2 sm:px-4 text-slate-700 text-sm">
                    {tontine.participants.length}/{tontine.nombreParticipants}
                  </td>
                  <td className="py-3 px-2 sm:px-4 text-slate-700 text-sm">{tontine.duree} mois</td>
                  <td className="py-3 px-2 sm:px-4 text-slate-700 text-xs">
                    {formatDateShort(tontine.dateDebut)} - {formatDateShort(tontine.dateFin)}
                  </td>
                  <td className="py-3 px-2 sm:px-4">
                    <span className={getTontineStatusClass(tontine)}>{getTontineStatus(tontine)}</span>
                  </td>
                  <td className="py-3 px-2 sm:px-4">
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                      <button
                        onClick={() => onTontineSelect(tontine)}
                        className="px-2 py-1 bg-bleu-ciel hover:bg-bleu-nuit text-white text-xs rounded transition-colors"
                      >
                        Gérer
                      </button>
                      <button
                        onClick={() => handleEdit(tontine)}
                        className="px-2 py-1 bg-bleu-nuit hover:bg-bleu-ciel text-white text-xs rounded transition-colors"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(tontine.id)}
                        className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default TontinesView
