const sequelize = require("../config/mariadb.conf");
const { Op } = require("sequelize");
const initModels = require("../databases/mariadb/model/init-models");
const models = initModels(sequelize);
const datetimeFormatter = require("../utils/format/datetime-formatter");
const cloudinaryService = require("../services/cloudinary.service");
const cloudinaryUtils = require("../utils/cloudinary.utils");
const { Chat, ChatType, MemberRole } = require('../databases/mongodb/schemas/Chat');
const { Alert } = require('../databases/mongodb/schemas');
const mongoose = require('mongoose');
const { where } = require("../databases/mongodb/schemas/Alert");
const { calculateGPA } = require("./score.repo");

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

        const studentIds = studentCourseSections.map(scs => scs.student_id);

        // Lấy thông tin Student và Score song song
        const [studentsInfo, scores] = await Promise.all([
            models.Student.findAll({
                where: { student_id: studentIds },
                attributes: ['student_id', 'name', 'dob']
            }),
            models.Score.findAll({
                where: {
                    student_id: studentIds,
                    course_section_id: course_section_id
                }
            })
        ]);

        // Tạo Map để lookup nhanh
        const studentMap = new Map(studentsInfo.map(s => [s.student_id, s]));
        const scoreMap = new Map(scores.map(s => [s.student_id, s]));

        // Xử lý logic đánh giá
        let processedStudents = [];
        let studentsNeedCheckAlert = [];

        for (let i = 0; i < studentIds.length; i++) {
            const studentId = studentIds[i];
            const student = studentMap.get(studentId);
            const score = scoreMap.get(studentId);

            if (!student) continue;

            const scoreData = score ? {
                theo_regular1: score.theo_regular1, theo_regular2: score.theo_regular2, theo_regular3: score.theo_regular3,
                pra_regular1: score.pra_regular1, pra_regular2: score.pra_regular2, pra_regular3: score.pra_regular3,
                mid: score.mid, final: score.final, avr: score.avr
            } : {
                theo_regular1: null, theo_regular2: null, theo_regular3: null,
                pra_regular1: null, pra_regular2: null, pra_regular3: null,
                mid: null, final: null, avr: null
            };

            // initial_evaluate
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

            // Đẩy vào danh sách tạm
            const studentObj = {
                no: 0, // Sẽ update sau khi sort
                student_id: student.student_id,
                name: student.name,
                dob: datetimeFormatter.formatDateVN(student.dob),
                score: scoreData,
                initial_evaluate: initial_evaluate,
                isRemindYet: false // Mặc định false
            };

            processedStudents.push(studentObj);

            // Nếu cần cảnh báo, kiểm tra xem đã cảnh báo chưa
            if (initial_evaluate !== 'ok') {
                studentsNeedCheckAlert.push(studentId);
            }
        };

        // Batch Query MongoDB.
        if (studentsNeedCheckAlert.length > 0) {
            // Tạo regex pattern để tìm bất kỳ sinh viên nào trong danh sách: "SV001|SV002|..."
            const studentIdsRegex = studentsNeedCheckAlert.join('|');

            // Tìm tất cả Alert liên quan đến lớp và danh sách sinh viên này
            const existingAlerts = await Alert.find({
                $and: [
                    { header: { $regex: '^Nhắc nhở học tập', $options: 'i' } },
                    { header: { $regex: course_section_id, $options: 'i' } },
                    { header: { $regex: studentIdsRegex, $options: 'i' } }
                ]
            });

            // Duyệt lại danh sách sinh viên để map kết quả từ MongoDB
            // Với mỗi sinh viên cần check, xem có alert nào match ID của họ không
            processedStudents.forEach(student => {
                if (student.initial_evaluate !== 'ok') {
                    // Kiểm tra xem có alert nào chứa student_id của SV này không
                    const hasAlert = existingAlerts.some(alert =>
                        new RegExp(student.student_id, 'i').test(alert.header)
                    );
                    student.isRemindYet = hasAlert;
                }
            });
        }

        // Sắp xếp danh sách sinh viên theo tên tiếng Việt
        processedStudents.sort((a, b) => {
            const lastNameA = a.name.split(' ').pop() || '';
            const lastNameB = b.name.split(' ').pop() || '';
            const nameComparison = lastNameA.localeCompare(lastNameB, 'vi');
            if (nameComparison !== 0) return nameComparison;
            return a.name.localeCompare(b.name, 'vi');
        });

        // Đánh số thứ tự lại
        processedStudents.forEach((s, index) => s.no = index + 1);

        // Trả về kết quả hoàn chỉnh
        return {
            course_section_id: courseSectionDetail.id,
            subjectName: courseSectionDetail.subject?.name || 'N/A',
            className: courseSectionDetail.clazz?.name || 'N/A',
            sessionName: courseSectionDetail?.session ? courseSectionDetail.session.name + ' ' + courseSectionDetail.session.years : 'N/A',
            facultyName: courseSectionDetail.subject?.faculty?.name || 'N/A',
            lecturerName: courseSectionDetail.lecturers_course_sections?.[0]?.lecturer?.name || 'N/A',
            students: processedStudents
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
            attributes: { exclude: ['id', 'isDeleted', 'clazz_id', 'major_id', 'createdAt', 'updatedAt'] },
            where: { student_id, isDeleted: false },
            include: [
                // use the actual association alias defined in your models (singular 'parent' per error)
                {
                    model: models.Parent,
                    as: 'parent',
                    attributes: ['parent_id', 'name', 'phone', 'email', 'gender', 'address', 'dob'],
                    where: { isDeleted: false },
                    required: false
                },
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

        const genderStudent = (student.gender === true || student.gender === '1' || student.gender === 1) ? "Nam" : "Nữ";

        // Normalize parent(s) to array regardless of alias ('parent' or 'parents')
        // const parentsField = student.parent || student.parents || null;
        // const parentsArr = parentsField ? (Array.isArray(parentsField) ? parentsField : [parentsField]) : [];

        // const parentInforList = parentsArr.map(parent => {
        //     const genderParent = (parent.gender === true || parent.gender === '1' || parent.gender === 1) ? "Nam" : "Nữ";
        //     return {
        //         parent_id: parent.parent_id,
        //         name: parent.name,
        //         dob: parent.dob ? datetimeFormatter.formatDateVN(parent.dob) : null,
        //         gender: genderParent,
        //         phone: parent.phone,
        //         email: parent.email,
        //         address: parent.address
        //     };
        // });

        return {
            student_id: student.student_id,
            name: student.name,
            dob: student.dob ? datetimeFormatter.formatDateVN(student.dob) : null,
            gender: genderStudent,
            avatar: student.avatar,
            phone: student.phone,
            email: student.email,
            address: student.address,
            className: student.clazz ? student.clazz.name : null,
            facultyName: student.clazz && student.clazz.faculty ? student.clazz.faculty.name : null,
            majorName: student.major ? student.major.name : null,
            parent: student.parent
        };
    } catch (error) {
        console.error("Error in getStudentInfoById4Lecturer:", error);
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
 * @param {string} session_name - Tên của học kỳ (VD: HK1 2024-2025)
 * @param {string} faculty_id - ID của khoa
 * @param {number} page - Trang hiện tại
 * @param {number} pageSize - Số lượng bản ghi trên một trang
 * @returns {Object} { total, page, pageSize, students, linkPrev, linkNext, pages }
 */
const getFailedStudentsBySessionAndFaculty = async (session_id, session_name, faculty_id, option = 'all', page, pageSize = 10) => {
    try {
        if (!session_id || !session_name || !faculty_id) {
            throw new Error('session_id, session_name and faculty_id are required');
        }

        const page_num = parseInt(page) || 1;
        const pageSize_num = parseInt(pageSize) || 10;

        // BƯỚC 1: Lấy danh sách Student ID
        const targetStudents = await models.Student.findAll({
            attributes: ['student_id', 'name', 'parent_id', 'clazz_id'],
            include: [
                {
                    model: models.Score,
                    as: 'scores',
                    attributes: [],
                    required: true,
                    include: [{
                        model: models.CourseSection,
                        as: 'course_section',
                        attributes: [],
                        where: { session_id: session_id },
                        include: [{
                            model: models.Subject,
                            as: 'subject',
                            attributes: [],
                            where: { faculty_id: faculty_id }
                        }]
                    }]
                },
                {
                    model: models.Clazz,
                    as: 'clazz',
                    attributes: ['name'],
                    required: true,
                    include: [
                        {
                            model: models.Faculty,
                            as: 'faculty',
                            attributes: ['name'],
                            where: { faculty_id: faculty_id },
                            required: true
                        }
                    ]
                }
            ],
            raw: true,
            nest: true
        });

        // Lấy danh sách ID duy nhất
        const distinctStudentIds = [...new Set(targetStudents.map(s => s.student_id))];

        if (distinctStudentIds.length === 0) {
            return { total: 0, page: page_num, pageSize: pageSize_num, students: [], linkPrev: null, linkNext: null, pages: [] };
        }

        // BƯỚC 2: Lấy TOÀN BỘ lịch sử điểm
        const allHistoryScores = await models.Score.findAll({
            where: {
                student_id: { [Op.in]: distinctStudentIds }
            },
            include: [
                {
                    model: models.CourseSection,
                    as: 'course_section',
                    where: { isCompleted: true },
                    attributes: ['id', 'session_id', 'subject_id'],
                    include: [
                        {
                            model: models.Subject,
                            as: 'subject',
                            attributes: ['theo_credit', 'pra_credit']
                        },
                        {
                            model: models.Session,
                            as: 'session',
                            attributes: ['id', 'name', 'years']
                        }
                    ]
                }
            ]
        });

        // BƯỚC 2.1: TỐI ƯU HÓA - Fetch Alert một lần duy nhất cho toàn bộ danh sách sinh viên
        // Tạo Regex để tìm tất cả sinh viên trong 1 query: "SV001|SV002|SV003"
        const studentIdsRegexString = distinctStudentIds.join('|');
        const sessionNameRegexString = session_name.replace(/-/g, '.*-.*'); // Fix lỗi khoảng trắng

        // Query MongoDB 1 lần lấy hết cảnh báo của nhóm sinh viên này
        const allAlerts = await Alert.find({
            $and: [
                { header: { $regex: '^Cảnh báo học vụ', $options: 'i' } },
                {
                    $or: [
                        { header: { $regex: studentIdsRegexString, $options: 'i' } }, // Tìm trong header
                        { receiverID: { $in: distinctStudentIds } } // Tìm theo receiverID
                    ]
                }
            ]
        });

        // Query MongoDB 1 lần Lấy hết Thông báo buộc thôi học của nhóm sinh viên này
        const allExpulsionAlerts = await Alert.find({
            $and: [
                { header: { $regex: '^Thông báo buộc thôi học', $options: 'i' } },
                {
                    $or: [
                        { header: { $regex: studentIdsRegexString, $options: 'i' } }, // Tìm trong header
                        { receiverID: { $in: distinctStudentIds } } // Tìm theo receiverID
                    ]
                }
            ]
        });

        // Tạo Map để tra cứu nhanh: student_id -> { isWarningYet, count, gotExpelAlertYet }
        const alertMap = {};

        // Khởi tạo map mặc định
        distinctStudentIds.forEach(id => {
            alertMap[id] = { isWarningYet: false, count: 0, gotExpelAlertYet: false };
        });

        // Nhóm các Alert theo header để tránh đếm trùng khi gửi cho cả sinh viên và phụ huynh
        const groupedAlerts = {};
        allAlerts.forEach(alert => {
            const header = alert.header || "";
            if (!groupedAlerts[header]) {
                groupedAlerts[header] = alert;
            }
        });

        // Duyệt qua các Alert đã được nhóm để phân loại vào Map
        Object.values(groupedAlerts).forEach(alert => {
            const header = alert.header || "";

            // Tìm xem alert này thuộc về sinh viên nào trong danh sách
            distinctStudentIds.forEach(studentId => {
                // Kiểm tra header chứa studentId (Case insensitive)
                const matchedByHeader = new RegExp(studentId, 'i').test(header);
                
                if (matchedByHeader) {
                    // Tăng biến đếm tổng (chỉ đếm 1 lần cho mỗi header duy nhất)
                    alertMap[studentId].count += 1;

                    // Kiểm tra xem alert này có thuộc session hiện tại không
                    if (new RegExp(sessionNameRegexString, 'i').test(header)) {
                        alertMap[studentId].isWarningYet = true;
                    }
                }
            });
        });

        // Xử lý Expulsion Alerts - chỉ cần kiểm tra có hay không, không cần so session
        allExpulsionAlerts.forEach(alert => {
            const receiverID = alert.receiverID;
            
            // Kiểm tra receiverID có trong danh sách không
            if (receiverID && alertMap[receiverID]) {
                alertMap[receiverID].gotExpelAlertYet = true;
            }
            
            // Cũng kiểm tra trong header (backup)
            const header = alert.header || "";
            distinctStudentIds.forEach(studentId => {
                if (new RegExp(studentId, 'i').test(header)) {
                    alertMap[studentId].gotExpelAlertYet = true;
                }
            });
        });

        // BƯỚC 3: Xử lý logic tính toán
        let processedStudents = [];
        const currentSessionObj = await models.Session.findByPk(session_id);

        const getSessionOrder = (sessionName, sessionYear) => {
            const yearPart = sessionYear ? parseInt(sessionYear.split('-')[0]) : 0;
            let termPart = 0;
            if (sessionName.includes('HK1')) termPart = 1;
            else if (sessionName.includes('HK2')) termPart = 2;
            else if (sessionName.includes('HK3')) termPart = 3;
            return yearPart * 10 + termPart;
        };

        const currentSessionOrder = getSessionOrder(currentSessionObj.name, currentSessionObj.years);

        for (const studentId of distinctStudentIds) {
            const studentInfo = targetStudents.find(s => s.student_id === studentId);
            const studentScores = allHistoryScores.filter(s => s.student_id === studentId);

            const scoresInCurrentSession = [];
            const scoresCumulativeCurrent = [];
            const scoresCumulativePrev = [];
            const learnedSessions = new Set();

            studentScores.forEach(score => {
                // Kiểm tra null safety cho course_section (phòng hờ data rác)
                if (!score.course_section || !score.course_section.session) return;

                const cs = score.course_section;
                const scoreSessionOrder = getSessionOrder(cs.session.name, cs.session.years);
                learnedSessions.add(scoreSessionOrder);

                const scoreData = {
                    avr: score.avr,
                    theo_credit: cs.subject ? cs.subject.theo_credit : 0,
                    pra_credit: cs.subject ? cs.subject.pra_credit : 0
                };

                if (cs.session_id === session_id) scoresInCurrentSession.push(scoreData);
                if (scoreSessionOrder <= currentSessionOrder) scoresCumulativeCurrent.push(scoreData);
                if (scoreSessionOrder < currentSessionOrder) scoresCumulativePrev.push(scoreData);
            });

            const gpa10_in_session = calculateGPA(scoresInCurrentSession, '10');
            const gpa4_in_session = calculateGPA(scoresInCurrentSession, '4');
            const gpa10_cumulative = calculateGPA(scoresCumulativeCurrent, '10');
            const gpa4_cumulative = calculateGPA(scoresCumulativeCurrent, '4');

            const semesterIndex = Array.from(learnedSessions).filter(order => order <= currentSessionOrder).length;

            const isSummerSession = session_name.toUpperCase().includes('HK3');
            let need2Warn = false;

            // CHỈ XÉT CẢNH BÁO NẾU KHÔNG PHẢI LÀ HK3
            if (!isSummerSession) {
                // Logic cảnh báo:
                // a) ĐTBCHK: dưới 0.80 đối với học kỳ đầu của khóa học, dưới 1.00 đối với các học kỳ tiếp theo
                let failBySessionGPA = false;
                if (semesterIndex === 1) {
                    // Học kỳ đầu của khóa học
                    if (gpa4_in_session < 0.80) failBySessionGPA = true;
                } else {
                    // Các học kỳ tiếp theo
                    if (gpa4_in_session < 1.00) failBySessionGPA = true;
                }

                // b) ĐTBCTL: dưới 1.20 (năm 1), dưới 1.40 (năm 2), dưới 1.60 (năm 3), dưới 1.80 (năm 4+)
                // Chỉ áp dụng ĐTBCTL khi sinh viên đã hoàn thành ít nhất 1 năm học (có HK2 hoặc nhiều hơn)
                let failByCumulativeGPA = false;

                // Kiểm tra xem sinh viên đã hoàn thành năm học nào chưa
                // CHỈ XÉT CÁC HỌC KỲ TRƯỚC HOẶC BẰNG HỌC KỲ HIỆN TẠI
                const academicYearSessions = {};
                Array.from(learnedSessions)
                    .filter(sessionOrder => sessionOrder <= currentSessionOrder) // Chỉ lấy học kỳ <= hiện tại
                    .forEach(sessionOrder => {
                        const year = Math.floor(sessionOrder / 10);
                        const semester = sessionOrder % 10;
                        if (!academicYearSessions[year]) academicYearSessions[year] = [];
                        academicYearSessions[year].push(semester);
                    });



                // Đếm số năm học đã hoàn thành (có ít nhất HK2 hoặc HK3)
                let completedAcademicYears = 0;
                let currentYearStatus = 'incomplete'; // Chưa hoàn thành năm hiện tại

                Object.keys(academicYearSessions).forEach(year => {
                    const semesters = academicYearSessions[year];
                    const currentYear = Math.floor(currentSessionOrder / 10);
                    
                    if (parseInt(year) < currentYear) {
                        // Năm học trước đây - tính là đã hoàn thành
                        completedAcademicYears++;
                    } else if (parseInt(year) === currentYear) {
                        // Năm học hiện tại - kiểm tra xem đã qua HK1 chưa
                        if (semesters.includes(2) || semesters.includes(3)) {
                            currentYearStatus = 'in_progress'; // Đang trong năm nhưng đã qua HK1
                        }
                    }
                });

                // Chỉ áp dụng ĐTBCTL nếu sinh viên không phải mới chỉ học HK1 duy nhất
                if (completedAcademicYears > 0 || currentYearStatus === 'in_progress') {
                    const academicYear = completedAcademicYears + (currentYearStatus === 'in_progress' ? 1 : 0);
                    
                    if (academicYear === 1 && gpa4_cumulative < 1.20) {
                        failByCumulativeGPA = true;
                    } else if (academicYear === 2 && gpa4_cumulative < 1.40) {
                        failByCumulativeGPA = true;
                    } else if (academicYear === 3 && gpa4_cumulative < 1.60) {
                        failByCumulativeGPA = true;
                    } else if (academicYear >= 4 && gpa4_cumulative < 1.80) {
                        failByCumulativeGPA = true;
                    }
                }

                need2Warn = failBySessionGPA || failByCumulativeGPA;
            }
            const warningStatus = alertMap[studentId];

            if (need2Warn) {
                processedStudents.push({
                    student_id: studentId,
                    studentName: studentInfo.name,
                    className: studentInfo.clazz ? studentInfo.clazz.name : null,
                    facultyName: studentInfo.clazz && studentInfo.clazz.faculty ? studentInfo.clazz.faculty.name : null,
                    gpa10_in_session: gpa10_in_session,
                    gpa4_in_session: gpa4_in_session,
                    gpa10: gpa10_cumulative,
                    gpa4: gpa4_cumulative,
                    need2Warn: need2Warn,
                    parent_id: studentInfo.parent_id || null,
                    isWarningYet: warningStatus.isWarningYet,
                    totalWarnings: warningStatus.count,
                    gotExpelAlertYet: warningStatus.gotExpelAlertYet
                });
            }
        }

        // BƯỚC 4: Filter Options
        if (option === 'notWarningYet') {
            processedStudents = processedStudents.filter(s => !s.isWarningYet);
        } else if (option === 'warned') {
            processedStudents = processedStudents.filter(s => s.isWarningYet);
        }

        // BƯỚC 5: Sort
        processedStudents.sort((a, b) => {
            const lastNameA = a.studentName.split(' ').pop() || '';
            const lastNameB = b.studentName.split(' ').pop() || '';
            const nameComparison = lastNameA.localeCompare(lastNameB, 'vi');
            return nameComparison !== 0 ? nameComparison : a.studentName.localeCompare(b.studentName, 'vi');
        });

        // BƯỚC 6: Pagination
        const total = processedStudents.length;
        const totalPages = Math.ceil(total / pageSize_num);
        const currentPage = Math.max(1, Math.min(page_num, totalPages || 1));
        const offsetCalculated = (currentPage - 1) * pageSize_num;

        // Fix lỗi slice nếu mảng rỗng
        const paginatedStudents = total > 0 ? processedStudents.slice(offsetCalculated, offsetCalculated + pageSize_num) : [];

        const linkPrev = currentPage > 1 ?
            `/api/students/failed?sessionId=${session_id}&facultyId=${faculty_id}&option=${option}&page=${currentPage - 1}&pageSize=${pageSize_num}` : null;
        const linkNext = currentPage < totalPages ?
            `/api/students/failed?sessionId=${session_id}&facultyId=${faculty_id}&option=${option}&page=${currentPage + 1}&pageSize=${pageSize_num}` : null;

        const pages = [];
        for (let i = currentPage; i < currentPage + 3 && i <= totalPages; i++) {
            pages.push(i);
        }

        return {
            total,
            page: currentPage,
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
const searchFailedStudentBySessionAndFacultyWithStudentId = async (session_id, session_name, faculty_id, student_id) => {
    try {
        // Validate input
        if (!session_id || !session_name || !faculty_id || !student_id) {
            throw new Error('session_id, session_name, faculty_id and student_id are required');
        }

        // BƯỚC 1: Tìm thông tin sinh viên cụ thể trong Session và Faculty đó
        const targetStudent = await models.Student.findOne({
            where: { student_id: student_id },
            attributes: ['student_id', 'name', 'parent_id', 'clazz_id'],
            include: [
                {
                    model: models.Score,
                    as: 'scores',
                    attributes: [],
                    required: true,
                    include: [{
                        model: models.CourseSection,
                        as: 'course_section',
                        attributes: [],
                        where: { session_id: session_id },
                        include: [{
                            model: models.Subject,
                            as: 'subject',
                            attributes: [],
                            where: { faculty_id: faculty_id }
                        }]
                    }]
                },
                {
                    model: models.Clazz,
                    as: 'clazz',
                    attributes: ['name'],
                    required: true,
                    include: [
                        {
                            model: models.Faculty,
                            as: 'faculty',
                            attributes: ['name'],
                            where: { faculty_id: faculty_id },
                            required: true
                        }
                    ]
                }
            ],
            raw: true,
            nest: true
        });

        // Nếu không tìm thấy sinh viên trong khoa/kỳ này -> Return null
        if (!targetStudent) {
            return null;
        }

        // BƯỚC 2: Lấy TOÀN BỘ lịch sử điểm của sinh viên này
        const allHistoryScores = await models.Score.findAll({
            where: {
                student_id: student_id
            },
            include: [
                {
                    model: models.CourseSection,
                    as: 'course_section',
                    where: { isCompleted: true },
                    attributes: ['id', 'session_id', 'subject_id'],
                    include: [
                        {
                            model: models.Subject,
                            as: 'subject',
                            attributes: ['theo_credit', 'pra_credit']
                        },
                        {
                            model: models.Session,
                            as: 'session',
                            attributes: ['id', 'name', 'years']
                        }
                    ]
                }
            ]
        });

        // BƯỚC 3: Xử lý logic tính toán
        const currentSessionObj = await models.Session.findByPk(session_id);

        const getSessionOrder = (sessionName, sessionYear) => {
            const yearPart = sessionYear ? parseInt(sessionYear.split('-')[0]) : 0;
            let termPart = 0;
            if (sessionName.includes('HK1')) termPart = 1;
            else if (sessionName.includes('HK2')) termPart = 2;
            else if (sessionName.includes('HK3')) termPart = 3;
            return yearPart * 10 + termPart;
        };

        const currentSessionOrder = getSessionOrder(currentSessionObj.name, currentSessionObj.years);

        // Phân loại điểm
        const scoresInCurrentSession = [];
        const scoresCumulativeCurrent = [];
        const scoresCumulativePrev = [];
        const learnedSessions = new Set();

        allHistoryScores.forEach(score => {
            if (!score.course_section || !score.course_section.session) return;

            const cs = score.course_section;
            const scoreSessionOrder = getSessionOrder(cs.session.name, cs.session.years);
            learnedSessions.add(scoreSessionOrder);

            const scoreData = {
                avr: score.avr,
                theo_credit: cs.subject ? cs.subject.theo_credit : 0,
                pra_credit: cs.subject ? cs.subject.pra_credit : 0
            };

            if (cs.session_id === session_id) scoresInCurrentSession.push(scoreData);
            if (scoreSessionOrder <= currentSessionOrder) scoresCumulativeCurrent.push(scoreData);
            if (scoreSessionOrder < currentSessionOrder) scoresCumulativePrev.push(scoreData);
        });

        // Tính GPA
        const gpa10_in_session = calculateGPA(scoresInCurrentSession, '10');
        const gpa4_in_session = calculateGPA(scoresInCurrentSession, '4');
        const gpa10_cumulative = calculateGPA(scoresCumulativeCurrent, '10');
        const gpa4_cumulative = calculateGPA(scoresCumulativeCurrent, '4');

        // Logic xét cảnh báo theo quy định mới
        const semesterIndex = Array.from(learnedSessions).filter(order => order <= currentSessionOrder).length;

        const isSummerSession = session_name.toUpperCase().includes('HK3');
        let need2Warn = false;

        // CHỈ XÉT CẢNH BÁO NẾU KHÔNG PHẢI LÀ HK3
        if (!isSummerSession) {
            // a) ĐTBCHK: dưới 0.80 đối với học kỳ đầu của khóa học, dưới 1.00 đối với các học kỳ tiếp theo
            let failBySessionGPA = false;
            if (semesterIndex === 1) {
                // Học kỳ đầu của khóa học
                if (gpa4_in_session < 0.80) failBySessionGPA = true;
            } else {
                // Các học kỳ tiếp theo
                if (gpa4_in_session < 1.00) failBySessionGPA = true;
            }

            // b) ĐTBCTL: dưới 1.20 (năm 1), dưới 1.40 (năm 2), dưới 1.60 (năm 3), dưới 1.80 (năm 4+)
            // Chỉ áp dụng ĐTBCTL khi sinh viên đã hoàn thành ít nhất 1 năm học (có HK2 hoặc nhiều hơn)
            let failByCumulativeGPA = false;

            // Kiểm tra xem sinh viên đã hoàn thành năm học nào chưa
            // CHỈ XÉT CÁC HỌC KỲ TRƯỚC HOẶC BẰNG HỌC KỲ HIỆN TẠI
            const academicYearSessions = {};
            Array.from(learnedSessions)
                .filter(sessionOrder => sessionOrder <= currentSessionOrder) // Chỉ lấy học kỳ <= hiện tại
                .forEach(sessionOrder => {
                    const year = Math.floor(sessionOrder / 10);
                    const semester = sessionOrder % 10;
                    if (!academicYearSessions[year]) academicYearSessions[year] = [];
                    academicYearSessions[year].push(semester);
                });

            // Đếm số năm học đã hoàn thành (có ít nhất HK2 hoặc HK3)
            let completedAcademicYears = 0;
            let currentYearStatus = 'incomplete'; // Chưa hoàn thành năm hiện tại

            Object.keys(academicYearSessions).forEach(year => {
                const semesters = academicYearSessions[year];
                const currentYear = Math.floor(currentSessionOrder / 10);
                
                if (parseInt(year) < currentYear) {
                    // Năm học trước đây - tính là đã hoàn thành
                    completedAcademicYears++;
                } else if (parseInt(year) === currentYear) {
                    // Năm học hiện tại - kiểm tra xem đã qua HK1 chưa
                    if (semesters.includes(2) || semesters.includes(3)) {
                        currentYearStatus = 'in_progress'; // Đang trong năm nhưng đã qua HK1
                    }
                }
            });

            // Chỉ áp dụng ĐTBCTL nếu sinh viên không phải mới chỉ học HK1 duy nhất
            if (completedAcademicYears > 0 || currentYearStatus === 'in_progress') {
                const academicYear = completedAcademicYears + (currentYearStatus === 'in_progress' ? 1 : 0);
                
                if (academicYear === 1 && gpa4_cumulative < 1.20) {
                    failByCumulativeGPA = true;
                } else if (academicYear === 2 && gpa4_cumulative < 1.40) {
                    failByCumulativeGPA = true;
                } else if (academicYear === 3 && gpa4_cumulative < 1.60) {
                    failByCumulativeGPA = true;
                } else if (academicYear >= 4 && gpa4_cumulative < 1.80) {
                    failByCumulativeGPA = true;
                }
            }

            need2Warn = failBySessionGPA || failByCumulativeGPA;
        }

        // BƯỚC 4: Kiểm tra trạng thái Alert trong MongoDB
        const sessionNameRegexString = session_name.replace(/-/g, '.*-.*');

        // Đếm cảnh báo trong kỳ hiện tại (sử dụng distinct header để tránh đếm trùng)
        const currentSessionAlerts = await Alert.find({
            $and: [
                { header: { $regex: '^Cảnh báo học vụ', $options: 'i' } },
                { header: { $regex: sessionNameRegexString, $options: 'i' } },
                {
                    $or: [
                        { header: { $regex: student_id, $options: 'i' } },
                        { receiverID: student_id }
                    ]
                }
            ]
        });
        
        // Đếm số header duy nhất
        const uniqueCurrentHeaders = new Set(currentSessionAlerts.map(alert => alert.header));
        const countCurrentSession = uniqueCurrentHeaders.size;

        // Đếm tổng cảnh báo (sử dụng distinct header để tránh đếm trùng)
        const totalAlerts = await Alert.find({
            $and: [
                { header: { $regex: '^Cảnh báo học vụ', $options: 'i' } },
                {
                    $or: [
                        { header: { $regex: student_id, $options: 'i' } },
                        { receiverID: student_id }
                    ]
                }
            ]
        });
        
        // Đếm số header duy nhất
        const uniqueTotalHeaders = new Set(totalAlerts.map(alert => alert.header));
        const countTotal = uniqueTotalHeaders.size;

        const isWarningYet = countCurrentSession > 0;

        // Kiểm tra thông báo buộc thôi học
        const expulsionAlerts = await Alert.find({
            $and: [
                { header: { $regex: '^Thông báo buộc thôi học', $options: 'i' } },
                {
                    $or: [
                        { header: { $regex: student_id, $options: 'i' } },
                        { receiverID: student_id }
                    ]
                }
            ]
        });
        
        const gotExpelAlertYet = expulsionAlerts.length > 0;

        // BƯỚC 5: Trả về kết quả
        // Chỉ trả về data nếu sinh viên vi phạm quy chế (Fail)
        if (need2Warn) {
            return {
                student_id: student_id,
                studentName: targetStudent.name,
                className: targetStudent.clazz ? targetStudent.clazz.name : null,
                facultyName: targetStudent.clazz && targetStudent.clazz.faculty ? targetStudent.clazz.faculty.name : null,
                gpa10_in_session: gpa10_in_session,
                gpa4_in_session: gpa4_in_session,
                gpa10: gpa10_cumulative,
                gpa4: gpa4_cumulative,
                need2Warn: need2Warn,
                parent_id: targetStudent.parent_id || null,
                isWarningYet: isWarningYet,
                totalWarnings: countTotal,
                gotExpelAlertYet: gotExpelAlertYet
            };
        }

        // Nếu sinh viên không bị cảnh báo
        return null;

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