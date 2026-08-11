export const VALID_ROLES = ['Non défini', 'Attaquant', 'Défenseur', 'Flex / Polyvalent'];

export function isValidRole(role) {
  return VALID_ROLES.includes(role);
}
