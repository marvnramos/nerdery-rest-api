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

export function encodeBase64(data: string) {
  return Buffer.from(data).toString('base64');
}

export function decodeBase64(data: string) {
  return Buffer.from(data, 'base64').toString('utf-8');
}

export function mapResultToIds<TArray, TObjectType>(
  entityIds: readonly TArray[],
  entityObjects: TObjectType[],
) {
  return entityIds.map(
    (id) => entityObjects.filter((entity) => entity['id'] === id) || null,
  );
}
