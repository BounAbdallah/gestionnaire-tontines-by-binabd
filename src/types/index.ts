export interface User {
  id: number
  username: string
  nom: string
  role: string
}

export interface Participant {
  id: string
  prenom: string
  nom: string
  parts: number
  dateAjout: string
  tontineId?: string
}

export interface Tontine {
  id: string
  nom: string
  montant: number
  nombreParticipants: number
  duree: number
  description: string
  dateDebut: string
  dateFin: string
  dateCreation: string
  participants: Participant[]
  monthlyPayments: Record<string, boolean>
  participantOrder: string[]
  monthlyBeneficiaries?: Record<number, string>
  finalizedMonths?: Record<
    number,
    {
      beneficiaryId: string
      amount: number
      date: string
    }
  >
}

export interface Statistics {
  totalTontines: number
  totalParticipants: number
  totalMontant: number
  tontinesActives: number
}

export interface ActivityLog {
  id: number
  action: string
  details: string
  username?: string
  dateAction: string
  tontineId?: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResult {
  success: boolean
  error?: string
}

export interface MonthData {
  number: number
  label: string
  date: Date
}

export interface PaymentRatio {
  text: string
  percentage: number
  color: string
}

export interface MonthlyReport {
  tontineName: string
  montant: number
  participants: (Participant & { isPaid: boolean })[]
  beneficiaire: string
  mois: number
  monthLabel?: string
  totalCollecte?: number
  participantsPayes?: number
  montantADistribuer?: number
}

export type MonthStatus = "future" | "current" | "completed"

export type TontineStatus = "En attente" | "À venir" | "Active" | "Terminée"

export type PaymentStatus = "paye" | "non_paye"

export interface TontineFormData {
  nom: string
  montant: number
  nombreParticipants: number
  duree: number
  description: string
  dateDebut: string
  dateFin: string
}

export interface ParticipantFormData {
  prenom: string
  nom: string
  parts: number
}
