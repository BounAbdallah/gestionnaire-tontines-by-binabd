"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { db } from "../../lib/database"
import { addMonths } from "../utils/dateUtils"
import type { Tontine, TontineFormData, User } from "../types"

interface TontineFormProps {
  editingTontine: Tontine | null
  onSuccess: () => void
  onCancel: () => void
  currentUser: User
}

const TontineForm: React.FC<TontineFormProps> = ({ editingTontine, onSuccess, onCancel, currentUser }) => {
  const [formData, setFormData] = useState<TontineFormData>({
    nom: "",
    montant: 0,
    nombreParticipants: 0,
    duree: 0,
    description: "",
    dateDebut: "",
    dateFin: "",
  })
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    if (editingTontine) {
      setFormData({
        nom: editingTontine.nom,
        montant: editingTontine.montant,
        nombreParticipants: editingTontine.nombreParticipants,
        duree: editingTontine.duree,
        description: editingTontine.description,
        dateDebut: editingTontine.dateDebut,
        dateFin: editingTontine.dateFin,
      })
    } else {
      setFormData({
        nom: "",
        montant: 0,
        nombreParticipants: 0,
        duree: 0,
        description: "",
        dateDebut: "",
        dateFin: "",
      })
    }
  }, [editingTontine])

  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  const updateDateFin = (dateDebut: string, duree: number): string => {
    if (dateDebut && duree) {
      const startDate = new Date(dateDebut)
      const endDate = addMonths(startDate, duree)
      return endDate.toISOString().split("T")[0]
    }
    return ""
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value, type } = e.target
    const newValue = type === "number" ? Number(value) : value

    const newFormData = {
      ...formData,
      [name]: newValue,
    }

    // Auto-calculate end date
    if (name === "dateDebut" || name === "duree") {
      newFormData.dateFin = updateDateFin(
        name === "dateDebut" ? (newValue as string) : formData.dateDebut,
        name === "duree" ? (newValue as number) : formData.duree,
      )
    }

    setFormData(newFormData)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (editingTontine) {
        await db.updateTontine(editingTontine.id, formData, currentUser.id)
      } else {
        const newTontine: Tontine = {
          id: generateId(),
          proprietaire_id: currentUser.id,
          ...formData,
          participants: [],
          dateCreation: new Date().toISOString(),
          monthlyPayments: {},
          participantOrder: [],
        }
        await db.createTontine(newTontine, currentUser.id)
      }

      onSuccess()
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de la sauvegarde de la tontine")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-semibold text-bleu-nuit mb-4">
        {editingTontine ? "Modifier la Tontine" : "Créer une Nouvelle Tontine"}
      </h3>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Nom de la Tontine</label>
          <input
            name="nom"
            type="text"
            required
            value={formData.nom}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-bleu-ciel focus:border-transparent text-sm"
            placeholder="Ex: Tontine Janvier 2024"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Montant Mensuel (FC)</label>
          <input
            name="montant"
            type="number"
            required
            min="1000"
            value={formData.montant}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-bleu-ciel focus:border-transparent text-sm"
            placeholder="25000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Nombre de Participants</label>
          <input
            name="nombreParticipants"
            type="number"
            min="2"
            max="20"
            required
            value={formData.nombreParticipants}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-bleu-ciel focus:border-transparent text-sm"
            placeholder="5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Durée (mois)</label>
          <input
            name="duree"
            type="number"
            min="1"
            max="24"
            required
            value={formData.duree}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-bleu-ciel focus:border-transparent text-sm"
            placeholder="12"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Date de début</label>
          <input
            name="dateDebut"
            type="date"
            required
            value={formData.dateDebut}
            onChange={handleChange}
            min={new Date().toISOString().split("T")[0]}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-bleu-ciel focus:border-transparent text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Date de fin (calculée automatiquement)
          </label>
          <input
            name="dateFin"
            type="date"
            readOnly
            value={formData.dateFin}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-gray-100 text-sm"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-bleu-ciel focus:border-transparent text-sm"
            rows={3}
            placeholder="Description de la tontine..."
          />
        </div>

        <div className="md:col-span-2 flex flex-col sm:flex-row gap-2 sm:gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 sm:px-6 py-2 bg-bleu-ciel hover:bg-bleu-nuit text-white rounded-lg transition-colors text-sm disabled:opacity-50"
          >
            {isLoading ? "Sauvegarde..." : editingTontine ? "Mettre à jour" : "Créer"}
          </button>

          {editingTontine && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 sm:px-6 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm"
            >
              Annuler
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default TontineForm
