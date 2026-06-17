import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, message, Card } from 'antd';
import { CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { inspectorApi } from '../../api';
import Layout from '../../components/Layout';
import { useNavigate } from 'react-router-dom';

const Pending: React.FC = () => {
  const [pendingSegments, setPendingSegments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadPendingSegments();
  }, []);

  const loadPendingSegments = async () => {
    setLoading(true);
    try {
      const response = await inspectorApi.getPendingSegments();
      setPendingSegments(response.data);
    } catch (error) {
      message.error('加载待巡看路段失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: '路段ID', dataIndex: 'segment_id', key: 'segment_id', width: 100 },
    { title: '路段名称', dataIndex: 'segment_name', key: 'segment_name' },
    {
      title: '计划巡看日期',
      dataIndex: 'next_inspection_date',
      key: 'next_inspection_date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '状态',
      key: 'is_overdue',
      render: (_: any, record: any) => (
        <Tag color={record.is_overdue ? 'red' : 'orange'}>
          {record.is_overdue ? (
            <Space>
              <WarningOutlined /> 已超期
            </Space>
          ) : (
            <Space>
              <CheckCircleOutlined /> 今日待巡看
            </Space>
          )}
        </Tag>
      ),
    },
    { title: '当前状态', dataIndex: 'status', key: 'status' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button
          type="primary"
          size="small"
          onClick={() => navigate('/inspector/new', { state: { segmentId: record.segment_id } })}
        >
          开始巡看
        </Button>
      ),
    },
  ];

  return (
    <Layout>
      <Card title="待巡看路段">
        <Table
          columns={columns}
          dataSource={pendingSegments}
          rowKey="segment_id"
          loading={loading}
        />
      </Card>
    </Layout>
  );
};

export default Pending;
