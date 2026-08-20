export interface Complaint {
  complaintId: string;
  customerId: string;
  category: 'billing' | 'technical' | 'service' | 'test';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  description: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateComplaintRequest {
  customerId: string;
  category: string;
  description: string;
}
