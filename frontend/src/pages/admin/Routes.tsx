import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Popconfirm,
  Space,
  Tag,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { adminApi } from '../../api';
import type { ActivityRoute } from '../../types';
import Layout from '../../components/Layout';

const statusOptions = ['正常开放', '待巡看', '局部绕行', '维护处理中', '已恢复'];

const Routes: React.FC = () => {
  const [routes, setRoutes] = useState<ActivityRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoute, setEditingRoute] = useState<ActivityRoute | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [form] = Form.useForm();

  useEffect(() => {
    loadRoutes();
  }, [statusFilter]);

  const loadRoutes = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await adminApi.getActivityRoutes(statusFilter);
      setRoutes(response.data);
    } catch (error) {
      message.error('加载活动路线失败');
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    if (loadError) {
      message.error('数据加载失败，请刷新后重试');
      return;
    }
    setEditingRoute(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (route: ActivityRoute) => {
    if (loadError) {
      message.error('数据加载失败，请刷新后重试');
      return;
    }
    setEditingRoute(route);
    form.setFieldsValue(route);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await adminApi.deleteActivityRoute(id);
      message.success('删除成功');
      loadRoutes();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingRoute) {
        await adminApi.updateActivityRoute(editingRoute.id, values);
        message.success('更新成功');
      } else {
        await adminApi.createActivityRoute(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadRoutes();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      '正常开放': 'green',
      '待巡看': 'orange',
      '局部绕行': 'blue',
      '维护处理中': 'red',
      '已恢复': 'green',
    };
    return colors[status] || 'default';
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '路线名称', dataIndex: 'name', key: 'name' },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '预估时长(分钟)', dataIndex: 'estimated_duration_minutes', key: 'estimated_duration_minutes' },
    { title: '最大人数', dataIndex: 'max_people', key: 'max_people' },
    { title: '难度', dataIndex: 'difficulty', key: 'difficulty' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ActivityRoute) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Layout>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增活动路线
        </Button>
        <Select
          style={{ width: 150 }}
          placeholder="按状态筛选"
          allowClear
          value={statusFilter}
          onChange={(value) => setStatusFilter(value)}
        >
          {statusOptions.map((s) => (
            <Select.Option key={s} value={s}>{s}</Select.Option>
          ))}
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={routes}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingRoute ? '编辑活动路线' : '新增活动路线'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="路线名称" rules={[{ required: true }]}>
            <Input placeholder="请输入路线名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入描述" rows={3} />
          </Form.Item>
          <Form.Item
            name="segment_ids"
            label="包含分段ID"
            rules={[
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  if (!/^[\d,]+$/.test(value)) {
                    return Promise.reject(new Error('只能输入数字和英文逗号'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input placeholder="请输入分段ID，用英文逗号分隔" />
          </Form.Item>
          <Form.Item name="estimated_duration_minutes" label="预估时长(分钟)">
            <InputNumber style={{ width: '100%' }} placeholder="请输入预估时长" min={0} />
          </Form.Item>
          <Form.Item name="max_people" label="最大人数">
            <InputNumber style={{ width: '100%' }} placeholder="请输入最大人数" min={0} />
          </Form.Item>
          <Form.Item name="difficulty" label="难度">
            <Select placeholder="请选择难度">
              <Select.Option value="简单">简单</Select.Option>
              <Select.Option value="中等">中等</Select.Option>
              <Select.Option value="困难">困难</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态">
              {statusOptions.map((s) => (
                <Select.Option key={s} value={s}>{s}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确定
              </Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default Routes;
