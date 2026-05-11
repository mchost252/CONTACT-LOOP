export type Category = 'All' | 'Individual' | 'Creator' | 'Business' | 'Other';

export interface UserContact {
  id: string;
  name: string;
  phone: string;
  category: Category;
  imageUrl?: string;
  createdAt: any; // Firestore Timestamp
  expiresAt: any; // Firestore Timestamp
}

export interface Stats {
  totalActive: number;
  joinedToday: number;
  categoryCounts: Record<Category, number>;
}
