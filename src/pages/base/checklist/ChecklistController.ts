import { inject, injectable } from 'inversify';
import { StoreInterface } from '@/base/port/StoreInterface';
import { WeddingItem } from './types';
import { JSONStorage } from '@qlover/fe-corekit';
import { IOCIdentifier } from '@/core/IOC';

interface ChecklistState {
  items: WeddingItem[];
  loading: boolean;
  error: Error | null;
}

const KEY = 'checklist';

function createDefaultState(storage: JSONStorage): ChecklistState {
  return {
    items: storage.getItem(KEY, []) as WeddingItem[],
    loading: false,
    error: null
  };
}

@injectable()
export class ChecklistController extends StoreInterface<ChecklistState> {
  constructor(
    @inject(IOCIdentifier.JSONStorage)
    protected storage: JSONStorage
  ) {
    super(() => createDefaultState(storage));
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
      this.storage.setItem(KEY, updatedItems);
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
    const updatedItems = this.state.items.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );

    try {
      this.storage.setItem(KEY, updatedItems);
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
    const updatedItems = this.state.items.filter((item) => item.id !== id);

    try {
      this.storage.setItem(KEY, updatedItems);
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
    const updatedItems = this.state.items.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );

    try {
      this.storage.setItem(KEY, updatedItems);
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
      this.storage.removeItem(KEY);
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

  // 导入数据
  importItems = (items: WeddingItem[]) => {
    try {
      // 验证导入的数据格式
      const validItems = items.map(item => ({
        ...item,
        id: item.id || Date.now().toString(),
        completed: Boolean(item.completed),
        dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
        estimatedPrice: item.estimatedPrice ? Number(item.estimatedPrice) : undefined,
        actualPrice: item.actualPrice ? Number(item.actualPrice) : undefined
      }));

      this.storage.setItem(KEY, validItems);
      this.emit({
        ...this.state,
        items: validItems,
        error: null
      });
    } catch (error) {
      this.emit({
        ...this.state,
        error: error as Error
      });
    }
  };

  exportItems(): string {
    return JSON.stringify(this.state.items, null, 2);
  }
}
