import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  message,
  Card,
  Select,
  DatePicker,
  Modal,
  Form,
  Input,
  Rate,
  Tooltip,
} from 'antd';
import { PlusOutlined, SyncOutlined, CommentOutlined, WarningOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { leaderApi, adminApi } from '../../api';
import type { ActivityRoute } from '../../types';
import Layout from '../../components/Layout';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const batchStatusOptions = ['已登记', '进行中', '已改线', '已完成', '已取消'];

const Batches: React.FC = () => {
  const [batches, setBatches] = useState<any[]>([]);
  const [routes, setRoutes] = useState<ActivityRoute[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    routeId: undefined as number | undefined,
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
    status: undefined as string | undefined,
    leaderId: undefined as number | undefined,
  });
  const [changeModalVisible, setChangeModalVisible] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [riskDetailVisible, setRiskDetailVisible] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [changeForm] = Form.useForm();
  const [feedbackForm] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [batchesRes, routesRes, usersRes] = await Promise.all([
        leaderApi.getBatches(
          filters.routeId,
          filters.startDate,
          filters.endDate,
          filters.status,
          filters.leaderId
        ),
        adminApi.getActivityRoutes(),
        adminApi.getUsers(),
      ]);
      setBatches(batchesRes.data);
      setRoutes(routesRes.data);
      setLeaders(usersRes.data.filter((u: any) => u.role === '活动领队'));
    } catch (error) {
      message.error('加载活动批次失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      '已登记': 'blue',
      '进行中': 'orange',
      '已改线': 'purple',
      '已完成': 'green',
      '已取消': 'default',
    };
    return colors[status] || 'default';
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case '高': return 'red';
      case '中': return 'orange';
      default: return 'green';
    }
  };

  const handleRouteChange = (batch: any) => {
    changeForm.resetFields();
    changeForm.setFieldsValue({ batch_id: batch.id, original_route_id: batch.route_id });
    setChangeModalVisible(true);
  };

  const handleFeedback = (batch: any) => {
    feedbackForm.resetFields();
    feedbackForm.setFieldsValue({ batch_id: batch.id });
    setFeedbackModalVisible(true);
  };

  const handleRiskDetail = (batch: any) => {
    setSelectedBatch(batch);
    setRiskDetailVisible(true);
  };

  const submitRouteChange = async (values: any) => {
    try {
      await leaderApi.createRouteChange(values);
      message.success('改线记录提交成功');
      setChangeModalVisible(false);
      loadData();
    } catch (error) {
      message.error('提交失败');
    }
  };

  const submitFeedback = async (values: any) => {
    try {
      await leaderApi.createFeedback(values);
      message.success('反馈提交成功');
      setFeedbackModalVisible(false);
      loadData();
    } catch (error) {
      message.error('提交失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '批次名称', dataIndex: 'batch_name', key: 'batch_name' },
    { title: '路线', dataIndex: 'route_name', key: 'route_name' },
    { title: '领队', dataIndex: 'leader_name', key: 'leader_name' },
    { title: '人数', dataIndex: 'people_count', key: 'people_count' },
    {
      title: '活动日期',
      dataIndex: 'activity_date',
      key: 'activity_date',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    { title: '开始时间', dataIndex: 'start_time', key: 'start_time' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      key: 'risk_level',
      render: (level: string, record: any) => {
        if (!level || level === '无') return <Tag color="green">无风险</Tag>;
        return (
          <Tooltip title="点击查看风险详情">
            <Tag
              color={getRiskLevelColor(level)}
              style={{ cursor: 'pointer' }}
              onClick={() => handleRiskDetail(record)}
            >
              <WarningOutlined /> {level}风险
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<SyncOutlined />}
            onClick={() => handleRouteChange(record)}
            disabled={record.status === '已完成'}
          >
            临时改线
          </Button>
          <Button
            type="link"
            icon={<CommentOutlined />}
            onClick={() => handleFeedback(record)}
            disabled={record.status === '已完成'}
          >
            活动反馈
          </Button>
          {record.risk_level && record.risk_level !== '无' && (
            <Button
              type="link"
              icon={<ExclamationCircleOutlined />}
              onClick={() => handleRiskDetail(record)}
            >
              风险详情
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Layout>
      <Card
        title="活动批次"
        extra={
          <Space wrap>
            <Select
              style={{ width: 150 }}
              placeholder="选择路线"
              allowClear
              onChange={(value) => setFilters({ ...filters, routeId: value })}
            >
              {routes.map((r) => (
                <Select.Option key={r.id} value={r.id}>
                  {r.name}
                </Select.Option>
              ))}
            </Select>
            <Select
              style={{ width: 120 }}
              placeholder="选择领队"
              allowClear
              onChange={(value) => setFilters({ ...filters, leaderId: value })}
            >
              {leaders.map((l: any) => (
                <Select.Option key={l.id} value={l.id}>
                  {l.full_name}
                </Select.Option>
              ))}
            </Select>
            <Select
              style={{ width: 120 }}
              placeholder="选择状态"
              allowClear
              onChange={(value) => setFilters({ ...filters, status: value })}
            >
              {batchStatusOptions.map((s) => (
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
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/leader/new')}>
              新建批次
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={batches}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          rowClassName={(record) =>
            record.risk_level === '高' ? 'risk-high-row' : record.risk_level === '中' ? 'risk-medium-row' : ''
          }
        />
      </Card>

      <Modal
        title={
          <Space>
            <WarningOutlined style={{ color: '#fa541c' }} />
            风险预警详情
          </Space>
        }
        open={riskDetailVisible}
        onCancel={() => setRiskDetailVisible(false)}
        footer={null}
        width={600}
      >
        {selectedBatch && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <span style={{ fontWeight: 600 }}>批次：</span>{selectedBatch.batch_name}
                <Tag color={getStatusColor(selectedBatch.status)}>{selectedBatch.status}</Tag>
                <Tag color={getRiskLevelColor(selectedBatch.risk_level)}>
                  <WarningOutlined /> {selectedBatch.risk_level}风险
                </Tag>
              </Space>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 600 }}>路线：</span>{selectedBatch.route_name}
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 600 }}>领队：</span>{selectedBatch.leader_name}
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 600 }}>活动日期：</span>
              {selectedBatch.activity_date ? dayjs(selectedBatch.activity_date).format('YYYY-MM-DD') : '-'}
            </div>
            {selectedBatch.risk_confirmed === 1 && (
              <div style={{ marginBottom: 12 }}>
                <Tag color="blue">领队已确认风险</Tag>
              </div>
            )}
            {selectedBatch.risk_summary && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>风险摘要：</div>
                <div style={{
                  padding: 12,
                  background: selectedBatch.risk_level === '高' ? '#fff1f0' : '#fff7e6',
                  borderRadius: 4,
                  whiteSpace: 'pre-wrap',
                  fontSize: 13,
                }}>
                  {selectedBatch.risk_summary}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="临时改线登记"
        open={changeModalVisible}
        onCancel={() => setChangeModalVisible(false)}
        footer={null}
      >
        <Form form={changeForm} layout="vertical" onFinish={submitRouteChange}>
          <Form.Item name="batch_id" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="original_route_id" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="new_route_description" label="新路线描述" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="请描述新的路线" />
          </Form.Item>
          <Form.Item name="reason" label="改线原因" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="请说明改线原因" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                提交
              </Button>
              <Button onClick={() => setChangeModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="活动反馈"
        open={feedbackModalVisible}
        onCancel={() => setFeedbackModalVisible(false)}
        footer={null}
      >
        <Form form={feedbackForm} layout="vertical" onFinish={submitFeedback}>
          <Form.Item name="batch_id" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="rating" label="活动评分" rules={[{ required: true }]}>
            <Rate />
          </Form.Item>
          <Form.Item name="content" label="活动评价">
            <TextArea rows={3} placeholder="请输入活动评价" />
          </Form.Item>
          <Form.Item name="issues_encountered" label="遇到的问题">
            <TextArea rows={3} placeholder="请描述活动中遇到的问题" />
          </Form.Item>
          <Form.Item name="suggestions" label="改进建议">
            <TextArea rows={3} placeholder="请输入改进建议" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                提交
              </Button>
              <Button onClick={() => setFeedbackModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default Batches;
