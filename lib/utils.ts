import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Local Storage Utilities ---

/**
 * Saves data to local storage after converting it to JSON.
 * Handles potential errors during stringification or saving.
 * @param key The key under which to store the data.
 * @param data The data to store (must be JSON serializable).
 */
export function saveToLocalStorage<T>(key: string, data: T): void {
  if (typeof window === "undefined") {
    console.warn("Local storage is not available on the server side.");
    return;
  }
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
  } catch (error) {
    console.error(
      `Error saving data to local storage under key "${key}":`,
      error
    );
  }
}

/**
 * Loads data from local storage and parses it from JSON.
 * Handles potential errors during loading or parsing.
 * Returns null if the key doesn't exist or if an error occurs.
 * @param key The key from which to retrieve the data.
 * @returns The parsed data, or null if not found or on error.
 */
export function loadFromLocalStorage<T>(key: string): T | null {
  if (typeof window === "undefined") {
    // console.warn("Local storage is not available on the server side.");
    return null; // Return null on server-side
  }
  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      return null; // Key not found
    }
    // Add specific handling for date strings if needed during parsing
    // For now, standard JSON parsing
    return JSON.parse(serializedData) as T;
  } catch (error) {
    console.error(
      `Error loading data from local storage under key "${key}":`,
      error
    );
    return null; // Return null on error
  }
}
