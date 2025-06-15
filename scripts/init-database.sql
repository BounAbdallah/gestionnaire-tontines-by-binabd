-- Création de la base de données SQLite pour la gestion des tontines avec multi-utilisateurs

-- Table des utilisateurs étendue
CREATE TABLE IF NOT EXISTS utilisateurs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    telephone TEXT,
    role TEXT DEFAULT 'user', -- 'super_admin', 'admin', 'user'
    statut TEXT DEFAULT 'en_attente', -- 'en_attente', 'approuve', 'rejete', 'suspendu'
    limite_tontines INTEGER DEFAULT 5,
    tontines_creees INTEGER DEFAULT 0,
    date_creation TEXT NOT NULL,
    date_approbation TEXT,
    date_derniere_connexion TEXT,
    approuve_par INTEGER,
    motif_rejet TEXT,
    actif BOOLEAN DEFAULT 1,
    FOREIGN KEY (approuve_par) REFERENCES utilisateurs(id)
);

-- Table des demandes d'inscription
CREATE TABLE IF NOT EXISTS demandes_inscription (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    telephone TEXT,
    password TEXT NOT NULL,
    motif_inscription TEXT,
    statut TEXT DEFAULT 'en_attente', -- 'en_attente', 'approuve', 'rejete'
    date_demande TEXT NOT NULL,
    date_traitement TEXT,
    traite_par INTEGER,
    commentaire_admin TEXT,
    FOREIGN KEY (traite_par) REFERENCES utilisateurs(id)
);

-- Table des tontines avec propriétaire
CREATE TABLE IF NOT EXISTS tontines (
    id TEXT PRIMARY KEY,
    proprietaire_id INTEGER NOT NULL,
    nom TEXT NOT NULL,
    montant INTEGER NOT NULL,
    nombreParticipants INTEGER NOT NULL,
    duree INTEGER NOT NULL,
    description TEXT,
    dateDebut TEXT NOT NULL,
    dateFin TEXT NOT NULL,
    dateCreation TEXT NOT NULL,
    statut TEXT DEFAULT 'active',
    FOREIGN KEY (proprietaire_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- Table des participants
CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY,
    tontineId TEXT NOT NULL,
    prenom TEXT NOT NULL,
    nom TEXT NOT NULL,
    parts INTEGER NOT NULL DEFAULT 1,
    dateAjout TEXT NOT NULL,
    ordre INTEGER,
    FOREIGN KEY (tontineId) REFERENCES tontines(id) ON DELETE CASCADE
);

-- Table des paiements mensuels
CREATE TABLE IF NOT EXISTS paiements_mensuels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tontineId TEXT NOT NULL,
    participantId TEXT NOT NULL,
    mois INTEGER NOT NULL,
    montant INTEGER NOT NULL,
    statut TEXT DEFAULT 'non_paye',
    datePaiement TEXT,
    dateCreation TEXT NOT NULL,
    FOREIGN KEY (tontineId) REFERENCES tontines(id) ON DELETE CASCADE,
    FOREIGN KEY (participantId) REFERENCES participants(id) ON DELETE CASCADE,
    UNIQUE(tontineId, participantId, mois)
);

-- Table des bénéficiaires mensuels
CREATE TABLE IF NOT EXISTS beneficiaires_mensuels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tontineId TEXT NOT NULL,
    participantId TEXT NOT NULL,
    mois INTEGER NOT NULL,
    montantDistribue INTEGER DEFAULT 0,
    dateDistribution TEXT,
    statut TEXT DEFAULT 'en_attente',
    dateCreation TEXT NOT NULL,
    FOREIGN KEY (tontineId) REFERENCES tontines(id) ON DELETE CASCADE,
    FOREIGN KEY (participantId) REFERENCES participants(id) ON DELETE CASCADE,
    UNIQUE(tontineId, mois)
);

-- Table des logs d'activité étendue
CREATE TABLE IF NOT EXISTS logs_activite (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utilisateurId INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    tontineId TEXT,
    cible_utilisateur_id INTEGER,
    dateAction TEXT NOT NULL,
    FOREIGN KEY (utilisateurId) REFERENCES utilisateurs(id),
    FOREIGN KEY (cible_utilisateur_id) REFERENCES utilisateurs(id)
);

-- Table des sessions utilisateurs
CREATE TABLE IF NOT EXISTS sessions_utilisateurs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utilisateur_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    date_creation TEXT NOT NULL,
    date_expiration TEXT NOT NULL,
    actif BOOLEAN DEFAULT 1,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- Table des visiteurs de l'application
CREATE TABLE IF NOT EXISTS visiteurs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    adresse_ip TEXT,
    user_agent TEXT,
    date_visite TEXT NOT NULL,
    page_visitee TEXT DEFAULT '/',
    duree_session INTEGER DEFAULT 0,
    utilisateur_id INTEGER,
    statut_visite TEXT DEFAULT 'anonyme', -- 'anonyme', 'connecte'
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
);

-- Insertion du super administrateur par défaut
INSERT OR IGNORE INTO utilisateurs (
    username, password, email, nom, prenom, role, statut, 
    limite_tontines, date_creation, actif
) VALUES (
    'superadmin', 'admin123', 'admin@tontines.com', 'Super', 'Administrateur', 
    'super_admin', 'approuve', 999, datetime('now'), 1
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_username ON utilisateurs(username);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_statut ON utilisateurs(statut);
CREATE INDEX IF NOT EXISTS idx_tontines_proprietaire ON tontines(proprietaire_id);
CREATE INDEX IF NOT EXISTS idx_participants_tontine ON participants(tontineId);
CREATE INDEX IF NOT EXISTS idx_paiements_tontine_mois ON paiements_mensuels(tontineId, mois);
CREATE INDEX IF NOT EXISTS idx_beneficiaires_tontine_mois ON beneficiaires_mensuels(tontineId, mois);
CREATE INDEX IF NOT EXISTS idx_logs_date ON logs_activite(dateAction);
CREATE INDEX IF NOT EXISTS idx_logs_utilisateur ON logs_activite(utilisateurId);
CREATE INDEX IF NOT EXISTS idx_demandes_statut ON demandes_inscription(statut);
CREATE INDEX IF NOT EXISTS idx_visiteurs_date ON visiteurs(date_visite);
CREATE INDEX IF NOT EXISTS idx_visiteurs_ip ON visiteurs(adresse_ip);
