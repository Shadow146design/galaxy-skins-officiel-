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
