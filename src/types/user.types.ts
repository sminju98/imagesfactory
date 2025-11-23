import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  provider: 'password' | 'google';
  points: number;
  emailVerified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  stats?: {
    totalGenerations: number;
    totalImages: number;
    totalPointsUsed: number;
    totalPointsPurchased: number;
  };
}

export interface PointTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'purchase' | 'usage' | 'refund' | 'bonus';
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: Timestamp;
}

