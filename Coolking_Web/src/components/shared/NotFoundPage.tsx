import React from 'react';

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  textAlign: 'center',
};

const NotFoundPage: React.FC = () => (
  <div style={containerStyle}>
    <h1>404 - Page Not Found</h1>
    <p>Trang mà bạn đang tìm kiếm không tồn tại.</p>
    <p>The page you are looking for does not exist.</p>
  </div>
);

export default NotFoundPage;