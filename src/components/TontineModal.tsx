"use client"

import type React from "react"
import { useState } from "react"
import ParticipantsTab from "./ParticipantsTab"
import MonthlyTab from "./MonthlyTab"
import type { Tontine } from "../types"

interface TontineModalProps {
  tontine: Tontine
  onClose: () => void
  onRefresh: () => void
}

type TabType = "participants" | "monthly"

const TontineModal: React.FC<TontineModalProps> = ({ tontine, onClose, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<TabType>("participants")

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-4">
              <h3 className="text-xl sm:text-2xl font-semibold text-slate-800">{tontine.nom}</h3>
              <p className="text-slate-600 mt-1 sm:mt-2 text-sm sm:text-base">{tontine.description}</p>
              <div className="flex flex-col sm:flex-row sm:gap-4 mt-2 text-sm text-slate-600">
                <p>Montant mensuel: {tontine.montant.toLocaleString()} FC</p>
                <p>Durée: {tontine.duree} mois</p>
                <p>
                  Participants: {tontine.participants.length}/{tontine.nombreParticipants}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-2xl flex-shrink-0">
              ×
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Tabs */}
          <div className="border-b border-slate-200">
            <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab("participants")}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === "participants"
                    ? "border-bleu-ciel text-bleu-ciel"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Participants
              </button>
              <button
                onClick={() => setActiveTab("monthly")}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === "monthly"
                    ? "border-bleu-ciel text-bleu-ciel"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Calendrier des Mois
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === "participants" && <ParticipantsTab tontine={tontine} onRefresh={onRefresh} />}

          {activeTab === "monthly" && <MonthlyTab tontine={tontine} onRefresh={onRefresh} />}
        </div>
      </div>
    </div>
  )
}

export default TontineModal
