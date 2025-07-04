import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Space,
  message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  ImportOutlined,
  UploadOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { IOC } from '@/core/IOC';
import { ChecklistController } from './ChecklistController';
import { useStore } from '@/uikit/hooks/useStore';
import { ItemCategory, WeddingItem } from './types';
import { useTranslation } from 'react-i18next';
import * as i18nKeys from '@config/Identifier/CheckList';

const ChecklistPage: React.FC = () => {
  const { t } = useTranslation();
  const controller = IOC.get(ChecklistController);
  const { items } = useStore(controller);
  const dialogHandler = IOC('DialogHandler');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<WeddingItem | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'completed' | 'pending'
  >('all');
  const [form] = Form.useForm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (error) {
      dialogHandler.error(t(i18nKeys.CHECKLIST_IMPORT_ERROR));
      setError(null);
    }
  }, [error, dialogHandler, t]);

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

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);

        if (Array.isArray(importedData)) {
          controller.importItems(importedData);
          message.success(t(i18nKeys.CHECKLIST_IMPORT_SUCCESS));
          setIsImportModalVisible(false);
        } else {
          throw new Error('Invalid format');
        }
      } catch (err) {
        setError(err as Error);
        message.error(t(i18nKeys.CHECKLIST_IMPORT_ERROR));
      }

      // 清除文件输入，以便可以重新选择相同的文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const jsonStr = controller.exportItems();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wedding-checklist-${dayjs().format('YYYY-MM-DD')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success(t(i18nKeys.CHECKLIST_EXPORT_SUCCESS));
  };

  const columns: ColumnsType<WeddingItem> = [
    {
      title: t(i18nKeys.CHECKLIST_COLUMN_STATUS),
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
            {completed
              ? t(i18nKeys.CHECKLIST_STATUS_COMPLETED)
              : t(i18nKeys.CHECKLIST_STATUS_PENDING)}
          </Tag>
        </div>
      )
    },
    {
      title: t(i18nKeys.CHECKLIST_COLUMN_NAME),
      dataIndex: 'name',
      width: 200,
      render: (text: string, record) => (
        <span className={record.completed ? 'line-through text-gray-400' : ''}>
          {text}
        </span>
      )
    },
    {
      title: t(i18nKeys.CHECKLIST_COLUMN_CATEGORY),
      dataIndex: 'category',
      width: 120,
      render: (category: string) => <Tag color="blue">{category}</Tag>
    },
    {
      title: t(i18nKeys.CHECKLIST_COLUMN_ESTIMATED_PRICE),
      dataIndex: 'estimatedPrice',
      width: 120,
      render: (price?: number) => (
        <span className="text-gray-600">
          {price ? `¥${price.toLocaleString()}` : '-'}
        </span>
      )
    },
    {
      title: t(i18nKeys.CHECKLIST_COLUMN_ACTUAL_PRICE),
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
      title: t(i18nKeys.CHECKLIST_COLUMN_DUE_DATE),
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
      title: t(i18nKeys.CHECKLIST_COLUMN_NOTES),
      dataIndex: 'notes',
      ellipsis: true
    },
    {
      title: t(i18nKeys.CHECKLIST_COLUMN_ACTIONS),
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
                title: t(i18nKeys.CHECKLIST_DELETE_CONFIRM_TITLE),
                content: t(i18nKeys.CHECKLIST_DELETE_CONFIRM_CONTENT),
                okText: t(i18nKeys.CHECKLIST_DELETE_CONFIRM_OK),
                cancelText: t(i18nKeys.CHECKLIST_DELETE_CONFIRM_CANCEL),
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
          <h1 className="text-2xl font-bold">
            {t(i18nKeys.CHECKLIST_PAGE_TITLE)}
          </h1>
          <div className="text-gray-500 mt-2">
            <div>
              {t(i18nKeys.CHECKLIST_TOTAL_ESTIMATED)}: ¥
              {totalEstimated.toLocaleString()} |{' '}
              {t(i18nKeys.CHECKLIST_TOTAL_ACTUAL)}: ¥
              {totalActual.toLocaleString()}
            </div>
            <div className="mt-1">
              {t(i18nKeys.CHECKLIST_PROGRESS)}: {progress}% (
              {t(i18nKeys.CHECKLIST_STATUS_COMPLETED)}{' '}
              {items.filter((item) => item.completed).length}{' '}
              {t('common.items')}, {t(i18nKeys.CHECKLIST_STATUS_PENDING)}{' '}
              {items.filter((item) => !item.completed).length}{' '}
              {t('common.items')})
            </div>
          </div>
        </div>
        <div className="space-x-2">
          <Button
            icon={<ImportOutlined />}
            onClick={() => setIsImportModalVisible(true)}
          >
            {t(i18nKeys.CHECKLIST_BTN_IMPORT)}
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            {t(i18nKeys.CHECKLIST_BTN_EXPORT)}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            {t(i18nKeys.CHECKLIST_BTN_ADD)}
          </Button>
          <Button
            danger
            onClick={() => {
              dialogHandler.confirm({
                title: t(i18nKeys.CHECKLIST_CLEAR_CONFIRM_TITLE),
                content: t(i18nKeys.CHECKLIST_CLEAR_CONFIRM_CONTENT),
                onOk: () => controller.clearAll()
              });
            }}
          >
            {t(i18nKeys.CHECKLIST_BTN_CLEAR)}
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <Radio.Group
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <Radio.Button value="all">
            {t(i18nKeys.CHECKLIST_FILTER_ALL)}
          </Radio.Button>
          <Radio.Button value="pending">
            {t(i18nKeys.CHECKLIST_STATUS_PENDING)}
          </Radio.Button>
          <Radio.Button value="completed">
            {t(i18nKeys.CHECKLIST_STATUS_COMPLETED)}
          </Radio.Button>
        </Radio.Group>
      </div>

      <Table
        columns={columns}
        dataSource={filteredItems}
        rowKey="id"
        pagination={false}
        className="shadow rounded-lg"
        rowClassName={(record) => (record.completed ? 'bg-primary-tcb' : '')}
      />

      <Modal
        title={
          editingItem
            ? t(i18nKeys.CHECKLIST_MODAL_EDIT_TITLE)
            : t(i18nKeys.CHECKLIST_MODAL_ADD_TITLE)
        }
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={t(i18nKeys.CHECKLIST_FORM_NAME)}
            rules={[
              {
                required: true,
                message: t(i18nKeys.CHECKLIST_FORM_NAME_REQUIRED)
              }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="category"
            label={t(i18nKeys.CHECKLIST_FORM_CATEGORY)}
            rules={[
              {
                required: true,
                message: t(i18nKeys.CHECKLIST_FORM_CATEGORY_REQUIRED)
              }
            ]}
          >
            <Select>
              {Object.values(ItemCategory).map((category) => (
                <Select.Option key={category} value={category}>
                  {category}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="estimatedPrice"
            label={t(i18nKeys.CHECKLIST_FORM_ESTIMATED_PRICE)}
          >
            <InputNumber prefix="¥" style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item
            name="actualPrice"
            label={t(i18nKeys.CHECKLIST_FORM_ACTUAL_PRICE)}
          >
            <InputNumber prefix="¥" style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="dueDate" label={t(i18nKeys.CHECKLIST_FORM_DUE_DATE)}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label={t(i18nKeys.CHECKLIST_FORM_NOTES)}>
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t(i18nKeys.CHECKLIST_MODAL_IMPORT_TITLE)}
        open={isImportModalVisible}
        onCancel={() => setIsImportModalVisible(false)}
        footer={null}
      >
        <div className="p-4 text-center">
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            ref={fileInputRef}
            className="hidden"
            id="fileInput"
          />
          <label
            htmlFor="fileInput"
            className="inline-block cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            <UploadOutlined className="mr-2" />
            {t(i18nKeys.CHECKLIST_BTN_IMPORT)}
          </label>
          <p className="mt-4 text-gray-500 text-sm">
            请选择JSON格式的数据文件导入
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ChecklistPage;
