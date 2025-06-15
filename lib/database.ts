import type {
  Tontine,
  Participant,
  Statistics,
  ActivityLog,
  User,
  MonthlyReport,
  TontineFormData,
  PaymentStatus,
} from "../src/types"

// Configuration et utilitaires pour la base de données SQLite
class DatabaseManager {
  private isInitialized = false
  private storage: Storage | undefined

  async init(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Simuler l'initialisation de SQLite (en réalité, cela dépendrait de l'environnement)
      console.log("Initialisation de la base de données SQLite...")
      this.isInitialized = true

      // En mode développement, on utilise localStorage comme fallback
      if (typeof window !== "undefined") {
        this.storage = window.localStorage
      }
    } catch (error) {
      console.error("Erreur lors de l'initialisation de la base de données:", error)
      throw error
    }
  }

  // Méthodes pour les tontines
  async getTontines(): Promise<Tontine[]> {
    await this.init()

    // Simulation d'une requête SQL
    // SQL Query: SELECT t.*, COUNT(p.id) as participantCount FROM tontines t LEFT JOIN participants p ON t.id = p.tontineId WHERE t.statut = 'active' GROUP BY t.id ORDER BY t.dateCreation DESC

    // Fallback vers localStorage pour la démo
    const saved = this.storage?.getItem("tontines-data")
    let tontines: Tontine[] = saved ? JSON.parse(saved) : []

    // Validation et nettoyage des données
    tontines = tontines.map((tontine) => ({
      ...tontine,
      nom: tontine.nom || "Tontine sans nom",
      montant: Number(tontine.montant) || 0,
      nombreParticipants: Number(tontine.nombreParticipants) || 0,
      duree: Number(tontine.duree) || 0,
      participants: Array.isArray(tontine.participants) ? tontine.participants : [],
      dateDebut: tontine.dateDebut || new Date().toISOString().split("T")[0],
      dateFin: tontine.dateFin || new Date().toISOString().split("T")[0],
      monthlyPayments: tontine.monthlyPayments || {},
      participantOrder: Array.isArray(tontine.participantOrder) ? tontine.participantOrder : [],
    }))

    return tontines
  }

  async createTontine(tontineData: Tontine): Promise<Tontine> {
    await this.init()

    // Validation des données avant insertion
    const validatedData: Tontine = {
      ...tontineData,
      nom: tontineData.nom || "Nouvelle Tontine",
      montant: Number(tontineData.montant) || 0,
      nombreParticipants: Number(tontineData.nombreParticipants) || 0,
      duree: Number(tontineData.duree) || 0,
      participants: [],
      monthlyPayments: {},
      participantOrder: [],
      dateCreation: new Date().toISOString(),
    }

    // Validation de la date de fin
    if (validatedData.dateDebut && validatedData.duree > 0) {
      try {
        const startDate = new Date(validatedData.dateDebut)
        const endDate = new Date(startDate)
        endDate.setMonth(endDate.getMonth() + validatedData.duree)
        validatedData.dateFin = endDate.toISOString().split("T")[0]
      } catch (error) {
        console.error("Erreur de calcul de date de fin:", error)
        validatedData.dateFin = validatedData.dateDebut
      }
    }

    console.log("Création de la tontine:", validatedData)

    // SQL Query: INSERT INTO tontines (id, nom, montant, nombreParticipants, duree, description, dateDebut, dateFin, dateCreation, statut) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

    // Simulation de l'insertion

    // Fallback vers localStorage
    const tontines = await this.getTontines()
    tontines.push(validatedData)
    this.storage?.setItem("tontines-data", JSON.stringify(tontines))

    // Log de l'activité
    await this.logActivity("creation_tontine", `Création de la tontine ${validatedData.nom}`, validatedData.id)

    return validatedData
  }

  async updateTontine(id: string, tontineData: Partial<TontineFormData>): Promise<Partial<TontineFormData>> {
    await this.init()

    // SQL Query: UPDATE tontines SET nom = ?, montant = ?, nombreParticipants = ?, duree = ?, description = ?, dateDebut = ?, dateFin = ? WHERE id = ?

    // Fallback vers localStorage
    const tontines = await this.getTontines()
    const index = tontines.findIndex((t) => t.id === id)
    if (index !== -1) {
      tontines[index] = { ...tontines[index], ...tontineData }
      this.storage?.setItem("tontines-data", JSON.stringify(tontines))
    }

    await this.logActivity("modification_tontine", `Modification de la tontine ${tontineData.nom}`, id)

    return tontineData
  }

  async deleteTontine(id: string): Promise<void> {
    await this.init()

    // SQL Query: UPDATE tontines SET statut = 'supprime' WHERE id = ?

    // Fallback vers localStorage
    const tontines = await this.getTontines()
    const filteredTontines = tontines.filter((t) => t.id !== id)
    this.storage?.setItem("tontines-data", JSON.stringify(filteredTontines))

    await this.logActivity("suppression_tontine", `Suppression de la tontine`, id)
  }

  // Méthodes pour les participants
  async getParticipants(tontineId: string): Promise<Participant[]> {
    await this.init()

    // SQL Query: SELECT * FROM participants WHERE tontineId = ? ORDER BY ordre ASC

    // Fallback vers localStorage
    const tontines = await this.getTontines()
    const tontine = tontines.find((t) => t.id === tontineId)
    return tontine?.participants || []
  }

  async createParticipant(participantData: Participant & { tontineId: string }): Promise<Participant> {
    await this.init()

    // SQL Query: INSERT INTO participants (id, tontineId, prenom, nom, parts, dateAjout, ordre) VALUES (?, ?, ?, ?, ?, ?, ?)

    // Fallback vers localStorage
    const tontines = await this.getTontines()
    const tontineIndex = tontines.findIndex((t) => t.id === participantData.tontineId)
    if (tontineIndex !== -1) {
      if (!tontines[tontineIndex].participants) {
        tontines[tontineIndex].participants = []
      }
      tontines[tontineIndex].participants.push(participantData)

      // Add to participant order
      if (!tontines[tontineIndex].participantOrder) {
        tontines[tontineIndex].participantOrder = []
      }
      tontines[tontineIndex].participantOrder.push(participantData.id)

      this.storage?.setItem("tontines-data", JSON.stringify(tontines))
    }

    await this.logActivity(
      "ajout_participant",
      `Ajout du participant ${participantData.prenom} ${participantData.nom}`,
      participantData.tontineId,
    )

    return participantData
  }

  async deleteParticipant(participantId: string, tontineId: string): Promise<void> {
    await this.init()

    // SQL Query: DELETE FROM participants WHERE id = ?

    // Fallback vers localStorage
    const tontines = await this.getTontines()
    const tontineIndex = tontines.findIndex((t) => t.id === tontineId)
    if (tontineIndex !== -1 && tontines[tontineIndex].participants) {
      tontines[tontineIndex].participants = tontines[tontineIndex].participants.filter((p) => p.id !== participantId)

      // Remove from participant order
      if (tontines[tontineIndex].participantOrder) {
        tontines[tontineIndex].participantOrder = tontines[tontineIndex].participantOrder.filter(
          (id) => id !== participantId,
        )
      }

      this.storage?.setItem("tontines-data", JSON.stringify(tontines))
    }

    await this.logActivity("suppression_participant", `Suppression d'un participant`, tontineId)
  }

  // Méthodes pour les paiements
  async updatePaymentStatus(
    tontineId: string,
    participantId: string,
    mois: number,
    statut: PaymentStatus,
  ): Promise<void> {
    await this.init()

    // SQL Query: INSERT OR REPLACE INTO paiements_mensuels (tontineId, participantId, mois, montant, statut, datePaiement, dateCreation) VALUES (?, ?, ?, ?, ?, ?, ?)

    // Fallback vers localStorage
    const tontines = await this.getTontines()
    const tontineIndex = tontines.findIndex((t) => t.id === tontineId)
    if (tontineIndex !== -1) {
      if (!tontines[tontineIndex].monthlyPayments) {
        tontines[tontineIndex].monthlyPayments = {}
      }
      const key = `${participantId}-${mois}`
      tontines[tontineIndex].monthlyPayments[key] = statut === "paye"
      this.storage?.setItem("tontines-data", JSON.stringify(tontines))
    }

    await this.logActivity(
      "modification_paiement",
      `Modification du statut de paiement pour le mois ${mois}`,
      tontineId,
    )
  }

  async getPaymentStatus(tontineId: string, participantId: string, mois: number): Promise<PaymentStatus> {
    await this.init()

    // SQL Query: SELECT statut FROM paiements_mensuels WHERE tontineId = ? AND participantId = ? AND mois = ?

    // Fallback vers localStorage
    const tontines = await this.getTontines()
    const tontine = tontines.find((t) => t.id === tontineId)
    if (tontine?.monthlyPayments) {
      const key = `${participantId}-${mois}`
      return tontine.monthlyPayments[key] ? "paye" : "non_paye"
    }

    return "non_paye"
  }

  // Méthodes pour les bénéficiaires
  async setMonthBeneficiary(tontineId: string, participantId: string, mois: number): Promise<void> {
    await this.init()

    // SQL Query: INSERT OR REPLACE INTO beneficiaires_mensuels (tontineId, participantId, mois, statut, dateCreation) VALUES (?, ?, ?, 'en_attente', ?)

    // Fallback vers localStorage
    const tontines = await this.getTontines()
    const tontineIndex = tontines.findIndex((t) => t.id === tontineId)
    if (tontineIndex !== -1) {
      if (!tontines[tontineIndex].monthlyBeneficiaries) {
        tontines[tontineIndex].monthlyBeneficiaries = {}
      }
      tontines[tontineIndex].monthlyBeneficiaries[mois] = participantId
      this.storage?.setItem("tontines-data", JSON.stringify(tontines))
    }

    await this.logActivity("definition_beneficiaire", `Définition du bénéficiaire pour le mois ${mois}`, tontineId)
  }

  async getMonthBeneficiary(tontineId: string, mois: number): Promise<string | null> {
    await this.init()

    // SQL Query: SELECT participantId FROM beneficiaires_mensuels WHERE tontineId = ? AND mois = ?

    // Fallback vers localStorage
    const tontines = await this.getTontines()
    const tontine = tontines.find((t) => t.id === tontineId)
    return tontine?.monthlyBeneficiaries?.[mois] || null
  }

  // Méthodes pour les statistiques
  async getStatistics(): Promise<Statistics> {
    await this.init()

    // Fallback vers localStorage
    const tontines = await this.getTontines()
    return {
      totalTontines: tontines.length,
      totalParticipants: tontines.reduce((total, t) => total + (t.participants?.length || 0), 0),
      totalMontant: tontines.reduce((total, t) => total + t.montant, 0),
      tontinesActives: tontines.filter((t) => {
        const now = new Date()
        const start = new Date(t.dateDebut)
        const end = new Date(t.dateFin)
        return now >= start && now <= end
      }).length,
    }
  }

  // Méthodes pour les logs
  async logActivity(action: string, details: string, tontineId: string | null = null): Promise<void> {
    await this.init()

    // SQL Query: INSERT INTO logs_activite (utilisateurId, action, details, tontineId, dateAction) VALUES (1, ?, ?, ?, ?)

    console.log(`[LOG] ${action}: ${details}`, { tontineId, date: new Date().toISOString() })
  }

  async getActivityLogs(): Promise<ActivityLog[]> {
    await this.init()

    // SQL Query: SELECT l.*, u.username FROM logs_activite l LEFT JOIN utilisateurs u ON l.utilisateurId = u.id ORDER BY l.dateAction DESC LIMIT ?

    // Retourner des logs d'exemple
    return [
      {
        id: 1,
        action: "creation_tontine",
        details: "Création de la tontine Famille 2024",
        username: "admin",
        dateAction: new Date().toISOString(),
      },
      {
        id: 2,
        action: "ajout_participant",
        details: "Ajout d'un nouveau participant",
        username: "admin",
        dateAction: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 3,
        action: "modification_paiement",
        details: "Modification du statut de paiement",
        username: "admin",
        dateAction: new Date(Date.now() - 7200000).toISOString(),
      },
    ]
  }

  // Méthodes pour l'authentification
  async authenticateUser(username: string, password: string): Promise<User | null> {
    await this.init()

    // SQL Query: SELECT id, username, nom, role FROM utilisateurs WHERE username = ? AND password = ?

    // Authentification simple pour la démo
    if (username === "admin" && password === "admin123") {
      await this.logActivity("connexion", `Connexion de l'utilisateur ${username}`)
      return {
        id: 1,
        username: "admin",
        nom: "Administrateur",
        role: "admin",
      }
    }

    return null
  }

  // Méthode pour les rapports
  async generateMonthlyReport(tontineId: string, mois: number): Promise<MonthlyReport | null> {
    await this.init()

    // SQL Query: SELECT t.nom as tontineName, t.montant, p.id as participantId, p.prenom, p.nom, p.parts, pm.statut as paymentStatus, bm.participantId as beneficiaryId FROM tontines t LEFT JOIN participants p ON t.id = p.tontineId LEFT JOIN paiements_mensuels pm ON p.id = pm.participantId AND pm.mois = ? LEFT JOIN beneficiaires_mensuels bm ON t.id = bm.tontineId AND bm.mois = ? WHERE t.id = ?

    // Fallback vers localStorage pour générer le rapport
    const tontines = await this.getTontines()
    const tontine = tontines.find((t) => t.id === tontineId)

    if (!tontine) return null

    const participants = tontine.participants || []
    const beneficiaryId = tontine.monthlyBeneficiaries?.[mois]
    const beneficiary = participants.find((p) => p.id === beneficiaryId)

    return {
      tontineName: tontine.nom,
      montant: tontine.montant,
      participants: participants.map((p) => ({
        ...p,
        isPaid: tontine.monthlyPayments?.[`${p.id}-${mois}`] || false,
      })),
      beneficiaire: beneficiary ? `${beneficiary.prenom} ${beneficiary.nom}` : "Non défini",
      mois,
    }
  }
}

// Export de l'instance singleton
export const db = new DatabaseManager()
