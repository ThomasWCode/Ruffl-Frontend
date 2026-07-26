export type UserRole = 'commissioner' | 'maker' | 'admin';
export type CommissionStatus =
  | 'pending'
  | 'negotiating'
  | 'price_proposed'
  | 'accepted'
  | 'active'
  | 'shipping'
  | 'complete'
  | 'cancelled'
  | 'disputed';
export type MilestoneStatus = 'locked' | 'active' | 'posted' | 'complete';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: 'active' | 'suspended' | 'deleted';
  bio?: string;
  avatarUrl?: string;
  suspendedUntil?: string;
  suspensionReason?: string;
}

export interface MakerProfile {
  userId: string;
  bio: string;
  location: string;
  specialisms: string[];
  basePrices: { head: number; partial: number; full: number };
  addOnPrices: { movingJaw: number; followMeEyes: number; coolingFan: number };
  turnaroundWeeks: number;
  queueOpen: boolean;
  verified: boolean;
  trusted: boolean;
  bannerUrl?: string;
}

export interface MakerResult {
  user: User;
  profile: MakerProfile;
  rating: number | null;
  completedCount: number;
  reviews: Review[];
}

export interface Commission {
  id: string;
  commissionerId: string;
  makerId: string;
  title: string;
  suitType: 'head' | 'partial' | 'full' | 'custom';
  species: string;
  description: string;
  referenceNotes: string;
  budget: number;
  proposedPrice?: number;
  agreedTotal?: number;
  depositAmount?: number;
  depositPaid: boolean;
  status: CommissionStatus;
  trackingNumber?: string;
  updatedAt: string;
}

export interface MilestoneUpdate {
  id: string;
  notes: string;
  attachments: { url: string; name: string; contentType: string }[];
  createdAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  position: number;
  status: MilestoneStatus;
  paymentAmount: number;
  updates: MilestoneUpdate[];
}

export interface CommissionDetail {
  commission: Commission;
  milestones: Milestone[];
  negotiations: {
    id: string;
    action: 'proposal' | 'accepted' | 'rejected';
    amount?: number;
    note?: string;
    createdAt: string;
  }[];
  materials: {
    id: string;
    item: string;
    quantity: number;
    unit: string;
    costPerUnit: number;
  }[];
  dispute: null | { id: string; status: string; explanation: string; resolution?: string };
}

export interface Review {
  id: string;
  quality: number;
  communication: number;
  accuracy: number;
  packaging: number;
  timeline: number;
  comment: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  kind: 'commission' | 'direct' | 'dispute' | 'admin';
  participantIds: string[];
  commissionId?: string;
  lastMessage: Message | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}
