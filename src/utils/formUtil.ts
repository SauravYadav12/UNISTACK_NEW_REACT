export function getChangedFields<T extends Record<string, unknown>>(
  originalData: T,
  editedData: Partial<T>,
  fieldsToCheck: (string)[]
): Partial<T> {
  const changedFields: Partial<T> = {};
  fieldsToCheck.forEach((field) => {
    const originalValue = originalData[field];
    const editedValue = editedData[field];

    if (Array.isArray(originalValue)) {
      if (JSON.stringify(originalValue) !== JSON.stringify(editedValue)) {
        (changedFields as Record<string, unknown>)[field] = editedValue;
      }
    } else if (typeof originalValue === 'object' && originalValue !== null) {
      if (originalValue.toString() !== editedValue?.toString()) {
        (changedFields as Record<string, unknown>)[field] = editedValue;
      }
    } else if (originalValue !== editedValue) {
      (changedFields as Record<string, unknown>)[field] = editedValue;
    }
  });

  return changedFields;
}
