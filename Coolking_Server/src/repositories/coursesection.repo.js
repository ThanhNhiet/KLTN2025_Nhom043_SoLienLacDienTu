const sequelize = require("../config/mariadb.conf");
const initModels = require("../databases/mariadb/model/init-models");
const { where } = require("../databases/mongodb/schemas/Alert");
const models = initModels(sequelize);
const datetimeFormatter = require("../utils/format/datetime-formatter");
const { Op } = require('sequelize');

/** 
 * Lấy danh sách các lớp học phần của giảng viên, phân trang, sắp xếp theo ngày tạo giảm dần
 * @param {string} lecturerId - Mã giảng viên
 * @param {number} page - Trang hiện tại
 * @param {number} pageSize - Số lượng bản ghi trên một trang
 * @returns {Object} success + message + data: { total, page, pageSize, courseSections, linkPrev, linkNext, pages }
 */
const getCourseSectionsByLecturer = async (lecturerId, page, pageSize = 10) => {
    try {
        // Validate input
        if (!lecturerId) {
            throw new Error('lecturerId is required');
        }

        const page_num = parseInt(page) || 1;
        const pageSize_num = parseInt(pageSize) || 10;
        const offset = (page_num - 1) * pageSize_num;

        const { count, rows } = await models.LecturerCourseSection.findAndCountAll({
            where: {
                lecturer_id: lecturerId
            },
            include: [
                {
                    model: models.CourseSection,
                    as: 'course_section',
                    where: { isCompleted: false },
                    attributes: ['id', 'createdAt'],
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
                        }
                    ]
                }
            ],
            order: [
                [{ model: models.CourseSection, as: 'course_section' }, 'createdAt', 'DESC']
            ],
            offset: offset,
            limit: pageSize_num,
            distinct: true
        });

        const courseSections = rows.map(item => ({
            course_section_id: item.course_section.id,
            subjectName: item.course_section.subject?.name || 'N/A',
            className: item.course_section.clazz?.name || 'N/A',
            facultyName: item.course_section.subject?.faculty?.name || 'N/A',
            sessionName: item.course_section.session ? `${item.course_section.session.name} ${item.course_section.session.years}` : 'N/A',
            createdAt: datetimeFormatter.formatDateVN(item.course_section.createdAt)
        }));

        const linkPrev = page_num > 1 ? `/api/coursesections/lecturer?page=${page_num - 1}&pagesize=${pageSize_num}` : null;
        const linkNext = (page_num - 1) * pageSize_num + rows.length < count ? `/api/coursesections/lecturer?page=${page_num + 1}&pagesize=${pageSize_num}` : null;

        // Tạo danh sách 3 trang liên tiếp
        const pages = [];
        const totalPages = Math.ceil(count / pageSize_num);
        for (let i = 1; i <= totalPages; i++) {
            if (i >= page_num && i < page_num + 3) {
                pages.push(i);
            }
        }

        return {
            total: count,
            page: page_num,
            pageSize: pageSize_num,
            courseSections: courseSections,
            linkPrev,
            linkNext,
            pages
        };

    } catch (error) {
        console.error('Error in getCourseSectionsByLecturer:', error);
        throw error;
    }
};

/**
 * Tìm kiếm course sections theo keyword: subject name, class name. Tìm kiếm tương đối
 * @param {string} lecturer_id - Mã giảng viên
 * @param {string} keyword - Từ khóa tìm kiếm
 * @param {number} page - Trang hiện tại
 * @param {number} pageSize - Số lượng bản ghi trên một trang
 * @returns {Object} success + message + data: { total, page, pageSize, courseSections, linkPrev, linkNext, pages }
 */
const searchCourseSectionsByKeyword4Lecturer = async (lecturer_id, keyword, page, pageSize = 10) => {
    try {
        if (!lecturer_id) {
            throw new Error('lecturer_id is required');
        }

        if (!keyword || keyword.trim() === '') {
            return await getCourseSectionsByLecturer(lecturer_id, page, pageSize);
        }

        const page_num = parseInt(page) || 1;
        const pageSize_num = parseInt(pageSize) || 10;
        const offset = (page_num - 1) * pageSize_num;

        const keyword_lower = `%${keyword.trim().toLowerCase()}%`;

        const { count, rows } = await models.LecturerCourseSection.findAndCountAll({
            where: {
                lecturer_id: lecturer_id,
                [Op.or]: [
                    { '$course_section.subject.name$': { [Op.like]: keyword_lower } },
                    { '$course_section.clazz.name$': { [Op.like]: keyword_lower } },
                    { '$course_section.id$': { [Op.like]: keyword_lower } }
                ]
            },
            include: [
                {
                    model: models.CourseSection,
                    as: 'course_section',
                    where: { isCompleted: false },
                    attributes: ['id', 'createdAt'],
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
                        }
                    ]
                }
            ],
            order: [[{ model: models.CourseSection, as: 'course_section' }, 'createdAt', 'DESC']],
            limit: pageSize_num,
            offset: offset,
            distinct: true
        });

        const courseSections = rows.map(item => ({
            course_section_id: item.course_section.id,
            subjectName: item.course_section.subject?.name || 'N/A',
            className: item.course_section.clazz?.name || 'N/A',
            facultyName: item.course_section.subject?.faculty?.name || 'N/A',
            sessionName: item.course_section.session ? `${item.course_section.session.name} ${item.course_section.session.years}` : 'N/A',
            createdAt: datetimeFormatter.formatDateVN(item.course_section.createdAt)
        }));

        const totalPages = Math.ceil(count / pageSize_num);
        const linkPrev = page_num > 1
            ? `/api/coursesections/search?lecturer_id=${lecturer_id}&keyword=${encodeURIComponent(keyword)}&page=${page_num - 1}&pageSize=${pageSize_num}`
            : null;
        const linkNext = page_num < totalPages
            ? `/api/coursesections/search?lecturer_id=${lecturer_id}&keyword=${encodeURIComponent(keyword)}&page=${page_num + 1}&pageSize=${pageSize_num}`
            : null;

        const pages = [];
        for (let i = page_num; i < page_num + 3 && i <= totalPages; i++) {
            pages.push(i);
        }

        return {
            total: count,
            page: page_num,
            pageSize: pageSize_num,
            courseSections,
            linkPrev,
            linkNext,
            pages
        };

    } catch (error) {
        console.error('Error in searchCourseSectionsByKeyword:', error);
        throw error;
    }
};

/**
 * Lọc course sections theo session name và faculty name. Tìm kiếm chính xác
 * @param {string} lecturer_id - Mã giảng viên
 * @param {string} sessionName - Tên session (có thể rỗng)
 * @param {string} facultyName - Tên khoa (có thể rỗng)
 * @param {number} page - Trang hiện tại
 * @param {number} pageSize - Số lượng bản ghi trên một trang
 * @returns {Object} success + message + data: { total, page, pageSize, courseSections, linkPrev, linkNext, pages }
 */
const filterCourseSections4Lecturer = async (lecturer_id, sessionId, facultyId, page, pageSize = 10) => {
    try {
        // Validate input
        if (!lecturer_id) {
            throw new Error('lecturer_id is required');
        }

        const page_num = parseInt(page) || 1;
        const pageSize_num = parseInt(pageSize) || 10;
        const offset = (page_num - 1) * pageSize_num;

        // Tạo điều kiện where động cho filter
        const whereClause = {};
        if (sessionId && sessionId.trim() !== '') {
            whereClause['$course_section.session.id$'] = sessionId.trim();
        }
        if (facultyId && facultyId.trim() !== '') {
            whereClause['$course_section.subject.faculty.faculty_id$'] = facultyId.trim();
        }

        // Query trực tiếp với filter + pagination
        const { count, rows } = await models.LecturerCourseSection.findAndCountAll({
            where: {
                lecturer_id: lecturer_id,
                ...whereClause
            },
            include: [
                {
                    model: models.CourseSection,
                    as: 'course_section',
                    where: { isCompleted: false },
                    attributes: ['id', 'createdAt'],
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
                        }
                    ]
                }
            ],
            order: [[{ model: models.CourseSection, as: 'course_section' }, 'createdAt', 'DESC']],
            limit: pageSize_num,
            offset: offset,
            distinct: true // tránh count sai khi có join
        });

        // Format dữ liệu trả về
        const courseSections = rows.map(item => ({
            course_section_id: item.course_section?.id || 'N/A',
            subjectName: item.course_section?.subject?.name || 'N/A',
            className: item.course_section?.clazz?.name || 'N/A',
            facultyName: item.course_section?.subject?.faculty?.name || 'N/A',
            sessionName: item.course_section?.session ? `${item.course_section.session.name} ${item.course_section.session.years}` : 'N/A',
            createdAt: item.course_section?.createdAt
                ? datetimeFormatter.formatDateVN(item.course_section.createdAt)
                : 'N/A'
        }));

        // Tính paging meta
        const totalPages = Math.ceil(count / pageSize_num);
        const linkPrev = page_num > 1
            ? `/api/coursesections/lecturer/filter?page=${page_num - 1}&pageSize=${pageSize_num}`
            : null;
        const linkNext = page_num < totalPages
            ? `/api/coursesections/lecturer/filter?page=${page_num + 1}&pageSize=${pageSize_num}`
            : null;

        // Danh sách 3 trang liên tiếp
        const pages = [];
        for (let i = page_num; i < page_num + 3 && i <= totalPages; i++) {
            pages.push(i);
        }

        return {
            total: count,
            page: page_num,
            pageSize: pageSize_num,
            totalPages,
            courseSections,
            linkPrev,
            linkNext,
            pages
        };

    } catch (error) {
        console.error('Error in filterCourseSections:', error);
        throw error;
    }
};

/**
 *  Lấy danh sách student_id + parent_id (nếu có) của một lớp học phần, phục vụ chức năng gửi thông báo
 * @param {string} course_section_id - Mã lớp học phần
 * @returns {Array} success + message + data: [ { student_id, parent_id (nếu có) } ] 
 */
const getStudentsAndParentsByCourseSection = async (course_section_id) => {
    try {
        if (!course_section_id) {
            throw new Error('course_section_id is required');
        }

        const students = await models.StudentCourseSection.findAll({
            attributes: ['student_id'],
            where: { course_section_id: course_section_id }
        });

        if (students.length === 0) {
            return {
                success: false,
                message: 'Không có học sinh nào trong lớp học phần này',
                data: []
            };
        }

        let finalData = [];
        for (const student of students) {
            const parent = await models.Parent.findOne({
                attributes: ['parent_id'],
                where: { student_id: student.student_id }
            });
            finalData.push({ student_id: student.student_id, parent_id: parent ? parent.parent_id : null });
        }

        return {
            success: true,
            message: 'Lấy danh sách học sinh và phụ huynh thành công',
            data: finalData
        };
    } catch (error) {
        console.error('Error in getStudentsAndParentsByCourseSection:', error);
        throw error;
    }
};


/**
 * Lấy danh sách các lớp học phần của học sinh, phân trang, sắp xếp theo ngày tạo giảm dần
 * @param {string} studentId - Mã học sinh 
 * @param {number} page - Trang hiện tại
 * @param {number} pageSize - Số lượng bản ghi trên một trang
 * @returns {Object} success + message + data: { total, page, pageSize, courseSections, linkPrev, linkNext, pages }
 */
const getCourseSectionsByStudent = async (studentId, page, pageSize = 10) => {
    try {
        // Validate input
        if (!studentId) {
            throw new Error('studentId is required');
        }

        const page_num = parseInt(page) || 1;
        const pageSize_num = parseInt(pageSize) || 10;

        // Fetch all data without pagination first (for sorting)
        const { count, rows } = await models.StudentCourseSection.findAndCountAll({
            where: {
                student_id: studentId
            },
            include: [
                {
                    model: models.CourseSection,
                    as: 'course_section',
                    attributes: ['id', 'createdAt'],
                    include: [
                        {
                            model: models.Subject,
                            as: 'subject',
                            attributes: ['name', 'subject_id'],
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
                                    attributes: ['name']
                                }
                            ]
                        }
                    ]
                }
            ],
            distinct: true,
            raw: false
        });

        // Sort in JavaScript: by year (DESC) → semester name (DESC) → createdAt (DESC)
        const sortedRows = rows.sort((a, b) => {
            const yearA = parseInt(a.course_section.session?.years?.split('-')[0] || '0');
            const yearB = parseInt(b.course_section.session?.years?.split('-')[0] || '0');
            
            // Primary: year DESC
            if (yearB !== yearA) return yearB - yearA;
            
            // Secondary: semester name DESC (HK3 > HK2 > HK1)
            const nameA = a.course_section.session?.name || '';
            const nameB = b.course_section.session?.name || '';
            if (nameA !== nameB) return nameB.localeCompare(nameA);
            
            // Tertiary: createdAt DESC
            return new Date(b.course_section.createdAt) - new Date(a.course_section.createdAt);
        });

        // Apply pagination after sorting
        const offset = (page_num - 1) * pageSize_num;
        const paginatedRows = sortedRows.slice(offset, offset + pageSize_num);

        const courseSections = paginatedRows.map(item => ({
            course_section_id: item.course_section.id,
            subject_id: item.course_section.subject?.subject_id || 'N/A',
            subjectName: item.course_section.subject?.name || 'N/A',
            className: item.course_section.clazz?.name || 'N/A',
            facultyName: item.course_section.subject?.faculty?.name || 'N/A',
            sessionName: item.course_section.session ?
                `${item.course_section.session.name} ${item.course_section.session.years}` : 'N/A',
            lecturerName: item.course_section.lecturers_course_sections?.[0]?.lecturer?.name || 'N/A',
            createdAt: datetimeFormatter.formatDateVN(item.course_section.createdAt)
        }));

        const linkPrev = page_num > 1 ?
            `/api/coursesections/student/${studentId}?page=${page_num - 1}&pagesize=${pageSize_num}` : null;
        const linkNext = page_num * pageSize_num < count ?
            `/api/coursesections/student/${studentId}?page=${page_num + 1}&pagesize=${pageSize_num}` : null;

        const totalPages = Math.ceil(count / pageSize_num);
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i >= page_num && i < page_num + 3) {
                pages.push(i);
            }
        }

        return {
            total: count,
            page: page_num,
            pageSize: pageSize_num,
            courseSections: courseSections,
            linkPrev,
            linkNext,
            pages
        };

    } catch (error) {
        console.error('Error in getCourseSectionsByStudent:', error);
        throw error;
    }
};



module.exports = {
    getCourseSectionsByLecturer,
    searchCourseSectionsByKeyword4Lecturer,
    filterCourseSections4Lecturer,
    getStudentsAndParentsByCourseSection,
    getCourseSectionsByStudent
};
