const sequelize = require("../config/mariadb.conf");
const { Op } = require("sequelize");
const initModels = require("../databases/mariadb/model/init-models");
const models = initModels(sequelize);
const datetimeFormatter = require("../utils/format/datetime-formatter");
const { where } = require("../databases/mongodb/schemas/Alert");
const { Alert } = require('../databases/mongodb/schemas');

/**
 * Lấy danh sách sinh viên bằng course_section_id
 * @param {string} course_section_id 
 * @returns {Array} Danh sách sinh viên
 */
const getStudentsByCourseSectionID = async (course_section_id) => {
    try {
        // Validate input
        if (!course_section_id) {
            throw new Error('course_section_id is required');
        }

        const students = await models.StudentCourseSection.findAll({
            where: {
                course_section_id: course_section_id
            },
            include: [
                {
                    model: models.Student,
                    as: 'student',
                    attributes: ['student_id', 'name', 'dob', 'gender']
                }
            ],
            attributes: ['practice_gr']
        });

        return students.map(item => ({
            student_id: item.student.student_id,
            name: item.student.name,
            dob: item.student.dob,
            gender: item.student.gender ? 'Nam' : 'Nữ',
            practice_gr: item?.practice_gr || null
        }));

    } catch (error) {
        console.error('Error in getStudentsByCourseSectionID:', error);
        throw error;
    }
};

/**
 * Lấy thông tin các buổi điểm danh của 1 lớp học phần bằng course_section_id
 * @param {string} course_section_id 
 * @returns {Array} Danh sách các buổi điểm danh
 */
const getAttendanceListByCourseID = async (course_section_id) => {
    try {
        // Validate input
        if (!course_section_id) {
            throw new Error('course_section_id is required');
        }

        const attendances = await models.Attendance.findAll({
            where: {
                course_section_id: course_section_id
            },
            attributes: ['id', 'date_attendance', 'start_lesson', 'end_lesson'],
            order: [['date_attendance', 'ASC'], ['start_lesson', 'ASC']]
        });

        return attendances.map(item => ({
            attendance_id: item.id,
            date_attendance: item.date_attendance,
            start_lesson: item.start_lesson,
            end_lesson: item.end_lesson
        }));

    } catch (error) {
        console.error('Error in getAttendanceListByCourseID:', error);
        throw error;
    }
};

/**
 * Lấy thông tin chi tiết lớp học phần bằng course_section_id
 * @param {string} course_section_id 
 * @returns {Object} Thông tin chi tiết lớp học phần
 */
const getCourseSectionDetailByID = async (course_section_id, user_id) => {
    try {
        // Validate input
        if (!course_section_id) {
            throw new Error('course_section_id is required');
        }

        console.log('User ID in getCourseSectionDetailByID:', user_id);

        // Truy vấn nhóm thực hành của giảng viên request
        const practice_gr = await models.LecturerCourseSection.findOne({
            where: {
                course_section_id: course_section_id,
                lecturer_id: user_id
            },
            attributes: ['practice_gr']
        });

        const courseSectionDetail = await models.CourseSection.findOne({
            where: {
                id: course_section_id
            },
            include: [
                {
                    model: models.Subject,
                    as: 'subject',
                    attributes: ['name', 'theo_credit', 'pra_credit'],
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
                    where: { isMain: true },
                    include: [
                        {
                            model: models.Lecturer,
                            as: 'lecturer',
                            attributes: ['lecturer_id', 'name', 'email', 'phone']
                        }
                    ]
                }
            ],
            attributes: ['id']
        });

        if (!courseSectionDetail) {
            throw new Error(`Course section not found with id: ${course_section_id}`);
        }

        // Lấy tên giảng viên đầu tiên (có thể có nhiều giảng viên)
        const lecturerName = courseSectionDetail.lecturers_course_sections?.[0]?.lecturer?.name || 'N/A';

        return {
            course_section_id: courseSectionDetail.id,
            subjectName: courseSectionDetail.subject?.name || 'N/A',
            theo_credit: courseSectionDetail.subject?.theo_credit || 0,
            pra_credit: courseSectionDetail.subject?.pra_credit || 0,
            className: courseSectionDetail.clazz?.name || 'N/A',
            facultyName: courseSectionDetail.subject?.faculty?.name || 'N/A',
            sessionName: courseSectionDetail.session ? `${courseSectionDetail.session.name} ${courseSectionDetail.session.years}` : 'N/A',
            lecturer_id: courseSectionDetail.lecturers_course_sections?.[0]?.lecturer?.lecturer_id || null,
            lecturerName: lecturerName,
            lecturerEmail: courseSectionDetail.lecturers_course_sections?.[0]?.lecturer?.email || 'N/A',
            lecturerPhone: courseSectionDetail.lecturers_course_sections?.[0]?.lecturer?.phone || 'N/A',
            practice_gr: practice_gr?.practice_gr || null
        };

    } catch (error) {
        console.error('Error in getCourseSectionDetailByID:', error);
        throw error;
    }
};

/**
 * Lấy danh sách các sinh viên điểm danh bằng attendance_id
 * @param {string} attendance_id 
 * @returns {Array} Danh sách điểm danh sinh viên
 */
const getAttendanceStudentListByAttendanceID = async (attendance_id) => {
    try {
        // Validate input
        if (!attendance_id) {
            throw new Error('attendance_id is required');
        }

        const attendanceStudents = await models.AttendanceStudent.findAll({
            where: {
                attendance_id: attendance_id
            },
            attributes: ['student_id', 'status', 'description']
        });

        return attendanceStudents.map(item => ({
            student_id: item.student_id,
            status: item.status,
            description: item.description
        }));

    } catch (error) {
        console.error('Error in getAttendanceStudentListByAttendanceID:', error);
        throw error;
    }
};

/**
 * Merge kết quả và trả về dữ liệu điểm danh hoàn chỉnh theo course_section_id
 * @param {string} course_section_id 
 * @returns {Object} Dữ liệu điểm danh hoàn chỉnh
 */
const getAttendanceDetailsByCourseSectionID = async (course_section_id, user_id) => {
    try {
        // Validate input parameters
        if (!course_section_id) {
            throw new Error('course_section_id is required');
        }

        // Lấy thông tin chi tiết lớp học phần
        const courseSectionDetail = await getCourseSectionDetailByID(course_section_id, user_id);

        // --- 1. TÍNH TOÁN GIỚI HẠN CẤM THI (Quy đổi ra TIẾT) ---
        // 1 tín chỉ LT = 15 tiết, 1 tín chỉ TH = 30 tiết
        const totalTheoPeriods = (courseSectionDetail.theo_credit || 0) * 15;
        const totalPraPeriods = (courseSectionDetail.pra_credit || 0) * 30;

        // Giới hạn 20% số tiết
        const maxAllowedTheoAbsent = totalTheoPeriods * 0.2;
        const maxAllowedPraAbsent = totalPraPeriods * 0.2;

        // Lấy danh sách sinh viên và danh sách điểm danh
        const allStudents = await getStudentsByCourseSectionID(course_section_id);
        const attendanceList = await getAttendanceListByCourseID(course_section_id);

        // =========================================================================
        // === SẮP XẾP DANH SÁCH ĐIỂM DANH (Date -> Start -> End) ===
        // =========================================================================
        attendanceList.sort((a, b) => {
            // 1. So sánh ngày (tăng dần)
            // Chuyển về getTime() để so sánh số nguyên timestamp cho chính xác
            const timeA = new Date(a.date_attendance).getTime();
            const timeB = new Date(b.date_attendance).getTime();
            if (timeA !== timeB) {
                return timeB - timeA;
            }

            // 2. Nếu ngày bằng nhau, so sánh tiết bắt đầu (tăng dần)
            if (a.start_lesson !== b.start_lesson) {
                return b.start_lesson - a.start_lesson;
            }

            // 3. Nếu tiết bắt đầu bằng nhau, so sánh tiết kết thúc (tăng dần)
            return a.end_lesson - b.end_lesson;
        });
        // =========================================================================

        //Lấy tiết học của lớp học phần của giảng viên chính
        const schedules = await models.Schedule.findOne({
            where: {
                course_section_id: course_section_id,
                user_id: courseSectionDetail.lecturer_id,
                date: { [Op.is]: null },
                room: {
                    [Op.notLike]: 'TH_%'
                }
            },
            attributes: ['start_lesson', 'end_lesson']
        });

        // --- 2. KHỞI TẠO BỘ ĐẾM SỐ BUỔI VẮNG ---
        // Map lưu: { student_id: { theo: 0, pra: 0 } } -> Đơn vị là BUỔI (Session)
        const studentAbsenceCounterMap = new Map();
        allStudents.forEach(s => studentAbsenceCounterMap.set(s.student_id, { theo: 0, pra: 0 }));

        const attendances = [];

        // Duyệt qua từng buổi điểm danh (Lúc này attendanceList ĐÃ ĐƯỢC SẮP XẾP)
        for (const attendance of attendanceList) {
            const attendanceStudents = await getAttendanceStudentListByAttendanceID(attendance.attendance_id);

            // Xác định loại buổi học
            const isPracticeSession = attendanceStudents.some(s => s.status === 'DIFGR');

            const attendanceStudentMap = new Map();
            attendanceStudents.forEach(item => {
                attendanceStudentMap.set(item.student_id, {
                    status: item.status,
                    description: item.description
                });
            });

            const studentsForSession = allStudents.map(student => {
                const attendanceData = attendanceStudentMap.get(student.student_id);
                const status = attendanceData ? attendanceData.status : "ABSENT";

                if (status !== 'DIFGR' && status === 'ABSENT') {
                    const currentCounter = studentAbsenceCounterMap.get(student.student_id);
                    if (currentCounter) {
                        if (isPracticeSession) {
                            currentCounter.pra += 1; // +1 buổi thực hành
                        } else {
                            currentCounter.theo += 1; // +1 buổi lý thuyết
                        }
                        studentAbsenceCounterMap.set(student.student_id, currentCounter);
                    }
                }

                return {
                    student_id: student.student_id,
                    name: student.name,
                    dob: datetimeFormatter.formatDateVN(student.dob),
                    gender: student.gender,
                    practice_gr: student.practice_gr,
                    status: status,
                    description: attendanceData ? attendanceData.description : ""
                };
            });

            attendances.push({
                date_attendance: datetimeFormatter.formatDateVN(attendance.date_attendance),
                attendance_id: attendance.attendance_id,
                start_lesson: attendance.start_lesson,
                end_lesson: attendance.end_lesson,
                type: isPracticeSession ? 'TH' : 'LT',
                students: studentsForSession
            });
        }

        // --- 3. XỬ LÝ DANH SÁCH TỔNG HỢP & LOGIC CẢNH BÁO ---
        let summaryStudents = allStudents.map(student => {
            // Lấy số BUỔI vắng
            const counters = studentAbsenceCounterMap.get(student.student_id) || { theo: 0, pra: 0 };

            let need2Remind = false;
            let remindAtCredit = null;
            let banFromTakingExam = false; // Mặc định là không cấm

            // --- QUY ĐỔI RA TIẾT ĐỂ SO SÁNH ---
            const currentTheoPeriods = counters.theo * 3; // Số tiết LT đã vắng
            const currentPraPeriods = counters.pra * 3;   // Số tiết TH đã vắng

            // 1. Logic Cấm thi (Vượt quá 20%)
            if (currentTheoPeriods > maxAllowedTheoAbsent || currentPraPeriods > maxAllowedPraAbsent) {
                banFromTakingExam = true;
            }

            // 2. Logic Cần nhắc nhở (Sắp bị cấm)
            // Check Lý thuyết
            const isNearBanTheo = (currentTheoPeriods <= maxAllowedTheoAbsent) &&
                ((currentTheoPeriods + 3) > maxAllowedTheoAbsent);

            // Check Thực hành
            const isNearBanPra = (currentPraPeriods <= maxAllowedPraAbsent) &&
                ((currentPraPeriods + 3) > maxAllowedPraAbsent);

            if (isNearBanTheo) {
                need2Remind = true;
                remindAtCredit = 'theo';
            } else if (isNearBanPra) {
                need2Remind = true;
                remindAtCredit = 'pra';
            }

            // Nếu đã bị cấm thi rồi thì không cần nhắc nhở "sắp bị cấm" nữa
            if (banFromTakingExam) {
                need2Remind = false;
            }

            return {
                student_id: student.student_id,
                name: student.name,
                dob: datetimeFormatter.formatDateVN(student.dob),
                gender: student.gender,
                practice_gr: student.practice_gr,
                absentTheo: counters.theo,
                absentPra: counters.pra,
                banFromTakingExam: banFromTakingExam,
                need2Remind: need2Remind,
                remindAtCredit: remindAtCredit,
                isRemindYet: false
            };
        });

        // 4. Lọc danh sách cần check Alert
        const studentsNeedCheckAlert = summaryStudents
            .filter(s => s.need2Remind)
            .map(s => s.student_id);

        // 5. Query MongoDB
        if (studentsNeedCheckAlert.length > 0) {
            const studentIdsRegex = studentsNeedCheckAlert.join('|');

            const existingAlerts = await Alert.find({
                $and: [
                    { header: { $regex: '^Nhắc nhở chuyên cần', $options: 'i' } },
                    { header: { $regex: course_section_id, $options: 'i' } },
                    { header: { $regex: studentIdsRegex, $options: 'i' } }
                ]
            });

            summaryStudents.forEach(student => {
                if (student.need2Remind) {
                    const hasAlert = existingAlerts.some(alert =>
                        new RegExp(student.student_id, 'i').test(alert.header)
                    );
                    student.isRemindYet = hasAlert;
                }
            });
        }

        return {
            subjectName: courseSectionDetail.subjectName,
            className: courseSectionDetail.className,
            course_section_id: courseSectionDetail.course_section_id,
            facultyName: courseSectionDetail.facultyName,
            sessionName: courseSectionDetail.sessionName,
            lecturerName: courseSectionDetail.lecturerName,
            lecturerEmail: courseSectionDetail.lecturerEmail,
            lecturerPhone: courseSectionDetail.lecturerPhone,
            practice_gr: courseSectionDetail.practice_gr,
            start_lesson: schedules ? schedules.start_lesson : null,
            end_lesson: schedules ? schedules.end_lesson : null,
            meta: {
                totalTheoPeriods,
                totalPraPeriods,
                maxAllowedTheoAbsent,
                maxAllowedPraAbsent
            },
            attendances: attendances,
            students: summaryStudents
        };

    } catch (error) {
        console.error('Error in getAttendanceDetailsByCourseSectionID:', error);
        throw error;
    }
};

/**
 * Tạo mới bản ghi buổi điểm danh (Attendance) và điểm danh cho sinh viên (AttendanceStudent)
 * @param {Array} attendanceData
{
    "start_lesson": xx,
    "end_lesson": xx,
    "students": [
        {
            "student_id": "xxx",
            "status": "LATE",
            "description": ""
        },
        {
            "student_id": "xxx", 
            "status": "PRESENT",
            "description": ""
        }
        ...
    ]
}
 * @returns {Object} success + message
 */
const createAttendanceRecord = async (lecturer_id, course_section_id, attendanceData) => {
    const transaction = await sequelize.transaction();

    try {
        // Validate input
        if (!lecturer_id) {
            throw new Error('lecturer_id is required');
        }

        if (!course_section_id) {
            throw new Error('course_section_id is required');
        }

        if (!attendanceData) {
            throw new Error('attendanceData is required');
        }

        const { start_lesson, end_lesson, students } = attendanceData;

        // Validate required fields
        if (start_lesson === undefined || end_lesson === undefined) {
            throw new Error('start_lesson and end_lesson are required');
        }

        if (!Array.isArray(students) || students.length === 0) {
            throw new Error('students array is required and cannot be empty');
        }

        // Validate lessons
        if (start_lesson < 1 || end_lesson < 1 || start_lesson > end_lesson) {
            throw new Error('Invalid lesson range. start_lesson and end_lesson must be >= 1 and start_lesson <= end_lesson');
        }

        // Tự động tạo date_attendance theo ngày hiện tại (yyyy-MM-dd)
        const currentDate = new Date();
        const date_attendance = currentDate.toISOString().split('T')[0]; // yyyy-MM-dd format

        // Kiểm tra lecturer có tồn tại không
        const existingLecturer = await models.Lecturer.findOne({
            where: { lecturer_id: lecturer_id }
        });
        if (!existingLecturer) {
            throw new Error(`Lecturer not found with id: ${lecturer_id}`);
        }

        // Kiểm tra course_section có tồn tại không
        const existingCourseSection = await models.CourseSection.findByPk(course_section_id);
        if (!existingCourseSection) {
            throw new Error(`Course section not found with id: ${course_section_id}`);
        }

        // Tạo bản ghi Attendance trước
        const attendanceRecord = await models.Attendance.create({
            lecturer_id: lecturer_id,
            course_section_id: course_section_id,
            date_attendance: date_attendance,
            start_lesson: start_lesson,
            end_lesson: end_lesson
        }, { transaction });

        // Validate và tạo bản ghi AttendanceStudent
        const attendanceStudentRecords = [];
        const { StatusAttendance } = require('../databases/mariadb/model/enums');

        for (const studentData of students) {
            const { student_id, status, description = "" } = studentData;

            // Validate student data
            if (!student_id) {
                throw new Error('student_id is required for each student');
            }

            if (!status) {
                throw new Error(`status is required for student ${student_id}`);
            }

            // Validate status enum
            if (!Object.values(StatusAttendance).includes(status)) {
                throw new Error(`Invalid status: ${status}. Must be one of: ${Object.values(StatusAttendance).join(', ')}`);
            }

            // Kiểm tra sinh viên có tồn tại không
            // const existingStudent = await models.Student.findOne({
            //     where: { student_id: student_id }
            // });

            // if (!existingStudent) {
            //     throw new Error(`Student not found with id: ${student_id}`);
            // }

            // Tạo record
            attendanceStudentRecords.push({
                attendance_id: attendanceRecord.id,
                student_id: student_id,
                status: status,
                description: description || ""
            });
        }

        // Bulk insert các attendance student records
        const createdRecords = await models.AttendanceStudent.bulkCreate(
            attendanceStudentRecords,
            {
                transaction,
                validate: true,
                returning: true
            }
        );

        await transaction.commit();

        return {
            success: true,
            message: `Dữ liệu điểm danh đã được lưu thành công cho ${createdRecords.length} sinh viên`
            // data: {
            //     attendance_id: attendanceRecord.id,
            //     date_attendance: date_attendance,
            //     start_lesson: start_lesson,
            //     end_lesson: end_lesson,
            //     total_students: createdRecords.length
            // }
        };

    } catch (error) {
        await transaction.rollback();
        console.error('Error in createAttendanceRecord:', error);

        return {
            success: false,
            message: `Lỗi khi tạo dữ liệu điểm danh: ${error.message}`
        };
    }
};

/**
 * Cập nhật bản ghi buổi điểm danh và điểm danh cho sinh viên
 * @param {string} attendance_id
 * @param {Array} attendance_studentData
{
    "start_lesson": xx,
    "end_lesson": xx,
    "students": [
        {
            "student_id": "xxx",
            "status": "LATE",
            "description": ""
        },
        {
            "student_id": "xxx", 
            "status": "PRESENT",
            "description": ""
        }
        ...
    ]
}
 * @returns {Object} success + message
 */
const updateAttendanceRecord = async (attendance_id, attendanceData) => {
    const transaction = await sequelize.transaction();

    try {
        // Validate input
        if (!attendance_id) {
            throw new Error('attendance_id is required');
        }

        if (!attendanceData) {
            throw new Error('attendanceData is required');
        }

        const { start_lesson, end_lesson, students } = attendanceData;

        // Validate required fields
        if (start_lesson === undefined || end_lesson === undefined) {
            throw new Error('start_lesson and end_lesson are required');
        }

        if (!Array.isArray(students) || students.length === 0) {
            throw new Error('students array is required and cannot be empty');
        }

        // Validate lessons
        if (start_lesson < 1 || end_lesson < 1 || start_lesson > end_lesson) {
            throw new Error('Invalid lesson range. start_lesson and end_lesson must be >= 1 and start_lesson <= end_lesson');
        }

        // Kiểm tra attendance record có tồn tại không
        const existingAttendance = await models.Attendance.findByPk(attendance_id);
        if (!existingAttendance) {
            throw new Error(`Attendance record not found with id: ${attendance_id}`);
        }

        // Cập nhật bản ghi Attendance
        await models.Attendance.update({
            start_lesson: start_lesson,
            end_lesson: end_lesson
        }, {
            where: { id: attendance_id },
            transaction
        });

        // Validate students trước khi xóa và tạo mới
        const { StatusAttendance } = require('../databases/mariadb/model/enums');

        for (const studentData of students) {
            const { student_id, status } = studentData;

            // Validate student data
            if (!student_id) {
                throw new Error('student_id is required for each student');
            }

            if (!status) {
                throw new Error(`status is required for student ${student_id}`);
            }

            // Validate status enum
            if (!Object.values(StatusAttendance).includes(status)) {
                throw new Error(`Invalid status: ${status}. Must be one of: ${Object.values(StatusAttendance).join(', ')}`);
            }

            // Kiểm tra sinh viên có tồn tại không
            // const existingStudent = await models.Student.findOne({
            //     where: { student_id: student_id }
            // });

            // if (!existingStudent) {
            //     throw new Error(`Student not found with id: ${student_id}`);
            // }
        }

        // Xóa các record cũ của AttendanceStudent
        await models.AttendanceStudent.destroy({
            where: {
                attendance_id: attendance_id
            },
            transaction
        });

        // Tạo lại các bản ghi AttendanceStudent
        const attendanceStudentRecords = students.map(studentData => {
            const { student_id, status, description = "" } = studentData;

            return {
                attendance_id: attendance_id,
                student_id: student_id,
                status: status,
                description: description || ""
            };
        });

        // Bulk insert các attendance student records mới
        const updatedRecords = await models.AttendanceStudent.bulkCreate(
            attendanceStudentRecords,
            {
                transaction,
                validate: true,
                returning: true
            }
        );

        await transaction.commit();

        return {
            success: true,
            message: `Dữ liệu điểm danh đã được cập nhật thành công cho ${updatedRecords.length} sinh viên`
            // data: {
            //     attendance_id: attendance_id,
            //     date_attendance: date_attendance,
            //     start_lesson: start_lesson,
            //     end_lesson: end_lesson,
            //     total_students: updatedRecords.length,
            //     updated_records: updatedRecords.length
            // }
        };

    } catch (error) {
        await transaction.rollback();
        console.error('Error in updateAttendanceRecord:', error);

        return {
            success: false,
            message: `Lỗi khi cập nhật dữ liệu điểm danh: ${error.message}`
        };
    }
};

// Xóa attendance record và attendance_student
const deleteAttendanceRecord = async (attendance_id) => {
    const transaction = await sequelize.transaction();
    try {
        // Validate input
        if (!attendance_id) {
            throw new Error('attendance_id is required');
        }
        // Kiểm tra attendance record có tồn tại không
        const existingAttendance = await models.Attendance.findByPk(attendance_id);
        if (!existingAttendance) {
            throw new Error(`Attendance record not found with id: ${attendance_id}`);
        }
        // Xóa các record AttendanceStudent trước
        await models.AttendanceStudent.destroy({
            where: { attendance_id: attendance_id },
            transaction
        });
        // Xóa record Attendance
        await models.Attendance.destroy({
            where: { id: attendance_id },
            transaction
        });
        await transaction.commit();
        return {
            success: true,
            message: `Đã xóa thành công bản ghi điểm danh`
        };
    } catch (error) {
        await transaction.rollback();
        console.error('Error in deleteAttendanceRecord:', error);
        return {
            success: false,
            message: `Lỗi khi xóa bản ghi điểm danh: ${error.message}`
        };
    }
};

/**
 * Lấy thông tin điểm danh của sinh viên theo môn học và lớp học phần
 * @param {string} student_id - Mã sinh viên
 * @param {string} subject_id - Mã môn học
 * @param {string} course_section_id - Mã lớp học phần (optional)
 * @returns {Object} Thông tin điểm danh của sinh viên
 */
const getAttendanceByStudentBySubject = async (student_id, subject_id, course_section_id) => {
    try {
        // Validate input
        if (!student_id) {
            throw new Error('student_id is required');
        }
        if (!subject_id) {
            throw new Error('subject_id is required');
        }

        // Lấy thông tin môn học
        const subject = await models.Subject.findOne({
            where: { subject_id },
            attributes: ['name'],
            include: [
                {
                    model: models.Faculty,
                    as: 'faculty',
                    attributes: ['name']
                }
            ]
        });

        if (!subject) {
            throw new Error('Subject not found');
        }

        // Build query conditions for CourseSection
        const courseSectionWhere = { subject_id };
        if (course_section_id) {
            courseSectionWhere.id = course_section_id;
        }

        // Lấy các lớp học phần của môn học mà sinh viên đã học
        const courseSections = await models.StudentCourseSection.findAll({
            where: { student_id },
            include: [
                {
                    model: models.CourseSection,
                    as: 'course_section',
                    where: courseSectionWhere,
                    include: [
                        {
                            model: models.Session,
                            as: 'session',
                            attributes: ['name', 'years']
                        }
                    ]
                }
            ]
        });

        const allAttendanceDetails = [];

        // Lấy điểm danh cho từng lớp học phần
        for (const cs of courseSections) {
            const attendances = await models.Attendance.findAll({
                where: {
                    course_section_id: cs.course_section.id
                },
                attributes: ['id', 'date_attendance', 'start_lesson', 'end_lesson'],
                include: [
                    {
                        model: models.AttendanceStudent,
                        as: 'attendance_students',
                        where: {
                            student_id: student_id
                        },
                        attributes: ['status', 'description'],
                        required: false
                    }
                ],
                order: [['date_attendance', 'ASC'], ['start_lesson', 'ASC']]
            });

            // Lấy chi tiết điểm danh của sinh viên
            for (const attendance of attendances) {
                const studentAttendanceRecords = attendance.AttendanceStudents || attendance.attendance_students;
                const studentAttendance = (studentAttendanceRecords && studentAttendanceRecords.length > 0)
                    ? studentAttendanceRecords[0]
                    : null;

                // Skip records with DIFGR status
                if (studentAttendance?.status === 'DIFGR') {
                    continue;
                }

                allAttendanceDetails.push({
                    course_section_id: cs.course_section.id,
                    session: `${cs.course_section.session.name} ${cs.course_section.session.years}`,
                    date: datetimeFormatter.formatDateVN(attendance.date_attendance),
                    start_lesson: attendance.start_lesson,
                    end_lesson: attendance.end_lesson,
                    status: studentAttendance?.status || 'ABSENT',
                    description: studentAttendance?.description || ''
                });
            }
        }

        // Tính thống kê tổng hợp (DIFGR records already filtered out)
        const stats = allAttendanceDetails.reduce((acc, curr) => {
            acc.total++;
            if (curr.status === 'PRESENT') acc.present++;
            if (curr.status === 'ABSENT') acc.absent++;
            if (curr.status === 'LATE') acc.late++;
            return acc;
        }, { total: 0, present: 0, absent: 0, late: 0 });

        return {
            subject_info: {
                subject_name: subject.name,
                faculty_name: subject.faculty?.name || 'N/A',
                total_sections: courseSections.length
            },
            statistics: {
                total_sessions: stats.total,
                present: stats.present,
                absent: stats.absent,
                late: stats.late,
                attendance_rate: stats.total ?
                    ((stats.present + stats.late) / stats.total * 100).toFixed(1) + '%' : '0%'
            },
            attendance_details: allAttendanceDetails
        };

    } catch (error) {
        console.error('Error in getAttendanceByStudentBySubject:', error);
        throw error;
    }
};

/**
 * Lấy thông tin điểm danh của con em theo parent_id có phân trang
 * @param {string} parent_id - Mã phụ huynh
 * @param {string} studentId - Mã sinh viên của con em
 * @param {number} page - Số trang
 * @param {number} pageSize - Số lượng bản ghi trên một trang
 * @returns {Object} Thông tin điểm danh của các con em có phân trang
 */
const getAttendanceByStudentBySubjectByParent = async (parent_id, studentId, page, pageSize) => {
    try {
        if (!parent_id) {
            throw new Error('parent_id is required');
        }

        if (!studentId) {
            throw new Error('studentId is required');
        }

        const page_num = parseInt(page) || 1;
        const pageSize_num = parseInt(pageSize) || 10;
        const offset = (page_num - 1) * pageSize_num;

        // Lấy thông tin sinh viên cụ thể
        const student = await models.Student.findOne({
            where: {
                student_id: studentId,
                parent_id: parent_id,
                isDeleted: false
            }
        });

        if (!student) {
            return {
                success: false,
                message: 'Không tìm thấy thông tin sinh viên của phụ huynh này'
            };
        }

        // Lấy các lớp học phần của sinh viên
        const courseSections = await models.StudentCourseSection.findAll({
            where: { student_id: studentId },
            include: [
                {
                    model: models.CourseSection,
                    as: 'course_section',
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
                            model: models.Session,
                            as: 'session',
                            attributes: ['name', 'years']
                        }
                    ]
                }
            ],
            offset: offset,
            limit: pageSize_num
        });

        const totalCourses = await models.StudentCourseSection.count({
            where: { student_id: studentId }
        });

        const attendanceResults = [];
        const courseAttendances = [];

        for (const cs of courseSections) {
            const attendances = await models.Attendance.findAll({
                where: { course_section_id: cs.course_section.id },
                attributes: ['id', 'date_attendance', 'start_lesson', 'end_lesson'],
                order: [['date_attendance', 'ASC'], ['start_lesson', 'ASC']]
            });

            const attendanceDetails = [];
            let stats = { total: 0, present: 0, absent: 0, late: 0 };

            for (const attendance of attendances) {
                const studentAttendance = await models.AttendanceStudent.findOne({
                    where: {
                        attendance_id: attendance.id,
                        student_id: studentId
                    },
                    attributes: ['status', 'description']
                });

                // Skip records with DIFGR status
                if (studentAttendance?.status === 'DIFGR') {
                    continue;
                }

                stats.total++;
                if (studentAttendance?.status === 'PRESENT') stats.present++;
                if (studentAttendance?.status === 'ABSENT') stats.absent++;
                if (studentAttendance?.status === 'LATE') stats.late++;

                attendanceDetails.push({
                    date: datetimeFormatter.formatDateVN(attendance.date_attendance),
                    start_lesson: attendance.start_lesson,
                    end_lesson: attendance.end_lesson,
                    status: studentAttendance?.status || 'ABSENT',
                    description: studentAttendance?.description || ''
                });
            }

            courseAttendances.push({
                subject_info: {
                    course_section_id: cs.course_section.id,
                    subject_name: cs.course_section.subject?.name || 'N/A',
                    faculty_name: cs.course_section.subject?.faculty?.name || 'N/A',
                    session: `${cs.course_section.session.name} ${cs.course_section.session.years}`,
                },
                statistics: {
                    total_sessions: stats.total,
                    present: stats.present,
                    absent: stats.absent,
                    late: stats.late,
                    attendance_rate: stats.total ?
                        ((stats.present + stats.late) / stats.total * 100).toFixed(1) + '%' : '0%'
                },
                attendance_details: attendanceDetails
            });
        }

        attendanceResults.push({
            student_id: student.student_id,
            student_name: student.name,
            course_sections: courseAttendances
        });

        // Tính toán thông tin phân trang
        const totalPages = Math.ceil(totalCourses / pageSize_num);
        const hasNext = page_num < totalPages;
        const hasPrev = page_num > 1;

        return {
            pagination: {
                total: totalCourses,
                page: page_num,
                pageSize: pageSize_num,
                totalPages: totalPages,
                hasNext: hasNext,
                hasPrev: hasPrev
            },
            data: attendanceResults[0] // Return single student data
        };

    } catch (error) {
        console.error('Error in getAttendanceByStudentBySubjectByParent:', error);
        throw error;
    }
};



module.exports = {
    getStudentsByCourseSectionID,
    getAttendanceListByCourseID,
    getCourseSectionDetailByID,
    getAttendanceStudentListByAttendanceID,
    getAttendanceDetailsByCourseSectionID,
    createAttendanceRecord,
    updateAttendanceRecord,
    deleteAttendanceRecord,
    getAttendanceByStudentBySubject,
    getAttendanceByStudentBySubjectByParent
};