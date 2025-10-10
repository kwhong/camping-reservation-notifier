import { useState, useEffect } from 'react';
import { Table, Card, Tag, Button, Space, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { availabilityAPI } from '../../services/api';
import dayjs from 'dayjs';

const AvailableSites = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const response = await availabilityAPI.get();
      setData(response.data.data || []);
    } catch (error) {
      console.error('Error fetching availability:', error);
      message.error('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  const columns = [
    {
      title: '캠핑장',
      dataIndex: 'campingName',
      key: 'campingName',
      width: 200,
    },
    {
      title: '지역',
      dataIndex: 'region',
      key: 'region',
      width: 120,
    },
    {
      title: '구역',
      dataIndex: 'area',
      key: 'area',
      width: 120,
    },
    {
      title: '날짜',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      render: (date) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '예약 가능 수',
      dataIndex: 'availableCount',
      key: 'availableCount',
      width: 120,
      align: 'center',
      render: (count) => (
        <Tag color={count > 3 ? 'green' : count > 0 ? 'orange' : 'red'}>
          {count}
        </Tag>
      ),
    },
    {
      title: '수집 시간',
      dataIndex: 'scrapedAt',
      key: 'scrapedAt',
      width: 180,
      render: (scrapedAt) => {
        if (!scrapedAt) return '-';

        try {
          let date;

          // Firestore Timestamp 객체 (seconds 속성 있음)
          if (scrapedAt.seconds) {
            date = new Date(scrapedAt.seconds * 1000);
          }
          // Firestore Timestamp 객체 (_seconds 속성 있음)
          else if (scrapedAt._seconds) {
            date = new Date(scrapedAt._seconds * 1000);
          }
          // ISO 문자열 또는 일반 Date 객체
          else {
            date = new Date(scrapedAt);
          }

          // 유효한 날짜인지 확인
          if (isNaN(date.getTime())) {
            return '-';
          }

          return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
        } catch (error) {
          console.error('Date parsing error:', error, scrapedAt);
          return '-';
        }
      },
    },
  ];

  return (
    <Card
      title={
        <Space>
          <span>가용 캠핑 사이트</span>
          <Tag color="blue">{data.length}개</Tag>
        </Space>
      }
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchAvailability}
          loading={loading}
        >
          새로고침
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey={(record) => `${record.campingName}-${record.area}-${record.date}`}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `총 ${total}개`,
        }}
      />
    </Card>
  );
};

export default AvailableSites;
