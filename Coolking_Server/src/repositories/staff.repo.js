const sequelize = require("../config/mariadb.conf");
const { Op } = require("sequelize");
const { initModels } = require("../databases/mariadb/model/init-models");
const models = initModels(sequelize);
const datetimeFormatter = require("../utils/format/datetime-formatter");
const cloudinaryService = require("../services/cloudinary.service");
const cloudinaryUtils = require("../utils/cloudinary.utils");

const getStaffByStaff_id = async (staff_id) => {
  try {
    const result = await models.Staff.findOne({
      attributes: {
        exclude: ['id', 'isDeleted']
      },
      where: { staff_id, isDeleted: false }
    });

    if (!result) throw new Error("Staff not found");

    const gender = result.gender == "1" ? "Nam" : "Nữ";

    return {
      staff_id: result.staff_id,
      admin_id: result.admin_id,
      name: result.name,
      dob: datetimeFormatter.formatDateVN(result.dob),
      gender,
      avatar: result.avatar,
      phone: result.phone,
      email: result.email,
      address: result.address,
      department: result.department,
      position: result.position,
      createdAt: datetimeFormatter.formatDateTimeVN(result.createdAt),
      updatedAt: datetimeFormatter.formatDateTimeVN(result.updatedAt),
    };
  } catch (error) {
    throw error;
  }
};

const getStaffByAdmin_id4Admin = async (admin_id) => {
  try {
    const result = await models.Staff.findOne({
      attributes: {
        exclude: ['id', 'isDeleted']
      },
      where: { admin_id, isDeleted: false }
    });

    if (!result) throw new Error("Admin staff not found");

    const gender = result.gender == "1" ? "Nam" : "Nữ";

    return {
      staff_id: result.staff_id,
      admin_id: result.admin_id,
      name: result.name,
      dob: datetimeFormatter.formatDateVN(result.dob),
      gender,
      avatar: result.avatar,
      phone: result.phone,
      email: result.email,
      address: result.address,
      department: result.department,
      position: result.position,
      createdAt: datetimeFormatter.formatDateTimeVN(result.createdAt),
      updatedAt: datetimeFormatter.formatDateTimeVN(result.updatedAt),
    };
  } catch (error) {
    throw error;
  }
};

const createStaff = async (staffData) => {
  try {
    staffData.dob = datetimeFormatter.convertddMMyyyy2yyyyMMdd(staffData.dob);
    return await models.Account.create(staffData);
  } catch (error) {
    throw error;
  }
};

const addAdmin_id4Staff = async (admin_id, staff_id, position, transaction) => {
  try {
    const staff = await models.Staff.findOne({ where: { staff_id }, transaction });
    if (!staff) throw new Error("Staff not found");
    staff.admin_id = admin_id;
    staff.position = position;
    await staff.save({ transaction });
    return;
  } catch (error) {
    throw error;
  }
};

const updateStaff = async (staff_id, staffData) => {
  const transaction = await sequelize.transaction();

  try {
    // Tìm staff
    const staff = await models.Staff.findOne({
      where: { staff_id },
      transaction
    });
    if (!staff) throw new Error("Staff not found");

    // Tìm account tương ứng
    const account = await models.Account.findOne({
      where: { user_id: staff_id },
      transaction
    });
    if (!account) throw new Error("Account not found");

    // Chuẩn bị dữ liệu cho staff
    const staffUpdateData = { ...staffData };
    if (staffUpdateData.dob) {
      staffUpdateData.dob = datetimeFormatter.convertddMMyyyy2yyyyMMdd(staffUpdateData.dob);
    }

    // Chuẩn bị dữ liệu cho account
    const accountUpdateData = {};
    if (staffData.email) {
      accountUpdateData.email = staffData.email;
    }
    if (staffData.phone) {
      accountUpdateData.phone_number = staffData.phone;
    }

    // Cập nhật staff
    await staff.update(staffUpdateData, { transaction });

    // Cập nhật account nếu có dữ liệu email hoặc phone
    if (Object.keys(accountUpdateData).length > 0) {
      await account.update(accountUpdateData, { transaction });
    }

    // Cập nhật thông tin trong MongoDB Chat nếu có thay đổi email hoặc phone
    if (staffData.email || staffData.phone) {
      try {
        const { Chat } = require('../databases/mongodb/schemas/Chat');

        const updateFields = {};
        if (staffData.email) {
          updateFields["members.$.email"] = staffData.email;
        }
        if (staffData.phone) {
          updateFields["members.$.phone"] = staffData.phone;
        }

        if (Object.keys(updateFields).length > 0) {
          updateFields.updatedAt = new Date();

          await Chat.updateMany(
            { "members.userID": staff_id },
            { $set: updateFields }
          );
        }
      } catch (chatUpdateError) {
        console.warn('Warning: Could not update staff info in chats:', chatUpdateError.message);
        // Không throw error vì cập nhật chính đã thành công
      }
    }

    await transaction.commit();

    return {
      staff: await staff.reload(),
      account: await account.reload(),
      message: 'Staff updated successfully'
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const updateStaff4Admin = async (admin_id, staffData) => {
  const transaction = await sequelize.transaction();

  try {
    // Tìm staff by admin_id
    const staff = await models.Staff.findOne({
      where: { admin_id },
      transaction
    });
    if (!staff) throw new Error("Admin staff not found");

    // Tìm account tương ứng
    const account = await models.Account.findOne({
      where: { user_id: admin_id },
      transaction
    });
    if (!account) throw new Error("Account not found");

    // Chuẩn bị dữ liệu cho staff
    const staffUpdateData = { ...staffData };
    if (staffUpdateData.dob) {
      staffUpdateData.dob = datetimeFormatter.convertddMMyyyy2yyyyMMdd(staffUpdateData.dob);
    }

    // Chuẩn bị dữ liệu cho account
    const accountUpdateData = {};
    if (staffData.email) {
      accountUpdateData.email = staffData.email;
    }
    if (staffData.phone) {
      accountUpdateData.phone_number = staffData.phone;
    }

    // Cập nhật staff
    await staff.update(staffUpdateData, { transaction });

    // Cập nhật account nếu có dữ liệu email hoặc phone
    if (Object.keys(accountUpdateData).length > 0) {
      await account.update(accountUpdateData, { transaction });
    }

    // Cập nhật thông tin trong MongoDB Chat nếu có thay đổi email hoặc phone
    if (staffData.email || staffData.phone) {
      try {
        const { Chat } = require('../databases/mongodb/schemas/Chat');

        const updateFields = {};
        if (staffData.email) {
          updateFields["members.$.email"] = staffData.email;
        }
        if (staffData.phone) {
          updateFields["members.$.phone"] = staffData.phone;
        }

        if (Object.keys(updateFields).length > 0) {
          updateFields.updatedAt = new Date();

          await Chat.updateMany(
            { "members.userID": admin_id },
            { $set: updateFields }
          );
        }
      } catch (chatUpdateError) {
        console.warn('Warning: Could not update admin staff info in chats:', chatUpdateError.message);
        // Không throw error vì cập nhật chính đã thành công
      }
    }

    await transaction.commit();

    return {
      staff: await staff.reload(),
      account: await account.reload(),
      message: 'Admin staff updated successfully'
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const deleteStaff = async (staff_id) => {
  try {
    const staff = await models.Staff.findOne({ where: { staff_id } });
    if (!staff) throw new Error("Staff not found");
    staff.isDeleted = true;
    await staff.save();
    return staff;
  } catch (error) {
    throw error;
  }
};

const deleteStaff4Admin = async (admin_id) => {
  try {
    const staff = await models.Staff.findOne({ where: { admin_id } });
    if (!staff) throw new Error("Admin staff not found");
    staff.isDeleted = true;
    await staff.save();
    return staff;
  } catch (error) {
    throw error;
  }
};

const uploadAvatar = async (staff_id, file) => {
  try {
    const staff = await models.Staff.findOne({ where: { staff_id } });
    if (!staff) throw new Error("Staff not found");
    const folder = 'account_avatar';

    // Xóa avatar cũ nếu có
    if (staff.avatar) {
      try {
        const publicId = cloudinaryUtils.getPublicIdFromUrl(staff.avatar, folder);
        await cloudinaryService.deleteFromCloudinary(publicId);
      } catch (deleteError) {
        console.log('Warning: Could not delete old avatar:', deleteError.message);
      }
    }

    // Upload avatar mới
    const uploadResult = await cloudinaryService.upload2Cloudinary(file.buffer, folder, file.originalname);
    if (!uploadResult.success) {
      throw new Error('Avatar upload failed');
    }

    // Cập nhật avatar URL trong database
    staff.avatar = uploadResult.url;
    await staff.save();

    // Cập nhật avatar trong tất cả các chat có chứa staff này
    try {
      const { Chat } = require('../databases/mongodb/schemas/Chat');

      // Tìm tất cả chat có members chứa userID = staff_id
      const updateResult = await Chat.updateMany(
        { "members.userID": staff_id },
        {
          $set: {
            "members.$.avatar": uploadResult.url,
            updatedAt: new Date()
          }
        }
      );

    } catch (chatUpdateError) {
      console.warn('Warning: Could not update avatar in chats:', chatUpdateError.message);
      // Không throw error vì avatar đã được cập nhật thành công trong MariaDB
    }

    return {
      staff_id: staff.staff_id,
      name: staff.name,
      avatar: staff.avatar,
      message: 'Avatar uploaded successfully'
    };
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw new Error(`Avatar upload failed: ${error.message}`);
  }
};

const uploadAvatar4Admin = async (admin_id, file) => {
  try {
    const staff = await models.Staff.findOne({ where: { admin_id } });
    if (!staff) throw new Error("Admin staff not found");
    const folder = 'account_avatar';

    // Xóa avatar cũ nếu có
    if (staff.avatar) {
      try {
        const publicId = cloudinaryUtils.getPublicIdFromUrl(staff.avatar, folder);
        await cloudinaryService.deleteFromCloudinary(publicId);
      } catch (deleteError) {
        console.log('Warning: Could not delete old avatar:', deleteError.message);
      }
    }

    // Upload avatar mới
    const uploadResult = await cloudinaryService.upload2Cloudinary(file.buffer, folder, file.originalname);
    if (!uploadResult.success) {
      throw new Error('Avatar upload failed');
    }

    // Cập nhật avatar URL trong database
    staff.avatar = uploadResult.url;
    await staff.save();

    // Cập nhật avatar trong tất cả các chat có chứa admin staff này
    try {
      const { Chat } = require('../databases/mongodb/schemas/Chat');

      // Tìm tất cả chat có members chứa userID = admin_id
      const updateResult = await Chat.updateMany(
        { "members.userID": admin_id },
        {
          $set: {
            "members.$.avatar": uploadResult.url,
            updatedAt: new Date()
          }
        }
      );

    } catch (chatUpdateError) {
      console.warn('Warning: Could not update avatar in chats:', chatUpdateError.message);
      // Không throw error vì avatar đã được cập nhật thành công trong MariaDB
    }

    return {
      admin_id: staff.admin_id,
      staff_id: staff.staff_id,
      name: staff.name,
      avatar: staff.avatar,
      message: 'Avatar uploaded successfully'
    };
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw new Error(`Avatar upload failed: ${error.message}`);
  }
};

const getStaffByID4Admin = async (staff_id) => {
  try {
    // Chỉ lấy staff có admin_id = null (không phải admin)
    const staff = await models.Staff.findOne({
      where: {
        staff_id,
        admin_id: null  // Điều kiện admin_id không tồn tại (null)
      }
    });
    if (!staff) throw new Error("Staff not found or is admin");

    return {
      staff_id: staff.staff_id,
      admin_id: staff.admin_id,
      name: staff.name,
      phone: staff.phone,
      email: staff.email,
      department: staff.department,
      position: staff.position
    };
  } catch (error) {
    throw error;
  }
};

const getAllStaffs = async (department) => {
  try {
    const staffs = await models.Staff.findAll({
      where: {
        admin_id: { [Op.ne]: null },
        isDeleted: false,
        department
      }
    });
    return staffs;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getStaffByStaff_id,
  getStaffByAdmin_id4Admin,
  createStaff,
  addAdmin_id4Staff,
  updateStaff,
  updateStaff4Admin,
  deleteStaff,
  deleteStaff4Admin,
  uploadAvatar,
  uploadAvatar4Admin,
  getStaffByID4Admin,
  getAllStaffs
};