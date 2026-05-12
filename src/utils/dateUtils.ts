/**
 * Returns a local ISO date string (YYYY-MM-DD) based on the user's current timezone.
 * This ensures that "Today" in the application matches the user's actual calendar day,
 * regardless of UTC offsets.
 */
export const getLocalISODate = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns a local ISO date-time string for filenames or specific logging.
 */
export const getLocalISOString = (date: Date = new Date()): string => {
  const datePart = getLocalISODate(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${datePart}_${hours}-${minutes}-${seconds}`;
};
