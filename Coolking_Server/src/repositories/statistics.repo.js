const sequelize = require("../config/mariadb.conf");
const initModels = require("../databases/mariadb/model/init-models");
const models = initModels(sequelize);

/**
 * Thống kê khoa theo học kỳ
 * @param {string} faculty_id 
 * @param {string} session_id 
 * @returns {Object}
 */
const getFacultyStatisticsBySession = async (faculty_id, session_id) => {
    try {
        // Validate input
        if (!faculty_id || !session_id) {
            throw new Error('faculty_id and session_id are required');
        }

        // Lấy thông tin khoa
        const faculty = await models.Faculty.findOne({
            attributes: ['faculty_id', 'name'],
            where: { faculty_id }
        });

        if (!faculty) {
            throw new Error('Faculty not found');
        }

        // Lấy thông tin session
        const session = await models.Session.findByPk(session_id, {
            attributes: ['name', 'years']
        });

        // Sử dụng raw query để tối ưu hiệu suất
        const facultyStats = await sequelize.query(`
            SELECT 
                COUNT(DISTINCT s.subject_id) as total_subjects,
                COUNT(DISTINCT cs.id) as total_course_sections,
                COUNT(DISTINCT lcs.lecturer_id) as total_lecturers,
                COUNT(DISTINCT scs.student_id) as total_students,
                AVG(sc.avr) as average_score,
                COUNT(CASE WHEN sc.avr >= 4.0 THEN 1 END) as students_passed,
                COUNT(CASE WHEN sc.avr IS NOT NULL THEN 1 END) as students_with_scores
            FROM subjects s
            LEFT JOIN course_sections cs ON s.subject_id = cs.subject_id AND cs.session_id = :session_id
            LEFT JOIN lecturers_coursesections lcs ON cs.id = lcs.course_section_id
            LEFT JOIN students_coursesections scs ON cs.id = scs.course_section_id
            LEFT JOIN scores sc ON cs.id = sc.course_section_id AND scs.student_id = sc.student_id
            WHERE s.faculty_id = :faculty_id
        `, {
            replacements: { faculty_id, session_id },
            type: sequelize.QueryTypes.SELECT
        });

        const stats = facultyStats[0] || {};

        // Tính thống kê điểm danh cho khoa
        const attendanceStats = await sequelize.query(`
            SELECT 
                COUNT(*) as total_attendance_records,
                COUNT(CASE WHEN \`as\`.status = 'present' THEN 1 END) as present_count,
                COUNT(CASE WHEN \`as\`.status = 'late' THEN 1 END) as late_count
            FROM attendances_students \`as\`
            INNER JOIN attendances a ON \`as\`.attendance_id = a.id
            INNER JOIN course_sections cs ON a.course_section_id = cs.id
            INNER JOIN subjects s ON cs.subject_id = s.subject_id
            WHERE s.faculty_id = :faculty_id 
            AND cs.session_id = :session_id
        `, {
            replacements: { faculty_id, session_id },
            type: sequelize.QueryTypes.SELECT
        });

        const attendanceData = attendanceStats[0] || {};
        const attendanceRate = attendanceData.total_attendance_records > 0
            ? ((attendanceData.present_count + attendanceData.late_count) / attendanceData.total_attendance_records * 100)
            : 0;

        // Tính phân bố điểm
        const gradeDistribution = await sequelize.query(`
            SELECT 
                COUNT(CASE WHEN sc.avr >= 8.5 THEN 1 END) as excellent,
                COUNT(CASE WHEN sc.avr >= 7.0 AND sc.avr < 8.5 THEN 1 END) as good,
                COUNT(CASE WHEN sc.avr >= 5.5 AND sc.avr < 7.0 THEN 1 END) as fair,
                COUNT(CASE WHEN sc.avr >= 4.0 AND sc.avr < 5.5 THEN 1 END) as poor,
                COUNT(CASE WHEN sc.avr < 4.0 THEN 1 END) as fail
            FROM scores sc
            INNER JOIN course_sections cs ON sc.course_section_id = cs.id
            INNER JOIN subjects s ON cs.subject_id = s.subject_id
            WHERE s.faculty_id = :faculty_id 
            AND cs.session_id = :session_id
        `, {
            replacements: { faculty_id, session_id },
            type: sequelize.QueryTypes.SELECT
        });

        const gradeData = gradeDistribution[0] || {};

        // Tính pass rate
        const passRate = stats.students_with_scores > 0
            ? (stats.students_passed / stats.students_with_scores * 100)
            : 0;

        return {
            faculty_id,
            faculty_name: faculty.name,
            session_name: session ? `${session.name} ${session.years}` : 'N/A',
            total_subjects: parseInt(stats.total_subjects) || 0,
            total_course_sections: parseInt(stats.total_course_sections) || 0,
            total_lecturers: parseInt(stats.total_lecturers) || 0,
            total_students: parseInt(stats.total_students) || 0,
            students_with_scores: parseInt(stats.students_with_scores) || 0,
            students_passed: parseInt(stats.students_passed) || 0,
            pass_rate: Math.round(passRate * 100) / 100,
            average_score: stats.average_score ? Math.round(parseFloat(stats.average_score) * 100) / 100 : 0,
            attendance_rate: Math.round(attendanceRate * 100) / 100,
            grade_distribution: {
                excellent: parseInt(gradeData.excellent) || 0,
                good: parseInt(gradeData.good) || 0,
                fair: parseInt(gradeData.fair) || 0,
                poor: parseInt(gradeData.poor) || 0,
                fail: parseInt(gradeData.fail) || 0
            }
        };

    } catch (error) {
        console.error('Error in getFacultyStatisticsBySession:', error);
        throw error;
    }
};

/**
 * Thống kê giảng viên theo học kỳ
 * @param {string} lecturer_id 
 * @param {string} session_id 
 * @returns {Object}
 */
const getLecturerStatisticsBySession = async (lecturer_id, session_id) => {
    try {
        // Validate input
        if (!lecturer_id || !session_id) {
            throw new Error('lecturer_id and session_id are required');
        }

        // Lấy thông tin giảng viên
        const lecturer = await models.Lecturer.findOne({
            attributes: ['lecturer_id', 'name'],
            where: { lecturer_id },
            include: [{
                model: models.Faculty,
                as: 'faculty',
                attributes: ['name']
            }]
        });

        if (!lecturer) {
            throw new Error('Lecturer not found');
        }

        // Lấy thông tin session
        const session = await models.Session.findByPk(session_id, {
            attributes: ['name', 'years']
        });

        // Thống kê cơ bản của giảng viên
        const lecturerStats = await sequelize.query(`
            SELECT 
                COUNT(DISTINCT cs.id) as total_course_sections,
                COUNT(DISTINCT s.id) as total_subjects,
                COUNT(DISTINCT scs.student_id) as total_students,
                AVG(sc.avr) as average_score,
                COUNT(CASE WHEN sc.avr >= 4.0 THEN 1 END) as students_passed,
                COUNT(CASE WHEN sc.avr IS NOT NULL THEN 1 END) as students_with_scores
            FROM lecturers_coursesections lcs
            INNER JOIN course_sections cs ON lcs.course_section_id = cs.id
            INNER JOIN subjects s ON cs.subject_id = s.subject_id
            LEFT JOIN students_coursesections scs ON cs.id = scs.course_section_id
            LEFT JOIN scores sc ON cs.id = sc.course_section_id AND scs.student_id = sc.student_id
            WHERE lcs.lecturer_id = :lecturer_id 
            AND cs.session_id = :session_id
        `, {
            replacements: { lecturer_id, session_id },
            type: sequelize.QueryTypes.SELECT
        });

        const stats = lecturerStats[0] || {};

        // Thống kê điểm danh
        const attendanceStats = await sequelize.query(`
            SELECT 
                COUNT(*) as total_attendance_records,
                COUNT(CASE WHEN \`as\`.status = 'present' THEN 1 END) as present_count,
                COUNT(CASE WHEN \`as\`.status = 'late' THEN 1 END) as late_count
            FROM attendances_students \`as\`
            INNER JOIN attendances a ON \`as\`.attendance_id = a.id
            INNER JOIN course_sections cs ON a.course_section_id = cs.id
            INNER JOIN lecturers_coursesections lcs ON cs.id = lcs.course_section_id
            WHERE lcs.lecturer_id = :lecturer_id 
            AND cs.session_id = :session_id
        `, {
            replacements: { lecturer_id, session_id },
            type: sequelize.QueryTypes.SELECT
        });

        const attendanceData = attendanceStats[0] || {};
        const attendanceRate = attendanceData.total_attendance_records > 0
            ? ((attendanceData.present_count + attendanceData.late_count) / attendanceData.total_attendance_records * 100)
            : 0;

        // Thống kê phân bố điểm
        const gradeDistribution = await sequelize.query(`
            SELECT 
                COUNT(CASE WHEN sc.avr >= 8.5 THEN 1 END) as excellent,
                COUNT(CASE WHEN sc.avr >= 7.0 AND sc.avr < 8.5 THEN 1 END) as good,
                COUNT(CASE WHEN sc.avr >= 5.5 AND sc.avr < 7.0 THEN 1 END) as fair,
                COUNT(CASE WHEN sc.avr >= 4.0 AND sc.avr < 5.5 THEN 1 END) as poor,
                COUNT(CASE WHEN sc.avr < 4.0 THEN 1 END) as fail
            FROM scores sc
            INNER JOIN course_sections cs ON sc.course_section_id = cs.id
            INNER JOIN lecturers_coursesections lcs ON cs.id = lcs.course_section_id
            WHERE lcs.lecturer_id = :lecturer_id 
            AND cs.session_id = :session_id
        `, {
            replacements: { lecturer_id, session_id },
            type: sequelize.QueryTypes.SELECT
        });

        const gradeData = gradeDistribution[0] || {};

        // Lấy danh sách môn học đang dạy
        const subjects = await sequelize.query(`
            SELECT DISTINCT s.name as subject_name
            FROM lecturers_coursesections lcs
            INNER JOIN course_sections cs ON lcs.course_section_id = cs.id
            INNER JOIN subjects s ON cs.subject_id = s.subject_id
            WHERE lcs.lecturer_id = :lecturer_id 
            AND cs.session_id = :session_id
            ORDER BY s.name
        `, {
            replacements: { lecturer_id, session_id },
            type: sequelize.QueryTypes.SELECT
        });

        // Tính pass rate
        const passRate = stats.students_with_scores > 0
            ? (stats.students_passed / stats.students_with_scores * 100)
            : 0;

        return {
            lecturer_id,
            lecturer_name: lecturer.name,
            faculty_name: lecturer.faculty?.name || 'N/A',
            session_name: session ? `${session.name} ${session.years}` : 'N/A',
            total_course_sections: parseInt(stats.total_course_sections) || 0,
            total_subjects: parseInt(stats.total_subjects) || 0,
            total_students: parseInt(stats.total_students) || 0,
            students_with_scores: parseInt(stats.students_with_scores) || 0,
            students_passed: parseInt(stats.students_passed) || 0,
            pass_rate: Math.round(passRate * 100) / 100,
            average_score: stats.average_score ? Math.round(parseFloat(stats.average_score) * 100) / 100 : 0,
            attendance_rate: Math.round(attendanceRate * 100) / 100,
            subjects_teaching: subjects.map(s => s.subject_name),
            grade_distribution: {
                excellent: parseInt(gradeData.excellent) || 0,
                good: parseInt(gradeData.good) || 0,
                fair: parseInt(gradeData.fair) || 0,
                poor: parseInt(gradeData.poor) || 0,
                fail: parseInt(gradeData.fail) || 0
            }
        };

    } catch (error) {
        console.error('Error in getLecturerStatisticsBySession:', error);
        throw error;
    }
};

/**
 * Thống kê tất cả giảng viên theo khoa và học kỳ (PHIÊN BẢN TỐI ƯU)
 * @param {string} faculty_id 
 * @param {string} session_id 
 * @returns {Object}
 */
const getLecturersStatisticsByFaculty = async (faculty_id, session_id) => {
    try {
        // --- BƯỚC 1: LẤY DỮ LIỆU CƠ BẢN (Validate & Lấy thông tin) ---
        if (!faculty_id || !session_id) {
            throw new Error('faculty_id and session_id are required');
        }

        const [faculty, session] = await Promise.all([
            models.Faculty.findOne({
                attributes: ['faculty_id', 'name'],
                where: { faculty_id }
            }),
            models.Session.findByPk(session_id, {
                attributes: ['name', 'years']
            })
        ]);

        if (!faculty) {
            throw new Error('Faculty not found');
        }
        const sessionName = session ? `${session.name} ${session.years}` : 'N/A';


        // --- BƯỚC 2: CHẠY SONG SONG TẤT CẢ CÁC QUERY LỚN ---

        const [
            allLecturerStats,
            allAttendanceStats,
            facultyAttendanceStats
        ] = await Promise.all([

            // Query 1: Lấy thống kê Điểm/Sinh viên cho TẤT CẢ giảng viên
            sequelize.query(`
                SELECT 
                    l.lecturer_id,
                    l.name,
                    COUNT(DISTINCT cs.id) as total_course_sections,
                    COUNT(DISTINCT s.subject_id) as total_subjects,
                    COUNT(DISTINCT scs.student_id) as total_students,
                    AVG(sc.avr) as average_score,
                    COUNT(CASE WHEN sc.avr >= 4.0 THEN 1 END) as students_passed,
                    COUNT(CASE WHEN sc.avr IS NOT NULL THEN 1 END) as students_with_scores
                FROM lecturers l
                LEFT JOIN lecturers_coursesections lcs ON l.lecturer_id = lcs.lecturer_id
                LEFT JOIN course_sections cs ON lcs.course_section_id = cs.id AND cs.session_id = :session_id
                LEFT JOIN subjects s ON cs.subject_id = s.subject_id
                LEFT JOIN students_coursesections scs ON cs.id = scs.course_section_id
                LEFT JOIN scores sc ON cs.id = sc.course_section_id AND scs.student_id = sc.student_id
                WHERE l.faculty_id = :faculty_id
                GROUP BY l.lecturer_id, l.name
                ORDER BY l.name
            `, {
                replacements: { faculty_id, session_id },
                type: sequelize.QueryTypes.SELECT
            }),

            // Query 2: Lấy thống kê Điểm danh cho TẤT CẢ giảng viên
            sequelize.query(`
                SELECT 
                    l.lecturer_id,
                    COUNT(*) as total_attendance_records,
                    COUNT(CASE WHEN \`as\`.status = 'present' THEN 1 END) as present_count,
                    COUNT(CASE WHEN \`as\`.status = 'late' THEN 1 END) as late_count
                FROM lecturers l
                LEFT JOIN lecturers_coursesections lcs ON l.lecturer_id = lcs.lecturer_id
                LEFT JOIN course_sections cs ON lcs.course_section_id = cs.id AND cs.session_id = :session_id
                LEFT JOIN attendances a ON cs.id = a.course_section_id
                LEFT JOIN attendances_students \`as\` ON a.id = \`as\`.attendance_id
                WHERE l.faculty_id = :faculty_id
                GROUP BY l.lecturer_id
            `, {
                replacements: { faculty_id, session_id },
                type: sequelize.QueryTypes.SELECT
            }),

            // Query 3: Lấy thống kê điểm danh TOÀN KHOA
            sequelize.query(`
                SELECT 
                    COUNT(*) as total_attendance_records,
                    COUNT(CASE WHEN \`as\`.status = 'present' THEN 1 END) as present_count,
                    COUNT(CASE WHEN \`as\`.status = 'late' THEN 1 END) as late_count
                FROM attendances_students \`as\`
                INNER JOIN attendances a ON \`as\`.attendance_id = a.id
                INNER JOIN course_sections cs ON a.course_section_id = cs.id
                INNER JOIN subjects s ON cs.subject_id = s.subject_id
                WHERE s.faculty_id = :faculty_id 
                AND cs.session_id = :session_id
            `, {
                replacements: { faculty_id, session_id },
                type: sequelize.QueryTypes.SELECT
            })
        ]);

        // --- BƯỚC 3: CHUYỂN KẾT QUẢ ĐIỂM DANH SANG MAP ĐỂ TRA CỨU ---
        const attendanceMap = new Map(allAttendanceStats.map(item => [item.lecturer_id, item]));

        // --- BƯỚC 4: LẶP QUA KẾT QUẢ ---
        const lecturerStatistics = allLecturerStats.map(lecturerStats => {
            // Lấy dữ liệu điểm danh tương ứng từ Map
            const attendanceData = attendanceMap.get(lecturerStats.lecturer_id) || {};

            // Tính toán tỷ lệ
            const attendanceRate = (attendanceData.total_attendance_records || 0) > 0
                ? (((attendanceData.present_count || 0) + (attendanceData.late_count || 0)) / attendanceData.total_attendance_records * 100)
                : 0;

            const studentsWithScores = parseInt(lecturerStats.students_with_scores) || 0;
            const studentsPassed = parseInt(lecturerStats.students_passed) || 0;
            const passRate = studentsWithScores > 0
                ? (studentsPassed / studentsWithScores * 100)
                : 0;

            return {
                lecturer_id: lecturerStats.lecturer_id,
                lecturer_name: lecturerStats.name,
                total_course_sections: parseInt(lecturerStats.total_course_sections) || 0,
                total_subjects: parseInt(lecturerStats.total_subjects) || 0,
                total_students: parseInt(lecturerStats.total_students) || 0,
                students_with_scores: studentsWithScores,
                students_passed: studentsPassed,
                pass_rate: Math.round(passRate * 100) / 100,
                average_score: lecturerStats.average_score ? Math.round(parseFloat(lecturerStats.average_score) * 100) / 100 : 0,
                attendance_rate: Math.round(attendanceRate * 100) / 100
            };
        });

        // --- BƯỚC 5: TÍNH TOÁN TỔNG HỢP---
        // Phần này code của bạn đã tối ưu, ta giữ nguyên
        const totalStats = lecturerStatistics.reduce((acc, lecturer) => ({
            total_course_sections: acc.total_course_sections + lecturer.total_course_sections,
            total_subjects: acc.total_subjects + lecturer.total_subjects,
            total_students: acc.total_students + lecturer.total_students,
            total_score_sum: acc.total_score_sum + (lecturer.average_score * lecturer.students_with_scores),
            total_students_with_scores: acc.total_students_with_scores + lecturer.students_with_scores,
            total_passed: acc.total_passed + lecturer.students_passed
        }), {
            total_course_sections: 0,
            total_subjects: 0,
            total_students: 0,
            total_score_sum: 0,
            total_students_with_scores: 0,
            total_passed: 0
        });

        const facultyAverageScore = totalStats.total_students_with_scores > 0
            ? Math.round((totalStats.total_score_sum / totalStats.total_students_with_scores) * 100) / 100
            : 0;

        const facultyPassRate = totalStats.total_students_with_scores > 0
            ? Math.round((totalStats.total_passed / totalStats.total_students_with_scores) * 100 * 100) / 100
            : 0;

        const facultyAttendanceData = facultyAttendanceStats[0] || {};
        const facultyAttendanceRate = (facultyAttendanceData.total_attendance_records || 0) > 0
            ? Math.round(((facultyAttendanceData.present_count + facultyAttendanceData.late_count) / facultyAttendanceData.total_attendance_records * 100) * 100) / 100
            : 0;

        // --- BƯỚC 6: TRẢ VỀ KẾT QUẢ ---
        return {
            faculty_id,
            faculty_name: faculty.name,
            session_name: sessionName,
            total_lecturers: lecturerStatistics.length,
            faculty_summary: {
                total_course_sections: totalStats.total_course_sections,
                total_subjects: totalStats.total_subjects,
                total_students: totalStats.total_students,
                average_score: facultyAverageScore,
                pass_rate: facultyPassRate,
                attendance_rate: facultyAttendanceRate
            },
            lecturers: lecturerStatistics
        };

    } catch (error) {
        console.error('Error in getLecturersStatisticsByFaculty (Optimized):', error);
        throw error;
    }
};

/**
 * Thống kê chi tiết lớp học phần với thông tin môn học, lớp, giảng viên
 * @param {string} course_section_id 
 * @param {string} session_id 
 * @returns {Object}
 */
const getCourseSectionStatisticsBySession = async (course_section_id, session_id) => {
    try {
        // Validate input
        if (!course_section_id) {
            throw new Error('course_section_id is required');
        }

        // Lấy thông tin chi tiết lớp học phần
        const courseSection = await models.CourseSection.findOne({
            where: {
                id: course_section_id,
                ...(session_id && { session_id })
            },
            include: [
                {
                    model: models.Subject,
                    as: 'subject',
                    attributes: ['subject_id', 'name', 'theo_credit', 'pra_credit'],
                    include: [{
                        model: models.Faculty,
                        as: 'faculty',
                        attributes: ['faculty_id', 'name']
                    }]
                },
                {
                    model: models.Clazz,
                    as: 'clazz',
                    attributes: ['id', 'name']
                },
                {
                    model: models.Session,
                    as: 'session',
                    attributes: ['id', 'name', 'years']
                },
                {
                    model: models.LecturerCourseSection,
                    as: 'lecturers_course_sections',
                    include: [{
                        model: models.Lecturer,
                        as: 'lecturer',
                        attributes: ['id', 'name']
                    }]
                }
            ]
        });

        if (!courseSection) {
            throw new Error('Course section not found');
        }

        // Đếm tổng số sinh viên đăng ký
        const totalStudents = await models.StudentCourseSection.count({
            where: { course_section_id }
        });

        // Thống kê điểm số
        const scoreStats = await sequelize.query(`
            SELECT 
                COUNT(*) as students_with_scores,
                COUNT(CASE WHEN avr >= 4.0 THEN 1 END) as students_passed,
                AVG(avr) as average_score,
                MIN(avr) as min_score,
                MAX(avr) as max_score,
                COUNT(CASE WHEN avr >= 8.5 THEN 1 END) as excellent,
                COUNT(CASE WHEN avr >= 7.0 AND avr < 8.5 THEN 1 END) as good,
                COUNT(CASE WHEN avr >= 5.5 AND avr < 7.0 THEN 1 END) as fair,
                COUNT(CASE WHEN avr >= 4.0 AND avr < 5.5 THEN 1 END) as poor,
                COUNT(CASE WHEN avr < 4.0 THEN 1 END) as fail
            FROM scores 
            WHERE course_section_id = :course_section_id
        `, {
            replacements: { course_section_id },
            type: sequelize.QueryTypes.SELECT
        });

        const scoreData = scoreStats[0] || {};

        // Thống kê điểm danh
        const attendanceStats = await sequelize.query(`
            SELECT 
                COUNT(DISTINCT a.id) as total_class_sessions,
                COUNT(*) as total_attendance_records,
                COUNT(CASE WHEN \`as\`.status = 'present' THEN 1 END) as present_count,
                COUNT(CASE WHEN \`as\`.status = 'absent' THEN 1 END) as absent_count,
                COUNT(CASE WHEN \`as\`.status = 'late' THEN 1 END) as late_count
            FROM attendances_students \`as\`
            INNER JOIN attendances a ON \`as\`.attendance_id = a.id
            INNER JOIN students_coursesections scs ON \`as\`.student_id = scs.student_id 
            WHERE a.course_section_id = :course_section_id 
            AND scs.course_section_id = :course_section_id
        `, {
            replacements: { course_section_id },
            type: sequelize.QueryTypes.SELECT
        });

        const attendanceData = attendanceStats[0] || {};

        // Tính các tỷ lệ
        const passRate = scoreData.students_with_scores > 0
            ? (scoreData.students_passed / scoreData.students_with_scores * 100)
            : 0;

        const attendanceRate = attendanceData.total_attendance_records > 0
            ? ((attendanceData.present_count + attendanceData.late_count) / attendanceData.total_attendance_records * 100)
            : 0;

        const absentRate = attendanceData.total_attendance_records > 0
            ? (attendanceData.absent_count / attendanceData.total_attendance_records * 100)
            : 0;

        const lateRate = attendanceData.total_attendance_records > 0
            ? (attendanceData.late_count / attendanceData.total_attendance_records * 100)
            : 0;

        return {
            course_section_id,
            course_section_info: {
                subjectId: courseSection.subject?.subject_id || null,
                subjectName: courseSection.subject?.name || 'N/A',
                subjectCredit: (courseSection.subject?.theo_credit || 0) + (courseSection.subject?.pra_credit || 0),
                className: courseSection.clazz?.name || 'N/A',
                sessionName: courseSection.session ? `${courseSection.session.name} ${courseSection.session.years}` : 'N/A',
                facultyName: courseSection.subject?.faculty?.name || 'N/A',
                lecturerName: courseSection.lecturers_course_sections?.[0]?.lecturer?.name || 'N/A',
                lecturerId: courseSection.lecturers_course_sections?.[0]?.lecturer?.lecturer_id || null
            },
            student_statistics: {
                total_students: totalStudents,
                students_with_scores: parseInt(scoreData.students_with_scores) || 0,
                students_passed: parseInt(scoreData.students_passed) || 0,
                pass_rate: Math.round(passRate * 100) / 100
            },
            score_statistics: {
                average_score: scoreData.average_score ? Math.round(parseFloat(scoreData.average_score) * 100) / 100 : 0,
                min_score: scoreData.min_score ? Math.round(parseFloat(scoreData.min_score) * 100) / 100 : 0,
                max_score: scoreData.max_score ? Math.round(parseFloat(scoreData.max_score) * 100) / 100 : 0,
                grade_distribution: {
                    excellent: parseInt(scoreData.excellent) || 0,
                    good: parseInt(scoreData.good) || 0,
                    fair: parseInt(scoreData.fair) || 0,
                    poor: parseInt(scoreData.poor) || 0,
                    fail: parseInt(scoreData.fail) || 0
                }
            },
            attendance_statistics: {
                total_class_sessions: parseInt(attendanceData.total_class_sessions) || 0,
                attendance_rate: Math.round(attendanceRate * 100) / 100,
                absent_rate: Math.round(absentRate * 100) / 100,
                late_rate: Math.round(lateRate * 100) / 100,
                present_count: parseInt(attendanceData.present_count) || 0,
                absent_count: parseInt(attendanceData.absent_count) || 0,
                late_count: parseInt(attendanceData.late_count) || 0
            }
        };

    } catch (error) {
        console.error('Error in getCourseSectionStatisticsBySession:', error);
        throw error;
    }
};

/**
 * Thống kê tất cả lớp học phần theo khoa và học kỳ
 * @param {string} faculty_id 
 * @param {string} session_id 
 * @returns {Object}
 */
/**
 * Thống kê tất cả lớp học phần theo khoa và học kỳ (PHIÊN BẢN TỐI ƯU)
 * Giải quyết vấn đề N+1 Query
 *
 * @param {string} faculty_id 
 * @param {string} session_id 
 * @returns {Object}
 */
const getCourseSectionsStatisticsByFaculty = async (faculty_id, session_id) => {
    try {
        // --- BƯỚC 1: LẤY DỮ LIỆU CƠ BẢN (Faculty & Session) ---
        if (!faculty_id || !session_id) {
            throw new Error('faculty_id and session_id are required');
        }

        const faculty = await models.Faculty.findOne({
            attributes: ['faculty_id', 'name'],
            where: { faculty_id }
        });

        if (!faculty) {
            throw new Error('Faculty not found');
        }

        const session = await models.Session.findByPk(session_id, {
            attributes: ['name', 'years']
        });
        const sessionName = session ? `${session.name} ${session.years}` : 'N/A';


        // --- BƯỚC 2: CHẠY SONG SONG TẤT CẢ CÁC QUERY LỚN ---

        const [
            baseCourseSections,
            allStudentCounts,
            allScoreStats,
            allAttendanceStats,
            facultyAttendanceData
        ] = await Promise.all([
            // Query 1: Lấy danh sách LỚP HỌC PHẦN cơ bản
            sequelize.query(`
                SELECT DISTINCT
                    cs.id,
                    s.name as subject_name,
                    (s.theo_credit + s.pra_credit) as subject_credit,
                    c.name as class_name,
                    l.name as lecturer_name,
                    l.lecturer_id as lecturer_id
                FROM course_sections cs
                INNER JOIN subjects s ON cs.subject_id = s.subject_id
                INNER JOIN clazz c ON cs.clazz_id = c.id
                LEFT JOIN lecturers_coursesections lcs ON cs.id = lcs.course_section_id
                LEFT JOIN lecturers l ON lcs.lecturer_id = l.lecturer_id
                WHERE s.faculty_id = :faculty_id
                AND cs.session_id = :session_id
                ORDER BY s.name, c.name
            `, {
                replacements: { faculty_id, session_id },
                type: sequelize.QueryTypes.SELECT
            }),

            // Query 2: Lấy TẤT CẢ số sinh viên, gộp theo lớp
            sequelize.query(`
                SELECT 
                    scs.course_section_id, 
                    COUNT(*) as total_students
                FROM students_coursesections scs
                INNER JOIN course_sections cs ON scs.course_section_id = cs.id
                INNER JOIN subjects s ON cs.subject_id = s.subject_id
                WHERE s.faculty_id = :faculty_id AND cs.session_id = :session_id
                GROUP BY scs.course_section_id
            `, {
                replacements: { faculty_id, session_id },
                type: sequelize.QueryTypes.SELECT
            }),

            // Query 3: Lấy TẤT CẢ thống kê điểm, gộp theo lớp
            sequelize.query(`
                SELECT
                    sc.course_section_id,
                    COUNT(*) as students_with_scores,
                    COUNT(CASE WHEN sc.avr >= 4.0 THEN 1 END) as students_passed,
                    AVG(sc.avr) as average_score,
                    MIN(sc.avr) as min_score,
                    MAX(sc.avr) as max_score,
                    COUNT(CASE WHEN sc.avr >= 8.5 THEN 1 END) as excellent,
                    COUNT(CASE WHEN sc.avr >= 7.0 AND sc.avr < 8.5 THEN 1 END) as good,
                    COUNT(CASE WHEN sc.avr >= 5.5 AND sc.avr < 7.0 THEN 1 END) as fair,
                    COUNT(CASE WHEN sc.avr >= 4.0 AND sc.avr < 5.5 THEN 1 END) as poor,
                    COUNT(CASE WHEN sc.avr < 4.0 THEN 1 END) as fail
                FROM scores sc
                INNER JOIN course_sections cs ON sc.course_section_id = cs.id
                INNER JOIN subjects s ON cs.subject_id = s.subject_id
                WHERE s.faculty_id = :faculty_id AND cs.session_id = :session_id
                GROUP BY sc.course_section_id
            `, {
                replacements: { faculty_id, session_id },
                type: sequelize.QueryTypes.SELECT
            }),

            // Query 4: Lấy TẤT CẢ thống kê điểm danh, gộp theo lớp
            sequelize.query(`
                SELECT
                    a.course_section_id,
                    COUNT(DISTINCT a.id) as total_class_sessions,
                    COUNT(*) as total_attendance_records,
                    COUNT(CASE WHEN \`as\`.status = 'present' THEN 1 END) as present_count,
                    COUNT(CASE WHEN \`as\`.status = 'late' THEN 1 END) as late_count,
                    COUNT(CASE WHEN \`as\`.status = 'absent' THEN 1 END) as absent_count
                FROM attendances_students \`as\`
                INNER JOIN attendances a ON \`as\`.attendance_id = a.id
                INNER JOIN students_coursesections scs ON \`as\`.student_id = scs.student_id AND a.course_section_id = scs.course_section_id
                INNER JOIN course_sections cs ON a.course_section_id = cs.id
                INNER JOIN subjects s ON cs.subject_id = s.subject_id
                WHERE s.faculty_id = :faculty_id AND cs.session_id = :session_id
                GROUP BY a.course_section_id
            `, {
                replacements: { faculty_id, session_id },
                type: sequelize.QueryTypes.SELECT
            }),

            // Query 5: Lấy thống kê điểm danh TOÀN KHOA
            sequelize.query(`
                SELECT
                    COUNT(*) as total_attendance_records,
                    COUNT(CASE WHEN \`as\`.status = 'present' THEN 1 END) as present_count,
                    COUNT(CASE WHEN \`as\`.status = 'late' THEN 1 END) as late_count
                FROM attendances_students \`as\`
                INNER JOIN attendances a ON \`as\`.attendance_id = a.id
                INNER JOIN course_sections cs ON a.course_section_id = cs.id
                INNER JOIN subjects s ON cs.subject_id = s.subject_id
                WHERE s.faculty_id = :faculty_id
                AND cs.session_id = :session_id
            `, {
                replacements: { faculty_id, session_id },
                type: sequelize.QueryTypes.SELECT
            })
        ]);

        // --- BƯỚC 3: CHUYỂN CÁC MẢNG KẾT QUẢ THÀNH MAP ĐỂ TRA CỨU NHANH ---
        const studentCountMap = new Map(allStudentCounts.map(item => [item.course_section_id, item]));
        const scoreStatsMap = new Map(allScoreStats.map(item => [item.course_section_id, item]));
        const attendanceStatsMap = new Map(allAttendanceStats.map(item => [item.course_section_id, item]));

        // --- BƯỚC 4: LẶP QUA DANH SÁCH LỚP HỌC ---
        const courseSectionStatistics = baseCourseSections.map(cs => {
            const studentData = studentCountMap.get(cs.id) || {};
            const scoreData = scoreStatsMap.get(cs.id) || {};
            const attendanceData = attendanceStatsMap.get(cs.id) || {};

            const totalStudents = parseInt(studentData.total_students) || 0;
            const studentsWithScores = parseInt(scoreData.students_with_scores) || 0;
            const studentsPassed = parseInt(scoreData.students_passed) || 0;
            const totalRecords = parseInt(attendanceData.total_attendance_records) || 0;
            const presentCount = parseInt(attendanceData.present_count) || 0;
            const lateCount = parseInt(attendanceData.late_count) || 0;
            const absentCount = parseInt(attendanceData.absent_count) || 0;

            const passRate = studentsWithScores > 0
                ? (studentsPassed / studentsWithScores * 100)
                : 0;

            const attendanceRate = totalRecords > 0
                ? ((presentCount + lateCount) / totalRecords * 100)
                : 0;

            const absentRate = totalRecords > 0
                ? (absentCount / totalRecords * 100)
                : 0;

            const lateRate = totalRecords > 0
                ? (lateCount / totalRecords * 100)
                : 0;

            // Trả về object hoàn chỉnh cho lớp học phần này
            return {
                course_section_id: cs.id,
                course_section_info: {
                    subjectId: cs.subject_id || null,
                    subjectName: cs.subject_name || 'N/A',
                    subjectCredit: cs.subject_credit || 0,
                    className: cs.class_name || 'N/A',
                    sessionName: sessionName,
                    facultyName: faculty.name,
                    lecturerName: cs.lecturer_name || 'N/A',
                    lecturerId: cs.lecturer_id
                },
                student_statistics: {
                    total_students: totalStudents,
                    students_with_scores: studentsWithScores,
                    students_passed: studentsPassed,
                    pass_rate: Math.round(passRate * 100) / 100
                },
                score_statistics: {
                    average_score: scoreData.average_score ? Math.round(parseFloat(scoreData.average_score) * 100) / 100 : 0,
                    min_score: scoreData.min_score || 0,
                    max_score: scoreData.max_score || 0,
                    grade_distribution: {
                        excellent: parseInt(scoreData.excellent) || 0,
                        good: parseInt(scoreData.good) || 0,
                        fair: parseInt(scoreData.fair) || 0,
                        poor: parseInt(scoreData.poor) || 0,
                        fail: parseInt(scoreData.fail) || 0
                    }
                },
                attendance_statistics: {
                    total_class_sessions: parseInt(attendanceData.total_class_sessions) || 0,
                    attendance_rate: Math.round(attendanceRate * 100) / 100,
                    absent_rate: Math.round(absentRate * 100) / 100,
                    late_rate: Math.round(lateRate * 100) / 100,
                    present_count: presentCount,
                    absent_count: absentCount,
                    late_count: lateCount
                }
            };
        });

        // --- BƯỚC 5: TÍNH TOÁN THỐNG KÊ TỔNG HỢP TOÀN KHOA ---
        const totalStats = courseSectionStatistics.reduce((acc, cs) => ({
            total_course_sections: acc.total_course_sections + 1,
            total_students: acc.total_students + cs.student_statistics.total_students,
            total_students_with_scores: acc.total_students_with_scores + cs.student_statistics.students_with_scores,
            total_passed: acc.total_passed + cs.student_statistics.students_passed,
            total_score_sum: acc.total_score_sum + (cs.score_statistics.average_score * cs.student_statistics.students_with_scores),
            grade_distribution: {
                excellent: acc.grade_distribution.excellent + cs.score_statistics.grade_distribution.excellent,
                good: acc.grade_distribution.good + cs.score_statistics.grade_distribution.good,
                fair: acc.grade_distribution.fair + cs.score_statistics.grade_distribution.fair,
                poor: acc.grade_distribution.poor + cs.score_statistics.grade_distribution.poor,
                fail: acc.grade_distribution.fail + cs.score_statistics.grade_distribution.fail
            }
        }), {
            total_course_sections: 0,
            total_students: 0,
            total_students_with_scores: 0,
            total_passed: 0,
            total_score_sum: 0,
            grade_distribution: { excellent: 0, good: 0, fair: 0, poor: 0, fail: 0 }
        });

        const facultyAverageScore = totalStats.total_students_with_scores > 0
            ? Math.round((totalStats.total_score_sum / totalStats.total_students_with_scores) * 100) / 100
            : 0;

        const facultyPassRate = totalStats.total_students_with_scores > 0
            ? Math.round((totalStats.total_passed / totalStats.total_students_with_scores) * 100 * 100) / 100
            : 0;

        const facAttendanceData = facultyAttendanceData[0] || {};
        const facAttendanceRate = (facAttendanceData.total_attendance_records || 0) > 0
            ? Math.round(((facAttendanceData.present_count + facAttendanceData.late_count) / facAttendanceData.total_attendance_records * 100) * 100) / 100
            : 0;

        // --- BƯỚC 6: TRẢ VỀ KẾT QUẢ ---
        return {
            faculty_id,
            faculty_name: faculty.name,
            session_name: sessionName,
            faculty_summary: {
                total_course_sections: totalStats.total_course_sections,
                total_students: totalStats.total_students,
                total_students_with_scores: totalStats.total_students_with_scores,
                average_score: facultyAverageScore,
                pass_rate: facultyPassRate,
                attendance_rate: facAttendanceRate,
                grade_distribution: totalStats.grade_distribution
            },
            course_sections: courseSectionStatistics
        };

    } catch (error) {
        console.error('Error in getCourseSectionsStatisticsByFaculty (Optimized):', error);
        throw error;
    }
};

/**
 * Lấy danh sách tất cả các khoa
 * @returns {Array} Danh sách các khoa với faculty_id và name
 */
const getAllFaculty = async () => {
    try {
        const faculties = await models.Faculty.findAll({
            attributes: ['faculty_id', 'name'],
            order: [['name', 'ASC']]
        });

        return faculties.map(faculty => ({
            faculty_id: faculty.faculty_id,
            name: faculty.name
        }));

    } catch (error) {
        console.error('Error in getAllFaculty:', error);
        throw error;
    }
};

/**
 * Lấy danh sách tất cả các học kỳ
 * @returns {Array} Danh sách các học kỳ với id, name, years - sắp xếp theo name và years giảm dần
 */
const getAllSession = async () => {
    try {
        const sessions = await models.Session.findAll({
            attributes: ['id', 'name', 'years'],
            order: [
                ['years', 'DESC'],
                ['name', 'DESC']
            ]
        });

        if (!sessions || sessions.length === 0) {
            throw new Error('No sessions found');
        }

        return sessions.map(session => ({
            id: session.id,
            nameSession: session.name + ' ' + session.years
        }));

    } catch (error) {
        console.error('Error in getAllSession:', error);
        throw error;
    }
};

module.exports = {
    getFacultyStatisticsBySession,
    getLecturerStatisticsBySession,
    getLecturersStatisticsByFaculty,
    getCourseSectionStatisticsBySession,
    getCourseSectionsStatisticsByFaculty,
    getAllFaculty,
    getAllSession
};
