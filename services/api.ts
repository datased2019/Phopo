
import { FamilyMember, User } from '../types';

/**
 * MOCK BACKEND ENGINE
 * Simulates a full-stack REST API with a database (localStorage).
 */

const STORAGE_KEY_MEMBERS = 'phopo_db_members';
const STORAGE_KEY_AUTH = 'phopo_db_session';
const STORAGE_KEY_ME = 'phopo_me_id';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class PhopoAPI {
  private static instance: PhopoAPI;
  private constructor() {}

  public static getInstance(): PhopoAPI {
    if (!PhopoAPI.instance) PhopoAPI.instance = new PhopoAPI();
    return PhopoAPI.instance;
  }

  // --- Auth API ---
  async login(email: string, provider: 'local' | 'google' | 'github'): Promise<User> {
    await sleep(800);
    const user: User = {
      id: `u-${Date.now()}`,
      name: email.split('@')[0],
      email,
      provider,
      avatar: `https://i.pravatar.cc/150?u=${email}`
    };
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
    return user;
  }

  async getCurrentUser(): Promise<User | null> {
    const data = localStorage.getItem(STORAGE_KEY_AUTH);
    return data ? JSON.parse(data) : null;
  }

  async logout() {
    localStorage.removeItem(STORAGE_KEY_AUTH);
  }

  // --- Member API ---
  async getMembers(): Promise<FamilyMember[]> {
    await sleep(400);
    const data = localStorage.getItem(STORAGE_KEY_MEMBERS);
    return data ? JSON.parse(data) : [];
  }

  async saveMembers(members: FamilyMember[]): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    
    await sleep(500); // Simulate network latency
    localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(members));
  }

  // --- Share API ---
  async getSharedTree(encodedData: string): Promise<FamilyMember[]> {
    await sleep(1200); // Simulate longer fetch for external link
    try {
      return JSON.parse(decodeURIComponent(atob(encodedData)));
    } catch (e) {
      throw new Error("Invalid share link");
    }
  }
}

export const api = PhopoAPI.getInstance();
