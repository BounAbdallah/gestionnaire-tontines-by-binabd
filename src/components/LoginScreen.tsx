"use client"

import type React from "react"
import { useState } from "react"
import type { LoginCredentials, LoginResult } from "../types"

interface LoginScreenProps {
  onLogin: (credentials: LoginCredentials) => Promise<LoginResult>
  isLoading: boolean
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, isLoading }) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: "",
    password: "",
  })
  const [error, setError] = useState<string>("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setError("")

    const result = await onLogin(credentials)
    if (!result.success) {
      setError(result.error || "Erreur de connexion")
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target
    setCredentials({
      ...credentials,
      [name]: value,
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-bleu-nuit mb-2">Gestion des Tontines</h1>
          <p className="text-slate-600 text-sm sm:text-base">Connexion Administrateur</p>
          <div className="mt-2 text-xs text-slate-500">
            <p>⚛️ Application React TypeScript avec SQLite</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nom d'utilisateur</label>
            <input
              name="username"
              type="text"
              required
              value={credentials.username}
              onChange={handleChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-bleu-ciel focus:border-transparent text-sm sm:text-base"
              placeholder="admin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe</label>
            <input
              name="password"
              type="password"
              required
              value={credentials.password}
              onChange={handleChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-bleu-ciel focus:border-transparent text-sm sm:text-base"
              placeholder="••••••••"
            />
          </div>

          {error && <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 sm:py-3 bg-bleu-ciel hover:bg-bleu-nuit text-white rounded-lg transition-colors font-medium text-sm sm:text-base disabled:opacity-50"
          >
            {isLoading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-slate-500 bg-slate-50 p-3 rounded">
          <p className="font-medium mb-1">Identifiants par défaut:</p>
          <p>
            Utilisateur: <strong>admin</strong>
          </p>
          <p>
            Mot de passe: <strong>admin123</strong>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginScreen
