"use client"

import type React from "react"
import { useState } from "react"
import { db } from "../../lib/database"
import { formatDate, addMonths } from "../utils/dateUtils"
import type { Tontine, MonthData, PaymentRatio, MonthStatus, Participant, User } from "../types"

interface MonthlyTabProps {
  tontine: Tontine
  onRefresh: () => void
  currentUser: User
}

const MonthlyTab: React.FC<MonthlyTabProps> = ({ tontine, onRefresh, currentUser }) => {
  const [selectedMonthDetail, setSelectedMonthDetail] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const getMonthsList = (tontine: Tontine): MonthData[] => {
    if (!tontine.dateDebut || tontine.duree === 0) return []

    const startDate = new Date(tontine.dateDebut)
    const months: MonthData[] = []

    for (let i = 0; i < tontine.duree; i++) {
      const monthDate = addMonths(startDate, i)
      months.push({
        number: i + 1,
        label: formatDate(monthDate),
        date: monthDate,
      })
    }

    return months
  }

  const getMonthStatus = (tontine: Tontine, monthNumber: number): MonthStatus => {
    if (!tontine.dateDebut) return "future"

    const startDate = new Date(tontine.dateDebut)
    const monthDate = addMonths(startDate, monthNumber - 1)
    const currentDate = new Date()

    if (monthDate > currentDate) return "future"
    if (monthDate.getMonth() === currentDate.getMonth() && monthDate.getFullYear() === currentDate.getFullYear())
      return "current"
    return "completed"
  }

  const getMonthStatusText = (tontine: Tontine, monthNumber: number): string => {
    const status = getMonthStatus(tontine, monthNumber)
    const statusTexts: Record<MonthStatus, string> = {
      future: "À venir",
      current: "En cours",
      completed: "Terminé",
    }
    return statusTexts[status]
  }

  const getMonthStatusBadgeClass = (tontine: Tontine, monthNumber: number): string => {
    const status = getMonthStatus(tontine, monthNumber)
    const classes: Record<MonthStatus, string> = {
      future: "bg-gray-100 text-gray-800",
      current: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
    }
    return classes[status]
  }

  const getPaymentStatus = (participant: Participant, month: number): boolean => {
    if (!tontine?.monthlyPayments) return false
    const key = `${participant.id}-${month}`
    return tontine.monthlyPayments[key] || false
  }

  const getPaymentRatio = (tontine: Tontine, monthNumber: number): PaymentRatio => {
    if (!tontine.participants.length) return { text: "0/0", percentage: 0, color: "text-slate-600" }

    const paidCount = tontine.participants.filter((p) => getPaymentStatus(p, monthNumber)).length
    const totalCount = tontine.participants.length
    const percentage = Math.round((paidCount / totalCount) * 100)

    let color = "text-red-600"
    if (percentage === 100) color = "text-green-600"
    else if (percentage >= 50) color = "text-yellow-600"

    return {
      text: `${paidCount}/${totalCount}`,
      percentage,
      color,
    }
  }

  const getMonthBeneficiary = (tontine: Tontine, monthNumber: number): string => {
    if (tontine.monthlyBeneficiaries && tontine.monthlyBeneficiaries[monthNumber]) {
      const participantId = tontine.monthlyBeneficiaries[monthNumber]
      const participant = tontine.participants.find((p) => p.id === participantId)
      return participant ? `${participant.prenom} ${participant.nom}` : "Non défini"
    }

    if (tontine.participantOrder && tontine.participants) {
      const participantId = tontine.participantOrder[monthNumber - 1]
      if (participantId) {
        const participant = tontine.participants.find((p) => p.id === participantId)
        return participant ? `${participant.prenom} ${participant.nom}` : "Non défini"
      }
    }

    return "Non défini"
  }

  const getMonthBeneficiaryId = (tontine: Tontine, monthNumber: number): string => {
    if (!tontine.monthlyBeneficiaries) return ""
    return tontine.monthlyBeneficiaries[monthNumber] || ""
  }

  const getMonthLabel = (tontine: Tontine, monthNumber: number): string => {
    const months = getMonthsList(tontine)
    return months[monthNumber - 1]?.label || `Mois ${monthNumber}`
  }

  const getTotalToCollect = (tontine: Tontine): number => {
    return tontine.participants.reduce((total, p) => total + tontine.montant * p.parts, 0)
  }

  const getCollectedAmount = (tontine: Tontine, monthNumber: number): number => {
    return tontine.participants
      .filter((p) => getPaymentStatus(p, monthNumber))
      .reduce((total, p) => total + tontine.montant * p.parts, 0)
  }

  const getPaidParticipants = (tontine: Tontine, monthNumber: number): number => {
    return tontine.participants.filter((p) => getPaymentStatus(p, monthNumber)).length
  }

  const selectMonthDetail = (monthNumber: number): void => {
    setSelectedMonthDetail(selectedMonthDetail === monthNumber ? null : monthNumber)
  }

  const setMonthBeneficiary = async (monthNumber: number, participantId: string): Promise<void> => {
    setIsLoading(true)

    try {
      await db.setMonthBeneficiary(tontine.id, participantId, monthNumber, currentUser.id)
      onRefresh()
    } catch (error) {
      console.error("Erreur lors de la définition du bénéficiaire:", error)
      alert("Erreur lors de la définition du bénéficiaire")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMonthlyPayment = async (participant: Participant, month: number): Promise<void> => {
    setIsLoading(true)

    try {
      const currentStatus = getPaymentStatus(participant, month)
      await db.updatePaymentStatus(
        tontine.id,
        participant.id,
        month,
        currentStatus ? "non_paye" : "paye",
        currentUser.id,
      )
      onRefresh()
    } catch (error) {
      console.error("Erreur lors de la mise à jour du paiement:", error)
      alert("Erreur lors de la mise à jour du paiement")
    } finally {
      setIsLoading(false)
    }
  }

  const markAllPaid = async (monthNumber: number): Promise<void> => {
    setIsLoading(true)

    try {
      for (const participant of tontine.participants) {
        await db.updatePaymentStatus(tontine.id, participant.id, monthNumber, "paye", currentUser.id)
      }
      onRefresh()
    } catch (error) {
      console.error("Erreur lors du marquage des paiements:", error)
      alert("Erreur lors du marquage des paiements")
    } finally {
      setIsLoading(false)
    }
  }

  const markAllUnpaid = async (monthNumber: number): Promise<void> => {
    setIsLoading(true)

    try {
      for (const participant of tontine.participants) {
        await db.updatePaymentStatus(tontine.id, participant.id, monthNumber, "non_paye", currentUser.id)
      }
      onRefresh()
    } catch (error) {
      console.error("Erreur lors du marquage des paiements:", error)
      alert("Erreur lors du marquage des paiements")
    } finally {
      setIsLoading(false)
    }
  }

  const finalizeMonth = async (monthNumber: number): Promise<void> => {
    const beneficiaryId = getMonthBeneficiaryId(tontine, monthNumber)
    const beneficiary = tontine.participants.find((p) => p.id === beneficiaryId)
    const amount = getCollectedAmount(tontine, monthNumber)

    if (
      beneficiary &&
      window.confirm(
        `Confirmer la distribution de ${amount.toLocaleString()} FC à ${beneficiary.prenom} ${beneficiary.nom} pour le mois ${monthNumber} ?`,
      )
    ) {
      alert(
        `Mois ${monthNumber} finalisé ! ${beneficiary.prenom} ${beneficiary.nom} a reçu ${amount.toLocaleString()} FC.`,
      )
    }
  }

  const resetMonth = async (monthNumber: number): Promise<void> => {
    if (window.confirm(`Êtes-vous sûr de vouloir réinitialiser tous les paiements du mois ${monthNumber} ?`)) {
      setIsLoading(true)

      try {
        for (const participant of tontine.participants) {
          await db.updatePaymentStatus(tontine.id, participant.id, monthNumber, "non_paye", currentUser.id)
        }
        onRefresh()
      } catch (error) {
        console.error("Erreur lors de la réinitialisation:", error)
        alert("Erreur lors de la réinitialisation")
      } finally {
        setIsLoading(false)
      }
    }
  }

  if (tontine.participants.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">📅</div>
        <p className="text-slate-500">Ajoutez d'abord des participants pour gérer les mois</p>
        <p className="text-slate-400 text-sm mt-2">
          Utilisez l'onglet "Participants" pour ajouter des membres à votre tontine
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="mb-4">
        <h4 className="text-base sm:text-lg font-semibold text-bleu-nuit mb-2">Calendrier des Mois</h4>
        <p className="text-sm text-slate-600">
          Cliquez sur une carte de mois pour voir les détails et gérer les paiements.
        </p>
      </div>

      {/* Monthly Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {getMonthsList(tontine).map((month, index) => (
          <div
            key={index}
            onClick={() => selectMonthDetail(index + 1)}
            className={`bg-white border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedMonthDetail === index + 1
                ? "border-bleu-ciel bg-blue-50"
                : "border-slate-200 hover:border-bleu-ciel"
            } ${getMonthStatus(tontine, index + 1) === "completed" ? "bg-green-50 border-green-200" : ""} ${
              getMonthStatus(tontine, index + 1) === "current" ? "bg-yellow-50 border-yellow-200" : ""
            } ${getMonthStatus(tontine, index + 1) === "future" ? "bg-slate-50 border-slate-200" : ""}`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h5 className="font-semibold text-slate-800 text-sm">Mois {index + 1}</h5>
                <p className="text-xs text-slate-600">{month.label}</p>
              </div>
              <div className="flex items-center">
                <span className={`text-xs px-2 py-1 rounded-full ${getMonthStatusBadgeClass(tontine, index + 1)}`}>
                  {getMonthStatusText(tontine, index + 1)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">Bénéficiaire:</span>
                <span className="text-xs font-medium text-slate-800">{getMonthBeneficiary(tontine, index + 1)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">Paiements:</span>
                <span className={`text-xs font-medium ${getPaymentRatio(tontine, index + 1).color}`}>
                  {getPaymentRatio(tontine, index + 1).text}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-bleu-ciel h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getPaymentRatio(tontine, index + 1).percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Month Detail Panel */}
      {selectedMonthDetail && (
        <div className="bg-slate-50 rounded-lg p-4 sm:p-6 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-bleu-nuit">
              Détails du Mois {selectedMonthDetail} - {getMonthLabel(tontine, selectedMonthDetail)}
            </h4>
            <button
              onClick={() => setSelectedMonthDetail(null)}
              className="text-slate-500 hover:text-slate-700 text-xl"
            >
              ×
            </button>
          </div>

          {/* Beneficiary Selection */}
          <div className="bg-white p-4 rounded-lg mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <h5 className="font-semibold text-slate-800 mb-2">🏆 Bénéficiaire du mois</h5>
                <p className="text-sm text-slate-600">
                  Sélectionnez qui recevra la totalité des cotisations collectées ce mois-ci.
                </p>
              </div>
              <div className="flex-shrink-0">
                <select
                  value={getMonthBeneficiaryId(tontine, selectedMonthDetail)}
                  onChange={(e) => setMonthBeneficiary(selectedMonthDetail, e.target.value)}
                  disabled={isLoading}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-bleu-ciel focus:border-transparent text-sm min-w-[200px] disabled:opacity-50"
                >
                  <option value="">Sélectionner un bénéficiaire</option>
                  {tontine.participants.map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      {participant.prenom} {participant.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {getMonthBeneficiary(tontine, selectedMonthDetail) !== "Non défini" && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">
                  <strong>{getMonthBeneficiary(tontine, selectedMonthDetail)}</strong> est le bénéficiaire de ce mois.
                  Il/Elle recevra <strong>{getTotalToCollect(tontine).toLocaleString()} FC</strong> si tous les
                  participants paient.
                </p>
              </div>
            )}
          </div>

          {/* Participants Management */}
          <div className="bg-white p-4 rounded-lg mb-4">
            <div className="flex justify-between items-center mb-4">
              <h5 className="font-semibold text-slate-800">Gestion des Participations</h5>
              <div className="flex gap-2">
                <button
                  onClick={() => markAllPaid(selectedMonthDetail)}
                  disabled={isLoading}
                  className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded transition-colors disabled:opacity-50"
                >
                  Tout marquer payé
                </button>
                <button
                  onClick={() => markAllUnpaid(selectedMonthDetail)}
                  disabled={isLoading}
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors disabled:opacity-50"
                >
                  Tout marquer non payé
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Participant</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Montant à Payer</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Statut</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tontine.participants.map((participant) => (
                    <tr key={participant.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="font-medium text-slate-800 text-sm">
                            {participant.prenom} {participant.nom}
                          </div>
                          {getMonthBeneficiaryId(tontine, selectedMonthDetail) === participant.id && (
                            <span className="ml-2 text-yellow-500">👑</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 text-sm">
                        {(tontine.montant * participant.parts).toLocaleString()} FC
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${
                            getPaymentStatus(participant, selectedMonthDetail)
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {getPaymentStatus(participant, selectedMonthDetail) ? "✅ Payé" : "❌ Non payé"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleMonthlyPayment(participant, selectedMonthDetail)}
                          disabled={isLoading}
                          className={`px-3 py-1 text-xs rounded font-medium transition-colors disabled:opacity-50 ${
                            getPaymentStatus(participant, selectedMonthDetail)
                              ? "bg-red-500 hover:bg-red-600 text-white"
                              : "bg-green-500 hover:bg-green-600 text-white"
                          }`}
                        >
                          {getPaymentStatus(participant, selectedMonthDetail) ? "Marquer non payé" : "Marquer payé"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Month Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <h6 className="font-semibold text-slate-800 text-sm">Total à Collecter</h6>
              <p className="text-lg font-bold text-bleu-ciel">{getTotalToCollect(tontine).toLocaleString()} FC</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h6 className="font-semibold text-slate-800 text-sm">Montant Collecté</h6>
              <p className="text-lg font-bold text-green-600">
                {getCollectedAmount(tontine, selectedMonthDetail).toLocaleString()} FC
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h6 className="font-semibold text-slate-800 text-sm">Participants Payés</h6>
              <p className="text-lg font-bold text-orange-600">
                {getPaidParticipants(tontine, selectedMonthDetail)}/{tontine.participants.length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h6 className="font-semibold text-slate-800 text-sm">Reste à Collecter</h6>
              <p className="text-lg font-bold text-red-600">
                {(getTotalToCollect(tontine) - getCollectedAmount(tontine, selectedMonthDetail)).toLocaleString()} FC
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
            {getMonthBeneficiaryId(tontine, selectedMonthDetail) &&
              getPaidParticipants(tontine, selectedMonthDetail) === tontine.participants.length && (
                <button
                  onClick={() => finalizeMonth(selectedMonthDetail)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                >
                  🎉 Finaliser le mois (Distribuer {getCollectedAmount(tontine, selectedMonthDetail).toLocaleString()}{" "}
                  FC)
                </button>
              )}
            <button
              onClick={() => resetMonth(selectedMonthDetail)}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              Réinitialiser le mois
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MonthlyTab
