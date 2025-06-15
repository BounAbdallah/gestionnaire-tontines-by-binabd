export interface User {
  id: number
  username: string
  email: string
  nom: string
  prenom: string
  telephone?: string
  role: "super_admin" | "admin" | "user"
  statut: "en_attente" | "approuve" | "rejete" | "suspendu"
  limite_tontines: number
  tontines_creees: number
  date_creation: string
  date_approbation?: string
  date_derniere_connexion?: string
  approuve_par?: number
  motif_rejet?: string
  actif: boolean
}

export interface RegistrationRequest {
  id?: number
  username: string
  email: string
  nom: string
  prenom: string
  telephone?: string
  password: string
  motif_inscription: string
  statut: "en_attente" | "approuve" | "rejete"
  date_demande: string
  date_traitement?: string
  traite_par?: number
  commentaire_admin?: string
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
  proprietaire_id: number
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
  totalUtilisateurs?: number
  utilisateursActifs?: number
  demandesEnAttente?: number
}

export interface ActivityLog {
  id: number
  action: string
  details: string
  username?: string
  dateAction: string
  tontineId?: string
  cible_utilisateur_id?: number
  userId?: number // Ajouter cette propriété
}

export interface Visitor {
  id: number
  adresse_ip?: string
  user_agent?: string
  date_visite: string
  page_visitee?: string
  duree_session?: number
  utilisateur_id?: number
  statut_visite: "anonyme" | "connecte"
}

export interface VisitorStats {
  totalVisiteurs: number
  visiteursAujourdhui: number
  visiteursCetteSemaine: number
  visiteursConnectes: number
  visiteursAnonymes: number
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegistrationData {
  username: string
  email: string
  nom: string
  prenom: string
  telephone?: string
  password: string
  confirmPassword: string
  motif_inscription: string
}

export interface LoginResult {
  success: boolean
  error?: string
  user?: User
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

export interface UserManagementData {
  user: User
  limite_tontines: number
  actif: boolean
  commentaire?: string
}
