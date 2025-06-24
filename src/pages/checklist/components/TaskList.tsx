import React from 'react';
import { List, Checkbox, Tag, Progress } from 'antd';
import { ChecklistCategory, ChecklistItem, Priority } from '../types';

interface TaskListProps {
  category: ChecklistCategory;
}

const TaskList: React.FC<TaskListProps> = ({ category }) => {
  // 这里应该从状态管理中获取任务列表，暂时使用模拟数据
  const tasks: ChecklistItem[] = [
    {
      id: '1',
      title: '预约场地看样',
      description: '查看婚礼场地并确认可用性',
      category: ChecklistCategory.VENUE,
      priority: Priority.HIGH,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.HIGH:
        return 'red';
      case Priority.MEDIUM:
        return 'orange';
      case Priority.LOW:
        return 'green';
      default:
        return 'blue';
    }
  };

  return (
    <List
      size="small"
      dataSource={tasks.filter(task => task.category === category)}
      renderItem={task => (
        <List.Item
          className="flex items-center gap-2 hover:bg-gray-50 p-2 rounded"
        >
          <Checkbox checked={task.completed} />
          <div className="flex-1">
            <div className="font-medium">{task.title}</div>
            {task.description && (
              <div className="text-sm text-gray-500">{task.description}</div>
            )}
          </div>
          <Tag color={getPriorityColor(task.priority)}>
            {task.priority}
          </Tag>
        </List.Item>
      )}
    />
  );
};

export default TaskList; 