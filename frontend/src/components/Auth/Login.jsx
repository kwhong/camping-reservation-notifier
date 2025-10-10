import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, message } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  // user 상태가 변경되면 dashboard로 리다이렉트
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      message.success('로그인되었습니다!');
      // user 상태가 업데이트되면 useEffect에서 자동으로 리다이렉트됨
    } catch (error) {
      console.error('Google login error:', error);
      message.error('Google 로그인에 실패했습니다: ' + error.message);
      setLoading(false); // 에러 시에만 로딩 해제
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card
        style={{ width: 400, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
        title={
          <div style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold' }}>
            🏕️ 캠핑장 예약 알림
          </div>
        }
      >
        <div style={{ padding: '20px 0', textAlign: 'center' }}>
          <p style={{ marginBottom: '24px', fontSize: '16px', color: '#666' }}>
            Google 계정으로 간편하게 로그인하세요
          </p>
          <Button
            type="primary"
            icon={<GoogleOutlined />}
            onClick={handleGoogleLogin}
            loading={loading}
            block
            size="large"
            style={{ height: '48px', fontSize: '16px' }}
          >
            Google로 로그인
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Login;
