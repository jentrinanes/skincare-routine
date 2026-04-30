export type ProductStatus = 'active' | 'unopened' | 'finished';
export type Period = 'AM' | 'PM';
export type Frequency = 'daily' | 'alternate' | '2x-week' | '1x-week';
export type PatchTestStatus = 'active' | 'passed' | 'failed' | 'abandoned';

export interface Product {
  id: string;
  name: string;
  brand: string;
  type: string;
  status: ProductStatus;
  openedDate: string | null;
  pao: number;
  actives: string[];
  notes: string;
  expiry?: string | null;
}

export interface RoutineItem {
  id: string;
  productId: string;
  period: Period;
  frequency: Frequency;
  startDate: string;
  order: number;
}

export interface Log {
  date: string;
  routineItemId: string;
  period: Period;
  completed: boolean;
  skipped?: boolean;
}

export interface Reaction {
  id: string;
  date: string;
  description: string;
  suspectedProducts: string[];
}

export interface PatchTest {
  id: string;
  productId: string;
  productName: string;
  brand: string;
  startDate: string;
  location: string;
  durationDays: number;
  status: PatchTestStatus;
  reactionNotes: string;
  notes: string;
}

export interface UserNotifications {
  enabled: boolean;
  amTime?: string;
  pmTime?: string;
}

export interface UserProfile {
  name: string;
  skinType: string;
  email: string;
  timezone: string;
  concerns?: string;
  notifications?: UserNotifications;
}

export interface User {
  name: string;
  email: string;
  skinType?: string;
}

export interface AppStore {
  user: User | null;
  products: Product[];
  routine: RoutineItem[];
  logs: Log[];
  reactions: Reaction[];
  patchTests: PatchTest[];
  darkMode: boolean;
  skinTypes: string[];
  userProfile: UserProfile;
}

export type AppPage =
  | 'dashboard'
  | 'products'
  | 'routine'
  | 'reactions'
  | 'patchtest'
  | 'calendar'
  | 'timeline'
  | 'settings';

export type AuthPage = 'login' | 'register' | 'forgot';
