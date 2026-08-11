// Décode une data URL ("data:image/png;base64,AAAA...") en { buffer, mimeType }.
// Lève une erreur si le format est invalide.
export function decodeDataUrl(dataUrl) {
  const match = /^data:([\w./+-]+);base64,(.+)$/s.exec(dataUrl || '');
  if (!match) throw new Error('invalid_data_url');
  const [, mimeType, base64] = match;
  const buffer = Buffer.from(base64, 'base64');
  return { buffer, mimeType };
}
