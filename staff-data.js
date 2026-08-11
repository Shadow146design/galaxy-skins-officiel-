'use strict';

/* =========================================================
   Galaxy Sinks™ — staff-data.js
   Données du staff, partagées entre la carte "galaxie" (index.html)
   et les pages de profil individuelles (membre.html?id=...).
   x / y : position en % dans la carte galaxie (0-100).
   size : taille du point sur la carte ('lg' | 'md' | 'sm').
   --------------------------------------------------------- */

const STAFF = {
  insane: {
    name: 'INSANE', role: 'Fondateur · Directeur eSport', tier: 'Direction',
    tagline: 'Clutch Factor', color: '#ffcf5c', x: 50, y: 16, size: 'lg',
    bioSlides: [
      { title: 'Présentation', text: "Fondateur de Galaxy Sinks™ en 2017. C'est lui qui porte la vision compétitive du crew au quotidien — celui qui relance tout le monde avant un scrim." },
      { title: 'Style', text: "Toujours au clutch dans les moments serrés, d'où son surnom en interne. Garde l'énergie du groupe intacte même après une mauvaise série." },
      { title: 'Anecdote', text: "A reconstruit le crew de zéro après la suppression de l'ancien serveur — 10 à 75+ membres en 3 mois, sous sa direction." },
    ],
    rl: { role: 'Attaquant / IGL', voiture: 'Octane', discord: 'Fondateur — accès total' },
    links: { twitch: 'https://www.twitch.tv/galaxysinks', instagram: 'https://www.instagram.com/galaxysinks', discord: 'https://discord.gg/qdvY4hEHqT' },
  },
  shadow: {
    name: 'Shadow', role: 'Administrateur WEB', tier: 'Direction',
    tagline: 'Night Owl', color: '#3fe0ff', x: 25, y: 34, size: 'lg',
    bioSlides: [
      { title: 'Présentation', text: "Développeur du bot et du site de Galaxy Sinks™. Façonne l'univers visuel du projet, du dégradé au dernier pixel qui scintille." },
      { title: 'Style', text: "Travaille surtout la nuit — d'où le pseudo. Perfectionniste sur les détails que personne d'autre ne remarque." },
      { title: 'Anecdote', text: "A reconstruit tout le site et le bot après la renaissance du crew, en partant d'une page blanche." },
    ],
    rl: { role: 'Support technique', voiture: 'Fennec', discord: 'Admin WEB — accès technique' },
    links: { twitch: 'https://www.twitch.tv/galaxysinks', instagram: 'https://www.instagram.com/galaxysinks', discord: 'https://discord.gg/qdvY4hEHqT' },
  },
  lucas: {
    name: 'Lucas', role: 'Modérateur', tier: 'Modération',
    tagline: 'Toujours en ligne', color: '#8c6bff', x: 76, y: 30, size: 'md',
    bioSlides: [
      { title: 'Présentation', text: "Le premier à réagir quand ça part en vrille sur le Discord. Modère avec calme et connaît tout le monde par son pseudo." },
      { title: 'Style', text: "Présent à toute heure, discret mais efficace — le genre de modérateur qu'on remarque seulement quand il n'est pas là." },
    ],
    rl: { role: 'Défenseur', voiture: 'Dominus', discord: 'Modérateur' },
  },
  chelli: {
    name: 'Chelli', role: 'Secrétaire', tier: 'Administration',
    tagline: 'Organisation millimétrée', color: '#ffcf5c', x: 14, y: 58, size: 'md',
    bioSlides: [
      { title: 'Présentation', text: "Tient à jour les plannings, les candidatures et les infos du crew. Sans elle, la moitié des événements n'auraient jamais de date fixe." },
      { title: 'Style', text: "Manageuse de plusieurs divisions du roster — organisation avant tout, aucun détail ne lui échappe." },
    ],
    rl: { role: 'Manageuse — Nova / Vortex / Nixys', voiture: 'Twinzer', discord: 'Secrétaire' },
  },
  vxice: {
    name: 'Vxice', role: 'Équipe Staff', tier: 'Staff',
    tagline: 'Présence rassurante', color: '#3fe0ff', x: 36, y: 68, size: 'sm',
    bioSlides: [
      { title: 'Présentation', text: "Fait partie du noyau staff qui veille sur l'ambiance générale du serveur et accueille les nouveaux membres." },
    ],
    rl: { role: 'Flex', voiture: 'Octane', discord: 'Équipe Staff' },
  },
  luciano: {
    name: 'Luciano', role: 'Équipe Staff', tier: 'Staff',
    tagline: 'Bonne humeur garantie', color: '#8c6bff', x: 58, y: 64, size: 'sm',
    bioSlides: [
      { title: 'Présentation', text: "Membre de l'équipe staff, toujours partant pour animer un vocal ou aider un nouveau à s'installer dans le crew." },
    ],
    rl: { role: 'Flex', voiture: 'Batmobile', discord: 'Équipe Staff' },
  },
  mimi: {
    name: 'Mimi', role: 'Équipe Staff', tier: 'Staff',
    tagline: 'Œil pour le détail', color: '#ffcf5c', x: 82, y: 56, size: 'sm',
    bioSlides: [
      { title: 'Présentation', text: "Fait partie de l'équipe staff — attentive à ce que chaque recoin du Discord reste clair et accueillant." },
    ],
    rl: { role: 'Attaquante — Alpha Division', voiture: 'Fennec', discord: 'Équipe Staff' },
  },
  sass: {
    name: 'Sass', role: 'Équipe Staff', tier: 'Staff',
    tagline: 'Énergie positive', color: '#3fe0ff', x: 48, y: 82, size: 'sm',
    bioSlides: [
      { title: 'Présentation', text: "Membre de l'équipe staff, toujours de bonne humeur — celle qui met l'ambiance dans les scrims du soir." },
    ],
    rl: { role: 'Flex', voiture: 'Octane', discord: 'Équipe Staff' },
  },
  nagzag: {
    name: 'Nagzag', role: 'Vidéaste', tier: 'Pôle vidéo',
    tagline: 'Œil de monteur', color: '#ff8c00', x: 68, y: 14, size: 'md',
    bioSlides: [
      { title: 'Présentation', text: "Filme et monte les meilleurs moments du crew aux côtés d'INSANE — les reprises vidéo, c'est lui." },
      { title: 'Style', text: "Toujours en train de repérer le prochain angle de caméra pendant les matchs du roster." },
    ],
    rl: { role: 'Vidéaste / Analyste', voiture: 'Breakout', discord: 'Pôle vidéo' },
  },
};