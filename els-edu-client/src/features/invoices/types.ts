export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  subjectOrCourseId?: string | number;
}

export interface Invoice {
  id: string | number;
  number: string;
  date: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: 'INR' | 'USD';
  targetType: 'ORG' | 'USER';
  targetId: string | number;
  targetName: string;
  categoryType: 'course' | 'subject';
  categoryId: string | number;
  categoryName: string;
  lineItems: LineItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string | number;
  name: string;
  billingAddress?: string;
}

export interface User {
  id: string | number;
  name: string;
  email: string;
  billingAddress?: string;
}

export interface Course {
  id: string | number;
  name: string;
  code?: string;
}

export interface Subject {
  id: string | number;
  name: string;
  code?: string;
}