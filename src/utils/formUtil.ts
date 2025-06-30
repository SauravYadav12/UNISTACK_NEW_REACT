export function getChangedFields<T extends Record<string, any>>(
  originalData: T,
  editedData: Partial<T>,
  fieldsToCheck: (keyof T)[]
): Partial<T> {
  const changedFields: Partial<T> = {};
  fieldsToCheck.forEach((field) => {
    const originalValue = originalData[field];
    const editedValue = editedData[field];

    if (Array.isArray(originalValue)) {
      if (JSON.stringify(originalValue) !== JSON.stringify(editedValue)) {
        changedFields[field] = editedValue;
      }
    } else if (typeof originalValue === 'object' && originalValue !== null) {
      if (originalValue.toString() !== editedValue?.toString()) {
        changedFields[field] = editedValue;
      }
    } else if (originalValue !== editedValue) {
      changedFields[field] = editedValue;
    }
  });

  return changedFields;
}
