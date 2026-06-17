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
  Alert,
  Switch,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { adminApi } from '../../api';
import type { ObservationPoint, TrailSegment } from '../../types';
import Layout from '../../components/Layout';

const statusOptions = ['正常开放', '待巡看', '局部绕行', '维护处理中', '已恢复'];

const ObservationPoints: React.FC = () => {
  const [points, setPoints] = useState<ObservationPoint[]>([]);
  const [segments, setSegments] = useState<TrailSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPoint, setEditingPoint] = useState<ObservationPoint | null>(null);
  const [segmentFilter, setSegmentFilter] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [segmentFilter, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [pointsRes, segmentsRes] = await Promise.all([
        adminApi.getObservationPoints(segmentFilter, statusFilter),
        adminApi.getTrailSegments(),
      ]);
      setPoints(pointsRes.data);
      setSegments(segmentsRes.data);
    } catch (error) {
      setLoadError(true);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingPoint(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (point: ObservationPoint) => {
    setEditingPoint(point);
    form.setFieldsValue(point);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await adminApi.deleteObservationPoint(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingPoint) {
        await adminApi.updateObservationPoint(editingPoint.id, values);
        message.success('更新成功');
      } else {
        await adminApi.createObservationPoint(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getSegmentName = (segmentId: number) => {
    const segment = segments.find((s) => s.id === segmentId);
    return segment?.name || '-';
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
    { title: '观察点名称', dataIndex: 'name', key: 'name' },
    {
      title: '所属分段',
      dataIndex: 'segment_id',
      key: 'segment_id',
      render: (segmentId: number) => getSegmentName(segmentId),
    },
    { title: '纬度', dataIndex: 'latitude', key: 'latitude' },
    { title: '经度', dataIndex: 'longitude', key: 'longitude' },
    {
      title: '有看台',
      dataIndex: 'has_bleachers',
      key: 'has_bleachers',
      render: (has: number) => (has ? '是' : '否'),
    },
    { title: '看台状态', dataIndex: 'bleachers_status', key: 'bleachers_status' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ObservationPoint) => (
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
      {loadError && (
        <Alert
          type="error"
          message="数据加载失败"
          description="无法加载数据，请重试"
          showIcon
          action={<Button size="small" onClick={loadData}>重试</Button>}
          style={{ marginBottom: 16 }}
        />
      )}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增观察点
        </Button>
        <Space>
          <Select
            style={{ width: 180 }}
            placeholder="按分段筛选"
            allowClear
            value={segmentFilter}
            onChange={(value) => setSegmentFilter(value)}
          >
            {segments.map((s) => (
              <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
            ))}
          </Select>
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
        dataSource={points}
        rowKey="id"
        loading={loading}
        scroll={{ x: true }}
      />

      <Modal
        title={editingPoint ? '编辑观察点' : '新增观察点'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="观察点名称" rules={[{ required: true }]}>
            <Input placeholder="请输入观察点名称" />
          </Form.Item>
          <Form.Item name="segment_id" label="所属分段" rules={[{ required: true }]}>
            <Select placeholder="请选择所属分段">
              {segments.map((s) => (
                <Select.Option key={s.id} value={s.id}>
                  {s.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入描述" rows={3} />
          </Form.Item>
          <Form.Item name="latitude" label="纬度">
            <InputNumber style={{ width: '100%' }} placeholder="请输入纬度" step={0.0001} />
          </Form.Item>
          <Form.Item name="longitude" label="经度">
            <InputNumber style={{ width: '100%' }} placeholder="请输入经度" step={0.0001} />
          </Form.Item>
          <Form.Item name="has_bleachers" label="是否有看台" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="bleachers_status" label="看台状态">
            <Select placeholder="请选择看台状态">
              <Select.Option value="正常">正常</Select.Option>
              <Select.Option value="需维修">需维修</Select.Option>
              <Select.Option value="损坏">损坏</Select.Option>
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

export default ObservationPoints;
