const sequelize = require("../config/mariadb.conf");
const { initModels } = require("../databases/mariadb/model/init-models");
const models = initModels(sequelize);
const datetimeFormatter = require("../utils/format/datetime-formatter");
const cloudinaryService = require("../services/cloudinary.service");
const cloudinaryUtils = require("../utils/cloudinary.utils");
const { Alert } = require('../databases/mongodb/schemas');

const getLecturerByLecturer_id = async (lecturer_id) => {
  try {
    const result = await models.Lecturer.findOne({
      attributes: {
        exclude: ['id', 'isDeleted', 'faculty_id']
      },
      where: { lecturer_id, isDeleted: false },
      include: [
        {
          model: models.Faculty,
          as: 'faculty',
          attributes: ['name'],
          required: false
        },
        {
          model: models.Clazz,
          as: 'clazz',
          attributes: ['name'],
          required: false
        }
      ]
    });

    if (!result) throw new Error("Lecturer not found");

    const gender = result.gender == "1" ? "Nam" : "Nữ";

    return {
      lecturer_id: result.lecturer_id,
      name: result.name,
      dob: datetimeFormatter.formatDateVN(result.dob),
      gender,
      avatar: result.avatar,
      phone: result.phone,
      email: result.email,
      address: result.address,
      facultyName: result.faculty ? result.faculty.name : null,
      homeroomClassName: result.clazz ? result.clazz.name : null,
      createdAt: datetimeFormatter.formatDateTimeVN(result.createdAt),
      updatedAt: datetimeFormatter.formatDateTimeVN(result.updatedAt),
    };
  } catch (error) {
    throw error;
  }
};

const createLecturer = async (lecturerData) => {
  try {
    lecturerData.dob = datetimeFormatter.convertddMMyyyy2yyyyMMdd(lecturerData.dob);
    return await models.Account.create(lecturerData);
  } catch (error) {
    throw error;
  }
};

const updateLecturer = async (lecturer_id, lecturerData) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Tìm lecturer
    const lecturer = await models.Lecturer.findOne({ 
      where: { lecturer_id },
      transaction 
    });
    if (!lecturer) throw new Error("Lecturer not found");

    // Tìm account tương ứng
    const account = await models.Account.findOne({ 
      where: { user_id: lecturer_id },
      transaction 
    });
    if (!account) throw new Error("Account not found");

    // Chuẩn bị dữ liệu cho lecturer
    const lecturerUpdateData = { ...lecturerData };
    if (lecturerUpdateData.dob) {
      lecturerUpdateData.dob = datetimeFormatter.convertddMMyyyy2yyyyMMdd(lecturerUpdateData.dob);
    }

    // Chuẩn bị dữ liệu cho account
    const accountUpdateData = {};
    if (lecturerData.email) {
      accountUpdateData.email = lecturerData.email;
    }
    if (lecturerData.phone) {
      accountUpdateData.phone_number = lecturerData.phone;
    }

    // Cập nhật lecturer
    await lecturer.update(lecturerUpdateData, { transaction });

    // Cập nhật account nếu có dữ liệu email hoặc phone
    if (Object.keys(accountUpdateData).length > 0) {
      await account.update(accountUpdateData, { transaction });
    }

    // Cập nhật thông tin trong MongoDB Chat nếu có thay đổi email hoặc phone
    if (lecturerData.email || lecturerData.phone) {
      try {
        const { Chat } = require('../databases/mongodb/schemas/Chat');
        
        const updateFields = {};
        if (lecturerData.email) {
          updateFields["members.$.email"] = lecturerData.email;
        }
        if (lecturerData.phone) {
          updateFields["members.$.phone"] = lecturerData.phone;
        }
        
        if (Object.keys(updateFields).length > 0) {
          updateFields.updatedAt = new Date();
          
          await Chat.updateMany(
            { "members.userID": lecturer_id },
            { $set: updateFields }
          );
        }
      } catch (chatUpdateError) {
        console.warn('Warning: Could not update lecturer info in chats:', chatUpdateError.message);
        // Không throw error vì cập nhật chính đã thành công
      }
    }

    await transaction.commit();
    
    return {
      lecturer: await lecturer.reload(),
      account: await account.reload(),
      message: 'Lecturer updated successfully'
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const deleteLecturer = async (lecturer_id) => {
  try {
    const lecturer = await models.Lecturer.findOne({ where: { lecturer_id } });
    if (!lecturer) throw new Error("Leturer not found");
    lecturer.isDeleted = true;
    await lecturer.save();
    return lecturer;
  } catch (error) {
    throw error;
  }
};

const uploadAvatar = async (lecturer_id, file) => {
  try {
    const lecturer = await models.Lecturer.findOne({ where: { lecturer_id } });
    if (!lecturer) throw new Error("Lecturer not found");
    const folder = 'account_avatar';
  
    // Xóa avatar cũ nếu có
    if (lecturer.avatar) {
      try {
        const publicId = cloudinaryUtils.getPublicIdFromUrl(lecturer.avatar, folder);
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
    lecturer.avatar = uploadResult.url;
    await lecturer.save();
    
    // Cập nhật avatar trong tất cả các chat có chứa lecturer này
    try {
      const { Chat } = require('../databases/mongodb/schemas/Chat');
      
      // Tìm tất cả chat có members chứa userID = lecturer_id
      const updateResult = await Chat.updateMany(
        { "members.userID": lecturer_id },
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
      lecturer_id: lecturer.lecturer_id,
      name: lecturer.name,
      avatar: lecturer.avatar,
      message: 'Avatar uploaded successfully'
    };
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw new Error(`Avatar upload failed: ${error.message}`);
  }
};

const getLecturerById4Admin = async (lecturer_id) => {
  try {
    const lecturer = await models.Lecturer.findOne({ where: { lecturer_id } });
    if (!lecturer) throw new Error("Lecturer not found");
    const homeroom = await models.Clazz.findOne({ where: { id: lecturer.homeroom_class_id } });
    return {
      lecturer_id: lecturer.lecturer_id,
      name: lecturer.name,
      phone: lecturer.phone,
      email: lecturer.email,
      faculty_id: lecturer.faculty_id,
      homeroom_name: homeroom ? homeroom.name : null
    };
  } catch (error) {
    throw error;
  }
};

const getHomeroomClassByLecturerId = async (lecturer_id) => {
  try {
    const lecturer = await models.Lecturer.findOne({
      attributes: ['id', 'name', 'email', 'phone', 'faculty_id', 'homeroom_class_id'],
      where: { lecturer_id },
      include: [
        {
          model: models.Faculty,
          as: 'faculty',
          attributes: ['name'],
          required: false
        },
        {
          model: models.Clazz,
          as: 'clazz',
          attributes: ['name'],
          required: false
        }
      ]
    });
    if (!lecturer) throw new Error("Lecturer not found");
    return {
      lecturer_id: lecturer.lecturer_id,
      name: lecturer.name,
      email: lecturer.email,
      phone: lecturer.phone,
      facultyName: lecturer.faculty ? lecturer.faculty.name : null,
      homeroom_class_id: lecturer.homeroom_class_id,
      homeroomClassName: lecturer.clazz ? lecturer.clazz.name : null,
    }
  } catch (error) {
    throw error;
  }
};

const getStudentsInHomeroomClass = async (homeroom_class_id) => {
  try {
    const students = await models.Student.findAll({
      attributes: ['student_id', 'name', 'dob', 'gender', 'email', 'phone', 'address', 'parent_id'],
      where: { clazz_id: homeroom_class_id, isDeleted: false },
      include: [
        {
          model: models.Major,
          as: 'major',
          attributes: ['name'],
          required: false
        },
        {
          model: models.Parent,
          as: 'parent',
          attributes: ['name', 'dob', 'gender', 'phone', 'email', 'address'],
          required: false
        }
      ]
    });
    return students.map(student => ({
      student_id: student.student_id,
      name: student.name,
      dob: datetimeFormatter.formatDateVN(student.dob),
      gender: student.gender ? "Nam" : "Nữ",
      email: student.email,
      phone: student.phone,
      address: student.address,
      parent_id: student.parent_id,
      parentName: student.parent ? student.parent.name : null,
      parentDob: student.parent ? datetimeFormatter.formatDateVN(student.parent.dob) : null,
      parentGender: student.parent ? (student.parent.gender ? "Nam" : "Nữ") : null,
      parentPhone: student.parent ? student.parent.phone : null,
      parentEmail: student.parent ? student.parent.email : null,
      parentAddress: student.parent ? student.parent.address : null
    }));
  } catch (error) {
    throw error;
  }
};

const getStudentsInfoInHomeroomClassByLecturerId = async (lecturer_id) => {
    try {
        // 1. Lấy thông tin lớp chủ nhiệm
        const homeroomInfo = await getHomeroomClassByLecturerId(lecturer_id);
        
        // Nếu giảng viên không có lớp chủ nhiệm, trả về rỗng
        if (!homeroomInfo.homeroom_class_id) {
            return {
                homeroomInfo,
                students: []
            };
        }

        // 2. Lấy danh sách sinh viên cơ bản từ MariaDB
        const students = await getStudentsInHomeroomClass(homeroomInfo.homeroom_class_id);

        if (students.length === 0) {
            return {
                homeroomInfo,
                students: []
            };
        }

        // 3. TỐI ƯU HÓA: Batch Query MongoDB để lấy Alert cho toàn bộ sinh viên

        const studentIds = students.map(s => s.student_id);
        const studentIdsRegexString = studentIds.join('|'); // Pattern: "SV01|SV02|SV03"

        // Query 1: Lấy tất cả "Cảnh báo học vụ" liên quan đến danh sách sinh viên này
        const allWarnings = await Alert.find({
            $and: [
                { header: { $regex: '^Cảnh báo học vụ', $options: 'i' } },
                {
                    $or: [
                        { header: { $regex: studentIdsRegexString, $options: 'i' } }, // Tìm ID trong header
                        { receiverID: { $in: studentIds } } // Tìm theo receiverID
                    ]
                }
            ]
        });

        // Query 2: Lấy tất cả "Thông báo buộc thôi học" liên quan
        const allExpulsions = await Alert.find({
            $and: [
                { header: { $regex: '^Thông báo buộc thôi học', $options: 'i' } },
                {
                    $or: [
                        { header: { $regex: studentIdsRegexString, $options: 'i' } },
                        { receiverID: { $in: studentIds } }
                    ]
                }
            ]
        });

        // 4. Xử lý dữ liệu Alert vào Map để mapping nhanh
        const alertMap = {};
        
        // Khởi tạo map mặc định
        studentIds.forEach(id => {
            alertMap[id] = { totalWarnings: 0, gotExpelAlertYet: false };
        });

        // --- Xử lý đếm Warning (Logic tránh trùng lặp Header) ---
        // Nhóm các Alert theo header để tránh đếm trùng khi gửi cho cả sinh viên và phụ huynh
        const uniqueWarningAlerts = {};
        allWarnings.forEach(alert => {
            const header = alert.header || "";
            // Chỉ giữ lại 1 bản ghi đại diện cho mỗi header unique
            if (!uniqueWarningAlerts[header]) {
                uniqueWarningAlerts[header] = alert;
            }
        });

        // Duyệt qua các Warning Header duy nhất để đếm
        Object.values(uniqueWarningAlerts).forEach(alert => {
            const header = alert.header || "";
            const receiverID = alert.receiverID;

            studentIds.forEach(studentId => {
                // Kiểm tra xem alert này có thuộc về studentId này không
                // Logic check: Header chứa ID hoặc receiverID trùng khớp
                const isMatch = new RegExp(studentId, 'i').test(header) || receiverID === studentId;
                
                if (isMatch) {
                    alertMap[studentId].totalWarnings += 1;
                }
            });
        });

        // --- Xử lý Expulsion (Chỉ cần check tồn tại) ---
        allExpulsions.forEach(alert => {
            const header = alert.header || "";
            const receiverID = alert.receiverID;

            studentIds.forEach(studentId => {
                const isMatch = new RegExp(studentId, 'i').test(header) || receiverID === studentId;
                if (isMatch) {
                    alertMap[studentId].gotExpelAlertYet = true;
                }
            });
        });

        // 5. Merge dữ liệu cảnh báo vào danh sách sinh viên
        const students_final = students.map(student => ({
            ...student,
            totalWarnings: alertMap[student.student_id].totalWarnings,
            gotExpelAlertYet: alertMap[student.student_id].gotExpelAlertYet
        }));

        return {
            homeroomInfo,
            students: students_final
        };

    } catch (error) {
        console.error("Error in getStudentsInfoInHomeroomClassByLecturerId:", error);
        throw error;
    }
};

const getLecturerInfoByHomeroomClassId = async (homeroom_class_id) => {
  try {
    const lecturer = await models.Lecturer.findOne({
      attributes: ['lecturer_id', 'name'],
      where: { homeroom_class_id, isDeleted: false }
    });
    if (!lecturer) throw new Error("Lecturer not found");
    return lecturer;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getLecturerByLecturer_id,
  createLecturer,
  updateLecturer,
  deleteLecturer,
  uploadAvatar,
  getLecturerById4Admin,
  getStudentsInfoInHomeroomClassByLecturerId,
  getLecturerInfoByHomeroomClassId
};

