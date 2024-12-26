export function getExpirationTimestamp() {
  return new Date(Date.now() + 15 * 60 * 1000);
}

export function filterNullEntries(obj: object) {
  return Object.fromEntries(
    Object.entries({ ...obj }).filter(
      ([, value]) => value !== null && value !== undefined,
    ),
  );
}
