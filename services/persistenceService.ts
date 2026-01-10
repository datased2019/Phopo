
import { FamilyMember } from '../types';

const STORAGE_KEY = 'phopo_family_tree';

export const saveTree = (members: FamilyMember[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
};

export const loadTree = (): FamilyMember[] | null => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

export const generateShareLink = (members: FamilyMember[]): string => {
  const data = btoa(encodeURIComponent(JSON.stringify(members)));
  const url = new URL(window.location.href);
  url.searchParams.set('tree', data);
  return url.toString();
};

export const loadSharedTree = (): FamilyMember[] | null => {
  const params = new URLSearchParams(window.location.search);
  const data = params.get('tree');
  if (!data) return null;
  try {
    return JSON.parse(decodeURIComponent(atob(data)));
  } catch (e) {
    console.error("Failed to parse shared tree", e);
    return null;
  }
};
