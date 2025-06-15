import type {
  Tontine,
  Participant,
  Statistics,
  ActivityLog,
  User,
  MonthlyReport,
  TontineFormData,
  PaymentStatus,
  RegistrationRequest,
  RegistrationData,
  Visitor,
} from "../src/types"

// Configuration et utilitaires pour la base de données SQLite
class DatabaseManager {
  private db: unknown = null
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

  // Méthodes pour l'authentification et les utilisateurs
  async authenticateUser(username: string, password: string): Promise<User | null> {
    await this.init()

    // SQL Query: SELECT * FROM utilisateurs WHERE username = ? AND password = ? AND actif = 1

    // Authentification simple pour la démo
    if (username === "superadmin" && password === "admin123") {
      await this.logActivity("connexion", `Connexion de l'utilisateur ${username}`, null, 1)
      return {
        id: 1,
        username: "superadmin",
        email: "admin@tontines.com",
        nom: "Super",
        prenom: "Administrateur",
        role: "super_admin",
        statut: "approuve",
        limite_tontines: 999,
        tontines_creees: 0,
        date_creation: new Date().toISOString(),
        actif: true,
      }
    }

    // Vérifier dans les utilisateurs stockés
    const users = await this.getUsers()
    const user = users.find((u) => u.username === username && u.actif && u.statut === "approuve")

    if (user && password === "password123") {
      // Mot de passe par défaut pour la démo
      await this.logActivity("connexion", `Connexion de l'utilisateur ${username}`, null, user.id)
      return user
    }

    return null
  }

  async registerUser(data: RegistrationData): Promise<{ success: boolean; error?: string }> {
    await this.init()

    try {
      // Vérifier si l'utilisateur ou l'email existe déjà
      const existingUsers = await this.getUsers()
      const existingRequests = await this.getRegistrationRequests()

      if (existingUsers.some((u) => u.username === data.username || u.email === data.email)) {
        return { success: false, error: "Ce nom d'utilisateur ou email est déjà utilisé" }
      }

      if (existingRequests.some((r) => r.username === data.username || r.email === data.email)) {
        return { success: false, error: "Une demande avec ce nom d'utilisateur ou email est déjà en cours" }
      }

      // Créer la demande d'inscription
      const newRequest: RegistrationRequest = {
        id: Date.now(),
        username: data.username,
        email: data.email,
        nom: data.nom,
        prenom: data.prenom,
        telephone: data.telephone,
        password: data.password, // En production, il faudrait hasher le mot de passe
        motif_inscription: data.motif_inscription,
        statut: "en_attente",
        date_demande: new Date().toISOString(),
      }

      const requests = existingRequests
      requests.push(newRequest)
      this.storage?.setItem("registration-requests", JSON.stringify(requests))

      await this.logActivity("demande_inscription", `Nouvelle demande d'inscription de ${data.prenom} ${data.nom}`)

      return { success: true }
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error)
      return { success: false, error: "Erreur lors de l'inscription" }
    }
  }

  async getUsers(): Promise<User[]> {
    await this.init()

    // SQL Query: SELECT * FROM utilisateurs ORDER BY date_creation DESC

    const saved = this.storage?.getItem("users-data")
    return saved ? JSON.parse(saved) : []
  }

  async getRegistrationRequests(): Promise<RegistrationRequest[]> {
    await this.init()

    // SQL Query: SELECT * FROM demandes_inscription ORDER BY date_demande DESC

    const saved = this.storage?.getItem("registration-requests")
    return saved ? JSON.parse(saved) : []
  }

  async approveRegistrationRequest(requestId: number, approvedBy: number, limiteTontines: number): Promise<void> {
    await this.init()

    const requests = await this.getRegistrationRequests()
    const request = requests.find((r) => r.id === requestId)

    if (!request) throw new Error("Demande non trouvée")

    // Créer l'utilisateur
    const newUser: User = {
      id: Date.now(),
      username: request.username,
      email: request.email,
      nom: request.nom,
      prenom: request.prenom,
      telephone: request.telephone,
      role: "user",
      statut: "approuve",
      limite_tontines: limiteTontines,
      tontines_creees: 0,
      date_creation: new Date().toISOString(),
      date_approbation: new Date().toISOString(),
      approuve_par: approvedBy,
      actif: true,
    }

    // Ajouter l'utilisateur
    const users = await this.getUsers()
    users.push(newUser)
    this.storage?.setItem("users-data", JSON.stringify(users))

    // Marquer la demande comme approuvée
    request.statut = "approuve"
    request.date_traitement = new Date().toISOString()
    request.traite_par = approvedBy
    this.storage?.setItem("registration-requests", JSON.stringify(requests))

    await this.logActivity(
      "approbation_utilisateur",
      `Approbation de l'utilisateur ${request.prenom} ${request.nom}`,
      null,
      approvedBy,
      newUser.id,
    )
  }

  async rejectRegistrationRequest(requestId: number, rejectedBy: number, motif: string): Promise<void> {
    await this.init()

    const requests = await this.getRegistrationRequests()
    const request = requests.find((r) => r.id === requestId)

    if (!request) throw new Error("Demande non trouvée")

    request.statut = "rejete"
    request.date_traitement = new Date().toISOString()
    request.traite_par = rejectedBy
    request.commentaire_admin = motif

    this.storage?.setItem("registration-requests", JSON.stringify(requests))

    await this.logActivity(
      "rejet_utilisateur",
      `Rejet de la demande de ${request.prenom} ${request.nom}: ${motif}`,
      null,
      rejectedBy,
    )
  }

  async toggleUserStatus(userId: number, modifiedBy: number): Promise<void> {
    await this.init()

    const users = await this.getUsers()
    const userIndex = users.findIndex((u) => u.id === userId)

    if (userIndex === -1) throw new Error("Utilisateur non trouvé")

    users[userIndex].actif = !users[userIndex].actif
    this.storage?.setItem("users-data", JSON.stringify(users))

    await this.logActivity(
      "modification_statut_utilisateur",
      `${users[userIndex].actif ? "Activation" : "Désactivation"} de l'utilisateur ${users[userIndex].prenom} ${users[userIndex].nom}`,
      null,
      modifiedBy,
      userId,
    )
  }

  async updateUserLimits(userId: number, newLimit: number, modifiedBy: number): Promise<void> {
    await this.init()

    const users = await this.getUsers()
    const userIndex = users.findIndex((u) => u.id === userId)

    if (userIndex === -1) throw new Error("Utilisateur non trouvé")

    const oldLimit = users[userIndex].limite_tontines
    users[userIndex].limite_tontines = newLimit
    this.storage?.setItem("users-data", JSON.stringify(users))

    await this.logActivity(
      "modification_limite_utilisateur",
      `Modification de la limite de tontines de ${users[userIndex].prenom} ${users[userIndex].nom}: ${oldLimit} → ${newLimit}`,
      null,
      modifiedBy,
      userId,
    )
  }

  // Méthodes pour les tontines (modifiées pour supporter les propriétaires)
  async getTontines(userId?: number): Promise<Tontine[]> {
    await this.init()

    // SQL Query: SELECT t.*, u.prenom, u.nom as proprietaire_nom FROM tontines t LEFT JOIN utilisateurs u ON t.proprietaire_id = u.id WHERE (? IS NULL OR t.proprietaire_id = ?) AND t.statut = 'active' ORDER BY t.dateCreation DESC

    const saved = this.storage?.getItem("tontines-data")
    let tontines: Tontine[] = saved ? JSON.parse(saved) : []

    // Filtrer par utilisateur si spécifié
    if (userId) {
      tontines = tontines.filter((t) => t.proprietaire_id === userId)
    }

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

  async createTontine(tontineData: Tontine, userId: number): Promise<Tontine> {
    await this.init()

    // Vérifier les limites de l'utilisateur
    const user = (await this.getUsers()).find((u) => u.id === userId)
    if (!user) throw new Error("Utilisateur non trouvé")

    const userTontines = await this.getTontines(userId)
    if (userTontines.length >= user.limite_tontines) {
      throw new Error(`Limite de ${user.limite_tontines} tontines atteinte`)
    }

    // Validation des données avant insertion
    const validatedData: Tontine = {
      ...tontineData,
      proprietaire_id: userId,
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

    // SQL Query: INSERT INTO tontines (id, proprietaire_id, nom, montant, nombreParticipants, duree, description, dateDebut, dateFin, dateCreation, statut) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

    // Fallback vers localStorage
    const tontines = await this.getTontines()
    tontines.push(validatedData)
    this.storage?.setItem("tontines-data", JSON.stringify(tontines))

    // Mettre à jour le compteur de tontines de l'utilisateur
    const users = await this.getUsers()
    const userIndex = users.findIndex((u) => u.id === userId)
    if (userIndex !== -1) {
      users[userIndex].tontines_creees++
      this.storage?.setItem("users-data", JSON.stringify(users))
    }

    // Log de l'activité
    await this.logActivity("creation_tontine", `Création de la tontine ${validatedData.nom}`, validatedData.id, userId)

    return validatedData
  }

  async updateTontine(
    id: string,
    tontineData: Partial<TontineFormData>,
    userId: number,
  ): Promise<Partial<TontineFormData>> {
    await this.init()

    // SQL Query: UPDATE tontines SET nom = ?, montant = ?, nombreParticipants = ?, duree = ?, description = ?, dateDebut = ?, dateFin = ? WHERE id = ? AND proprietaire_id = ?

    // Fallback vers localStorage
    const tontines = await this.getTontines()
    const index = tontines.findIndex((t) => t.id === id && t.proprietaire_id === userId)
    if (index !== -1) {
      tontines[index] = { ...tontines[index], ...tontineData }
      this.storage?.setItem("tontines-data", JSON.stringify(tontines))
    }

    await this.logActivity("modification_tontine", `Modification de la tontine ${tontineData.nom}`, id, userId)

    return tontineData
  }

  async deleteTontine(id: string, userId: number): Promise<void> {
    await this.init()

    // SQL Query: UPDATE tontines SET statut = 'supprime' WHERE id = ? AND proprietaire_id = ?

    // Fallback vers localStorage
    const tontines = await this.getTontines()
    const filteredTontines = tontines.filter((t) => !(t.id === id && t.proprietaire_id === userId))
    this.storage?.setItem("tontines-data", JSON.stringify(filteredTontines))

    // Mettre à jour le compteur de tontines de l'utilisateur
    const users = await this.getUsers()
    const userIndex = users.findIndex((u) => u.id === userId)
    if (userIndex !== -1) {
      users[userIndex].tontines_creees = Math.max(0, users[userIndex].tontines_creees - 1)
      this.storage?.setItem("users-data", JSON.stringify(users))
    }

    await this.logActivity("suppression_tontine", `Suppression de la tontine`, id, userId)
  }

  // Méthodes pour les participants (inchangées)
  async getParticipants(tontineId: string): Promise<Participant[]> {
    await this.init()

    // SQL Query: SELECT * FROM participants WHERE tontineId = ? ORDER BY ordre ASC

    // Fallback vers localStorage
    const tontines = await this.getTontines()
    const tontine = tontines.find((t) => t.id === tontineId)
    return tontine?.participants || []
  }

  async createParticipant(participantData: Participant & { tontineId: string }, userId: number): Promise<Participant> {
    await this.init()

    // SQL Query: INSERT INTO participants (id, tontineId, prenom, nom, parts, dateAjout, ordre) VALUES (?, ?, ?, ?, ?, ?, ?)

    // Fallback vers localStorage
    const tontines = await this.getTontines()
    const tontineIndex = tontines.findIndex((t) => t.id === participantData.tontineId && t.proprietaire_id === userId)
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
      userId,
    )

    return participantData
  }

  async deleteParticipant(participantId: string, tontineId: string, userId: number): Promise<void> {
    await this.init()

    // SQL Query: DELETE FROM participants WHERE id = ? AND tontineId IN (SELECT id FROM tontines WHERE proprietaire_id = ?)

    // Fallback vers localStorage
    const tontines = await this.getTontines()
    const tontineIndex = tontines.findIndex((t) => t.id === tontineId && t.proprietaire_id === userId)
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

    await this.logActivity("suppression_participant", `Suppression d'un participant`, tontineId, userId)
  }

  // Méthodes pour les paiements (modifiées pour vérifier les permissions)
  async updatePaymentStatus(
    tontineId: string,
    participantId: string,
    mois: number,
    statut: PaymentStatus,
    userId: number,
  ): Promise<void> {
    await this.init()

    // SQL Query: INSERT OR REPLACE INTO paiements_mensuels (tontineId, participantId, mois, montant, statut, datePaiement, dateCreation) VALUES (?, ?, ?, ?, ?, ?, ?) WHERE tontineId IN (SELECT id FROM tontines WHERE proprietaire_id = ?)

    // Fallback vers localStorage
    const tontines = await this.getTontines()
    const tontineIndex = tontines.findIndex((t) => t.id === tontineId && t.proprietaire_id === userId)
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
      userId,
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

  // Méthodes pour les bénéficiaires (modifiées pour vérifier les permissions)
  async setMonthBeneficiary(tontineId: string, participantId: string, mois: number, userId: number): Promise<void> {
    await this.init()

    // SQL Query: INSERT OR REPLACE INTO beneficiaires_mensuels (tontineId, participantId, mois, statut, dateCreation) VALUES (?, ?, ?, 'en_attente', ?) WHERE tontineId IN (SELECT id FROM tontines WHERE proprietaire_id = ?)

    // Fallback vers localStorage
    const tontines = await this.getTontines()
    const tontineIndex = tontines.findIndex((t) => t.id === tontineId && t.proprietaire_id === userId)
    if (tontineIndex !== -1) {
      if (!tontines[tontineIndex].monthlyBeneficiaries) {
        tontines[tontineIndex].monthlyBeneficiaries = {}
      }
      tontines[tontineIndex].monthlyBeneficiaries[mois] = participantId
      this.storage?.setItem("tontines-data", JSON.stringify(tontines))
    }

    await this.logActivity(
      "definition_beneficiaire",
      `Définition du bénéficiaire pour le mois ${mois}`,
      tontineId,
      userId,
    )
  }

  async getMonthBeneficiary(tontineId: string, mois: number): Promise<string | null> {
    await this.init()

    // SQL Query: SELECT participantId FROM beneficiaires_mensuels WHERE tontineId = ? AND mois = ?

    // Fallback vers localStorage
    const tontines = await this.getTontines()
    const tontine = tontines.find((t) => t.id === tontineId)
    return tontine?.monthlyBeneficiaries?.[mois] || null
  }

  // Méthodes pour les statistiques (modifiées pour supporter multi-utilisateurs)
  async getStatistics(userId?: number): Promise<Statistics> {
    await this.init()

    const tontines = await this.getTontines(userId)
    const users = await this.getUsers()
    const requests = await this.getRegistrationRequests()

    const baseStats = {
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

    // Ajouter les statistiques d'administration si c'est un super admin
    if (!userId) {
      return {
        ...baseStats,
        totalUtilisateurs: users.length,
        utilisateursActifs: users.filter((u) => u.actif && u.statut === "approuve").length,
        demandesEnAttente: requests.filter((r) => r.statut === "en_attente").length,
      }
    }

    return baseStats
  }

  // Méthodes pour les logs (modifiées)
  async logActivity(
    action: string,
    details: string,
    tontineId: string | null = null,
    userId: number | null = null,
    cibleUserId: number | null = null,
  ): Promise<void> {
    await this.init()

    // SQL Query: INSERT INTO logs_activite (utilisateurId, action, details, tontineId, cible_utilisateur_id, dateAction) VALUES (?, ?, ?, ?, ?, ?)

    // Stocker réellement les logs dans localStorage
    const logs = await this.getActivityLogs(1000) // Récupérer les logs existants
    const newLog: ActivityLog = {
      id: Date.now(),
      action,
      details,
      username: userId ? (await this.getUsers()).find((u) => u.id === userId)?.username || "Utilisateur" : "Système",
      dateAction: new Date().toISOString(),
      tontineId: tontineId || undefined,
      cible_utilisateur_id: cibleUserId || undefined,
      userId: userId || undefined, // Ajouter l'userId pour le filtrage
    }

    // Ajouter le nouveau log au début
    const updatedLogs = [newLog, ...logs].slice(0, 100) // Garder seulement les 100 derniers
    this.storage?.setItem("activity-logs", JSON.stringify(updatedLogs))

    console.log(`[LOG] ${action}: ${details}`, { tontineId, userId, cibleUserId, date: new Date().toISOString() })
  }

  async getActivityLogs(limit = 50, userId?: number): Promise<ActivityLog[]> {
    await this.init()

    // SQL Query: SELECT l.*, u.username FROM logs_activite l LEFT JOIN utilisateurs u ON l.utilisateurId = u.id ORDER BY l.dateAction DESC LIMIT ?

    // Récupérer les logs depuis localStorage
    const saved = this.storage?.getItem("activity-logs")
    let logs: ActivityLog[] = saved ? JSON.parse(saved) : []

    // Filtrer par utilisateur si spécifié (pour les utilisateurs normaux)
    if (userId) {
      logs = logs.filter((log) => {
        // Récupérer l'ID utilisateur du log (il faut l'ajouter lors de la création des logs)
        return log.userId === userId
      })
    }

    // Si pas de logs sauvegardés, créer des logs d'exemple
    if (logs.length === 0 && !userId) {
      const exampleLogs: ActivityLog[] = [
        {
          id: 1,
          action: "creation_tontine",
          details: "Création de la tontine Famille 2024",
          username: "superadmin",
          dateAction: new Date().toISOString(),
          userId: 1,
        },
        {
          id: 2,
          action: "ajout_participant",
          details: "Ajout d'un nouveau participant",
          username: "superadmin",
          dateAction: new Date(Date.now() - 3600000).toISOString(),
          userId: 1,
        },
        {
          id: 3,
          action: "modification_paiement",
          details: "Modification du statut de paiement",
          username: "superadmin",
          dateAction: new Date(Date.now() - 7200000).toISOString(),
          userId: 1,
        },
      ]
      this.storage?.setItem("activity-logs", JSON.stringify(exampleLogs))
      return exampleLogs.slice(0, limit)
    }

    return logs.slice(0, limit)
  }

  // Méthode pour les rapports (modifiée pour vérifier les permissions)
  async generateMonthlyReport(tontineId: string, mois: number, userId?: number): Promise<MonthlyReport | null> {
    await this.init()

    // SQL Query: SELECT t.nom as tontineName, t.montant, p.id as participantId, p.prenom, p.nom, p.parts, pm.statut as paymentStatus, bm.participantId as beneficiaryId FROM tontines t LEFT JOIN participants p ON t.id = p.tontineId LEFT JOIN paiements_mensuels pm ON p.id = pm.participantId AND pm.mois = ? LEFT JOIN beneficiaires_mensuels bm ON t.id = bm.tontineId AND bm.mois = ? WHERE t.id = ? AND (? IS NULL OR t.proprietaire_id = ?)

    // Fallback vers localStorage pour générer le rapport
    const tontines = await this.getTontines(userId)
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

  // Méthodes pour les visiteurs
  async recordVisitor(visitorData: {
    adresse_ip?: string
    user_agent?: string
    page_visitee?: string
    utilisateur_id?: number
    statut_visite?: "anonyme" | "connecte"
  }): Promise<void> {
    await this.init()

    // SQL Query: INSERT INTO visiteurs (adresse_ip, user_agent, date_visite, page_visitee, utilisateur_id, statut_visite) VALUES (?, ?, ?, ?, ?, ?)

    try {
      // En mode développement, simuler l'enregistrement
      const visitor = {
        id: Date.now(),
        adresse_ip: visitorData.adresse_ip || "localhost",
        user_agent: visitorData.user_agent || navigator.userAgent || "Unknown",
        date_visite: new Date().toISOString(),
        page_visitee: visitorData.page_visitee || "/",
        duree_session: 0,
        utilisateur_id: visitorData.utilisateur_id || null,
        statut_visite: visitorData.statut_visite || "anonyme",
      }

      // Stocker dans localStorage pour la démo
      const visitors = await this.getVisitors(100)
      const updatedVisitors = [visitor, ...visitors].slice(0, 100) // Garder seulement les 100 derniers
      this.storage?.setItem("visitors-data", JSON.stringify(updatedVisitors))

      console.log("[VISITOR] Nouveau visiteur enregistré:", visitor)
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du visiteur:", error)
    }
  }

  // Define the Visitor type at the top of the file or import it from your types
  // type Visitor = {
  //   id: number
  //   adresse_ip: string
  //   user_agent: string
  //   date_visite: string
  //   page_visitee: string
  //   duree_session: number
  //   utilisateur_id: number | null
  //   statut_visite: "anonyme" | "connecte"
  // }

  async getVisitors(limit = 50): Promise<Visitor[]> {
    await this.init()

    // SQL Query: SELECT * FROM visiteurs ORDER BY date_visite DESC LIMIT ?

    const saved = this.storage?.getItem("visitors-data")
    const visitors: Visitor[] = saved ? JSON.parse(saved) : []
    return visitors.slice(0, limit)
  }

  async getVisitorStats(): Promise<{
    totalVisiteurs: number
    visiteursAujourdhui: number
    visiteursCetteSemaine: number
    visiteursConnectes: number
    visiteursAnonymes: number
  }> {
    await this.init()

    const visitors = await this.getVisitors(1000)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    return {
      totalVisiteurs: visitors.length,
      visiteursAujourdhui: visitors.filter((v) => new Date(v.date_visite) >= today).length,
      visiteursCetteSemaine: visitors.filter((v) => new Date(v.date_visite) >= weekAgo).length,
      visiteursConnectes: visitors.filter((v) => v.statut_visite === "connecte").length,
      visiteursAnonymes: visitors.filter((v) => v.statut_visite === "anonyme").length,
    }
  }
}

// Export de l'instance singleton
export const db = new DatabaseManager()
