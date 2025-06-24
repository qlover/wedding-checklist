import { WeddingItem } from '../types';

const STORAGE_KEY = 'wedding-checklist-items';

export const StorageService = {
  // 保存所有项目
  saveItems(items: WeddingItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving items to localStorage:', error);
    }
  },

  // 获取所有项目
  getItems(): WeddingItem[] {
    try {
      const items = localStorage.getItem(STORAGE_KEY);
      if (items) {
        // 将日期字符串转换回 Date 对象
        return JSON.parse(items).map((item: WeddingItem) => ({
          ...item,
          dueDate: item.dueDate ? new Date(item.dueDate) : undefined
        }));
      }
      return [];
    } catch (error) {
      console.error('Error reading items from localStorage:', error);
      return [];
    }
  },

  // 清除所有数据
  clearItems(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing items from localStorage:', error);
    }
  }
}; 