import { getStore } from '@netlify/blobs';

export const usersStore = () => getStore('users');
export const usernameIndexStore = () => getStore('usernames');
export const discordIndexStore = () => getStore('discord-ids');
export const sessionsStore = () => getStore('sessions');
export const applicationsStore = () => getStore('applications');
export const configStore = () => getStore('config');
export const avatarsStore = () => getStore('avatars');
export const clipsMetaStore = () => getStore('clips-meta');
export const clipsVideoStore = () => getStore('clips-video');
