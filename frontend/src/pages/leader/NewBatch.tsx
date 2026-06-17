import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  TimePicker,
  Button,
  message,
  Card,
  Space,
  Alert,
  Modal,
  Tag,
  Descriptions,
  Spin,
} from 'antd';
import {
  WarningOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { leaderApi } from '../../api';
import type { ActivityRoute, RouteRiskAssessment } from '../../types';
import Layout from '../../components/Layout';

const { TextArea } = Input;

const NewBatch: React.FC = () => {
  const [routes, setRoutes] = useState<ActivityRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskAssessment, setRiskAssessment] = useState<RouteRiskAssessment | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<ActivityRoute | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await leaderApi.getAvailableRoutes();
      setRoutes(response.data);
    } catch (error) {
      message.error('加载路线失败，请重试');
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRouteChange = async (routeId: number) => {
    const route = routes.find((r) => r.id === routeId);
    setSelectedRoute(route || null);
    form.setFieldsValue({ people_count: undefined });
    
    if (!routeId) {
      setRiskAssessment(null);
      return;
    }
    setRiskLoading(true);
    try {
      const response = await leaderApi.getRouteRisk(routeId);
      setRiskAssessment(response.data);
    } catch (error) {
      message.error('加载路线风险信息失败');
      setRiskAssessment(null);
    } finally {
      setRiskLoading(false);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case '高': return 'red';
      case '中': return 'orange';
      default: return 'green';
    }
  };

  const getRiskFactorIcon = (type: string) => {
    switch (type) {
      case 'segment_status': return '🚧';
      case 'abnormal_points': return '⚠️';
      case 'inspection_status': return '🔍';
      case 'inspection_anomaly': return '📋';
      case 'no_inspection': return '❓';
      case 'overdue_inspection': return '⏰';
      case 'frequent_anomalies': return '📊';
      default: return '⚠️';
    }
  };

  const buildRiskSummary = (assessment: RouteRiskAssessment): string => {
    const parts = [`风险等级: ${assessment.risk_level}`];
    if (assessment.risk_factors.length > 0) {
      parts.push('风险因素:');
      assessment.risk_factors.forEach((f, i) => {
        parts.push(`  ${i + 1}. ${f.reason}`);
      });
    }
    if (assessment.suggestions.length > 0) {
      parts.push('建议处理方式:');
      assessment.suggestions.forEach((s, i) => {
        parts.push(`  ${i + 1}. ${s}`);
      });
    }
    return parts.join('\n');
  };

  const handleSubmit = async (values: any) => {
    if (riskAssessment && riskAssessment.needs_confirmation) {
      setConfirmModalVisible(true);
      return;
    }
    doSubmit(values);
  };

  const doSubmit = async (values?: any) => {
    const formValues = values || form.getFieldsValue();
    setLoading(true);
    try {
      const data = {
        ...formValues,
        activity_date: formValues.activity_date.format('YYYY-MM-DD'),
        start_time: formValues.start_time ? formValues.start_time.format('HH:mm') : null,
        end_time: formValues.end_time ? formValues.end_time.format('HH:mm') : null,
        risk_level: riskAssessment?.risk_level || '无',
        risk_summary: riskAssessment ? buildRiskSummary(riskAssessment) : null,
        risk_confirmed: riskAssessment?.needs_confirmation ? 1 : 0,
      };
      await leaderApi.createBatch(data);
      message.success('活动批次创建成功');
      navigate('/leader/batches');
    } catch (error) {
      message.error('创建失败');
    } finally {
      setLoading(false);
      setConfirmModalVisible(false);
    }
  };

  const handleConfirmSubmit = () => {
    setConfirmModalVisible(false);
    doSubmit();
  };

  return (
    <Layout>
      <Card title="新建活动批次">
        {loadError ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ marginBottom: 16, color: '#999' }}>数据加载失败</p>
            <Button type="primary" onClick={loadRoutes} loading={loading}>
              重新加载
            </Button>
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            style={{ maxWidth: 600 }}
            disabled={loading || routes.length === 0}
          >
            <Form.Item name="batch_name" label="批次名称" rules={[{ required: true }]}>
              <Input placeholder="请输入批次名称" />
            </Form.Item>

            <Form.Item name="route_id" label="活动路线" rules={[{ required: true }]}>
              <Select
                placeholder="请选择活动路线"
                onChange={handleRouteChange}
                loading={riskLoading}
              >
                {routes.map((r: any) => (
                  <Select.Option key={r.id} value={r.id}>
                    {r.name} (预计{r.estimated_duration_minutes}分钟，最多{r.max_people}人)
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

          {riskLoading && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <Spin tip="正在评估路线风险..." />
            </div>
          )}

          {riskAssessment && riskAssessment.risk_level !== '无' && !riskLoading && (
            <Alert
              type={riskAssessment.risk_level === '高' ? 'error' : 'warning'}
              showIcon
              icon={<WarningOutlined />}
              style={{ marginBottom: 16 }}
              message={
                <Space>
                  <span>路线风险提示</span>
                  <Tag color={getRiskLevelColor(riskAssessment.risk_level)}>
                    {riskAssessment.risk_level}风险
                  </Tag>
                </Space>
              }
              description={
                <div>
                  <div style={{ marginTop: 8, marginBottom: 8 }}>
                    <strong>风险原因：</strong>
                  </div>
                  {riskAssessment.risk_factors.map((factor, index) => (
                    <div key={index} style={{ marginBottom: 4, paddingLeft: 8 }}>
                      {getRiskFactorIcon(factor.type)} <Tag color={getRiskLevelColor(factor.risk_level)} style={{ marginRight: 4 }}>{factor.risk_level}</Tag>
                      {factor.reason}
                    </div>
                  ))}
                  {riskAssessment.suggestions.length > 0 && (
                    <>
                      <div style={{ marginTop: 12, marginBottom: 8 }}>
                        <strong>建议处理方式：</strong>
                      </div>
                      {riskAssessment.suggestions.map((suggestion, index) => (
                        <div key={index} style={{ marginBottom: 4, paddingLeft: 8 }}>
                          💡 {suggestion}
                        </div>
                      ))}
                    </>
                  )}
                  {riskAssessment.needs_confirmation && (
                    <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(0,0,0,0.04)', borderRadius: 4 }}>
                      <ExclamationCircleOutlined style={{ color: '#fa8c16', marginRight: 8 }} />
                      该路线存在风险因素，提交时需进行二次确认
                    </div>
                  )}
                </div>
              }
            />
          )}

          {riskAssessment && riskAssessment.risk_level === '无' && !riskLoading && (
            <Alert
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
              message="路线安全"
              description="该路线当前无风险预警，所有步道分段状态正常。"
            />
          )}

          <Form.Item
            name="people_count"
            label="参与人数"
            rules={[
              { required: true, message: '请输入参与人数' },
              {
                validator: (_, value) => {
                  if (value && selectedRoute?.max_people && value > selectedRoute.max_people) {
                    return Promise.reject(new Error(`参与人数不能超过路线最大人数 ${selectedRoute.max_people} 人`));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入参与人数"
              min={1}
              max={selectedRoute?.max_people || undefined}
            />
          </Form.Item>

          <Form.Item name="activity_date" label="活动日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} placeholder="请选择活动日期" disabledDate={(current) => current && current < dayjs().startOf('day')} />
          </Form.Item>

          <Form.Item label="活动时间">
            <Space>
              <Form.Item name="start_time" noStyle>
                <TimePicker placeholder="开始时间" format="HH:mm" />
              </Form.Item>
              <span> - </span>
              <Form.Item name="end_time" noStyle>
                <TimePicker placeholder="结束时间" format="HH:mm" />
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item name="notes" label="备注">
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                创建批次
              </Button>
              <Button onClick={() => navigate('/leader/batches')}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
        )}
      </Card>

      <Modal
        title={
          <Space>
            <WarningOutlined style={{ color: '#fa8c16' }} />
            路线风险确认
          </Space>
        }
        open={confirmModalVisible}
        onCancel={() => setConfirmModalVisible(false)}
        width={600}
        footer={[
          <Button key="cancel" onClick={() => setConfirmModalVisible(false)}>
            取消创建
          </Button>,
          <Button key="submit" type="primary" danger onClick={handleConfirmSubmit}>
            确认创建（已了解风险）
          </Button>,
        ]}
      >
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="该路线存在风险因素，请确认后再创建批次"
        />
        {riskAssessment && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="路线名称">{riskAssessment.route_name}</Descriptions.Item>
            <Descriptions.Item label="风险等级">
              <Tag color={getRiskLevelColor(riskAssessment.risk_level)}>
                {riskAssessment.risk_level}风险
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="风险因素">
              {riskAssessment.risk_factors.map((factor, index) => (
                <div key={index} style={{ marginBottom: 4 }}>
                  <Tag color={getRiskLevelColor(factor.risk_level)} style={{ marginRight: 4 }}>{factor.risk_level}</Tag>
                  {factor.reason}
                </div>
              ))}
            </Descriptions.Item>
            <Descriptions.Item label="建议处理方式">
              {riskAssessment.suggestions.map((s, index) => (
                <div key={index} style={{ marginBottom: 4 }}>💡 {s}</div>
              ))}
            </Descriptions.Item>
          </Descriptions>
        )}
        <div style={{ marginTop: 16, padding: 12, background: '#fff7e6', borderRadius: 4 }}>
          <strong>提示：</strong>确认创建后，风险摘要将自动保存到批次详情中，管理员和巡看人员可在活动批次列表和仪表板中查看。
        </div>
      </Modal>
    </Layout>
  );
};

export default NewBatch;
