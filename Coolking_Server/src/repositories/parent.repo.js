const { QueryTypes } = require('sequelize');
const sequelize = require("../config/mariadb.conf");
const initModels = require("../databases/mariadb/model/init-models");
const models = initModels(sequelize);
const datetimeFormatter = require("../utils/format/datetime-formatter");
const cloudinaryService = require("../services/cloudinary.service");
const cloudinaryUtils = require("../utils/cloudinary.utils");
const { Chat, ChatType, MemberRole } = require('../databases/mongodb/schemas/Chat');
const mongoose = require('mongoose');

const getParentByParent_id = async (parent_id) => {
  try {
    if (!parent_id) {
      throw new Error("Parent ID is required");
    }

    const parent = await models.Parent.findOne({
      attributes: {
        exclude: ['id', 'isDeleted', 'createdAt', 'updatedAt']
      },
      where: { parent_id, isDeleted: false },
      include: [
        {
          model: models.Student,
          as: 'students',
          attributes: {
            exclude: ['id', 'isDeleted', 'clazz_id', 'major_id', 'parent_id', 'createdAt', 'updatedAt']
          },
          where: { isDeleted: false },
          required: false,
          include: [
            {
              model: models.Clazz,
              as: 'clazz',
              attributes: ['name'],
              required: false,
              include: [
                {
                  model: models.Faculty,
                  as: 'faculty',
                  attributes: ['name'],
                  required: false
                }
              ]
            },
            {
              model: models.Major,
              as: 'major',
              attributes: ['name'],
              required: false
            }
          ]
        }
      ]
    });

    if (!parent) {
      throw new Error(`Parent not found with ID: ${parent_id}`);
    }

    const studentInfoList = parent.students.map(student => {
      const genderStudent = student.gender ? "Nam" : "Nữ";

      return {
        student_id: student.student_id,
        name: student.name,
        dob: datetimeFormatter.formatDateVN(student.dob),
        gender: genderStudent,
        phone: student.phone,
        email: student.email,
        address: student.address,
        className: student.clazz ? student.clazz.name : null,
        facultyName: student.clazz && student.clazz.faculty ? student.clazz.faculty.name : null,
        majorName: student.major ? student.major.name : null,
      };
    });

    const genderParent = parent.gender ? "Nam" : "Nữ";

    return {
      parent_id: parent.parent_id,
      name: parent.name,
      email: parent.email,
      dob: parent.dob ? datetimeFormatter.formatDateVN(parent.dob) : null,
      phone: parent.phone,
      address: parent.address,
      avatar: parent.avatar,
      gender: genderParent,
      students: studentInfoList
    };
  } catch (error) {
    console.error("Error fetching parent:", error);
    throw error;
  }
};

const updateParentAvatar = async (parent_id, file) => {
  try {

    // Kiểm tra input
    if (!parent_id) {
      throw new Error("Parent ID is required");
    }
    if (!file || !file.buffer) {
      throw new Error("File is required");
    }

    const parent = await models.Parent.findOne({ where: { parent_id } });
    if (!parent) throw new Error("Parent not found");

    const folder = 'account_avatar';

    // Xóa avatar cũ nếu có
    if (parent.avatar) {
      try {
        const publicId = cloudinaryUtils.getPublicIdFromUrl(parent.avatar, folder);
        await cloudinaryService.deleteFromCloudinary(publicId);
      } catch (deleteError) {
        console.log('Warning: Could not delete old avatar:', deleteError.message);
      }
    }

    // Upload avatar mới
    const uploadResult = await cloudinaryService.upload2Cloudinary(file.buffer, folder, file.originalname);

    if (!uploadResult || !uploadResult.success) {
      throw new Error('Avatar upload failed');
    }

    // Cập nhật avatar URL trong database
    parent.avatar = uploadResult.url;
    await parent.save();

    // Find chat and update member's avatar
    const chats = await Chat.find({ 'members.userID': parent_id });

    if (chats && chats.length > 0) {
      // Use Promise.all to handle all async operations
      await Promise.all(chats.map(async (chat) => {
        const memberIndex = chat.members.findIndex(member => member.userID === parent_id);
        if (memberIndex !== -1) {
          chat.members[memberIndex].avatar = uploadResult.url;
          await chat.save();
        }
      }));
    }

    return {
      parent_id: parent.parent_id,
      name: parent.name,
      avatar: parent.avatar,
      message: 'Avatar uploaded successfully'
    };
  } catch (error) {
    console.error("Error in updateParentAvatar:", error);
    throw error;
  }
};
const updateParentInfo = async (parent_id, parentData) => {
  try {
    const parent = await models.Parent.findOne({ where: { parent_id } });
    if (!parent) throw new Error("Parent not found");
    parentData.dob = datetimeFormatter.convertddMMyyyy2yyyyMMdd(parentData.dob);
    parentData.updatedAt = new Date();
    return await parent.update(parentData);
  } catch (error) {
    throw error;
  }
};
const getParentScheduleWithExceptions = async (parent_id, options = {}) => {
  try {
    // Validate input
    if (!parent_id) {
      throw new Error("Parent ID is required");
    }

    // Lấy student_id từ parent_id
    const parent = await models.Parent.findOne({
      where: { parent_id, isDeleted: false }
    });

    if (!parent) {
      throw new Error("Parent not found");
    }

    const student_id = parent.student_id;

    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 10;
    const sortBy = options.sortBy || 'schedule_type';
    const sortOrder = options.sortOrder || 'ASC';
    const offset = (page - 1) * limit;

    // Validate sortBy to prevent SQL injection
    const allowedSortFields = ['day_of_week', 'start_lesson', 'schedule_date', 'subject_name', 'session_name', 'schedule_type'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'schedule_type';
    const safeSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

    // Đếm tổng số records (bao gồm cả lịch học và lịch thi)
    const countResults = await sequelize.query(`
            SELECT COUNT(*) as total
            FROM students AS ST 
            JOIN schedules AS SH ON ST.student_id = SH.user_id 
            LEFT JOIN schedule_exceptions AS shex ON SH.id = shex.schedule_id
            LEFT JOIN lecturers AS le1 ON le1.lecturer_id = shex.new_lecturer_id 
                AND shex.exception_type = 'LECTURER_CHANGED'
            JOIN course_sections AS co_se ON co_se.id = SH.course_section_id
            JOIN clazz AS cl ON cl.id = co_se.clazz_id
            JOIN subjects AS su ON su.subject_id = co_se.subject_id
            JOIN sessions AS se ON se.id = co_se.session_id
            JOIN lecturers_coursesections AS le_co ON le_co.course_section_id = co_se.id
            JOIN lecturers AS le2 ON le2.lecturer_id = le_co.lecturer_id
            WHERE SH.user_id = :student_id
              AND (
                (SH.isExam = 0 AND SH.isCompleted = 0) OR 
                (SH.isExam = 1)
              )
        `, {
      replacements: { student_id },
      type: sequelize.QueryTypes.SELECT
    });

    const totalRecords = countResults[0]?.total || 0;
    const totalPages = Math.ceil(totalRecords / limit);

    if (totalRecords === 0) {
      return {
        student_id: student_id,
        message: "Không tìm thấy lịch học hoặc lịch thi cho sinh viên này",
        pagination: {
          current_page: page,
          total_pages: 0,
          total_records: 0,
          limit: limit,
          has_next: false,
          has_prev: false
        },
        schedules: [],
        exams: []
      };
    }

    // Lấy dữ liệu với phân trang (bao gồm cả lịch học và lịch thi)
    const results = await sequelize.query(`
            SELECT  
                ST.student_id,
                ST.name AS student_name,
                cl.name AS class_name,
                su.name AS subject_name,
                se.name AS session_name,
                se.years AS academic_year,
                -- Ngày bắt đầu và kết thúc của môn học
                SH.start_date AS course_start_date,
                SH.end_date AS course_end_date,
                le2.name AS original_lecturer,
                COALESCE(le1.name, le2.name) AS current_lecturer,
                -- Hiển thị thông tin đã thay đổi nếu có exception
                COALESCE(shex.new_start_lesson, SH.start_lesson) AS display_start_lesson,
                COALESCE(shex.new_end_lesson, SH.end_lesson) AS display_end_lesson,
                COALESCE(shex.new_date, SH.date) AS display_date,
                COALESCE(shex.new_room, SH.room) AS display_room,
                -- Thông tin gốc để so sánh
                SH.start_lesson AS original_start_lesson,
                SH.end_lesson AS original_end_lesson,
                SH.day_of_week AS original_day_of_week,
                SH.date AS original_date,
                SH.room AS original_room,
                -- Thông tin exception
                shex.exception_type,
                shex.original_date AS exception_original_date,
                shex.new_date AS exception_new_date,
                shex.new_start_lesson,
                shex.new_end_lesson,
                shex.new_room,
                SH.isExam,
                CASE 
                    WHEN shex.id IS NOT NULL THEN 'Có thay đổi'
                    ELSE 'Lịch bình thường'
                END AS schedule_status,
                SH.id AS schedule_id,
                co_se.id AS course_section_id
            FROM students AS ST 
            JOIN schedules AS SH ON ST.student_id = SH.user_id 
            LEFT JOIN schedule_exceptions AS shex ON SH.id = shex.schedule_id
            LEFT JOIN lecturers AS le1 ON le1.lecturer_id = shex.new_lecturer_id 
                AND shex.exception_type = 'LECTURER_CHANGED'
            JOIN course_sections AS co_se ON co_se.id = SH.course_section_id
            JOIN clazz AS cl ON cl.id = co_se.clazz_id
            JOIN subjects AS su ON su.subject_id = co_se.subject_id
            JOIN sessions AS se ON se.id = co_se.session_id
            JOIN lecturers_coursesections AS le_co ON le_co.course_section_id = co_se.id
            JOIN lecturers AS le2 ON le2.lecturer_id = le_co.lecturer_id
            WHERE SH.user_id = :student_id
              AND (
                (SH.isExam = 0 AND SH.isCompleted = 0) OR 
                (SH.isExam = 1)
              )
            ORDER BY ${safeSortBy === 'subject_name' ? 'su.name' :
        safeSortBy === 'session_name' ? 'se.name' :
          safeSortBy === 'schedule_type' ? 'SH.isExam' :
            safeSortBy === 'schedule_date' ? 'COALESCE(shex.new_date, SH.date)' :
              safeSortBy === 'start_lesson' ? 'COALESCE(shex.new_start_lesson, SH.start_lesson)' :
                `SH.${safeSortBy}`} ${safeSortOrder}
            LIMIT :limit OFFSET :offset
        `, {
      replacements: { student_id, limit, offset },
      type: sequelize.QueryTypes.SELECT
    });

    // Tách dữ liệu thành lịch học và lịch thi
    const classSchedules = [];
    const examSchedules = [];

    results.forEach(item => {
      const formattedItem = {
        schedule_id: item.schedule_id,
        course_section_id: item.course_section_id,
        student_info: {
          student_id: item.student_id,
          student_name: item.student_name,
          class_name: item.class_name
        },
        subject_info: {
          subject_name: item.subject_name,
          session_name: item.session_name,
          academic_year: item.academic_year,
          // Ngày bắt đầu và kết thúc của môn học
          course_start_date: item.course_start_date ? datetimeFormatter.formatDateVN(item.course_start_date) : null,
          course_end_date: item.course_end_date ? datetimeFormatter.formatDateVN(item.course_end_date) : null
        },
        schedule_info: {
          // Hiển thị thông tin đã thay đổi (nếu có exception)
          day_of_week: item.original_day_of_week,
          start_lesson: item.display_start_lesson,
          end_lesson: item.display_end_lesson,
          schedule_date: item.display_date,
          room: item.display_room,
          type: item.isExam,
          status: item.schedule_status
        },
        lecturer_info: {
          original_lecturer: item.original_lecturer,
          // Chỉ hiển thị giảng viên mới khi có thay đổi, còn không thì null
          new_lecturer: item.exception_type === 'LECTURER_CHANGED' ? item.current_lecturer : null
        },
        // Thông tin gốc để so sánh
        original_info: {
          start_lesson: item.original_start_lesson,
          end_lesson: item.original_end_lesson,
          date: item.original_date,
          room: item.original_room
        },
        exception_info: item.exception_type ? {
          exception_type: item.exception_type,
          original_date: item.exception_original_date,
          new_date: item.exception_new_date,
          new_start_lesson: item.new_start_lesson,
          new_end_lesson: item.new_end_lesson,
          new_room: item.new_room,
          changes: {
            time_changed: item.new_start_lesson || item.new_end_lesson ? true : false,
            date_changed: item.exception_new_date ? true : false,
            room_changed: item.new_room ? true : false,
            lecturer_changed: item.exception_type === 'LECTURER_CHANGED' ? true : false
          }
        } : null
      };

      if (item.isExam === 1) {
        examSchedules.push(formattedItem);
      } else {
        classSchedules.push(formattedItem);
      }
    });

    // Thống kê tổng quan
    const allResults = await sequelize.query(`
            SELECT 
                SH.isExam,
                CASE WHEN shex.id IS NOT NULL THEN 'Có thay đổi' ELSE 'Lịch bình thường' END AS schedule_status,
                shex.exception_type
            FROM students AS ST 
            JOIN schedules AS SH ON ST.student_id = SH.user_id 
            LEFT JOIN schedule_exceptions AS shex ON SH.id = shex.schedule_id
            JOIN course_sections AS co_se ON co_se.id = SH.course_section_id
            JOIN lecturers_coursesections AS le_co ON le_co.course_section_id = co_se.id
            WHERE SH.user_id = :student_id
              AND (
                (SH.isExam = 0 AND SH.isCompleted = 0) OR 
                (SH.isExam = 1)
              )
        `, {
      replacements: { student_id },
      type: sequelize.QueryTypes.SELECT
    });

    const stats = {
      total_items: totalRecords,
      total_class_schedules: allResults.filter(s => s.isExam === 0).length,
      total_exam_schedules: allResults.filter(s => s.isExam === 1).length,
      normal_schedules: allResults.filter(s => s.schedule_status === 'Lịch bình thường').length,
      exception_schedules: allResults.filter(s => s.schedule_status === 'Có thay đổi').length,
      exception_types: [...new Set(allResults
        .filter(s => s.exception_type)
        .map(s => s.exception_type)
      )]
    };

    return {
      student_id: student_id,
      student_name: results[0]?.student_name,
      statistics: stats,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_records: totalRecords,
        limit: limit,
        has_next: page < totalPages,
        has_prev: page > 1
      },
      schedules: classSchedules,
      exams: examSchedules
    };

  } catch (error) {
    console.error("Error in getParentScheduleWithExceptions:", error);
    throw error;
  }
}





module.exports = {
  getParentByParent_id,
  updateParentAvatar,
  updateParentInfo,
  getParentScheduleWithExceptions
};