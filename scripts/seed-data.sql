-- Données d'exemple pour tester l'application

-- Insertion d'une tontine d'exemple
INSERT OR IGNORE INTO tontines (
    id, nom, montant, nombreParticipants, duree, description, 
    dateDebut, dateFin, dateCreation, statut
) VALUES (
    'tontine-exemple-1',
    'Tontine Famille 2024',
    25000,
    4,
    6,
    'Tontine familiale pour l''année 2024',
    date('now'),
    date('now', '+6 months'),
    datetime('now'),
    'active'
);

-- Insertion des participants d'exemple
INSERT OR IGNORE INTO participants (id, tontineId, prenom, nom, parts, dateAjout, ordre) VALUES
('part-1', 'tontine-exemple-1', 'Jean', 'Dupont', 1, datetime('now'), 1),
('part-2', 'tontine-exemple-1', 'Marie', 'Martin', 2, datetime('now'), 2),
('part-3', 'tontine-exemple-1', 'Pierre', 'Durand', 1, datetime('now'), 3),
('part-4', 'tontine-exemple-1', 'Sophie', 'Bernard', 1, datetime('now'), 4);

-- Insertion des paiements d'exemple pour le premier mois
INSERT OR IGNORE INTO paiements_mensuels (tontineId, participantId, mois, montant, statut, datePaiement, dateCreation) VALUES
('tontine-exemple-1', 'part-1', 1, 25000, 'paye', datetime('now'), datetime('now')),
('tontine-exemple-1', 'part-2', 1, 50000, 'paye', datetime('now'), datetime('now')),
('tontine-exemple-1', 'part-3', 1, 25000, 'non_paye', NULL, datetime('now')),
('tontine-exemple-1', 'part-4', 1, 25000, 'non_paye', NULL, datetime('now'));

-- Définition du bénéficiaire pour le premier mois
INSERT OR IGNORE INTO beneficiaires_mensuels (tontineId, participantId, mois, statut, dateCreation) VALUES
('tontine-exemple-1', 'part-1', 1, 'en_attente', datetime('now'));

-- Log d'activité d'exemple
INSERT INTO logs_activite (utilisateurId, action, details, tontineId, dateAction) VALUES
(1, 'creation_tontine', 'Création de la tontine Famille 2024', 'tontine-exemple-1', datetime('now'));
