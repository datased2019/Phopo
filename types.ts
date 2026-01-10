
export type Gender = 'male' | 'female' | 'other';

export interface FamilyMember {
  id: string;
  name: string;
  gender: Gender;
  birthDate?: string;
  deathDate?: string;
  photo?: string;
  bio?: string;
  parentId1?: string; 
  parentId2?: string; 
  spouseId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: 'local' | 'google' | 'github';
}

export interface AppState {
  members: FamilyMember[];
  user: User | null;
}
