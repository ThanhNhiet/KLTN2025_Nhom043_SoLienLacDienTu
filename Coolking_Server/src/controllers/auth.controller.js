const accountRepo = require('../repositories/account.repo');
const jwtUtils = require('../utils/jwt.utils');
const tokenRepo = require('../repositories/token.repo');
const redisService = require('../services/redis.service');
const emailService = require("../services/email.service");
const smsService = require("../services/sms.service");

// POST /public/login
exports.login = async (req, res, next) => {
	try {
		const { username, password } = req.body;

		// Xác thực người dùng từ repo
		const account = await accountRepo.login(username, password);

		// Nếu xác thực thành công, tạo token
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
		const ipAddress = req.ip || req.connection.remoteAddress;
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
		console.log('Received email to check:', email);

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

		const result = await accountRepo.checkAccountByEmail(email);
		console.log('checkAccountByEmail result:', result);

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
