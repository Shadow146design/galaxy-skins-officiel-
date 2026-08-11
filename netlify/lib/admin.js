// Comptes admin codés en dur — filet de sécurité permanent (comparaison
// insensible à la casse) pour ne jamais se retrouver bloqué hors du panel :
// même si tous les droits "isAdminGranted" sont retirés par erreur, ces
// deux comptes restent admin et peuvent en redonner à quelqu'un d'autre.
// Tous les autres admins sont accordés dynamiquement via le panel (case à
// cocher "Admin" dans la liste des membres → isAdminGranted sur l'utilisateur).
const ADMIN_USERNAMES = ['insane', 'shadow'];

export function isAdminUser(user) {
  if (!user || !user.username) return false;
  if (ADMIN_USERNAMES.includes(user.username.toLowerCase())) return true;
  return Boolean(user.isAdminGranted);
}

// Utile côté UI pour expliquer pourquoi la case "Admin" d'un compte donné
// ne peut pas être décochée (ces comptes restent admin quoi qu'il arrive).
export function isHardcodedAdmin(user) {
  if (!user || !user.username) return false;
  return ADMIN_USERNAMES.includes(user.username.toLowerCase());
}
