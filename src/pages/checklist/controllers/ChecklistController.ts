import { injectable } from 'inversify';
import { StoreInterface } from '@/base/port/StoreInterface';
import { WeddingItem } from '../types';
import { StorageService } from '../services/storage';

interface ChecklistState {
  items: WeddingItem[];
  loading: boolean;
  error: Error | null;
}

function createDefaultState(): ChecklistState {
  return {
    items: StorageService.getItems(),
    loading: false,
    error: null
  };
}

@injectable()
export class ChecklistController extends StoreInterface<ChecklistState> {
  constructor() {
    super(createDefaultState);
  }

  // 选择器
  selector = {
    items: (state: ChecklistState) => state.items,
    loading: (state: ChecklistState) => state.loading,
    error: (state: ChecklistState) => state.error
  };

  // 添加新项目
  addItem = async (item: Omit<WeddingItem, 'id' | 'completed'>) => {
    const newItem: WeddingItem = {
      id: Date.now().toString(),
      completed: false,
      ...item
    };

    const updatedItems = [...this.state.items, newItem];
    
    try {
      StorageService.saveItems(updatedItems);
      this.emit({
        ...this.state,
        items: updatedItems,
        error: null
      });
    } catch (error) {
      this.emit({
        ...this.state,
        error: error as Error
      });
    }
  };

  // 更新项目
  updateItem = (id: string, updates: Partial<WeddingItem>) => {
    const updatedItems = this.state.items.map(item =>
      item.id === id ? { ...item, ...updates } : item
    );

    try {
      StorageService.saveItems(updatedItems);
      this.emit({
        ...this.state,
        items: updatedItems,
        error: null
      });
    } catch (error) {
      this.emit({
        ...this.state,
        error: error as Error
      });
    }
  };

  // 删除项目
  deleteItem = (id: string) => {
    const updatedItems = this.state.items.filter(item => item.id !== id);

    try {
      StorageService.saveItems(updatedItems);
      this.emit({
        ...this.state,
        items: updatedItems,
        error: null
      });
    } catch (error) {
      this.emit({
        ...this.state,
        error: error as Error
      });
    }
  };

  // 切换完成状态
  toggleComplete = (id: string) => {
    const updatedItems = this.state.items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );

    try {
      StorageService.saveItems(updatedItems);
      this.emit({
        ...this.state,
        items: updatedItems,
        error: null
      });
    } catch (error) {
      this.emit({
        ...this.state,
        error: error as Error
      });
    }
  };

  // 清除所有数据
  clearAll = () => {
    try {
      StorageService.clearItems();
      this.emit({
        ...this.state,
        items: [],
        error: null
      });
    } catch (error) {
      this.emit({
        ...this.state,
        error: error as Error
      });
    }
  };
} 