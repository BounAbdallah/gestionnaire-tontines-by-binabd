import type React from "react"
import { formatDate } from "../utils/dateUtils"
import type { ActivityLog } from "../types"

interface ActivityLogsProps {
  logs: ActivityLog[]
}

const ActivityLogs: React.FC<ActivityLogsProps> = ({ logs }) => {
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold text-bleu-nuit mb-4 flex items-center gap-2">
          📋 Journal d'Activité
        </h3>

        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-2 h-2 bg-bleu-ciel rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-slate-800 text-sm">{formatActionText(log.action)}</h4>
                  <span className="text-xs text-slate-500">{formatDate(log.dateAction)}</span>
                </div>
                <p className="text-sm text-slate-600 mt-1">{log.details}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                  <span>Par: {log.username || "Système"}</span>
                  {log.tontineId && <span>• ID: {log.tontineId.substring(0, 8)}...</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ActivityLogs
