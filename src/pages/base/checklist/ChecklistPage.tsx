import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Button,
  Input,
  DatePicker,
  Form,
  Select,
  InputNumber,
  Radio,
  Switch,
  Tag,
  Modal,
  Space
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  EditOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { IOC } from '@/core/IOC';
import { ChecklistController } from './ChecklistController';
import { useStore } from '@/uikit/hooks/useStore';
import { ItemCategory, WeddingItem } from './types';

const ChecklistPage: React.FC = () => {
  const controller = IOC.get(ChecklistController);
  const { items, error } = useStore(controller);
  const dialogHandler = IOC('DialogHandler');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<WeddingItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'completed' | 'pending'
  >('all');
  const [form] = Form.useForm();

  useEffect(() => {
    if (error) {
      dialogHandler.error('操作失败，请重试');
    }
  }, [error]);

  // 根据状态筛选项目
  const filteredItems = useMemo(() => {
    switch (statusFilter) {
      case 'completed':
        return items.filter((item) => item.completed);
      case 'pending':
        return items.filter((item) => !item.completed);
      default:
        return items;
    }
  }, [items, statusFilter]);

  // 计算完成进度
  const progress = useMemo(() => {
    if (items.length === 0) return 0;
    const completedCount = items.filter((item) => item.completed).length;
    return Math.round((completedCount / items.length) * 100);
  }, [items]);

  const handleEdit = (record: WeddingItem) => {
    setEditingItem(record);
    form.setFieldsValue({
      ...record,
      dueDate: record.dueDate ? dayjs(record.dueDate) : undefined
    });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        // 更新现有项目
        await controller.updateItem(editingItem.id, {
          ...values,
          dueDate: values.dueDate?.toDate()
        });
      } else {
        // 添加新项目
        await controller.addItem({
          ...values,
          dueDate: values.dueDate?.toDate()
        });
      }
      setIsModalVisible(false);
      setEditingItem(null);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingItem(null);
    form.resetFields();
  };

  const columns: ColumnsType<WeddingItem> = [
    {
      title: '状态',
      dataIndex: 'completed',
      width: 150,
      align: 'center',
      render: (completed: boolean, record) => (
        <div className="flex items-center justify-center space-x-2">
          <Switch
            checked={completed}
            onChange={() => controller.toggleComplete(record.id)}
            checkedChildren={<CheckOutlined />}
            unCheckedChildren={<CloseOutlined />}
            className={`${completed ? 'bg-green-500' : 'bg-gray-400'} transition-all duration-300`}
          />
          <Tag
            color={completed ? 'success' : 'default'}
            className="min-w-[60px] text-center transition-all duration-300"
          >
            {completed ? '已完成' : '待完成'}
          </Tag>
        </div>
      )
    },
    {
      title: '项目',
      dataIndex: 'name',
      width: 200,
      render: (text: string, record) => (
        <span className={record.completed ? 'line-through text-gray-400' : ''}>
          {text}
        </span>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 120,
      render: (category: string) => <Tag color="blue">{category}</Tag>
    },
    {
      title: '预计价格',
      dataIndex: 'estimatedPrice',
      width: 120,
      render: (price?: number) => (
        <span className="text-gray-600">
          {price ? `¥${price.toLocaleString()}` : '-'}
        </span>
      )
    },
    {
      title: '实际价格',
      dataIndex: 'actualPrice',
      width: 120,
      render: (price: number | undefined, record) => (
        <span
          className={`${record.completed ? 'text-green-600' : 'text-gray-600'}`}
        >
          {price ? `¥${price.toLocaleString()}` : '-'}
        </span>
      )
    },
    {
      title: '截止日期',
      dataIndex: 'dueDate',
      width: 120,
      render: (date?: Date) => {
        if (!date) return '-';
        const formattedDate = dayjs(date).format('YYYY-MM-DD');
        const isOverdue = !date && dayjs().isAfter(date, 'day');
        return (
          <Tag color={isOverdue ? 'error' : 'default'}>{formattedDate}</Tag>
        );
      }
    },
    {
      title: '备注',
      dataIndex: 'notes',
      ellipsis: true
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              dialogHandler.confirm({
                title: '确认删除',
                content: `确定要删除"${record.name}"吗？此操作不可恢复。`,
                okText: '删除',
                cancelText: '取消',
                okButtonProps: { danger: true },
                onOk: () => controller.deleteItem(record.id)
              });
            }}
          />
        </Space>
      )
    }
  ];

  const totalEstimated = items.reduce(
    (sum, item) => sum + (item.estimatedPrice || 0),
    0
  );
  const totalActual = items.reduce(
    (sum, item) => sum + (item.actualPrice || 0),
    0
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">备婚清单</h1>
          <div className="text-gray-500 mt-2">
            <div>
              预计总支出: ¥{totalEstimated} | 实际总支出: ¥{totalActual}
            </div>
            <div className="mt-1">
              总进度: {progress}% (已完成{' '}
              {items.filter((item) => item.completed).length} 项， 待完成{' '}
              {items.filter((item) => !item.completed).length} 项)
            </div>
          </div>
        </div>
        <div className="space-x-2">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            添加项目
          </Button>
          <Button
            danger
            onClick={() => {
              dialogHandler.confirm({
                title: '确认清除',
                content: '确定要清除所有数据吗？此操作不可恢复。',
                onOk: () => controller.clearAll()
              });
            }}
          >
            清除所有
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <Radio.Group
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <Radio.Button value="all">全部</Radio.Button>
          <Radio.Button value="pending">待完成</Radio.Button>
          <Radio.Button value="completed">已完成</Radio.Button>
        </Radio.Group>
      </div>

      <Table
        columns={columns}
        dataSource={filteredItems}
        rowKey="id"
        pagination={false}
        className="shadow rounded-lg"
        rowClassName={(record) => (record.completed ? 'bg-gray-50' : '')}
      />

      <Modal
        title={editingItem ? '编辑项目' : '添加新项目'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select>
              {Object.values(ItemCategory).map((category) => (
                <Select.Option key={category} value={category}>
                  {category}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="estimatedPrice" label="预计价格">
            <InputNumber prefix="¥" style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="actualPrice" label="实际价格">
            <InputNumber prefix="¥" style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="dueDate" label="截止日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ChecklistPage;
