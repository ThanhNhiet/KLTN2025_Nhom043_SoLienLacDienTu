const redisService = require('./redis.service');

var http = require('http');
var https = require('https');

const sendSMS = function(phones, content, type, sender) {
    var url = 'api.speedsms.vn';
    var params = JSON.stringify({
        to: phones,
        content: content,
        sms_type: type,
        sender: sender
    });

    var buf = new Buffer(process.env.SPEEDSMS_TOKEN + ':x');
    var auth = "Basic " + buf.toString('base64');
    const options = {
        hostname: url,
        port: 443,
        path: '/index.php/sms/send',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': auth
        }
    };

    const req = https.request(options, function(res) {
        res.setEncoding('utf8');
        var body = '';
        res.on('data', function(d) {
            body += d;
        });
        res.on('end', function() {
            var json = JSON.parse(body);
            if (json.status == 'success') {
                console.log("send sms success")
            }
            else {
                console.log("send sms failed " + body);
            }
        });
    });

    req.on('error', function(e) {
        console.log("send sms failed: " + e);
    });

    req.write(params);
    req.end();
};

// Tạo OTP ngẫu nhiên 6 số
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Gửi OTP qua sms
const sendOTP = async (phoneNumber) => {
    try {
        // Tạo OTP
        const otp = generateOTP();
        // Lưu OTP vào Redis với thời gian hết hạn 3 phút
        const redisKey = `otp:${phoneNumber}`;
        await redisService.setex(redisKey, 180, otp);
        // Gửi OTP qua SMS bằng Api của speedSMS
        // console.log(`Sending OTP ${otp} to phone number ${phoneNumber}`);
        sendSMS([phoneNumber], `Ma OTP cho Tai khoan Econtact cua ban la ${otp}`, 5, process.env.SPEEDSMS_SENDER);
        return { success: true, message: 'OTP đã được gửi' };
    } catch (error) {
        console.error('Error sending OTP:', error);
        return { success: false, message: 'Gửi OTP thất bại' };
    }
};

// Xác thực OTP
const verifyOTP = async (phoneNumber, inputOTP) => {
    try {
        // Lấy OTP từ Redis
        const redisKey = `otp:${phoneNumber}`;
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
            await redisService.setex(`reset:${phoneNumber}`, 300, resetToken);
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

module.exports = {
    sendOTP,
    verifyOTP
};