export interface Company {
  id: number;
  name: string;
  industry: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  bio?: string;
  companyIds?: number[];
}

export interface GuestUserInputAstro {
  date: string;
  time?: string | null;
  city: string;
  timezone?: string | null;
}
