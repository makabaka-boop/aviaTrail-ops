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
import type { Equipment } from '../../types';
import Layout from '../../components/Layout';

const categoryOptions = ['观察设备', '防护装备', '通讯设备', '医疗用品', '其他'];
const equipStatusOptions = ['良好', '需补充', '需维修', '损坏'];

const Equipments: React.FC = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [form] = Form.useForm();

  useEffect(() => {
    loadEquipments();
  }, [categoryFilter, statusFilter]);

  const loadEquipments = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getEquipments(categoryFilter, statusFilter);
      setEquipments(response.data);
    } catch (error) {
      message.error('加载器材清单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingEquipment(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    form.setFieldsValue(equipment);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await adminApi.deleteEquipment(id);
      message.success('删除成功');
      loadEquipments();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingEquipment) {
        await adminApi.updateEquipment(editingEquipment.id, values);
        message.success('更新成功');
      } else {
        await adminApi.createEquipment(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadEquipments();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      '良好': 'green',
      '需补充': 'orange',
      '需维修': 'yellow',
      '损坏': 'red',
    };
    return colors[status] || 'default';
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '器材名称', dataIndex: 'name', key: 'name' },
    { title: '分类', dataIndex: 'category', key: 'category' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
    { title: '存放位置', dataIndex: 'location', key: 'location' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    { title: '备注', dataIndex: 'notes', key: 'notes', ellipsis: true },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Equipment) => (
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
          新增器材
        </Button>
        <Space>
          <Select
            style={{ width: 150 }}
            placeholder="按分类筛选"
            allowClear
            value={categoryFilter}
            onChange={(value) => setCategoryFilter(value)}
          >
            {categoryOptions.map((c) => (
              <Select.Option key={c} value={c}>{c}</Select.Option>
            ))}
          </Select>
          <Select
            style={{ width: 150 }}
            placeholder="按状态筛选"
            allowClear
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
          >
            {equipStatusOptions.map((s) => (
              <Select.Option key={s} value={s}>{s}</Select.Option>
            ))}
          </Select>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={equipments}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingEquipment ? '编辑器材' : '新增器材'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="器材名称" rules={[{ required: true }]}>
            <Input placeholder="请输入器材名称" />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Select placeholder="请选择分类">
              {categoryOptions.map((c) => (
                <Select.Option key={c} value={c}>{c}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="quantity" label="数量">
            <InputNumber style={{ width: '100%' }} placeholder="请输入数量" min={0} />
          </Form.Item>
          <Form.Item name="location" label="存放位置">
            <Input placeholder="请输入存放位置" />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态">
              {equipStatusOptions.map((s) => (
                <Select.Option key={s} value={s}>{s}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea placeholder="请输入备注" rows={3} />
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

export default Equipments;
