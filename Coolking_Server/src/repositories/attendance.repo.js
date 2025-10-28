const sequelize = require("../config/mariadb.conf");
const { Op } = require("sequelize");
const initModels = require("../databases/mariadb/model/init-models");
const models = initModels(sequelize);
const datetimeFormatter = require("../utils/format/datetime-formatter");

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
            attributes: []
        });

        return students.map(item => ({
            student_id: item.student.student_id,
            name: item.student.name,
            dob: item.student.dob,
            gender: item.student.gender ? 'Nam' : 'Nữ'
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
const getCourseSectionDetailByID = async (course_section_id) => {
    try {
        // Validate input
        if (!course_section_id) {
            throw new Error('course_section_id is required');
        }

        const courseSectionDetail = await models.CourseSection.findOne({
            where: {
                id: course_section_id
            },
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
            className: courseSectionDetail.clazz?.name || 'N/A',
            facultyName: courseSectionDetail.subject?.faculty?.name || 'N/A',
            sessionName: courseSectionDetail.session ? `${courseSectionDetail.session.name} ${courseSectionDetail.session.years}` : 'N/A',
            lecturerName: lecturerName
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
const getAttendanceDetailsByCourseSectionID = async (course_section_id) => {
    try {
        // Validate input parameters
        if (!course_section_id) {
            throw new Error('course_section_id is required');
        }

        // Lấy thông tin chi tiết lớp học phần
        const courseSectionDetail = await getCourseSectionDetailByID(course_section_id);

        // Lấy danh sách sinh viên trong lớp
        const allStudents = await getStudentsByCourseSectionID(course_section_id);

        // Lấy danh sách các buổi điểm danh
        const attendanceList = await getAttendanceListByCourseID(course_section_id);

        // Tạo danh sách attendances với thông tin điểm danh đầy đủ
        const attendances = [];

        for (const attendance of attendanceList) {
            // Lấy danh sách sinh viên điểm danh cho buổi này
            const attendanceStudents = await getAttendanceStudentListByAttendanceID(attendance.attendance_id);

            // Tạo map để lookup nhanh thông tin điểm danh của từng sinh viên
            const attendanceStudentMap = new Map();
            attendanceStudents.forEach(item => {
                attendanceStudentMap.set(item.student_id, {
                    status: item.status,
                    description: item.description
                });
            });

            // Tạo danh sách đầy đủ tất cả sinh viên với thông tin điểm danh
            const students = allStudents.map(student => {
                const attendanceData = attendanceStudentMap.get(student.student_id);

                return {
                    student_id: student.student_id,
                    name: student.name,
                    dob: datetimeFormatter.formatDateVN(student.dob),
                    gender: student.gender,
                    status: attendanceData ? attendanceData.status : "ABSENT",
                    description: attendanceData ? attendanceData.description : ""
                };
            });

            attendances.push({
                date_attendance: datetimeFormatter.formatDateVN(attendance.date_attendance),
                attendance_id: attendance.attendance_id,
                start_lesson: attendance.start_lesson,
                end_lesson: attendance.end_lesson,
                students: students
            });
        }

        return {
            subjectName: courseSectionDetail.subjectName,
            className: courseSectionDetail.className,
            course_section_id: courseSectionDetail.course_section_id,
            facultyName: courseSectionDetail.facultyName,
            sessionName: courseSectionDetail.sessionName,
            lecturerName: courseSectionDetail.lecturerName,
            attendances: attendances,
            students: attendances?.[0]?.students || allStudents
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
            const existingStudent = await models.Student.findOne({
                where: { student_id: student_id }
            });

            if (!existingStudent) {
                throw new Error(`Student not found with id: ${student_id}`);
            }

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

        // Tự động cập nhật date_attendance theo ngày hiện tại (yyyy-MM-dd)
        const currentDate = new Date();
        const date_attendance = currentDate.toISOString().split('T')[0]; // yyyy-MM-dd format

        // Cập nhật bản ghi Attendance
        await models.Attendance.update({
            date_attendance: date_attendance,
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
            const existingStudent = await models.Student.findOne({
                where: { student_id: student_id }
            });

            if (!existingStudent) {
                throw new Error(`Student not found with id: ${student_id}`);
            }
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
                order: [['date_attendance', 'ASC'], ['start_lesson', 'ASC']]
            });

            // Lấy chi tiết điểm danh của sinh viên
            for (const attendance of attendances) {
                const studentAttendance = await models.AttendanceStudent.findOne({
                    where: {
                        attendance_id: attendance.id,
                        student_id
                    },
                    attributes: ['status', 'description']
                });

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

        // Tính thống kê tổng hợp
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
 * @param {number} page - Số trang
 * @param {number} pageSize - Số lượng bản ghi trên một trang
 * @returns {Object} Thông tin điểm danh của các con em có phân trang
 */
const getAttendanceByStudentBySubjectByParent = async (parent_id, page, pageSize) => {
    try {
        if (!parent_id) {
            throw new Error('parent_id is required');
        }

        const page_num = parseInt(page) || 1;
        const pageSize_num = parseInt(pageSize) || 10;
        const offset = (page_num - 1) * pageSize_num;

        // Lấy tổng số con em của phụ huynh
        const totalChildren = await models.Parent.count({
            where: { parent_id }
        });

        // Lấy danh sách con em của phụ huynh có phân trang
        const children = await models.Parent.findAll({
            where: { parent_id },
            include: [
                {
                    model: models.Student,
                    as: 'student',
                    attributes: ['student_id', 'name'],
                    where: { isDeleted: false }
                }
            ],
            offset: offset,
            limit: pageSize_num
        });

        if (!children || children.length === 0) {
            return {
                success: false,
                message: 'Không tìm thấy thông tin con em của phụ huynh này'
            };
        }

        const attendanceResults = [];

        // Lấy thông tin điểm danh cho từng con
        for (const child of children) {
            // Lấy các lớp học phần của học sinh
            const courseSections = await models.StudentCourseSection.findAll({
                where: { student_id: child.student.student_id },
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
                ]
            });

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
                            student_id: child.student.student_id
                        },
                        attributes: ['status', 'description']
                    });

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
                    subject_info:{
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
                student_id: child.student.student_id,
                student_name: child.student.name,
                course_sections: courseAttendances
            });
        }

        // Tính toán thông tin phân trang
        const totalPages = Math.ceil(totalChildren / pageSize_num);
        const hasNext = page_num < totalPages;
        const hasPrev = page_num > 1;

        return {
                pagination: {
                    total: totalChildren,
                    page: page_num,
                    pageSize: pageSize_num,
                    totalPages: totalPages,
                    hasNext: hasNext,
                    hasPrev: hasPrev
                },
                children: attendanceResults
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