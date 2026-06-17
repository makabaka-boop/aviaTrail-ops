import React, { useEffect, useState } from 'react';
import {
  Table,
  Space,
  Tag,
  message,
  Card,
  Select,
  DatePicker,
  Button,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { inspectorApi, adminApi } from '../../api';
import type { TrailSegment } from '../../types';
import Layout from '../../components/Layout';

const { RangePicker } = DatePicker;

const statusOptions = ['正常开放', '待巡看', '局部绕行', '维护处理中', '已恢复'];

const Records: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [segments, setSegments] = useState<TrailSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    segmentId: undefined as number | undefined,
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
    status: undefined as string | undefined,
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [recordsRes, segmentsRes] = await Promise.all([
        inspectorApi.getInspectionRecords(
          filters.segmentId,
          filters.startDate,
          filters.endDate,
          filters.status
        ),
        adminApi.getTrailSegments(),
      ]);
      setRecords(recordsRes.data);
      setSegments(segmentsRes.data);
    } catch (error) {
      message.error('加载巡看记录失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      '正常开放': 'green',
      '局部绕行': 'blue',
      '维护处理中': 'orange',
      '待巡看': 'orange',
      '已恢复': 'green',
    };
    return colors[status] || 'default';
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '路段名称', dataIndex: 'segment_name', key: 'segment_name' },
    { title: '巡看人员', dataIndex: 'inspector_name', key: 'inspector_name' },
    {
      title: '巡看日期',
      dataIndex: 'inspection_date',
      key: 'inspection_date',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
    { title: '遮挡情况', dataIndex: 'obstruction_status', key: 'obstruction_status' },
    { title: '湿滑提示', dataIndex: 'slippery_warning', key: 'slippery_warning' },
    { title: '看台状态', dataIndex: 'bleachers_status', key: 'bleachers_status' },
    {
      title: '总体状态',
      dataIndex: 'overall_status',
      key: 'overall_status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    { title: '处理建议', dataIndex: 'suggestions', key: 'suggestions', ellipsis: true },
  ];

  return (
    <Layout>
      <Card
        title="巡看记录"
        extra={
          <Space>
            <Select
              style={{ width: 150 }}
              placeholder="选择路段"
              allowClear
              onChange={(value) => setFilters({ ...filters, segmentId: value })}
            >
              {segments.map((s) => (
                <Select.Option key={s.id} value={s.id}>
                  {s.name}
                </Select.Option>
              ))}
            </Select>
            <Select
              style={{ width: 150 }}
              placeholder="按状态筛选"
              allowClear
              onChange={(value) => setFilters({ ...filters, status: value })}
            >
              {statusOptions.map((s) => (
                <Select.Option key={s} value={s}>{s}</Select.Option>
              ))}
            </Select>
            <RangePicker
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setFilters({
                    ...filters,
                    startDate: dates[0].format('YYYY-MM-DD'),
                    endDate: dates[1].format('YYYY-MM-DD'),
                  });
                } else {
                  setFilters({ ...filters, startDate: undefined, endDate: undefined });
                }
              }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/inspector/new')}>
              新建记录
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </Layout>
  );
};

export default Records;
