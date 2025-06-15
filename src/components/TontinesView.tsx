"use client"

import type React from "react"
import { useState } from "react"
import { db } from "../../lib/database"
import { formatDateShort } from "../utils/dateUtils"
import TontineForm from "./TontineForm"
import type { Tontine, TontineStatus, User } from "../types"

interface TontinesViewProps {
  tontines: Tontine[]
  onTontineSelect: (tontine: Tontine) => void
  onRefresh: () => void
  currentUser: User
}

const TontinesView: React.FC<TontinesViewProps> = ({ tontines, onTontineSelect, onRefresh, currentUser }) => {
  const [editingTontine, setEditingTontine] = useState<Tontine | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

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
      setIsLoading(true)
      try {
        await db.deleteTontine(id, currentUser.id)
        onRefresh()
      } catch (error) {
        console.error("Erreur lors de la suppression:", error)
        alert("Erreur lors de la suppression de la tontine")
      } finally {
        setIsLoading(false)
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

  const canCreateTontine = (): boolean => {
    return currentUser.tontines_creees < currentUser.limite_tontines
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* User Limits Info */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-bleu-nuit">Mes Tontines</h3>
            <p className="text-sm text-slate-600">
              Vous avez créé <strong>{currentUser.tontines_creees}</strong> tontine(s) sur{" "}
              <strong>{currentUser.limite_tontines}</strong> autorisée(s)
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-slate-700">Limite de tontines</div>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-bleu-ciel h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min((currentUser.tontines_creees / currentUser.limite_tontines) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
                <span className="text-xs text-slate-600">
                  {Math.round((currentUser.tontines_creees / currentUser.limite_tontines) * 100)}%
                </span>
              </div>
            </div>

            {!canCreateTontine() && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                <p className="text-red-800 text-sm">
                  <strong>Limite atteinte !</strong>
                  <br />
                  Contactez un administrateur pour augmenter votre limite.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Tontine Form */}
      {canCreateTontine() || editingTontine ? (
        <TontineForm
          editingTontine={editingTontine}
          onSuccess={handleFormSuccess}
          onCancel={handleCancelEdit}
          currentUser={currentUser}
        />
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <h4 className="font-semibold text-yellow-800">Limite de tontines atteinte</h4>
              <p className="text-yellow-700 text-sm">
                Vous avez atteint votre limite de {currentUser.limite_tontines} tontine(s). Contactez un administrateur
                pour demander une augmentation de votre limite.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tontines List */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold text-bleu-nuit mb-4">Liste des Tontines</h3>

        {tontines.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-slate-500">Vous n'avez pas encore créé de tontine</p>
            {canCreateTontine() && (
              <p className="text-slate-400 text-sm mt-2">
                Utilisez le formulaire ci-dessus pour créer votre première tontine
              </p>
            )}
          </div>
        ) : (
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
                          disabled={isLoading}
                          className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors disabled:opacity-50"
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
        )}
      </div>
    </div>
  )
}

export default TontinesView
