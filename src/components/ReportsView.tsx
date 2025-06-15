"use client"

import type React from "react"
import { useState } from "react"
import { db } from "../../lib/database"
import { formatDate } from "../utils/dateUtils"
import type { Tontine, MonthlyReport, MonthData } from "../types"

interface ReportsViewProps {
  tontines: Tontine[]
}

interface AvailableMonth {
  value: number
  label: string
}

const ReportsView: React.FC<ReportsViewProps> = ({ tontines }) => {
  const [selectedTontineId, setSelectedTontineId] = useState<string>("")
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [availableMonths, setAvailableMonths] = useState<AvailableMonth[]>([])
  const [currentReport, setCurrentReport] = useState<MonthlyReport | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const getMonthsList = (tontine: Tontine): MonthData[] => {
    if (!tontine.dateDebut || tontine.duree === 0) return []

    const startDate = new Date(tontine.dateDebut)
    const months: MonthData[] = []

    for (let i = 0; i < tontine.duree; i++) {
      const monthDate = new Date(startDate)
      monthDate.setMonth(monthDate.getMonth() + i)
      months.push({
        number: i + 1,
        label: formatDate(monthDate),
        date: monthDate,
      })
    }

    return months
  }

  const handleTontineSelect = (tontineId: string): void => {
    setSelectedTontineId(tontineId)
    setSelectedMonth("")
    setCurrentReport(null)

    if (!tontineId) {
      setAvailableMonths([])
      return
    }

    const tontine = tontines.find((t) => t.id === tontineId)
    if (tontine) {
      const months = getMonthsList(tontine).map((month) => ({
        value: month.number,
        label: `Mois ${month.number} - ${month.label}`,
      }))
      setAvailableMonths(months)
    }
  }

  const generateReport = async (): Promise<void> => {
    if (!selectedTontineId || !selectedMonth) {
      alert("Veuillez sélectionner une tontine et un mois")
      return
    }

    setIsLoading(true)

    try {
      const report = await db.generateMonthlyReport(selectedTontineId, Number.parseInt(selectedMonth))
      if (report) {
        const monthLabel =
          availableMonths.find((m) => m.value === Number.parseInt(selectedMonth))?.label || `Mois ${selectedMonth}`

        let totalCollecte = 0
        let participantsPayes = 0

        report.participants.forEach((participant) => {
          if (participant.isPaid) {
            totalCollecte += report.montant * participant.parts
            participantsPayes++
          }
        })

        setCurrentReport({
          ...report,
          monthLabel,
          totalCollecte,
          participantsPayes,
          montantADistribuer: report.participants.reduce((total, p) => total + report.montant * p.parts, 0),
        })
      }
    } catch (error) {
      console.error("Erreur lors de la génération du rapport:", error)
      alert("Erreur lors de la génération du rapport")
    } finally {
      setIsLoading(false)
    }
  }

  const printReport = (): void => {
    const printContent = document.getElementById("printable-report")
    if (!printContent) return

    const originalContent = document.body.innerHTML

    document.body.innerHTML = printContent.outerHTML
    window.print()
    document.body.innerHTML = originalContent

    window.location.reload()
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold text-bleu-nuit mb-4">Rapports Mensuels</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Sélectionner une Tontine</label>
            <select
              value={selectedTontineId}
              onChange={(e) => handleTontineSelect(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-bleu-ciel focus:border-transparent text-sm"
            >
              <option value="">Choisir une tontine</option>
              {tontines.map((tontine) => (
                <option key={tontine.id} value={tontine.id}>
                  {tontine.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Mois de la Tontine</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              disabled={!selectedTontineId}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-bleu-ciel focus:border-transparent disabled:bg-gray-100 text-sm"
            >
              <option value="">Choisir un mois</option>
              {availableMonths.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={!selectedTontineId || !selectedMonth || isLoading}
              className="w-full px-4 sm:px-6 py-2 bg-bleu-ciel hover:bg-bleu-nuit text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? "Génération..." : "Générer Rapport"}
            </button>
          </div>
        </div>

        {/* Report Display */}
        {currentReport && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <h4 className="text-base sm:text-lg font-semibold text-slate-800">
                Rapport - {currentReport.tontineName} ({currentReport.monthLabel})
              </h4>
              <button
                onClick={printReport}
                className="px-3 sm:px-4 py-2 bg-bleu-nuit hover:bg-bleu-ciel text-white rounded-lg transition-colors text-sm"
              >
                Imprimer
              </button>
            </div>

            <div id="printable-report" className="bg-slate-50 p-4 sm:p-6 rounded-lg">
              <div className="text-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{currentReport.tontineName}</h2>
                <p className="text-slate-600 text-sm sm:text-base">{currentReport.monthLabel}</p>
                <p className="text-slate-600 text-sm sm:text-base">
                  Montant mensuel: {currentReport.montant.toLocaleString()} FC
                </p>
                <p className="text-slate-600 text-sm sm:text-base">
                  Bénéficiaire du mois: <strong>{currentReport.beneficiaire || "Non défini"}</strong>
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-300 min-w-[500px]">
                  <thead>
                    <tr className="bg-slate-200">
                      <th className="border border-slate-300 px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">
                        Participant
                      </th>
                      <th className="border border-slate-300 px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">Parts</th>
                      <th className="border border-slate-300 px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">
                        Montant Dû
                      </th>
                      <th className="border border-slate-300 px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">
                        Statut Paiement
                      </th>
                      <th className="border border-slate-300 px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">
                        Bénéficiaire
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentReport.participants.map((participant) => (
                      <tr key={participant.id}>
                        <td className="border border-slate-300 px-2 sm:px-4 py-2 text-xs sm:text-sm">
                          {participant.prenom} {participant.nom}
                        </td>
                        <td className="border border-slate-300 px-2 sm:px-4 py-2 text-xs sm:text-sm">
                          {participant.parts}
                        </td>
                        <td className="border border-slate-300 px-2 sm:px-4 py-2 text-xs sm:text-sm">
                          {(currentReport.montant * participant.parts).toLocaleString()} FC
                        </td>
                        <td className="border border-slate-300 px-2 sm:px-4 py-2">
                          <span
                            className={`text-xs sm:text-sm font-semibold ${
                              participant.isPaid ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {participant.isPaid ? "Payé" : "Non payé"}
                          </span>
                        </td>
                        <td className="border border-slate-300 px-2 sm:px-4 py-2">
                          <span
                            className={`text-xs sm:text-sm ${
                              currentReport.beneficiaire === `${participant.prenom} ${participant.nom}`
                                ? "text-green-600 font-semibold"
                                : "text-slate-600"
                            }`}
                          >
                            {currentReport.beneficiaire === `${participant.prenom} ${participant.nom}` ? "Oui" : "Non"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white p-3 sm:p-4 rounded-lg">
                  <h5 className="font-semibold text-slate-800 text-sm">Total Collecté</h5>
                  <p className="text-lg sm:text-xl font-bold text-green-600">
                    {currentReport.totalCollecte?.toLocaleString()} FC
                  </p>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-lg">
                  <h5 className="font-semibold text-slate-800 text-sm">Participants Payés</h5>
                  <p className="text-lg sm:text-xl font-bold text-blue-600">
                    {currentReport.participantsPayes}/{currentReport.participants.length}
                  </p>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-lg">
                  <h5 className="font-semibold text-slate-800 text-sm">Montant à Distribuer</h5>
                  <p className="text-lg sm:text-xl font-bold text-orange-600">
                    {currentReport.montantADistribuer?.toLocaleString()} FC
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReportsView
