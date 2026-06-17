import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  message,
  Card,
  Space,
  Divider,
} from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { inspectorApi, adminApi } from '../../api';
import type { TrailSegment } from '../../types';
import Layout from '../../components/Layout';

const { TextArea } = Input;

const NewRecord: React.FC = () => {
  const [segments, setSegments] = useState<TrailSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadSegments();
  }, []);

  const loadSegments = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await adminApi.getTrailSegments();
      setSegments(response.data);
      if (location.state?.segmentId) {
        form.setFieldsValue({ segment_id: location.state.segmentId });
      }
    } catch (error) {
      message.error('加载路段失败，请重试');
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await inspectorApi.createInspectionRecord(values);
      message.success('巡看记录提交成功');
      navigate('/inspector/records');
    } catch (error) {
      message.error('提交失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Card title="新建巡看记录">
        {loadError ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ marginBottom: 16, color: '#999' }}>数据加载失败</p>
            <Button type="primary" onClick={loadSegments} loading={loading}>
              重新加载
            </Button>
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            style={{ maxWidth: 800 }}
            disabled={loading || segments.length === 0}
          >
            <Form.Item name="segment_id" label="选择路段" rules={[{ required: true }]}>
              <Select placeholder="请选择巡看路段" loading={loading}>
                {segments.map((s) => (
                  <Select.Option key={s.id} value={s.id}>
                    {s.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Divider orientation="left">遮挡情况</Divider>
            <Form.Item name="obstruction_status" label="遮挡状态">
              <Select placeholder="请选择遮挡状态">
                <Select.Option value="正常">正常</Select.Option>
                <Select.Option value="轻微遮挡">轻微遮挡</Select.Option>
                <Select.Option value="严重遮挡">严重遮挡</Select.Option>
                <Select.Option value="无法通行">无法通行</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="obstruction_details" label="遮挡详情">
              <TextArea rows={3} placeholder="请描述遮挡情况" />
            </Form.Item>

            <Divider orientation="left">湿滑情况</Divider>
            <Form.Item name="slippery_warning" label="湿滑风险">
              <Select placeholder="请选择湿滑风险">
                <Select.Option value="无风险">无风险</Select.Option>
                <Select.Option value="有风险">有风险</Select.Option>
                <Select.Option value="高风险">高风险</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="slippery_details" label="湿滑详情">
              <TextArea rows={3} placeholder="请描述湿滑情况" />
            </Form.Item>

            <Divider orientation="left">看台状态</Divider>
            <Form.Item name="bleachers_status" label="看台状态">
              <Select placeholder="请选择看台状态">
                <Select.Option value="正常">正常</Select.Option>
                <Select.Option value="需维修">需维修</Select.Option>
                <Select.Option value="损坏">损坏</Select.Option>
                <Select.Option value="无看台">无看台</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="bleachers_details" label="看台详情">
              <TextArea rows={3} placeholder="请描述看台情况" />
            </Form.Item>

            <Divider orientation="left">总体评估</Divider>
            <Form.Item name="overall_status" label="总体状态" rules={[{ required: true }]}>
              <Select placeholder="请选择总体状态">
                <Select.Option value="正常开放">正常开放</Select.Option>
                <Select.Option value="待巡看">待巡看</Select.Option>
                <Select.Option value="局部绕行">局部绕行</Select.Option>
                <Select.Option value="维护处理中">维护处理中</Select.Option>
                <Select.Option value="已恢复">已恢复</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="suggestions" label="处理建议">
              <TextArea rows={4} placeholder="请输入处理建议" />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  提交记录
                </Button>
                <Button onClick={() => navigate('/inspector/records')}>取消</Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Card>
    </Layout>
  );
};

export default NewRecord;
