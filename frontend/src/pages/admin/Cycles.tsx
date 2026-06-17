import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  InputNumber,
  message,
  Space,
  Alert,
  Tag,
} from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminApi } from '../../api';
import type { InspectionCycle, TrailSegment } from '../../types';
import Layout from '../../components/Layout';

const Cycles: React.FC = () => {
  const [cycles, setCycles] = useState<InspectionCycle[]>([]);
  const [segments, setSegments] = useState<TrailSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCycle, setEditingCycle] = useState<InspectionCycle | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [cyclesRes, segmentsRes] = await Promise.all([
        adminApi.getInspectionCycles(),
        adminApi.getTrailSegments(),
      ]);
      setCycles(cyclesRes.data);
      setSegments(segmentsRes.data);
    } catch (error) {
      setLoadError(true);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCycle(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (cycle: InspectionCycle) => {
    setEditingCycle(cycle);
    form.setFieldsValue(cycle);
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingCycle) {
        await adminApi.updateInspectionCycle(editingCycle.id, values);
        message.success('更新成功');
      } else {
        await adminApi.createInspectionCycle(values);
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

  const isOverdue = (nextDate: string) => {
    return dayjs(nextDate).isBefore(dayjs());
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: '所属分段',
      dataIndex: 'segment_id',
      key: 'segment_id',
      render: (segmentId: number) => getSegmentName(segmentId),
    },
    { title: '巡看周期(天)', dataIndex: 'cycle_days', key: 'cycle_days' },
    { title: '上次巡看', dataIndex: 'last_inspection_date', key: 'last_inspection_date',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    { 
      title: '下次巡看', 
      dataIndex: 'next_inspection_date', 
      key: 'next_inspection_date',
      render: (date: string) => {
        if (!date) return '-';
        const overdue = isOverdue(date);
        return (
          <Tag color={overdue ? 'red' : 'green'}>
            {dayjs(date).format('YYYY-MM-DD')}
          </Tag>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: InspectionCycle) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
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
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增巡看周期
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={cycles}
        rowKey="id"
        loading={loading}
        scroll={{ x: true }}
      />

      <Modal
        title={editingCycle ? '编辑巡看周期' : '新增巡看周期'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="segment_id" label="所属分段" rules={[{ required: true }]}>
            <Select placeholder="请选择所属分段">
              {segments.map((s) => (
                <Select.Option key={s.id} value={s.id}>
                  {s.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="cycle_days" label="巡看周期(天)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} placeholder="请输入巡看周期" min={1} />
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

export default Cycles;
