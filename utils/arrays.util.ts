export function filterNullEntries(obj: object) {
  return Object.fromEntries(
    Object.entries({ ...obj }).filter(
      ([, value]) => value !== null && value !== undefined,
    ),
  );
}

export function mapResultToIds<TArray, TObjectType>(
  entityIds: readonly TArray[],
  entityObjects: TObjectType[],
) {
  return entityIds.map(
    (id) => entityObjects.filter((entity) => entity['id'] === id) || null,
  );
}
