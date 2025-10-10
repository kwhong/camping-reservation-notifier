import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, DatePicker, Select, Space, message, Popconfirm, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { settingsAPI } from '../../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const AREA_OPTIONS = [
  '데크A',
  '데크B',
  '데크C',
  '데크D',
  '원두막',
  '돔하우스',
];

const UserSettings = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await settingsAPI.getAll();
      setData(response.data.data || []);
    } catch (error) {
      console.error('Error fetching settings:', error);
      message.error('설정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      campingName: '다리안계곡캠핑장',
      region: '충북 단양',
      area: [],
    });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      campingName: record.campingName,
      region: record.region,
      area: record.area || [],
      dateRange: [dayjs(record.dateFrom), dayjs(record.dateTo)],
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await settingsAPI.delete(id);
      message.success('설정이 삭제되었습니다.');
      fetchSettings();
    } catch (error) {
      console.error('Error deleting setting:', error);
      message.error('삭제에 실패했습니다.');
    }
  };

  const handleToggleActive = async (record) => {
    try {
      await settingsAPI.update(record.id, { isActive: !record.isActive });
      message.success('설정이 업데이트되었습니다.');
      fetchSettings();
    } catch (error) {
      console.error('Error updating setting:', error);
      message.error('업데이트에 실패했습니다.');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        campingName: values.campingName,
        region: values.region,
        area: values.area || [],
        dateFrom: values.dateRange[0].format('YYYY-MM-DD'),
        dateTo: values.dateRange[1].format('YYYY-MM-DD'),
      };

      if (editingRecord) {
        await settingsAPI.update(editingRecord.id, payload);
        message.success('설정이 수정되었습니다.');
      } else {
        await settingsAPI.create(payload);
        message.success('설정이 추가되었습니다.');
      }

      setModalVisible(false);
      fetchSettings();
    } catch (error) {
      console.error('Error saving setting:', error);
      message.error('저장에 실패했습니다.');
    }
  };

  const columns = [
    {
      title: '활성',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive, record) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggleActive(record)}
        />
      ),
    },
    {
      title: '캠핑장',
      dataIndex: 'campingName',
      key: 'campingName',
    },
    {
      title: '지역',
      dataIndex: 'region',
      key: 'region',
    },
    {
      title: '구역',
      dataIndex: 'area',
      key: 'area',
      render: (areas) => areas?.join(', ') || '전체',
    },
    {
      title: '기간',
      key: 'dateRange',
      render: (_, record) => `${record.dateFrom} ~ ${record.dateTo}`,
    },
    {
      title: '작업',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="정말 삭제하시겠습니까?"
            onConfirm={() => handleDelete(record.id)}
            okText="예"
            cancelText="아니오"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        title="사용자 설정"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            설정 추가
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingRecord ? '설정 수정' : '설정 추가'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText="저장"
        cancelText="취소"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="캠핑장"
            name="campingName"
            rules={[{ required: true, message: '캠핑장을 입력해주세요' }]}
          >
            <Input placeholder="예: 다리안계곡캠핑장" />
          </Form.Item>

          <Form.Item
            label="지역"
            name="region"
            rules={[{ required: true, message: '지역을 입력해주세요' }]}
          >
            <Input placeholder="예: 충북 단양" />
          </Form.Item>

          <Form.Item
            label="구역 (선택 안하면 전체)"
            name="area"
          >
            <Select
              mode="multiple"
              placeholder="구역을 선택하세요"
              options={AREA_OPTIONS.map(area => ({ label: area, value: area }))}
            />
          </Form.Item>

          <Form.Item
            label="예약 희망 기간"
            name="dateRange"
            rules={[{ required: true, message: '기간을 선택해주세요' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default UserSettings;
