const nodemailer = require('nodemailer');
const redisService = require('./redis.service');

// Tạo transporter cho email
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    // tls: {
    //     rejectUnauthorized: false
    // }
});

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

        // Cấu hình email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
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
        };

        // Gửi email
        const info = await transporter.sendMail(mailOptions);
        return {
            success: true,
            message: 'OTP đã được gửi thành công',
            messageId: info.messageId
        };

    } catch (error) {
        console.error('Error sending OTP:', error);

        // Xử lý các loại lỗi khác nhau
        let errorMessage = 'Không thể gửi OTP. Vui lòng thử lại sau.';

        if (error.code === 'EDNS' || error.code === 'ENOTFOUND') {
            errorMessage = 'Không thể kết nối đến server email. Vui lòng kiểm tra kết nối mạng.';
        } else if (error.code === 'EAUTH') {
            errorMessage = 'Lỗi xác thực email. Vui lòng kiểm tra cấu hình email.';
        } else if (error.responseCode === 535) {
            errorMessage = 'Thông tin đăng nhập email không chính xác.';
        }

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
