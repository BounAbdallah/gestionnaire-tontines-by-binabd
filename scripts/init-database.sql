-- Création de la base de données SQLite pour la gestion des tontines

-- Table des tontines
CREATE TABLE IF NOT EXISTS tontines (
    id TEXT PRIMARY KEY,
    nom TEXT NOT NULL,
    montant INTEGER NOT NULL,
    nombreParticipants INTEGER NOT NULL,
    duree INTEGER NOT NULL,
    description TEXT,
    dateDebut TEXT NOT NULL,
    dateFin TEXT NOT NULL,
    dateCreation TEXT NOT NULL,
    statut TEXT DEFAULT 'active'
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
    statut TEXT DEFAULT 'non_paye', -- 'paye', 'non_paye'
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
    statut TEXT DEFAULT 'en_attente', -- 'en_attente', 'distribue'
    dateCreation TEXT NOT NULL,
    FOREIGN KEY (tontineId) REFERENCES tontines(id) ON DELETE CASCADE,
    FOREIGN KEY (participantId) REFERENCES participants(id) ON DELETE CASCADE,
    UNIQUE(tontineId, mois)
);

-- Table des utilisateurs (pour l'authentification)
CREATE TABLE IF NOT EXISTS utilisateurs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nom TEXT,
    email TEXT,
    role TEXT DEFAULT 'admin',
    dateCreation TEXT NOT NULL,
    dernierConnexion TEXT
);

-- Table des logs d'activité
CREATE TABLE IF NOT EXISTS logs_activite (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utilisateurId INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    tontineId TEXT,
    dateAction TEXT NOT NULL,
    FOREIGN KEY (utilisateurId) REFERENCES utilisateurs(id)
);

-- Insertion de l'utilisateur admin par défaut
INSERT OR IGNORE INTO utilisateurs (username, password, nom, role, dateCreation) 
VALUES ('admin', 'admin123', 'Administrateur', 'admin', datetime('now'));

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_participants_tontine ON participants(tontineId);
CREATE INDEX IF NOT EXISTS idx_paiements_tontine_mois ON paiements_mensuels(tontineId, mois);
CREATE INDEX IF NOT EXISTS idx_beneficiaires_tontine_mois ON beneficiaires_mensuels(tontineId, mois);
CREATE INDEX IF NOT EXISTS idx_logs_date ON logs_activite(dateAction);
