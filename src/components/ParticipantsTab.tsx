"use client"

import type React from "react"
import { useState } from "react"
import { db } from "../../lib/database"
import type { Tontine, ParticipantFormData } from "../types"

interface ParticipantsTabProps {
  tontine: Tontine
  onRefresh: () => void
}

const ParticipantsTab: React.FC<ParticipantsTabProps> = ({ tontine, onRefresh }) => {
  const [participantForm, setParticipantForm] = useState<ParticipantFormData>({
    prenom: "",
    nom: "",
    parts: 1,
  })
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  const getParticipantMonth = (tontine: Tontine, participantId: string): string | number => {
    if (!tontine.participantOrder) return "Non défini"
    const index = tontine.participantOrder.indexOf(participantId)
    return index !== -1 ? index + 1 : "Non défini"
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value, type } = e.target
    setParticipantForm({
      ...participantForm,
      [name]: type === "number" ? Number(value) : value,
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()

    if (tontine.participants.length >= tontine.nombreParticipants) {
      alert("Nombre maximum de participants atteint")
      return
    }

    setIsLoading(true)

    try {
      const newParticipant = {
        id: generateId(),
        ...participantForm,
        dateAjout: new Date().toISOString(),
      }

      await db.createParticipant({
        ...newParticipant,
        tontineId: tontine.id,
      })

      setParticipantForm({
        prenom: "",
        nom: "",
        parts: 1,
      })

      onRefresh()
    } catch (error) {
      console.error("Erreur lors de l'ajout du participant:", error)
      alert("Erreur lors de l'ajout du participant")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async (participantId: string): Promise<void> => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce participant ?")) {
      setIsLoading(true)

      try {
        await db.deleteParticipant(participantId, tontine.id)
        onRefresh()
      } catch (error) {
        console.error("Erreur lors de la suppression:", error)
        alert("Erreur lors de la suppression du participant")
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Add Participant Form */}
      {tontine.participants.length < tontine.nombreParticipants ? (
        <div className="bg-slate-50 p-3 sm:p-4 rounded-lg">
          <h4 className="text-base sm:text-lg font-semibold text-bleu-nuit mb-3 sm:mb-4">Ajouter un Participant</h4>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Prénom</label>
              <input
                name="prenom"
                type="text"
                required
                value={participantForm.prenom}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-bleu-ciel focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nom</label>
              <input
                name="nom"
                type="text"
                required
                value={participantForm.nom}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-bleu-ciel focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nombre de Parts</label>
              <input
                name="parts"
                type="number"
                min="1"
                required
                value={participantForm.parts}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-bleu-ciel focus:border-transparent text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-3 sm:px-4 py-2 bg-bleu-ciel hover:bg-bleu-nuit text-white rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                {isLoading ? "Ajout..." : "Ajouter"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <p className="text-yellow-800 text-sm">
            <strong>Limite atteinte:</strong> Vous avez atteint le nombre maximum de participants (
            {tontine.nombreParticipants}) pour cette tontine.
          </p>
        </div>
      )}

      {/* Participants List */}
      <div>
        <h4 className="text-base sm:text-lg font-semibold text-bleu-nuit mb-3 sm:mb-4">
          Liste des Participants ({tontine.participants.length}/{tontine.nombreParticipants})
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-2 sm:px-4 font-semibold text-slate-700 text-sm">Participant</th>
                <th className="text-left py-3 px-2 sm:px-4 font-semibold text-slate-700 text-sm">Parts</th>
                <th className="text-left py-3 px-2 sm:px-4 font-semibold text-slate-700 text-sm">Montant</th>
                <th className="text-left py-3 px-2 sm:px-4 font-semibold text-slate-700 text-sm">Mois de Réception</th>
                <th className="text-left py-3 px-2 sm:px-4 font-semibold text-slate-700 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tontine.participants.map((participant) => (
                <tr key={participant.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-2 sm:px-4">
                    <div className="font-medium text-slate-800 text-sm">
                      {participant.prenom} {participant.nom}
                    </div>
                  </td>
                  <td className="py-3 px-2 sm:px-4 text-slate-700 text-sm">{participant.parts}</td>
                  <td className="py-3 px-2 sm:px-4 text-slate-700 text-sm">
                    {(tontine.montant * participant.parts).toLocaleString()} FC
                  </td>
                  <td className="py-3 px-2 sm:px-4 text-slate-700 text-sm">
                    <span className="bg-bleu-ciel text-white px-2 py-1 rounded-full text-xs">
                      Mois {getParticipantMonth(tontine, participant.id)}
                    </span>
                  </td>
                  <td className="py-3 px-2 sm:px-4">
                    <button
                      onClick={() => handleRemove(participant.id)}
                      disabled={isLoading}
                      className="px-2 sm:px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      Supprimer
                    </button>
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

export default ParticipantsTab
