export function getExpirationTimestamp() {
  return new Date(Date.now() + 15 * 60 * 1000);
}