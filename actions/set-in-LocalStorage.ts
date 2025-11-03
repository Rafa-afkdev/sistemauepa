"use client";

export const setInLocalstorage = (key: string, value: any) => {
    return localStorage.setItem(key, JSON.stringify(value))
}