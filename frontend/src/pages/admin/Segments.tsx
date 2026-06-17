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
import type { TrailSegment } from '../../types';
import Layout from '../../components/Layout';

const statusOptions = ['正常开放', '待巡看', '局部绕行', '维护处理中', '已恢复'];

const Segments: React.FC = () => {
  const [segments, setSegments] = useState<TrailSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSegment, setEditingSegment] = useState<TrailSegment | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [form] = Form.useForm();

  useEffect(() => {
    loadSegments();
  }, [statusFilter]);

  const loadSegments = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getTrailSegments(statusFilter);
      setSegments(response.data);
    } catch (error) {
      message.error('加载步道分段失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingSegment(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (segment: TrailSegment) => {
    setEditingSegment(segment);
    form.setFieldsValue(segment);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await adminApi.deleteTrailSegment(id);
      message.success('删除成功');
      loadSegments();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingSegment) {
        await adminApi.updateTrailSegment(editingSegment.id, values);
        message.success('更新成功');
      } else {
        await adminApi.createTrailSegment(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadSegments();
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
    { title: '分段名称', dataIndex: 'name', key: 'name' },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '起点', dataIndex: 'start_point', key: 'start_point' },
    { title: '终点', dataIndex: 'end_point', key: 'end_point' },
    { title: '长度(km)', dataIndex: 'length_km', key: 'length_km' },
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
      render: (_: any, record: TrailSegment) => (
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
          新增步道分段
        </Button>
        <Space>
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
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={segments}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingSegment ? '编辑步道分段' : '新增步道分段'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="分段名称" rules={[{ required: true }]}>
            <Input placeholder="请输入分段名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入描述" rows={3} />
          </Form.Item>
          <Form.Item name="start_point" label="起点">
            <Input placeholder="请输入起点" />
          </Form.Item>
          <Form.Item name="end_point" label="终点">
            <Input placeholder="请输入终点" />
          </Form.Item>
          <Form.Item name="length_km" label="长度(km)">
            <InputNumber style={{ width: '100%' }} placeholder="请输入长度" min={0} step={0.1} />
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

export default Segments;
