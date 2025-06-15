"use client"

import type React from "react"
import { useState } from "react"
import type { RegistrationData } from "../types"

interface RegistrationScreenProps {
  onRegister: (data: RegistrationData) => Promise<{ success: boolean; error?: string }>
  onBackToLogin: () => void
  isLoading: boolean
}

const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ onRegister, onBackToLogin, isLoading }) => {
  const [formData, setFormData] = useState<RegistrationData>({
    username: "",
    email: "",
    nom: "",
    prenom: "",
    telephone: "",
    password: "",
    confirmPassword: "",
    motif_inscription: "",
  })
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<boolean>(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const validateForm = (): boolean => {
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return false
    }

    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères")
      return false
    }

    if (!formData.email.includes("@")) {
      setError("Veuillez entrer une adresse email valide")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setError("")

    if (!validateForm()) return

    const result = await onRegister(formData)
    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error || "Erreur lors de l'inscription")
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-600 mb-4">Demande envoyée !</h2>
          <p className="text-slate-600 mb-6">
            Votre demande d'inscription a été envoyée avec succès. Un administrateur va examiner votre demande et vous
            recevrez une notification par email.
          </p>
          <button
            onClick={onBackToLogin}
            className="w-full px-4 py-2 bg-bleu-ciel hover:bg-bleu-nuit text-white rounded-lg transition-colors"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-bleu-nuit mb-2">Créer un compte</h1>
          <p className="text-slate-600 text-sm sm:text-base">Demande d'accès à la plateforme de gestion des tontines</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Prénom *</label>
              <input
                name="prenom"
                type="text"
                required
                value={formData.prenom}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-bleu-ciel focus:border-transparent text-sm"
                placeholder="Votre prénom"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nom *</label>
              <input
                name="nom"
                type="text"
                required
                value={formData.nom}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-bleu-ciel focus:border-transparent text-sm"
                placeholder="Votre nom"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nom d'utilisateur *</label>
            <input
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-bleu-ciel focus:border-transparent text-sm"
              placeholder="Choisissez un nom d'utilisateur"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-bleu-ciel focus:border-transparent text-sm"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone</label>
              <input
                name="telephone"
                type="tel"
                value={formData.telephone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-bleu-ciel focus:border-transparent text-sm"
                placeholder="+243 XXX XXX XXX"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe *</label>
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-bleu-ciel focus:border-transparent text-sm"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Confirmer le mot de passe *</label>
              <input
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-bleu-ciel focus:border-transparent text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Motif de l'inscription *</label>
            <textarea
              name="motif_inscription"
              required
              value={formData.motif_inscription}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-bleu-ciel focus:border-transparent text-sm"
              placeholder="Expliquez pourquoi vous souhaitez utiliser cette plateforme..."
            />
          </div>

          {error && <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded">{error}</div>}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-bleu-ciel hover:bg-bleu-nuit text-white rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              {isLoading ? "Envoi en cours..." : "Envoyer la demande"}
            </button>

            <button
              type="button"
              onClick={onBackToLogin}
              className="flex-1 px-4 py-3 bg-slate-500 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Retour à la connexion
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500 bg-slate-50 p-3 rounded">
          <p>
            En créant un compte, vous acceptez que vos informations soient examinées par un administrateur avant
            l'activation de votre compte.
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegistrationScreen
