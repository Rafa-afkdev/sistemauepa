"use client";

export const getFromLocalstorage = (key: string) => {
    const value = localStorage.getItem(key);
    try {
        return value ? JSON.parse(value) : null;
    } catch (error) {
        console.error(`Error parsing JSON from localStorage for key "${key}":`, error);
        return null;
    }
};
