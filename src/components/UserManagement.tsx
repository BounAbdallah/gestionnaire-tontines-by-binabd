"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { db } from "../../lib/database"
import { formatDate } from "../utils/dateUtils"
import type { User, RegistrationRequest } from "../types"

interface UserManagementProps {
  currentUser: User
  onRefresh: () => void
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser, onRefresh }) => {
  const [users, setUsers] = useState<User[]>([])
  const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<"users" | "requests">("requests")
  const [editingLimits, setEditingLimits] = useState<{ [key: number]: number }>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async (): Promise<void> => {
    setIsLoading(true)
    try {
      const [usersData, requestsData] = await Promise.all([db.getUsers(), db.getRegistrationRequests()])
      setUsers(usersData)
      setRegistrationRequests(requestsData)
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveRequest = async (requestId: number, limite_tontines = 5): Promise<void> => {
    setIsLoading(true)
    try {
      await db.approveRegistrationRequest(requestId, currentUser.id, limite_tontines)
      await loadData()
      onRefresh()
    } catch (error) {
      console.error("Erreur lors de l'approbation:", error)
      alert("Erreur lors de l'approbation de la demande")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRejectRequest = async (requestId: number, motif: string): Promise<void> => {
    setIsLoading(true)
    try {
      await db.rejectRegistrationRequest(requestId, currentUser.id, motif)
      await loadData()
      onRefresh()
    } catch (error) {
      console.error("Erreur lors du rejet:", error)
      alert("Erreur lors du rejet de la demande")
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleUserStatus = async (userId: number): Promise<void> => {
    setIsLoading(true)
    try {
      await db.toggleUserStatus(userId, currentUser.id)
      await loadData()
      onRefresh()
    } catch (error) {
      console.error("Erreur lors du changement de statut:", error)
      alert("Erreur lors du changement de statut")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateUserLimits = async (userId: number, newLimit: number): Promise<void> => {
    setIsLoading(true)
    try {
      await db.updateUserLimits(userId, newLimit, currentUser.id)
      await loadData()
      onRefresh()
      setEditingLimits({ ...editingLimits, [userId]: newLimit })
    } catch (error) {
      console.error("Erreur lors de la mise à jour des limites:", error)
      alert("Erreur lors de la mise à jour des limites")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (statut: string): string => {
    const badges: Record<string, string> = {
      en_attente: "bg-yellow-100 text-yellow-800",
      approuve: "bg-green-100 text-green-800",
      rejete: "bg-red-100 text-red-800",
      suspendu: "bg-orange-100 text-orange-800",
    }
    return badges[statut] || "bg-gray-100 text-gray-800"
  }

  const getStatusText = (statut: string): string => {
    const texts: Record<string, string> = {
      en_attente: "En attente",
      approuve: "Approuvé",
      rejete: "Rejeté",
      suspendu: "Suspendu",
    }
    return texts[statut] || statut
  }

  const getRoleText = (role: string): string => {
    const roles: Record<string, string> = {
      super_admin: "Super Admin",
      admin: "Administrateur",
      user: "Utilisateur",
    }
    return roles[role] || role
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold text-bleu-nuit mb-4 flex items-center gap-2">
          👥 Gestion des Utilisateurs
        </h3>

        {/* Tabs */}
        <div className="border-b border-slate-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("requests")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "requests"
                  ? "border-bleu-ciel text-bleu-ciel"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Demandes d'inscription ({registrationRequests.filter((r) => r.statut === "en_attente").length})
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "users"
                  ? "border-bleu-ciel text-bleu-ciel"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Utilisateurs ({users.length})
            </button>
          </nav>
        </div>

        {/* Registration Requests Tab */}
        {activeTab === "requests" && (
          <div className="space-y-4">
            {registrationRequests.filter((r) => r.statut === "en_attente").length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📝</div>
                <p className="text-slate-500">Aucune demande d'inscription en attente</p>
              </div>
            ) : (
              registrationRequests
                .filter((r) => r.statut === "en_attente")
                .map((request) => (
                  <div key={request.id} className="bg-slate-50 rounded-lg p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-slate-800">
                            {request.prenom} {request.nom}
                          </h4>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.statut)}`}
                          >
                            {getStatusText(request.statut)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600 mb-3">
                          <p>👤 Utilisateur: {request.username}</p>
                          <p>📧 Email: {request.email}</p>
                          <p>📱 Téléphone: {request.telephone || "Non renseigné"}</p>
                          <p>📅 Demande: {formatDate(request.date_demande)}</p>
                        </div>

                        <div className="bg-white p-3 rounded border">
                          <p className="text-sm font-medium text-slate-700 mb-1">Motif de l'inscription:</p>
                          <p className="text-sm text-slate-600">{request.motif_inscription}</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 lg:w-48">
                        <div className="mb-2">
                          <label className="block text-xs font-medium text-slate-700 mb-1">Limite de tontines</label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            defaultValue={5}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                            id={`limit-${request.id}`}
                          />
                        </div>

                        <button
                          onClick={() => {
                            const limitInput = document.getElementById(`limit-${request.id}`) as HTMLInputElement
                            const limit = Number.parseInt(limitInput.value) || 5
                            handleApproveRequest(request.id!, limit)
                          }}
                          disabled={isLoading}
                          className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          ✅ Approuver
                        </button>

                        <button
                          onClick={() => {
                            const motif = prompt("Motif du rejet:")
                            if (motif) {
                              handleRejectRequest(request.id!, motif)
                            }
                          }}
                          disabled={isLoading}
                          className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          ❌ Rejeter
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Utilisateur</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Rôle</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Statut</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Tontines</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Limite</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Dernière connexion</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter((user) => user.id !== currentUser.id)
                  .map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-slate-800 text-sm">
                            {user.prenom} {user.nom}
                          </div>
                          <div className="text-xs text-slate-600">@{user.username}</div>
                          <div className="text-xs text-slate-600">{user.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {getRoleText(user.role)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(user.statut)}`}>
                          {getStatusText(user.statut)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700">{user.tontines_creees}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={editingLimits[user.id] ?? user.limite_tontines}
                            onChange={(e) =>
                              setEditingLimits({ ...editingLimits, [user.id]: Number.parseInt(e.target.value) || 1 })
                            }
                            className="w-16 px-2 py-1 border border-slate-300 rounded text-xs"
                          />
                          {editingLimits[user.id] !== undefined && editingLimits[user.id] !== user.limite_tontines && (
                            <button
                              onClick={() => handleUpdateUserLimits(user.id, editingLimits[user.id])}
                              disabled={isLoading}
                              className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs disabled:opacity-50"
                            >
                              ✓
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {user.date_derniere_connexion ? formatDate(user.date_derniere_connexion) : "Jamais"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleUserStatus(user.id)}
                            disabled={isLoading}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
                              user.actif
                                ? "bg-red-500 hover:bg-red-600 text-white"
                                : "bg-green-500 hover:bg-green-600 text-white"
                            }`}
                          >
                            {user.actif ? "🚫 Désactiver" : "✅ Activer"}
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

export default UserManagement
