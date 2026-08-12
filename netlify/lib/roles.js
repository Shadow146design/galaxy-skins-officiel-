export const VALID_ROLES = ['Non défini', 'Attaquant', 'Défenseur', 'Flex / Polyvalent'];

export function isValidRole(role) {
  return VALID_ROLES.includes(role);
}

// Poste au sein de l'organisation (distinct du rôle en jeu ci-dessus) —
// assigné uniquement par le staff via le panel admin.
export const STAFF_ROLES = [
  'Membre',
  'Recruteur',
  'Coach',
  'Manageur',
  'Modérateur',
  'Cyber Sécurité',
  'Staff',
  'Admin',
  'Créateur',
];

export function isValidStaffRole(staffRole) {
  return STAFF_ROLES.includes(staffRole);
}

// Postes que le staff seul peut attribuer (panel admin) — trop sensibles
// pour être auto-déclarés par un membre depuis son profil.
const ADMIN_ONLY_STAFF_ROLES = ['Modérateur', 'Admin', 'Créateur'];

export const SELF_STAFF_ROLES = STAFF_ROLES.filter((r) => !ADMIN_ONLY_STAFF_ROLES.includes(r));

export function isValidSelfStaffRole(staffRole) {
  return SELF_STAFF_ROLES.includes(staffRole);
}
