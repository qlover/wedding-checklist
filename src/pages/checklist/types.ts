export interface WeddingItem {
  id: string;
  name: string;
  completed: boolean;
  estimatedPrice?: number;  // 预计价格
  actualPrice?: number;     // 实际价格
  notes?: string;          // 备注
  dueDate?: Date;         // 截止日期
  category: ItemCategory;  // 分类
}

// 清单分类
export enum ItemCategory {
  MUST_HAVE = '必需品',
  CLOTHES = '服装饰品',
  PHOTOGRAPHY = '婚纱摄影',
  CEREMONY = '仪式用品',
  OTHERS = '其他'
}

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  category: ChecklistCategory;
  priority: Priority;
  dueDate?: Date;
  completed: boolean;
  budget?: number;
  actualCost?: number;
  vendorInfo?: VendorInfo;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ChecklistCategory {
  VENUE = 'venue',
  ATTIRE = 'attire',
  PHOTOGRAPHY = 'photography',
  CATERING = 'catering',
  DECORATION = 'decoration',
  MUSIC = 'music',
  INVITATION = 'invitation',
  CEREMONY = 'ceremony',
  TRANSPORTATION = 'transportation',
  HONEYMOON = 'honeymoon',
  OTHER = 'other',
}

export enum Priority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export interface VendorInfo {
  name: string;
  contact: string;
  phone?: string;
  email?: string;
  address?: string;
  quotation?: number;
  contractFile?: string;
  notes?: string;
}

export interface Budget {
  total: number;
  spent: number;
  remaining: number;
  categories: Record<ChecklistCategory, number>;
} 