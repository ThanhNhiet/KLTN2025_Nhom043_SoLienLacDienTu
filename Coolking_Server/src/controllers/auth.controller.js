const accountRepo = require('../repositories/account.repo');
const jwtUtils = require('../utils/jwt.utils');
const tokenRepo = require('../repositories/token.repo');
const redisService = require('../services/redis.service');
const emailService = require("../services/email.service");
const smsService = require("../services/sms.service");

// Cấu hình giới hạn
const OTP_LIMIT_CONFIG = {
    IP_MAX: 10,        // 1 IP chỉ được yêu cầu 10 lần/giờ (cho cả mail và phone)
    TARGET_MAX: 3,     // 1 Email hoặc 1 SĐT chỉ nhận tối đa 3 OTP/giờ
    WINDOW: 60 * 60    // 1 Tiếng (tính bằng giây)
};

/**
 * Hàm kiểm tra Rate Limit chung
 * @param {string} key - Key Redis
 * @param {number} limit - Số lần cho phép
 * @param {number} window - Thời gian (giây)
 * @returns {Promise<number|null>} - Trả về TTL (giây còn lại) nếu bị chặn, hoặc null nếu được phép
 */
const checkLimit = async (key, limit, window) => {
    const count = await redisService.incr(key);
    if (count === 1) {
        await redisService.expire(key, window);
    }
    if (count > limit) {
        return await redisService.ttl(key);
    }
    return null;
};

// POST /public/login
exports.login = async (req, res, next) => {
	try {
		const { username, password } = req.body;

		// --- RATE LIMITER START ---
        // Lấy IP người dùng để làm key định danh
        const ipAddress = req.ip || req.connection.remoteAddress;
        const limitKey = `login_limit:${ipAddress}`;
        const MAX_ATTEMPTS = 5; // Cho phép thử 5 lần
        const WINDOW_SECONDS = 60; // Trong vòng 60 giây
		const ipttl = await checkLimit(limitKey, MAX_ATTEMPTS, WINDOW_SECONDS);
		if (ipttl) {
			return res.status(429).json({
				message: `Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau ${ipttl} giây.`
			});
		}
		// --- RATE LIMITER END ---

		// Xác thực người dùng từ repo
		const account = await accountRepo.login(username, password);

		// --- LOGIN SUCCESS ---
        await redisService.del(limitKey);
		const payload = {
			id: account.id,
			user_id: account.user_id,
			role: account.role
		};

		// Tạo access token và refresh token
		const { accessToken, refreshToken } = jwtUtils.generateTokens(payload);

		// Xóa refresh token cũ
		await tokenRepo.deleteTokenByUserId(account.user_id);

		// Lưu refresh token vào database
		await tokenRepo.saveToken(account.user_id, refreshToken, ipAddress);

		// Trả về token cho client
		res.json({
			message: "Đăng nhập thành công",
			access_token: accessToken,
			refresh_token: refreshToken
		});
	} catch (err) {
		res.status(401).json({ message: err.message });
	}
};

/**
 * Refresh token để lấy access token mới
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.refreshToken = async (req, res) => {
	try {
		const { refresh_token } = req.body;

		if (!refresh_token) {
			return res.status(400).json({ message: 'Refresh token is required' });
		}

		// Xác thực refresh token
		const decoded = jwtUtils.verifyRefreshToken(refresh_token);

		if (!decoded) {
			return res.status(401).json({ message: 'Invalid or expired refresh token' });
		}

		// Kiểm tra xem token có tồn tại trong database không
		const tokenDoc = await tokenRepo.findToken(refresh_token);

		if (!tokenDoc) {
			return res.status(401).json({ message: 'Refresh token has been revoked' });
		}

		// Tạo access token mới
		const payload = {
			id: decoded.id,
			user_id: decoded.user_id,
			role: decoded.role
		};

		const { accessToken, refreshToken } = jwtUtils.generateTokens(payload);

		// Xóa refresh token cũ
		const result = await tokenRepo.deleteToken(refresh_token);
		if (!result) {
			return res.status(400).json({ message: 'Failed to delete old refresh token' });
		}

		// Lưu refresh token vào database
		const ipAddress = req.ip || req.connection.remoteAddress;
		await tokenRepo.saveToken(decoded.user_id, refreshToken, ipAddress);

		// Trả về access token mới
		res.json({
			access_token: accessToken,
			refresh_token: refreshToken
		});
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

/**
 * Đăng xuất - thu hồi refresh token và blacklist access token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.logout = async (req, res) => {
	try {
		const { refresh_token } = req.body;
		
		if (!refresh_token) {
			return res.status(400).json({ message: 'Refresh token is required' });
		}
		
		// Xóa refresh token khỏi database
		await tokenRepo.deleteToken(refresh_token);
		
		// Blacklist access token hiện tại (nếu có)
		const authHeader = req.headers.authorization;
		if (authHeader && authHeader.startsWith('Bearer ')) {
			const accessToken = authHeader.split(' ')[1];
			
			// Giải mã token để lấy thời gian hết hạn
			const decoded = jwtUtils.decodeToken(accessToken);
			if (decoded && decoded.exp) {
				// Thêm access token vào Redis blacklist với thời gian hết hạn
				await redisService.addToBlacklist(accessToken, decoded.exp);
			}
		}
		
		res.json({ message: 'Đăng xuất thành công' });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// POST /public/verify-otp
exports.verifyOTP_Email = async (req, res) => {
	try {
		const { email, otp } = req.body;
		// Kiểm tra các trường bắt buộc
		if (!email || !otp) {
			return res.status(400).json({
				success: false,
				message: 'Email và OTP là bắt buộc'
			});
		}

		// Kiểm tra format email
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({
				success: false,
				message: 'Email không hợp lệ'
			});
		}

		// Kiểm tra format OTP (6 số)
		const otpRegex = /^\d{6}$/;
		if (!otpRegex.test(otp)) {
			return res.status(400).json({
				success: false,
				message: 'OTP phải là 6 chữ số'
			});
		}

		const result = await emailService.verifyOTP(email, otp);

		if (result.success) {
			res.status(200).json({
				success: true,
				message: result.message,
				data: {
					email: email,
					verified: true,
					resetToken: result.resetToken
				}
			});
		} else {
			res.status(400).json({
				success: false,
				message: result.message
			});
		}

	} catch (error) {
		console.error('Error in verifyOTP controller:', error);
		res.status(500).json({
			success: false,
			message: error.message || 'Lỗi server khi xác thực OTP'
		});
	}
};

// POST /public/check-email/:email
exports.checkAccountByEmail = async (req, res) => {
	try {
		const { email } = req.params;
		const ip = req.ip || req.connection.remoteAddress;

		// Kiểm tra email có được cung cấp không
		if (!email) {
			return res.status(400).json({
				success: false,
				message: 'Email là bắt buộc'
			});
		}

		// Kiểm tra format email
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({
				success: false,
				message: 'Email không hợp lệ'
			});
		}

		// ========== RATE LIMITER START ==========
        // Check 1: Giới hạn theo IP (Chống Bot spam hệ thống)
        const ipKey = `otp_limit:ip:${ip}`;
        const ipTTL = await checkLimit(ipKey, OTP_LIMIT_CONFIG.IP_MAX, OTP_LIMIT_CONFIG.WINDOW);
        if (ipTTL) {
            return res.status(429).json({
                success: false,
                message: `Bạn thao tác quá nhanh. Vui lòng thử lại sau ${Math.ceil(ipTTL / 60)} phút.`
            });
        }
        // Check 2: Giới hạn theo Email (Chống spam vào hộp thư người dùng)
        const emailKey = `otp_limit:email:${email}`;
        const emailTTL = await checkLimit(emailKey, OTP_LIMIT_CONFIG.TARGET_MAX, OTP_LIMIT_CONFIG.WINDOW);
        if (emailTTL) {
            return res.status(429).json({
                success: false,
                message: `Đã gửi quá nhiều OTP đến email này. Vui lòng quay lại sau ${Math.ceil(emailTTL / 60)} phút.`
            });
        }
        // ========== RATE LIMITER END ==========

		const result = await accountRepo.checkAccountByEmail(email);

		if (result === 0) {
			return res.status(404).json({
				success: false,
				message: 'Không tìm thấy tài khoản với email này'
			});
		} else if (result === -1) {
			return res.status(500).json({
				success: false,
				message: 'Lỗi khi gửi OTP. Vui lòng thử lại sau'
			});
		} else {
			return res.status(200).json({
				success: true,
				message: 'Tìm thấy tài khoản. OTP đã được gửi đến email của bạn',
				data: {
					email: email,
					accountExists: true,
					otpSent: true
				}
			});
		}

	} catch (error) {
		console.error('Error in checkAccountByEmail controller:', error);
		res.status(500).json({
			success: false,
			message: error.message || 'Lỗi server khi kiểm tra email'
		});
	}
};

// POST /public/change-password-by-email
exports.changePasswordByEmail = async (req, res) => {
	try {
		const { email, resetToken, newPassword } = req.body;
		if (!email || !resetToken || !newPassword) {
			return res.status(400).json({
				success: false,
				message: 'Password mới là bắt buộc'
			});
		}
		const result = await accountRepo.changePassword_ByEmail(email, resetToken, newPassword);
		if (result === 0) {
			return res.status(400).json({
				success: false,
				message: 'Token đặt lại không hợp lệ hoặc đã hết hạn'
			});
		} else {
			return res.status(200).json({
				success: true,
				message: 'Đổi mật khẩu thành công'
			});
		}
	} catch (error) {
		console.error('Error in changePasswordByEmail controller:', error);
		res.status(500).json({
			success: false,
			message: error.message || 'Lỗi server'
		});
	}
};

// POST /public/check-phone-number/:phoneNumber
exports.checkAccountByPhoneNumber = async (req, res) => {
	try {
		const { phoneNumber } = req.params;
		const ip = req.ip || req.connection.remoteAddress;
		// Kiểm tra số điện thoại có được cung cấp không
		if (!phoneNumber) {
			return res.status(400).json({
				success: false,
				message: 'Số điện thoại là bắt buộc'
			});
		}
		// Kiểm tra format số điện thoại (có 10 số)
		const phoneRegex = /^\d{10}$/;
		if (!phoneRegex.test(phoneNumber)) {
			return res.status(400).json({
				success: false,
				message: 'Số điện thoại không hợp lệ.'
			});
		}

		// ========== RATE LIMITER START ==========
        // Check 1: Giới hạn theo IP
        const ipKey = `otp_limit:ip:${ip}`;
        const ipTTL = await checkLimit(ipKey, OTP_LIMIT_CONFIG.IP_MAX, OTP_LIMIT_CONFIG.WINDOW);
        if (ipTTL) {
            return res.status(429).json({
                success: false,
                message: `Hệ thống bận. Vui lòng thử lại sau ${Math.ceil(ipTTL / 60)} phút.`
            });
        }
        // Check 2: Giới hạn theo Số điện thoại
        const phoneKey = `otp_limit:phone:${phoneNumber}`;
        const phoneTTL = await checkLimit(phoneKey, OTP_LIMIT_CONFIG.TARGET_MAX, OTP_LIMIT_CONFIG.WINDOW);
        if (phoneTTL) {
            return res.status(429).json({
                success: false,
                message: `Đã gửi quá nhiều mã OTP. Vui lòng thử lại sau ${Math.ceil(phoneTTL / 60)} phút.`
            });
        }
        // ========== RATE LIMITER END ==========

		const result = await accountRepo.checkAccountByPhoneNumber(phoneNumber);
		if (result === 0) {
			return res.status(404).json({
				success: false,
				message: 'Không tìm thấy tài khoản với số điện thoại này'
			});
		} else if (result === -1) {
			return res.status(500).json({
				success: false,
				message: 'Lỗi khi gửi OTP. Vui lòng thử lại sau'
			});
		} else {
			return res.status(200).json({
				success: true,
				message: 'Tìm thấy tài khoản. OTP đã được gửi đến số điện thoại của bạn',
				data: {
					phoneNumber: phoneNumber,
					accountExists: true,
					otpSent: true
				}
			});
		}
	} catch (error) {
		console.error('Error in checkAccountByPhoneNumber controller:', error);
		res.status(500).json({
			success: false,
			message: error.message || 'Lỗi server'
		});
	}
};

// POST /public/verify-otp-phone
exports.verifyOTP_Phone = async (req, res) => {
	try {
		const { phoneNumber, otp } = req.body;
		// Kiểm tra các trường bắt buộc
		if (!phoneNumber || !otp) {
			return res.status(400).json({
				success: false,
				message: 'Số điện thoại và OTP là bắt buộc'
			});
		}
		// Kiểm tra format số điện thoại (có 10 số)
		const phoneRegex = /^\d{10}$/;
		if (!phoneRegex.test(phoneNumber)) {
			return res.status(400).json({
				success: false,
				message: 'Số điện thoại không hợp lệ.'
			});
		}
		// Kiểm tra format OTP (6 số)
		const otpRegex = /^\d{6}$/;
		if (!otpRegex.test(otp)) {
			return res.status(400).json({
				success: false,
				message: 'OTP phải là 6 chữ số'
			});
		}
		const result = await smsService.verifyOTP(phoneNumber, otp);
		if (result.success) {
			res.status(200).json({
				success: true,
				message: result.message,
				data: {
					phoneNumber: phoneNumber,
					verified: true,
					resetToken: result.resetToken
				}
			});
		} else {
			res.status(400).json({
				success: false,
				message: result.message
			});
		}
	} catch (error) {
		console.error('Error in verifyOTP_Phone controller:', error);
		res.status(500).json({
			success: false,
			message: error.message || 'Lỗi server'
		});
	}
};

// POST /public/change-password-by-phone-number
exports.changePasswordByPhoneNumber = async (req, res) => {
	try {
		const { phoneNumber, resetToken, newPassword } = req.body;
		if (!phoneNumber || !resetToken || !newPassword) {
			return res.status(400).json({
				success: false,
				message: 'Mật khẩu mới là bắt buộc'
			});
		}
		const result = await accountRepo.changePassword_ByPhoneNumber(phoneNumber, resetToken, newPassword);
		if (result === 0) {
			return res.status(400).json({
				success: false,
				message: 'Token đặt lại không hợp lệ hoặc đã hết hạn'
			});
		} else {
			return res.status(200).json({
				success: true,
				message: 'Đổi mật khẩu thành công'
			});
		}
	} catch (error) {
		console.error('Error in changePasswordByPhoneNumber controller:', error);
		res.status(500).json({
			success: false,
			message: error.message || 'Lỗi server'
		});
	}
};
