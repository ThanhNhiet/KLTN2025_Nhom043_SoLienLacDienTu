const sequelize = require("../config/mariadb.conf");
const initModels = require("../databases/mariadb/model/init-models");
const models = initModels(sequelize);
const bcrypt = require("bcrypt");
const datetimeFormatter = require("../utils/format/datetime-formatter");
const emailService = require("../services/email.service");
const smsService = require("../services/sms.service");
const redisService = require('../services/redis.service');
const staffRepo = require("./staff.repo");
const { password } = require("../config/redis.conf");

const login = async (username, password) => {
  try {
    // Phân loại username dựa trên định dạng
    let whereClause = {};

    // Kiểm tra xem username có phải là email không
    if (username.includes('@') && username.includes('.')) {
      whereClause = { email: username };
    }
    // Kiểm tra xem username có phải là số điện thoại không (chỉ chứa số, dấu + và dấu -)
    else if (/^[0-9+\-\s]+$/.test(username)) {
      whereClause = { phone_number: username };
    }
    // Kiểm tra xem username có phải là user_id không (bắt đầu bằng ST, PA, LE, AD)
    else if (/^(ST|PA|LE|AD)/.test(username)) {
      whereClause = { user_id: username };
    }
    // Nếu không khớp với bất kỳ mẫu nào, thử tìm kiếm trong tất cả các trường
    else {
      const { Op } = require('sequelize');
      whereClause = {
        [Op.or]: [
          { user_id: username },
          { email: username },
          { phone_number: username }
        ]
      };
    }

    const account = await models.Account.findOne({ where: whereClause });

    if (!account) throw new Error("Account not found");
    if (account.status === 'INACTIVE') throw new Error("Account is not active");
    const isValid = await bcrypt.compare(password, account.password);
    if (!isValid) throw new Error("Invalid password");
    return account;
  } catch (error) {
    throw error;
  }
};

const changePassword = async (user_id, oldPassword, newPassword) => {
  try {
    const account = await models.Account.findOne({ where: { user_id } });
    if (!account) throw new Error("Account not found");
    const isValid = await bcrypt.compare(oldPassword, account.password);
    if (!isValid) throw new Error("Invalid old password");
    account.password = newPassword;
    await account.save();
    return account;
  } catch (error) {
    throw error;
  }
};

const getAllAccounts_paging = async (page, pageSize) => {
  try {
    const page_num = parseInt(page);
    const offset = (page_num - 1) * pageSize;
    const pageSize_num = parseInt(pageSize);
    const { count, rows } = await models.Account.findAndCountAll({
      attributes: { exclude: ['password'] },
      limit: pageSize_num,
      offset,
      order: [['updatedAt', 'DESC']],
      raw: true
    });

    const accounts = rows.map(acc => ({
      ...acc,
      createdAt: datetimeFormatter.formatDateTimeVN(acc.createdAt),
      updatedAt: datetimeFormatter.formatDateTimeVN(acc.updatedAt)
    }));

    const linkPrev = page_num > 1 ? `/api/accounts?page=${page_num - 1}&pagesize=${pageSize_num}` : null;
    const linkNext = (page_num - 1) * pageSize_num + rows.length < count ? `/api/accounts?page=${page_num + 1}&pagesize=${pageSize_num}` : null;
    //nếu đang ở trang 1 thì 3pages là [1, 2, 3], nếu đang ở trang 2 thì 3pages là [2, 3, 4]
    const pages = [];
    for (let i = 1; i <= Math.ceil(count / pageSize_num); i++) {
      if (i >= page_num && i < page_num + 3) {
        pages.push(i);
      }
    }

    return { total: count, page: page_num, pageSize: pageSize_num, accounts: accounts, linkPrev, linkNext, pages };
  } catch (error) {
    throw error;
  }
};

//Get user by keyword (likely): user_id, email, phone_number
const getAllAccounts_keyword = async (keyword, page, pageSize) => {
  try {
    const page_num = parseInt(page);
    const pageSize_num = parseInt(pageSize);
    const offset = (page_num - 1) * pageSize_num;

    const { Op } = require('sequelize');
    const { count, rows } = await models.Account.findAndCountAll({
      where: {
        [Op.or]: [
          { user_id: { [Op.like]: `%${keyword}%` } },
          { email: { [Op.like]: `%${keyword}%` } },
          { phone_number: { [Op.like]: `%${keyword}%` } }
        ]
      },
      attributes: { exclude: ['password'] },
      limit: pageSize_num,
      offset,
      order: [['updatedAt', 'DESC']],
      raw: true
    });

    const accounts = rows.map(acc => ({
      ...acc,
      createdAt: datetimeFormatter.formatDateTimeVN(acc.createdAt),
      updatedAt: datetimeFormatter.formatDateTimeVN(acc.updatedAt)
    }));

    const linkPrev = page_num > 1
      ? `/api/accounts/search?keyword=${encodeURIComponent(keyword)}&page=${page_num - 1}&pagesize=${pageSize_num}`
      : null;

    const linkNext = page_num * pageSize_num < count
      ? `/api/accounts/search?keyword=${encodeURIComponent(keyword)}&page=${page_num + 1}&pagesize=${pageSize_num}`
      : null;

    const pages = [];
    for (let i = 1; i <= Math.ceil(count / pageSize_num); i++) {
      if (i >= page_num && i < page_num + 3) {
        pages.push(i);
      }
    }

    return {
      total: count,
      page: page_num,
      pageSize: pageSize_num,
      accounts,
      linkPrev,
      linkNext,
      pages
    };
  } catch (error) {
    throw error;
  }
};


const getAccountByUserId = async (user_id) => {
  try {
    const result = await models.Account.findOne({
      attributes: { exclude: ['password'] }, // Loại trừ trường password
      where: { user_id },
      raw: true
    });
    if (!result) throw new Error("Account not found");
    // const account = result.get({ plain: true });
    // console.log(account);
    // account.createdAt = datetimeFormatter.formatDateTimeVN(result.createdAt);
    // account.updatedAt = datetimeFormatter.formatDateTimeVN(result.updatedAt);
    // console.log(account.createdAt);
    // console.log(account.updatedAt);
    // return account;
    return {
      ...result,
      createdAt: datetimeFormatter.formatDateTimeVN(result.createdAt),
      updatedAt: datetimeFormatter.formatDateTimeVN(result.updatedAt),
    };
  } catch (error) {
    throw error;
  }
};

const createAccount = async (accountData) => {
  if (accountData.role === 'ADMIN') {
    const transaction = await sequelize.transaction();
    try {
      // Tự động sinh user_id cho ADMIN, user_id có định dạng ADMINxxx
      // Đếm số lượng record có role là ADMIN
      const numberOfAdmins = await models.Account.count({ where: { role: 'ADMIN' } });
      const newAdminNumber = numberOfAdmins + 1;
      const paddedNumber = String(newAdminNumber).padStart(3, '0'); // luôn đủ 3 số
      const admin_id = `ADMIN${paddedNumber}`;
      if (accountData.email === '') {
        accountData.email = null;
      }
      if (accountData.phone_number === '') {
        accountData.phone_number = null;
      }
      const formAdmin = {
        user_id: admin_id,
        password: accountData.password,
        role: accountData.role,
        status: accountData.status,
        email: accountData.email,
        phone_number: accountData.phone_number,
      };
      const newAdmin = await models.Account.create(formAdmin, { transaction });
      await staffRepo.addAdmin_id4Staff(admin_id, accountData.user_id, accountData.position, transaction);
      await transaction.commit();
      return newAdmin;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } else {
    // Logic cho các role khác không cần transaction
    if (accountData.email === '') {
      accountData.email = null;
    }
    if (accountData.phone_number === '') {
      accountData.phone_number = null;
    }
    try {
      const formUser = {
        user_id: accountData.user_id,
        password: accountData.password,
        role: accountData.role,
        status: accountData.status,
        email: accountData.email,
        phone_number: accountData.phone_number,
      };
      return await models.Account.create(formUser);
    } catch (error) {
      throw error;
    }
  }
};

const updateAccount = async (user_id, accountData) => {
  try {
    const account = await models.Account.findOne({ where: { user_id } });
    if (!account) throw new Error("Account not found");
    return await account.update(accountData);
  } catch (error) {
    throw error;
  }
};

const deleteAccount = async (user_id) => {
  try {
    const account = await models.Account.findOne({ where: { user_id } });
    if (!account) throw new Error("Account not found");
    account.status = 'INACTIVE';
    await account.save();
    return account;
  } catch (error) {
    throw error;
  }
};

const resetPassword4Admin = async (user_id) => {
  try {
    const account = await models.Account.findOne({ where: { user_id } });
    if (!account) throw new Error("Account not found");
    const newPassword = '12345678';
    account.password = newPassword;
    await account.save();
    return newPassword;
  } catch (error) {
    throw error;
  }
};

const checkAccountByEmail = async (email) => {
  try {
    const account = await models.Account.findOne({ where: { email } });
    if (!account) return 0; // Tài khoản không tồn tại

    const result = await emailService.sendOTP(email);
    if (!result.success) return -1; // Gửi OTP thất bại

    return 1; // Gửi OTP thành công
  } catch (error) {
    console.error('Error in checkAccountByEmail:', error);
    return -1; // Lỗi xảy ra
  }
};

const changePassword_ByEmail = async (email, resetToken, newPassword) => {
  try {
    const account = await models.Account.findOne({ where: { email } });
    if (!account) throw new Error("Account not found");
    const storedToken = await redisService.get(`reset:${email}`);
    if (storedToken !== resetToken) return 0;
    account.password = newPassword;
    await account.save();
    await redisService.del(`reset:${email}`);
    return account;
  } catch (error) {
    throw error;
  }
};

const checkAccountByPhoneNumber = async (phoneNumber) => {
  try {
    const account = await models.Account.findOne({ where: { phone_number: phoneNumber } });
    if (!account) return 0; // Tài khoản không tồn tại
    const result = await smsService.sendOTP(phoneNumber);
    if (!result.success) return -1; // Gửi OTP thất bại
    return 1; // Gửi OTP thành công
  } catch (error) {
    console.error('Error in checkAccountByPhoneNumber:', error);
    return -1; // Lỗi xảy ra
  }
};

const changePassword_ByPhoneNumber = async (phoneNumber, resetToken, newPassword) => {
  try {
    const account = await models.Account.findOne({ where: { phone_number: phoneNumber } });
    if (!account) throw new Error("Account not found");
    const storedToken = await redisService.get(`reset:${phoneNumber}`);
    if (storedToken !== resetToken) return 0;
    account.password = newPassword;
    await account.save();
    await redisService.del(`reset:${phoneNumber}`);
    return account;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  login,
  changePassword,
  getAllAccounts_paging,
  getAccountByUserId,
  createAccount,
  updateAccount,
  deleteAccount,
  resetPassword4Admin,
  getAllAccounts_keyword,
  checkAccountByEmail,
  changePassword_ByEmail,
  checkAccountByPhoneNumber,
  changePassword_ByPhoneNumber
};
