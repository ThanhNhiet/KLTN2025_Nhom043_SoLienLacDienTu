const sequelize = require("../config/mariadb.conf");
const { Op } = require("sequelize");
const initModels = require("../databases/mariadb/model/init-models");
const models = initModels(sequelize);
const datetimeFormatter = require("../utils/format/datetime-formatter");
const cloudinaryService = require("../services/cloudinary.service");
const cloudinaryUtils = require("../utils/cloudinary.utils");
const { Chat, ChatType, MemberRole } = require('../databases/mongodb/schemas/Chat');
const mongoose = require('mongoose');
const alertRepo = require("./alert.repo");

/**
 *  Lấy danh sách sinh viên + điểm số bằng course_section_id - dùng cho giảng viên
 * @param {string} course_section_id 
 * @returns {Object}
 */
const getStudentsScoreByCourseSectionId4Lecturer = async (course_section_id) => {
    try {
        // Validate input
        if (!course_section_id) {
            throw new Error('course_section_id is required');
        }

        // Lấy thông tin lớp học phần: course_section_id, subjectName, className, sessionName, facultyName, lecturerName 
        const courseSectionDetail = await models.CourseSection.findOne({
            where: { id: course_section_id },
            attributes: ['id'],
            include: [
                {
                    model: models.Subject,
                    as: 'subject',
                    attributes: ['name'],
                    include: [
                        {
                            model: models.Faculty,
                            as: 'faculty',
                            attributes: ['name']
                        }
                    ]
                },
                {
                    model: models.Clazz,
                    as: 'clazz',
                    attributes: ['name']
                },
                {
                    model: models.Session,
                    as: 'session',
                    attributes: ['name', 'years']
                },
                {
                    model: models.LecturerCourseSection,
                    as: 'lecturers_course_sections',
                    include: [
                        {
                            model: models.Lecturer,
                            as: 'lecturer',
                            attributes: ['name']
                        }
                    ]
                }
            ]
        });

        if (!courseSectionDetail) {
            throw new Error(`Course section not found with id: ${course_section_id}`);
        }

        // Lấy danh sách student_id từ Student_CourseSection
        const studentCourseSections = await models.StudentCourseSection.findAll({
            where: { course_section_id: course_section_id },
            attributes: ['student_id'],
            order: [['createdAt', 'ASC']] // Sắp xếp theo thời gian đăng ký
        });

        if (studentCourseSections.length === 0) {
            // Nếu không có sinh viên nào trong lớp, vẫn trả về thông tin lớp
            return {
                course_section_id: courseSectionDetail.id,
                subjectName: courseSectionDetail.subject?.name || 'N/A',
                className: courseSectionDetail.clazz?.name || 'N/A',
                sessionName: courseSectionDetail?.session ? courseSectionDetail.session.name + ' ' + courseSectionDetail.session.years : 'N/A',
                facultyName: courseSectionDetail.subject?.faculty?.name || 'N/A',
                lecturerName: courseSectionDetail.lecturers_course_sections?.[0]?.lecturer?.name || 'N/A',
                students: []
            };
        }

        // Lấy thông tin từng sinh viên và điểm số
        const studentPromises = studentCourseSections.map(async (scs, i) => {
            const studentId = scs.student_id;

            // Lấy thông tin sinh viên từ Student bằng student_id
            const student = await models.Student.findOne({
                where: { student_id: studentId },
                attributes: ['student_id', 'name', 'dob']
            });

            if (!student) {
                console.warn(`Student not found with id: ${studentId}`);
                return null;
            }

            // Lấy thông tin điểm từ Score theo từng student_id và course_section_id
            const score = await models.Score.findOne({
                where: {
                    student_id: studentId,
                    course_section_id: course_section_id
                },
                attributes: [
                    'theo_regular1', 'theo_regular2', 'theo_regular3',
                    'pra_regular1', 'pra_regular2', 'pra_regular3',
                    'mid', 'final', 'avr'
                ]
            });

            // Tạo object điểm số (nếu không có điểm thì để null)
            const scoreData = score ? {
                theo_regular1: score.theo_regular1,
                theo_regular2: score.theo_regular2,
                theo_regular3: score.theo_regular3,
                pra_regular1: score.pra_regular1,
                pra_regular2: score.pra_regular2,
                pra_regular3: score.pra_regular3,
                mid: score.mid,
                final: score.final,
                avr: score.avr
            } : {
                theo_regular1: null,
                theo_regular2: null,
                theo_regular3: null,
                pra_regular1: null,
                pra_regular2: null,
                pra_regular3: null,
                mid: null,
                final: null,
                avr: null
            };

            // Tính toán initial_evaluate
            let initial_evaluate = 'ok';

            if (score) {
                // Tính điểm trung bình của regular (cả theo và pra)
                const regularScores = [
                    score.theo_regular1, score.theo_regular2, score.theo_regular3,
                    score.pra_regular1, score.pra_regular2, score.pra_regular3
                ].filter(s => s !== null && s !== undefined);

                let regularAverage = null;
                if (regularScores.length > 0) {
                    regularAverage = regularScores.reduce((sum, s) => sum + s, 0) / regularScores.length;
                }

                // Kiểm tra các điều kiện danger
                // 1. Nếu điểm trung bình regular < 4 và mid < 4 và chưa có final
                if ((regularAverage !== null && regularAverage < 4) && (score.mid !== null && score.mid < 4) && (score.final === null)) {
                    initial_evaluate = 'danger';
                }
                // 2. Nếu final < 3
                else if (score.final !== null && score.final < 3) {
                    initial_evaluate = 'Not passed';
                }
                // 3. Nếu avr < 4
                else if (score.avr !== null && score.avr < 4) {
                    initial_evaluate = 'Not passed';
                }
            }

            const studentData = {
                no: i + 1, // STT
                student_id: student.student_id,
                name: student.name,
                dob: datetimeFormatter.formatDateVN(student.dob),
                score: scoreData,
                initial_evaluate: initial_evaluate
            };

            // Nếu cần cảnh báo, kiểm tra xem đã cảnh báo chưa
            if (initial_evaluate !== 'ok') {
                studentData.isWarningYet = await alertRepo.isWarningYet4Student(course_section_id, student.student_id);
            }

            return studentData;
        });

        let students = (await Promise.all(studentPromises)).filter(s => s !== null);

        // Sắp xếp danh sách sinh viên theo tên tiếng Việt
        students.sort((a, b) => {
            // Tách tên ra khỏi họ và tên đệm
            const lastNameA = a.name.split(' ').pop() || '';
            const lastNameB = b.name.split(' ').pop() || '';

            // So sánh tên trước
            const nameComparison = lastNameA.localeCompare(lastNameB, 'vi');

            // Nếu tên khác nhau, trả về kết quả so sánh tên
            if (nameComparison !== 0) {
                return nameComparison;
            }

            // Nếu tên giống nhau, so sánh toàn bộ họ tên để giữ trật tự họ và tên đệm
            return a.name.localeCompare(b.name, 'vi');
        });

        // Gán lại số thứ tự (no) sau khi đã sắp xếp
        students.forEach((student, index) => {
            student.no = index + 1;
        });

        // Trả về kết quả hoàn chỉnh
        return {
            course_section_id: courseSectionDetail.id,
            subjectName: courseSectionDetail.subject?.name || 'N/A',
            className: courseSectionDetail.clazz?.name || 'N/A',
            sessionName: courseSectionDetail?.session ? courseSectionDetail.session.name + ' ' + courseSectionDetail.session.years : 'N/A',
            facultyName: courseSectionDetail.subject?.faculty?.name || 'N/A',
            lecturerName: courseSectionDetail.lecturers_course_sections?.[0]?.lecturer?.name || 'N/A',
            students: students
        };

    } catch (error) {
        console.error('Error in getStudentsByCourseSectionId4Lecturer:', error);
        throw error;
    }
};

const updateStudentAvatar = async (student_id, file) => {
    try {
        const student = await models.Student.findOne({ where: { student_id } });
        if (!student) throw new Error("Student not found");

        const folder = 'account_avatar';

        // Xóa avatar cũ nếu có
        if (student.avatar) {
            try {
                const publicId = cloudinaryUtils.getPublicIdFromUrl(student.avatar, folder);
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
        student.avatar = uploadResult.url;
        await student.save();

        // Find chat and update member's avatar
        const chats = await Chat.find({ 'members.userID': student_id });
        console.log('Chats found for avatar update:', chats.length);

        if (chats && chats.length > 0) {
            // Use Promise.all to handle all async operations
            await Promise.all(chats.map(async (chat) => {
                const memberIndex = chat.members.findIndex(member => member.userID === student_id);
                if (memberIndex !== -1) {
                    chat.members[memberIndex].avatar = uploadResult.url;
                    await chat.save();
                }
            }));
        }

        return {
            student_id: student.student_id,
            name: student.name,
            avatar: student.avatar,
            message: 'Avatar uploaded successfully'
        };
    } catch (error) {
        console.error("Error in uploadAvatar:", error);
        throw error;
    }
}

/**
 *  Lấy thông tin sinh viên bằng student_id - dùng cho giảng viên
 * @param {string} student_id 
 * @returns {Object}
 */
const getStudentInfoById4Lecturer = async (student_id) => {
    try {
        const student = await models.Student.findOne({
            attributes: {
                exclude: ['id', 'isDeleted', 'clazz_id', 'major_id', 'createdAt', 'updatedAt']
            },
            where: { student_id, isDeleted: false },
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
        });

        if (!student) throw new Error("Student not found");

        const genderStudent = student.gender == "1" ? "Nam" : "Nữ";

        //Lấy thông tin liên lạc của phụ huynh từ bảng Parent theo student_id (sử dụng student_id string)
        const parent = await models.Parent.findOne({
            attributes: ['parent_id', 'name', 'gender', 'phone', 'email'],
            where: { student_id: student.student_id }
        });

        let genderParent = null;
        if (parent) {
            genderParent = parent.gender == "1" ? "Nam" : "Nữ";
        }

        return {
            student_id: student.student_id,
            name: student.name,
            dob: datetimeFormatter.formatDateVN(student.dob),
            gender: genderStudent,
            avatar: student.avatar,
            phone: student.phone,
            email: student.email,
            address: student.address,
            className: student.clazz ? student.clazz.name : null,
            facultyName: student.clazz && student.clazz.faculty ? student.clazz.faculty.name : null,
            majorName: student.major ? student.major.name : null,
            parent: {
                parent_id: parent?.parent_id || null,
                name: parent?.name || null,
                gender: genderParent,
                phone: parent?.phone || null,
                email: parent?.email || null
            }
        };
    } catch (error) {
        throw error;
    }
};

const getStudentByStudent_id = async (student_id) => {
    try {
        const result = await models.Student.findOne({
            attributes: {
                exclude: ['id', 'isDeleted']
            },
            where: { student_id, isDeleted: false },
            include: [
                {
                    model: models.Clazz,
                    as: 'clazz',
                    attributes: ['name', 'id'],
                    required: false
                },
                {
                    model: models.Major,
                    as: 'major',
                    attributes: ['name', 'major_id'],
                    required: false
                }
            ]
        });
        if (!result) throw new Error("Student not found");

        const gender = result.gender === "1" ? "Nam" : "Nữ";
        return {
            student_id: result.student_id,
            name: result.name,
            dob: datetimeFormatter.formatDateVN(result.dob),
            gender,
            avatar: result.avatar,
            phone: result.phone,
            email: result.email,
            address: result.address,
            clazzName: result.clazz ? result.clazz.name : null,
            clazzId: result.clazz ? result.clazz.id : null,
            majorName: result.major ? result.major.name : null,
            majorId: result.major ? result.major.major_id : null,
            createdAt: datetimeFormatter.formatDateTimeVN(result.createdAt),
            updatedAt: datetimeFormatter.formatDateTimeVN(result.updatedAt),
        }

    } catch (error) {
        console.error("Error in getStudentByStudent_id:", error);
        throw error;
    }
}

const updateStudentInfo = async (student_id, updateData) => {
    try {
        const student = await models.Student.findOne({ where: { student_id } });
        if (!student) throw new Error("Student not found");
        updateData.dob = datetimeFormatter.convertddMMyyyy2yyyyMMdd(updateData.dob);
        updateData.updatedAt = new Date();
        return await student.update(updateData);
    } catch (error) {
        console.error("Error in updateStudentInfo:", error);
        throw error;
    }
}

/**
 * Lấy lịch học và lịch thi của sinh viên bao gồm cả exception (thay đổi lịch) với phân trang
 * @param {string} student_id - Mã sinh viên (VD: SV2100001)
 * @param {Object} options - Tùy chọn phân trang {page: 1, limit: 10, sortBy: 'day_of_week', sortOrder: 'ASC'}
 * @returns {Object} - Thông tin lịch học và lịch thi chi tiết với phân trang
 */
const getStudentScheduleWithExceptions = async (student_id, options = {}) => {
    try {
        // Validate input
        if (!student_id) {
            throw new Error('student_id is required');
        }

        // Default pagination options
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
        console.error("Error in getStudentScheduleWithExceptions:", error);
        throw error;
    }
}




/**
 * Lấy lịch học đơn giản của sinh viên (không bao gồm exception) với phân trang
 * @param {string} student_id - Mã sinh viên
 * @param {Object} options - Tùy chọn phân trang {page: 1, limit: 10, sortBy: 'day_of_week', sortOrder: 'ASC'}
 * @returns {Object} - Lịch học cơ bản với phân trang
 */
const getStudentBasicSchedule = async (student_id, options = {}) => {
    try {
        if (!student_id) {
            throw new Error('student_id is required');
        }

        // Default pagination options
        const page = parseInt(options.page) || 1;
        const limit = parseInt(options.limit) || 10;
        const sortBy = options.sortBy || 'day_of_week';
        const sortOrder = options.sortOrder || 'ASC';
        const offset = (page - 1) * limit;

        // Validate sortBy to prevent SQL injection
        const allowedSortFields = ['day_of_week', 'start_lesson', 'schedule_date', 'subject_name', 'session_name'];
        const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'day_of_week';
        const safeSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

        // Đếm tổng số records
        const countResults = await sequelize.query(`
            SELECT COUNT(*) as total
            FROM students AS ST 
            JOIN schedules AS SH ON ST.student_id = SH.user_id 
            JOIN course_sections AS co_se ON co_se.id = SH.course_section_id
            JOIN clazz AS cl ON cl.id = co_se.clazz_id
            JOIN subjects AS su ON su.subject_id = co_se.subject_id
            JOIN sessions AS se ON se.id = co_se.session_id
            JOIN lecturers_coursesections AS le_co ON le_co.course_section_id = co_se.id
            JOIN lecturers AS le ON le.lecturer_id = le_co.lecturer_id
            WHERE SH.isExam = 0 
              AND SH.isCompleted = 0 
              AND SH.user_id = :student_id
        `, {
            replacements: { student_id },
            type: sequelize.QueryTypes.SELECT
        });

        const totalRecords = countResults[0]?.total || 0;
        const totalPages = Math.ceil(totalRecords / limit);

        if (totalRecords === 0) {
            return {
                student_id: student_id,
                message: "Không tìm thấy lịch học cho sinh viên này",
                pagination: {
                    current_page: page,
                    total_pages: 0,
                    total_records: 0,
                    limit: limit,
                    has_next: false,
                    has_prev: false
                },
                schedules: []
            };
        }

        const results = await sequelize.query(`
            SELECT  
                ST.student_id,
                ST.name AS student_name,
                cl.name AS class_name,
                su.name AS subject_name,
                se.name AS session_name,
                se.years AS academic_year,
                le.name AS lecturer_name,
                SH.start_lesson,
                SH.end_lesson,
                SH.day_of_week,
                SH.date AS schedule_date,
                SH.room,
                SH.id AS schedule_id,
                co_se.id AS course_section_id
            FROM students AS ST 
            JOIN schedules AS SH ON ST.student_id = SH.user_id 
            JOIN course_sections AS co_se ON co_se.id = SH.course_section_id
            JOIN clazz AS cl ON cl.id = co_se.clazz_id
            JOIN subjects AS su ON su.subject_id = co_se.subject_id
            JOIN sessions AS se ON se.id = co_se.session_id
            JOIN lecturers_coursesections AS le_co ON le_co.course_section_id = co_se.id
            JOIN lecturers AS le ON le.lecturer_id = le_co.lecturer_id
            WHERE SH.isExam = 0 
              AND SH.isCompleted = 0 
              AND SH.user_id = :student_id
            ORDER BY ${safeSortBy === 'subject_name' ? 'su.name' :
                safeSortBy === 'session_name' ? 'se.name' :
                    `SH.${safeSortBy}`} ${safeSortOrder}
            LIMIT :limit OFFSET :offset
        `, {
            replacements: { student_id, limit, offset },
            type: sequelize.QueryTypes.SELECT
        });

        return {
            student_id,
            student_name: results[0]?.student_name,
            pagination: {
                current_page: page,
                total_pages: totalPages,
                total_records: totalRecords,
                limit: limit,
                has_next: page < totalPages,
                has_prev: page > 1
            },
            schedules: results
        };

    } catch (error) {
        console.error("Error in getStudentBasicSchedule:", error);
        throw error;
    }
}

/**
 * Lấy lịch thi của sinh viên với phân trang
 * @param {string} student_id - Mã sinh viên
 * @param {Object} options - Tùy chọn phân trang {page: 1, limit: 10, sortBy: 'exam_date', sortOrder: 'ASC'}
 * @returns {Object} - Lịch thi với phân trang
 */
const getStudentExamSchedule = async (student_id, options = {}) => {
    try {
        if (!student_id) {
            throw new Error('student_id is required');
        }

        // Default pagination options
        const page = parseInt(options.page) || 1;
        const limit = parseInt(options.limit) || 10;
        const sortBy = options.sortBy || 'exam_date';
        const sortOrder = options.sortOrder || 'ASC';
        const offset = (page - 1) * limit;

        // Validate sortBy to prevent SQL injection
        const allowedSortFields = ['exam_date', 'start_lesson', 'subject_name', 'session_name'];
        const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'exam_date';
        const safeSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

        // Đếm tổng số records
        const countResults = await sequelize.query(`
            SELECT COUNT(*) as total
            FROM students AS ST 
            JOIN schedules AS SH ON ST.student_id = SH.user_id 
            JOIN course_sections AS co_se ON co_se.id = SH.course_section_id
            JOIN clazz AS cl ON cl.id = co_se.clazz_id
            JOIN subjects AS su ON su.subject_id = co_se.subject_id
            JOIN sessions AS se ON se.id = co_se.session_id
            JOIN lecturers_coursesections AS le_co ON le_co.course_section_id = co_se.id
            JOIN lecturers AS le ON le.lecturer_id = le_co.lecturer_id
            WHERE SH.isExam = 1 
              AND SH.user_id = :student_id
        `, {
            replacements: { student_id },
            type: sequelize.QueryTypes.SELECT
        });

        const totalRecords = countResults[0]?.total || 0;
        const totalPages = Math.ceil(totalRecords / limit);

        if (totalRecords === 0) {
            return {
                student_id: student_id,
                message: "Không tìm thấy lịch thi cho sinh viên này",
                pagination: {
                    current_page: page,
                    total_pages: 0,
                    total_records: 0,
                    limit: limit,
                    has_next: false,
                    has_prev: false
                },
                exams: []
            };
        }

        const results = await sequelize.query(`
            SELECT  
                ST.student_id,
                ST.name AS student_name,
                cl.name AS class_name,
                su.name AS subject_name,
                se.name AS session_name,
                se.years AS academic_year,
                le.name AS lecturer_name,
                SH.start_lesson,
                SH.end_lesson,
                SH.date AS exam_date,
                SH.room,
                SH.id AS schedule_id,
                co_se.id AS course_section_id
            FROM students AS ST 
            JOIN schedules AS SH ON ST.student_id = SH.user_id 
            JOIN course_sections AS co_se ON co_se.id = SH.course_section_id
            JOIN clazz AS cl ON cl.id = co_se.clazz_id
            JOIN subjects AS su ON su.subject_id = co_se.subject_id
            JOIN sessions AS se ON se.id = co_se.session_id
            JOIN lecturers_coursesections AS le_co ON le_co.course_section_id = co_se.id
            JOIN lecturers AS le ON le.lecturer_id = le_co.lecturer_id
            WHERE SH.isExam = 1 
              AND SH.user_id = :student_id
            ORDER BY ${safeSortBy === 'subject_name' ? 'su.name' :
                safeSortBy === 'session_name' ? 'se.name' :
                    safeSortBy === 'exam_date' ? 'SH.date' :
                        `SH.${safeSortBy}`} ${safeSortOrder}
            LIMIT :limit OFFSET :offset
        `, {
            replacements: { student_id, limit, offset },
            type: sequelize.QueryTypes.SELECT
        });

        return {
            student_id,
            student_name: results[0]?.student_name,
            pagination: {
                current_page: page,
                total_pages: totalPages,
                total_records: totalRecords,
                limit: limit,
                has_next: page < totalPages,
                has_prev: page > 1
            },
            exams: results
        };

    } catch (error) {
        console.error("Error in getStudentExamSchedule:", error);
        throw error;
    }
}

/**
 * Lấy danh sách phân trang sinh viên có điểm không đạt theo session_id và faculty_id
 * @param {string} session_id - ID của session (học kỳ)
 * @param {string} faculty_id - ID của khoa
 * @param {number} page - Trang hiện tại
 * @param {number} pageSize - Số lượng bản ghi trên một trang
 * @returns {Object} { total, page, pageSize, students, linkPrev, linkNext, pages }
 */
const getFailedStudentsBySessionAndFaculty = async (session_id, faculty_id, option = 'all', page, pageSize = 10) => {
    try {
        // Validate input
        if (!session_id || !faculty_id) {
            throw new Error('session_id and faculty_id are required');
        }

        const page_num = parseInt(page) || 1;
        const pageSize_num = parseInt(pageSize) || 10;
        const offset = (page_num - 1) * pageSize_num;

        // Tìm tất cả course_sections theo session_id và faculty_id
        const courseSections = await models.CourseSection.findAll({
            where: {
                session_id: session_id
            },
            include: [
                {
                    model: models.Subject,
                    as: 'subject',
                    where: {
                        faculty_id: faculty_id
                    },
                    attributes: ['subject_id', 'name']
                }
            ],
            attributes: ['id']
        });

        if (courseSections.length === 0) {
            return {
                total: 0,
                page: page_num,
                pageSize: pageSize_num,
                students: [],
                linkPrev: null,
                linkNext: null,
                pages: []
            };
        }

        const courseSectionIds = courseSections.map(cs => cs.id);
        let failedStudents = [];

        // Lấy tất cả điểm của các course section này
        const scores = await models.Score.findAll({
            where: {
                course_section_id: { [Op.in]: courseSectionIds },
                [Op.or]: [
                    { mid: { [Op.lt]: 4 } },
                    { final: { [Op.lt]: 3 } },
                    { avr: { [Op.lt]: 4 } }
                ]
            },
            include: [
                {
                    model: models.Student,
                    as: 'student',
                    attributes: ['student_id', 'name'],
                    required: true
                },
                {
                    model: models.CourseSection,
                    as: 'course_section',
                    attributes: ['id'],
                    include: [{
                        model: models.Subject,
                        as: 'subject',
                        attributes: ['name']
                    }]
                }
            ]
        });

        // Xử lý và kiểm tra cảnh báo
        const studentCheckPromises = scores.map(async (score) => {
            const student = score.student;
            const courseSection = score.course_section;

            // Lấy thông tin phụ huynh
            const parent = await models.Parent.findOne({
                where: { student_id: student.student_id },
                attributes: ['parent_id']
            });

            // Kiểm tra đã cảnh báo chưa
            const isWarningYet = await alertRepo.isWarningYet4Student(courseSection.id, student.student_id);

            return {
                course_section_id: courseSection.id,
                subjectName: courseSection.subject.name,
                student_id: student.student_id,
                studentName: student.name,
                theo_regular1: score.theo_regular1,
                theo_regular2: score.theo_regular2,
                theo_regular3: score.theo_regular3,
                pra_regular1: score.pra_regular1,
                pra_regular2: score.pra_regular2,
                pra_regular3: score.pra_regular3,
                mid: score.mid,
                final: score.final,
                avr: score.avr,
                parent_id: parent ? parent.parent_id : null,
                isWarningYet: isWarningYet
            };
        });

        failedStudents = await Promise.all(studentCheckPromises);

        // Lọc theo option
        if (option === 'notWarningYet') {
            failedStudents = failedStudents.filter(student => !student.isWarningYet);
        }

        // Sắp xếp theo tên sinh viên
        failedStudents.sort((a, b) => {
            const lastNameA = a.studentName.split(' ').pop() || '';
            const lastNameB = b.studentName.split(' ').pop() || '';
            const nameComparison = lastNameA.localeCompare(lastNameB, 'vi');
            if (nameComparison !== 0) {
                return nameComparison;
            }
            return a.studentName.localeCompare(b.studentName, 'vi');
        });

        // Tính toán phân trang
        const total = failedStudents.length;
        const totalPages = Math.ceil(total / pageSize_num);
        const paginatedStudents = failedStudents.slice(offset, offset + pageSize_num);

        // Tạo link phân trang
        const linkPrev = page_num > 1 ?
            `/api/students/failed?sessionId=${session_id}&facultyId=${faculty_id}&option=${option}&page=${page_num - 1}&pageSize=${pageSize_num}` : null;
        const linkNext = page_num < totalPages ?
            `/api/students/failed?sessionId=${session_id}&facultyId=${faculty_id}&option=${option}&page=${page_num + 1}&pageSize=${pageSize_num}` : null;

        // Tạo danh sách 3 trang liên tiếp
        const pages = [];
        for (let i = page_num; i < page_num + 3 && i <= totalPages; i++) {
            pages.push(i);
        }

        return {
            total,
            page: page_num,
            pageSize: pageSize_num,
            students: paginatedStudents,
            linkPrev,
            linkNext,
            pages
        };

    } catch (error) {
        console.error('Error in getFailedStudentsBySessionAndFaculty:', error);
        throw error;
    }
};

/**
 * Hàm search của getFailedStudentsBySessionAndFaculty (theo stuendent_id)
 * @param {string} session_id
 * @param {string} faculty_id
 * @param {string} student_id
 * @returns {Object} student info
 */
const searchFailedStudentBySessionAndFacultyWithStudentId = async (session_id, faculty_id, student_id) => {
    try {
        // Validate input
        if (!session_id || !faculty_id || !student_id) {
            throw new Error('session_id, faculty_id, and student_id are required');
        }

        // Tìm tất cả course_sections theo session_id và faculty_id
        const courseSections = await models.CourseSection.findAll({
            where: { session_id },
            include: [{
                model: models.Subject,
                as: 'subject',
                where: { faculty_id },
                attributes: []
            }],
            attributes: ['id'],
            raw: true
        });

        if (courseSections.length === 0) {
            return {
                success: false,
                message: 'Không tìm thấy lớp học phần nào cho khoa và học kỳ này.',
                student: null
            };
        }

        const courseSectionIds = courseSections.map(cs => cs.id);

        // Lấy điểm không đạt của sinh viên trong các lớp học phần đó
        const failedScores = await models.Score.findAll({
            where: {
                student_id,
                course_section_id: { [Op.in]: courseSectionIds },
                [Op.or]: [
                    { mid: { [Op.lt]: 4 } },
                    { final: { [Op.lt]: 3 } },
                    { avr: { [Op.lt]: 4 } }
                ]
            },
            attributes: { exclude: ['createdAt', 'updatedAt', 'id', 'student_id'] },
            include: [
                { model: models.Student, as: 'student', attributes: ['student_id', 'name'], required: true },
                {
                    model: models.CourseSection,
                    as: 'course_section',
                    attributes: ['id'],
                    include: [{ model: models.Subject, as: 'subject', attributes: ['name'] }]
                }
            ]
        });

        if (failedScores.length === 0) {
            return {
                success: true,
                message: 'Sinh viên không có môn nào không đạt trong khoa và học kỳ này.',
                student: null
            };
        }

        // Lấy thông tin phụ huynh
        const parent = await models.Parent.findOne({ where: { student_id }, attributes: ['parent_id'] });

        // Xử lý và kiểm tra cảnh báo cho từng môn học không đạt
        const failedSubjects = await Promise.all(
            failedScores.map(async (score) => {
                const plain = score.get({ plain: true });
                const isWarningYet = await alertRepo.isWarningYet4Student(
                    plain.course_section.id,
                    student_id
                );

                return {
                    course_section_id: plain.course_section.id,
                    subjectName: plain.course_section.subject.name,
                    theo_regular1: plain.theo_regular1,
                    theo_regular2: plain.theo_regular2,
                    theo_regular3: plain.theo_regular3,
                    pra_regular1: plain.pra_regular1,
                    pra_regular2: plain.pra_regular2,
                    pra_regular3: plain.pra_regular3,
                    mid: plain.mid,
                    final: plain.final,
                    avr: plain.avr,
                    isWarningYet
                };
            })
        );

        return {
            student_id: failedScores[0].student.student_id,
            studentName: failedScores[0].student.name,
            parent_id: parent ? parent.parent_id : null,
            failedSubjects
        };

    } catch (error) {
        console.error('Error in searchFailedStudentBySessionAndFacultyWithStudentId:', error);
        throw error;
    }
};

module.exports = {
    getStudentsScoreByCourseSectionId4Lecturer,
    getStudentInfoById4Lecturer,
    getStudentByStudent_id,
    updateStudentInfo,
    getStudentScheduleWithExceptions,
    getStudentBasicSchedule,
    getStudentExamSchedule,
    updateStudentAvatar,
    getFailedStudentsBySessionAndFaculty,
    searchFailedStudentBySessionAndFacultyWithStudentId
};