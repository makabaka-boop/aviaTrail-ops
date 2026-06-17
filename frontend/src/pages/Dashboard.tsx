import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Space, DatePicker, Tooltip } from 'antd';
import {
  EnvironmentOutlined,
  EyeOutlined,
  TeamOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { dashboardApi } from '../api';
import Layout from '../components/Layout';

const { RangePicker } = DatePicker;

const Dashboard: React.FC = () => {
  const [overview, setOverview] = useState<any>({});
  const [routeHeatmap, setRouteHeatmap] = useState<any[]>([]);
  const [anomalyDistribution, setAnomalyDistribution] = useState<any>({});
  const [inspectionWorkload, setInspectionWorkload] = useState<any[]>([]);
  const [pendingPoints, setPendingPoints] = useState<any>({});
  const [overdueInspections, setOverdueInspections] = useState<any[]>([]);
  const [peakHours, setPeakHours] = useState<any[]>([]);
  const [riskOverlap, setRiskOverlap] = useState<any[]>([]);
  const [riskBatches, setRiskBatches] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const safeFetch = async (apiCall: () => Promise<any>, fallback: any = null) => {
    try {
      const res = await apiCall();
      return res.data;
    } catch {
      return fallback;
    }
  };

  const loadData = async () => {
    const startDate = dateRange[0].format('YYYY-MM-DD');
    const endDate = dateRange[1].format('YYYY-MM-DD');

    const [
      overviewData,
      heatmapData,
      anomalyData,
      workloadData,
      pendingData,
      overdueData,
      peakData,
      riskData,
      riskBatchesData,
    ] = await Promise.all([
      safeFetch(() => dashboardApi.getOverview(startDate, endDate), {}),
      safeFetch(() => dashboardApi.getRouteHeatmap(startDate, endDate), []),
      safeFetch(() => dashboardApi.getAnomalyDistribution(startDate, endDate), {}),
      safeFetch(() => dashboardApi.getInspectionWorkload(startDate, endDate), []),
      safeFetch(() => dashboardApi.getPendingPoints(startDate, endDate), {}),
      safeFetch(() => dashboardApi.getOverdueInspections(), []),
      safeFetch(() => dashboardApi.getActivityPeakHours(startDate, endDate), []),
      safeFetch(() => dashboardApi.getRiskOverlap(startDate, endDate), []),
      safeFetch(() => dashboardApi.getRiskBatches(startDate, endDate), []),
    ]);

    setOverview(overviewData);
    setRouteHeatmap(heatmapData);
    setAnomalyDistribution(anomalyData);
    setInspectionWorkload(workloadData);
    setPendingPoints(pendingData);
    setOverdueInspections(overdueData);
    setPeakHours(peakData);
    setRiskOverlap(riskData);
    setRiskBatches(riskBatchesData);
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

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case '高': return 'red';
      case '中': return 'orange';
      default: return 'green';
    }
  };

  const routeHeatmapChart = {
    title: { text: '路线热度统计', left: 'center' },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { type: 'category', data: routeHeatmap.map((r) => r.route_name) },
    yAxis: [{ type: 'value', name: '批次数量' }, { type: 'value', name: '总人数' }],
    series: [
      {
        name: '批次数量',
        type: 'bar',
        data: routeHeatmap.map((r) => r.batch_count),
        itemStyle: { color: '#5470c6' },
      },
      {
        name: '总人数',
        type: 'line',
        yAxisIndex: 1,
        data: routeHeatmap.map((r) => r.total_people),
        itemStyle: { color: '#91cc75' },
      },
    ],
  };

  const anomalyChart = {
    title: { text: '异常分布统计', left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { top: 'bottom' },
    series: [
      {
        name: '异常类型',
        type: 'pie',
        radius: ['40%', '70%'],
        data: [
          { name: '遮挡问题', value: Object.values(anomalyDistribution.obstruction || {}).reduce((a: any, b: any) => Number(a) + Number(b), 0) },
          { name: '湿滑风险', value: Object.values(anomalyDistribution.slippery || {}).reduce((a: any, b: any) => Number(a) + Number(b), 0) },
          { name: '看台问题', value: Object.values(anomalyDistribution.bleachers || {}).reduce((a: any, b: any) => Number(a) + Number(b), 0) },
        ],
      },
    ],
  };

  const workloadChart = {
    title: { text: '巡看人员工作量', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: inspectionWorkload.map((w) => w.inspector_name) },
    yAxis: { type: 'value', name: '巡看次数' },
    series: [
      {
        name: '巡看次数',
        type: 'bar',
        data: inspectionWorkload.map((w) => w.inspection_count),
        itemStyle: { color: '#fac858' },
      },
    ],
  };

  const peakHoursChart = {
    title: { text: '活动时段人流分布', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: peakHours.map((h) => `${h.hour}:00`) },
    yAxis: { type: 'value', name: '参与人数' },
    series: [
      {
        name: '参与人数',
        type: 'line',
        smooth: true,
        areaStyle: {},
        data: peakHours.map((h) => h.people_count),
        itemStyle: { color: '#ee6666' },
      },
    ],
  };

  const pendingColumns = [
    { title: '路段名称', dataIndex: 'name', key: 'name' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
  ];

  const overdueColumns = [
    { title: '路段名称', dataIndex: 'segment_name', key: 'segment_name' },
    {
      title: '超期天数',
      dataIndex: 'days_overdue',
      key: 'days_overdue',
      render: (days: number) => (
        <Tag color={days > 3 ? 'red' : 'orange'}>{days} 天</Tag>
      ),
    },
    { title: '上次巡看', dataIndex: 'last_inspection', key: 'last_inspection' },
  ];

  const riskColumns = [
    { title: '批次名称', dataIndex: 'batch_name', key: 'batch_name' },
    { title: '路线', dataIndex: 'route_name', key: 'route_name' },
    { title: '人数', dataIndex: 'people_count', key: 'people_count' },
    { title: '开始时间', dataIndex: 'start_time', key: 'start_time' },
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      key: 'risk_level',
      render: (level: string) => (
        <Tag color={level === '高' ? 'red' : 'orange'}>{level}风险</Tag>
      ),
    },
  ];

  const riskBatchesColumns = [
    { title: '批次名称', dataIndex: 'batch_name', key: 'batch_name' },
    { title: '路线', dataIndex: 'route_name', key: 'route_name' },
    { title: '领队', dataIndex: 'leader_name', key: 'leader_name' },
    {
      title: '活动日期',
      dataIndex: 'activity_date',
      key: 'activity_date',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          '已登记': 'blue',
          '进行中': 'orange',
          '已改线': 'purple',
          '已完成': 'green',
          '已取消': 'default',
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      key: 'risk_level',
      render: (level: string) => (
        <Tag color={getRiskLevelColor(level)}>
          <WarningOutlined /> {level}风险
        </Tag>
      ),
    },
    {
      title: '确认状态',
      dataIndex: 'risk_confirmed',
      key: 'risk_confirmed',
      render: (confirmed: number) => confirmed === 1
        ? <Tag color="blue"><CheckCircleOutlined /> 已确认</Tag>
        : <Tag color="orange"><ExclamationCircleOutlined /> 未确认</Tag>,
    },
    {
      title: '风险摘要',
      dataIndex: 'risk_summary',
      key: 'risk_summary',
      width: 300,
      render: (summary: string) => summary ? (
        <Tooltip title={summary}>
          <span style={{ maxWidth: 280, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {summary.split('\n')[0]}
          </span>
        </Tooltip>
      ) : '-',
    },
  ];

  return (
    <Layout>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0], dates[1]]);
              }
            }}
          />
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <Card>
            <Statistic
              title="步道分段总数"
              value={overview.total_segments || 0}
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <Card>
            <Statistic
              title="观察点总数"
              value={overview.total_points || 0}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <Card>
            <Statistic
              title="活动路线总数"
              value={overview.total_routes || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <Card>
            <Statistic
              title="活动批次总数"
              value={overview.total_batches || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <Card>
            <Statistic
              title="风险批次数量"
              value={riskBatches.length}
              prefix={<WarningOutlined />}
              valueStyle={{ color: riskBatches.length > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <Card>
            <Statistic
              title="高风险批次"
              value={riskBatches.filter((b) => b.risk_level === '高').length}
              prefix={<AlertOutlined />}
              valueStyle={{ color: riskBatches.filter((b) => b.risk_level === '高').length > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <Card>
            <Statistic
              title="今日风险叠加批次"
              value={riskOverlap.length}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: riskOverlap.length > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <Card>
            <Statistic
              title="超期巡看分段"
              value={overdueInspections.length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: overdueInspections.length > 0 ? '#fa8c16' : '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Card title="路线热度统计">
            <ReactECharts option={routeHeatmapChart} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Card title="异常分布统计">
            <ReactECharts option={anomalyChart} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Card title="巡看人员工作量">
            <ReactECharts option={workloadChart} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Card title="活动时段人流分布">
            <ReactECharts option={peakHoursChart} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={24} md={8} lg={8} xl={8}>
          <Card
            title={
              <Space>
                <AlertOutlined style={{ color: 'red' }} />
                异常路段
              </Space>
            }
          >
            <Table
              dataSource={pendingPoints.abnormal_segments || []}
              columns={pendingColumns}
              size="small"
              pagination={false}
              rowKey="id"
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={24} md={8} lg={8} xl={8}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined style={{ color: 'orange' }} />
                超期巡看
              </Space>
            }
          >
            <Table
              dataSource={overdueInspections}
              columns={overdueColumns}
              size="small"
              pagination={false}
              rowKey="segment_id"
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={24} md={8} lg={8} xl={8}>
          <Card
            title={
              <Space>
                <WarningOutlined style={{ color: 'red' }} />
                风险叠加预警
              </Space>
            }
          >
            <Table
              dataSource={riskOverlap}
              columns={riskColumns}
              size="small"
              pagination={false}
              rowKey="batch_id"
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </Col>
      </Row>

      {riskBatches.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card
              title={
                <Space>
                  <WarningOutlined style={{ color: '#cf1322' }} />
                  风险批次一览
                  <Tag color="red">{riskBatches.length} 个批次</Tag>
                </Space>
              }
            >
              <Table
                dataSource={riskBatches}
                columns={riskBatchesColumns}
                size="small"
                pagination={{ pageSize: 5 }}
                rowKey="id"
                rowClassName={(record) =>
                  record.risk_level === '高' ? 'risk-high-row' : 'risk-medium-row'
                }
              />
            </Card>
          </Col>
        </Row>
      )}
    </Layout>
  );
};

export default Dashboard;
