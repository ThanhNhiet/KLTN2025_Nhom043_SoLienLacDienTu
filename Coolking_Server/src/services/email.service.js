const { Resend } = require('resend');
const redisService = require('./redis.service');

// Khởi tạo Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Tạo OTP ngẫu nhiên 6 số
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Gửi OTP qua email
const sendOTP = async (email) => {
    try {
        // Tạo OTP
        const otp = generateOTP();

        // Lưu OTP vào Redis với thời gian hết hạn 3 phút (180 giây)
        const redisKey = `otp:${email}`;
        await redisService.setex(redisKey, 180, otp);

        // Gửi qua api Resend
        const {data, error} = await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: [email],
            subject: 'Mã OTP xác thực - E-Contact Book',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2c3e50; text-align: center;">Mã OTP xác thực</h2>
                    <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #007bff; font-size: 36px; margin: 0; letter-spacing: 5px;">${otp}</h1>
                    </div>
                    <p style="color: #666; font-size: 16px; line-height: 1.5;">
                        Đây là mã OTP để xác thực tài khoản của bạn trên hệ thống E-Contact Book Coolking.
                    </p>
                    <p style="color: #e74c3c; font-weight: bold;">
                        Mã OTP này sẽ hết hạn sau 3 phút. Vui lòng không chia sẻ mã này với ai khác.
                    </p>
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 14px;">
                        <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
                        <p>© 2025 E-Contact Book Coolking</p>
                    </div>
                </div>
            `
        });

        if (error) {
            console.error('Resend API Error:', error);
            throw new Error('Lỗi từ dịch vụ gửi email: ' + error.message);
        }

        return {
            success: true,
            message: 'OTP đã được gửi thành công',
            messageId: data.id
        };

    } catch (error) {
        console.error('Error sending OTP:', error);
        throw new Error(errorMessage);
    }
};

// Xác thực OTP
const verifyOTP = async (email, inputOTP) => {
    try {
        // Lấy OTP từ Redis
        const redisKey = `otp:${email}`;
        const storedOTP = await redisService.get(redisKey);

        if (!storedOTP) {
            return {
                success: false,
                message: 'OTP đã hết hạn hoặc không tồn tại'
            };
        }

        // So sánh OTP
        if (storedOTP === inputOTP) {
            // Xóa OTP khỏi Redis sau khi xác thực thành công
            await redisService.del(redisKey);
            // Tạo token đặt lại mật khẩu có thời hạn 5 phút
            const resetToken = crypto.randomUUID() + inputOTP;
            await redisService.setex(`reset:${email}`, 300, resetToken);
            return {
                success: true,
                message: 'Xác thực OTP thành công',
                resetToken: resetToken
            };
        } else {
            return {
                success: false,
                message: 'OTP không chính xác'
            };
        }

    } catch (error) {
        console.error('Error verifying OTP:', error);
        throw new Error('Lỗi xác thực OTP. Vui lòng thử lại sau.');
    }
};

// Xóa OTP (nếu cần)
const deleteOTP = async (email) => {
    try {
        const redisKey = `otp:${email}`;
        await redisService.del(redisKey);
        return {
            success: true,
            message: 'OTP đã được xóa thành công'
        };
    } catch (error) {
        console.error('Error deleting OTP:', error);
        throw new Error('Lỗi xóa OTP');
    }
};

// Kiểm tra thời gian còn lại của OTP
const getOTPTimeRemaining = async (email) => {
    try {
        const redisKey = `otp:${email}`;
        const ttl = await redisService.ttl(redisKey);

        if (ttl <= 0) {
            return {
                exists: false,
                timeRemaining: 0
            };
        }

        return {
            exists: true,
            timeRemaining: ttl
        };
    } catch (error) {
        console.error('Error getting OTP time remaining:', error);
        throw new Error('Lỗi kiểm tra thời gian OTP');
    }
};

module.exports = {
    sendOTP,
    verifyOTP,
    deleteOTP,
    getOTPTimeRemaining
};
