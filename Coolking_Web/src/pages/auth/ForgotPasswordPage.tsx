import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

type MethodType = 'email' | 'phone' | null;

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState<MethodType>(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleMethodSelect = (method: MethodType) => {
    setSelectedMethod(method);
    setInputValue('');
    setError('');
  };

  const handleBack = () => {
    setSelectedMethod(null);
    setInputValue('');
    setError('');
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone);
  };

  const handleContinue = async () => {
    if (!inputValue.trim()) {
      setError('Vui lòng nhập thông tin');
      return;
    }

    if (selectedMethod === 'email') {
      if (!validateEmail(inputValue)) {
        setError('Email không hợp lệ');
        return;
      }
    } else if (selectedMethod === 'phone') {
      if (!validatePhone(inputValue)) {
        setError('Số điện thoại không hợp lệ (10-11 chữ số)');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      let response;
      if (selectedMethod === 'email') {
        response = await authService.checkEmail(inputValue);
      } else if (selectedMethod === 'phone') {
        response = await authService.checkPhone(inputValue);
      }

      if (response?.success) {
        // Chuyển đến trang OTP với thông tin
        navigate('/otp-confirm', {
          state: {
            method: selectedMethod,
            contact: inputValue,
            message: response.message
          }
        });
      } else {
        console.error('API returned unsuccessful response:', response);
        setError(response?.message || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      console.error('API Error:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 401) {
        setError('Yêu cầu xác thực. Vui lòng thử lại.');
      } else {
        setError(error.response?.data?.message || 'Không tìm thấy tài khoản');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Quên mật khẩu</h1>
          <p className="text-gray-600">
            {selectedMethod ? 'Nhập thông tin để nhận mã xác thực' : 'Chọn phương thức khôi phục mật khẩu'}
          </p>
        </div>

        {!selectedMethod ? (
          // Method Selection Screen
          <div className="space-y-4">
            <button
              onClick={() => handleMethodSelect('email')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition duration-200 flex items-center justify-center space-x-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Đổi mật khẩu bằng Email</span>
            </button>

            <button
              onClick={() => handleMethodSelect('phone')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition duration-200 flex items-center justify-center space-x-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <div className="text-center">
                <span>Đổi mật khẩu bằng SĐT</span>
              </div>
            </button>

            <button
              onClick={() => navigate('/login')}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition duration-200 mt-6"
            >
              Quay lại đăng nhập
            </button>
          </div>
        ) : (
          // Input Screen
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {selectedMethod === 'email' ? 'Địa chỉ Email' : 'Số điện thoại'}
              </label>
              <input
                type={selectedMethod === 'email' ? 'email' : 'tel'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={selectedMethod === 'email' ? 'example@email.com' : '0xxxxxxxxx'}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition duration-200"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleContinue}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-xl transition duration-200 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <span>Tiếp tục</span>
                )}
              </button>

              <button
                onClick={handleBack}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition duration-200"
              >
                Quay lại
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
