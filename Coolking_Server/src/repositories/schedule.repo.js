const { Op } = require("sequelize");
const sequelize = require("../config/mariadb.conf");
const { initModels } = require("../databases/mariadb/model/init-models");
const models = initModels(sequelize);
const datetimeFormatter = require("../utils/format/datetime-formatter");
const { where } = require("../databases/mongodb/schemas/Alert");

/**
 * Chuyển đổi từ JavaScript day (0-6) sang database day_of_week (1-7)
 * @param {Date} date - Date object
 * @returns {number} - day_of_week (1=Thứ 2, 7=Chủ nhật)
 */
const getDayOfWeekFromDate = (date) => {
    const jsDay = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    return jsDay === 0 ? 7 : jsDay; // Chuyển 0 (Sunday) thành 7, các ngày khác giữ nguyên
};

/**
 * Phân tích chuỗi ngày tháng với định dạng dd/MM/yyyy hoặc dd-MM-yyyy.
 * @param {string} dateString - Chuỗi ngày tháng.
 * @returns {Date} - Đối tượng Date.
 */
const parseDate = (dateString) => {
    if (!dateString) {
        throw new Error('Date string is required');
    }
    
    const delimiter = dateString.includes('/') ? '/' : '-';
    const parts = dateString.split(delimiter);
    
    if (parts.length !== 3) {
        throw new Error('Invalid date format. Expected dd/MM/yyyy or dd-MM-yyyy');
    }
    
    const [day, month, year] = parts;
    
    // Kiểm tra tính hợp lệ của các thành phần
    if (!day || !month || !year) {
        throw new Error('Invalid date components');
    }
    
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Kiểm tra xem Date object có hợp lệ không
    if (isNaN(dateObj.getTime())) {
        throw new Error('Invalid date');
    }
    
    return dateObj;
};

/**
 * Tính toán ngày bắt đầu (Thứ 2) và kết thúc (Chủ Nhật) của một tuần dựa trên ngày cho trước.
 * @param {Date} dateObj - Đối tượng Date của ngày hiện tại.
 * @returns {{weekStart: Date, weekEnd: Date}} - Ngày bắt đầu và kết thúc của tuần.
 */
const calculateWeekRange = (dateObj) => {
    if (!dateObj || isNaN(dateObj.getTime())) {
        throw new Error('Invalid date object provided');
    }
    
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const weekStart = new Date(dateObj);
    weekStart.setDate(dateObj.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return { weekStart, weekEnd };
};

/**
 * Lấy dữ liệu lịch trình từ database cho một user trong một khoảng thời gian.
 * @param {string} userId - ID của người dùng.
 * @param {Date} weekStart - Ngày bắt đầu tuần.
 * @param {Date} weekEnd - Ngày kết thúc tuần.
 * @returns {Promise<Array>} - Mảng các lịch trình.
 */
const fetchSchedulesFromDb = async (userId, weekStart, weekEnd) => {
    // Format dates cho database query (YYYY-MM-DD)
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];
    
    return models.Schedule.findAll({
        where: {
            user_id: userId,
            [Op.or]: [
                // Lịch thường: kiểm tra start_date và end_date
                {
                    isExam: { [Op.ne]: 1 },
                    start_date: { [Op.lte]: weekEnd },
                    end_date: { [Op.gte]: weekStart }
                },
                // Lịch thi: chỉ kiểm tra date field nằm trong tuần
                {
                    isExam: 1,
                    date: { [Op.between]: [weekStartStr, weekEndStr] }
                }
            ]
        },
        include: [
            {
                model: models.CourseSection,
                as: 'course_section',
                attributes: ['id'],
                include: [
                    { model: models.Clazz, as: 'clazz', attributes: ['name'] },
                    { model: models.Subject, as: 'subject', attributes: ['name'] },
                    {
                        model: models.LecturerCourseSection,
                        as: 'lecturers_course_sections',
                        attributes: ['lecturer_id'],
                        include: [{ model: models.Lecturer, as: 'lecturer', attributes: ['name'] }]
                    }
                ]
            },
            {
                model: models.ScheduleException,
                as: 'schedule_exceptions',
                where: { original_date: { [Op.between]: [weekStart, weekEnd] } },
                required: false,
                include: [{ model: models.Lecturer, as: 'new_lecturer', attributes: ['name'], required: false }]
            }
        ]
    });
};

/**
 * Xử lý một lịch trình có các ngoại lệ (nghỉ, bù, đổi phòng...).
 * @param {Object} schedule - Lịch trình gốc.
 * @param {Object} baseScheduleData - Dữ liệu cơ bản của lịch trình.
 * @param {Date} weekStart - Ngày bắt đầu tuần hiện tại.
 * @param {Date} weekEnd - Ngày kết thúc tuần hiện tại.
 * @returns {Array} - Mảng các lịch trình đã được xử lý từ ngoại lệ.
 */
const processScheduleWithExceptions = (schedule, baseScheduleData, weekStart, weekEnd) => {
    const processed = [];
    for (const exception of schedule.schedule_exceptions) {
        const exceptionDate = new Date(exception.original_date);
        const exceptionDayOfWeek = getDayOfWeekFromDate(exceptionDate);

        const canceledEvent = {
            ...baseScheduleData,
            id: schedule.id,
            type: schedule.isExam ? 'EXAM' : 'REGULAR',
            status: 'CANCELED',
            date: datetimeFormatter.formatDateVN(exceptionDate),
            day_of_week: exceptionDayOfWeek,
            room: schedule.room,
            start_lesson: schedule.start_lesson,
            end_lesson: schedule.end_lesson,
        };

        if (exception.exception_type === 'MAKEUP') {
            // Chỉ thêm lịch gốc bị hủy, không thêm lịch MAKEUP ở đây
            // Lịch MAKEUP sẽ được xử lý riêng trong main function
            processed.push(canceledEvent);
        } else if (exception.exception_type === 'CANCELED') {
            processed.push(canceledEvent);
        } else { // ROOM_CHANGED, LECTURER_CHANGED
            processed.push({
                ...baseScheduleData,
                id: schedule.id,
                type: schedule.isExam ? 'EXAM' : 'REGULAR',
                status: exception.exception_type,
                date: datetimeFormatter.formatDateVN(exceptionDate),
                day_of_week: exceptionDayOfWeek,
                room: exception.new_room || schedule.room,
                start_lesson: schedule.start_lesson,
                end_lesson: schedule.end_lesson,
                lecturerName: exception.new_lecturer?.name || baseScheduleData.lecturerName,
            });
        }
    }
    return processed;
};

/**
 * Xử lý lịch trình thông thường (không có ngoại lệ) cho tuần hiện tại.
 * @param {Object} schedule - Lịch trình gốc.
 * @param {Object} baseScheduleData - Dữ liệu cơ bản của lịch trình.
 * @param {Date} weekStart - Ngày bắt đầu tuần.
 * @param {Date} weekEnd - Ngày kết thúc tuần.
 * @param {Map} exceptionDatesMap - Map các ngày có exception.
 * @returns {Array} - Mảng các lịch trình đã được xử lý.
 */
const processRegularSchedule = (schedule, baseScheduleData, weekStart, weekEnd, exceptionDatesMap = new Map()) => {
    const processed = [];
    if (schedule.isExam && schedule.date) {
        // Xử lý lịch thi có ngày cụ thể
        // Parse date từ format YYYY-MM-DD sang Date object
        let examDate;
        if (typeof schedule.date === 'string') {
            // Nếu là string format YYYY-MM-DD, chuyển sang Date
            const dateParts = schedule.date.split('-');
            if (dateParts.length === 3) {
                examDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
            } else {
                examDate = new Date(schedule.date);
            }
        } else {
            examDate = new Date(schedule.date);
        }
        
        if (examDate >= weekStart && examDate <= weekEnd) {
            const examDateStr = datetimeFormatter.formatDateVN(examDate);
            
            // Chỉ thêm nếu ngày này không có exception
            if (!exceptionDatesMap.has(examDateStr)) {
                processed.push({
                    ...baseScheduleData,
                    id: schedule.id,
                    type: 'EXAM',
                    status: schedule.isCompleted ? 'COMPLETED' : 'SCHEDULED',
                    date: examDateStr,
                    day_of_week: getDayOfWeekFromDate(examDate),
                    room: schedule.room,
                    start_lesson: schedule.start_lesson,
                    end_lesson: schedule.end_lesson,
                });
            }
        }
    } else if (!schedule.isExam && schedule.day_of_week) {
        // Xử lý lịch học lặp lại theo thứ trong tuần
        for (let i = 0; i < 7; i++) {
            const scheduleDate = new Date(weekStart);
            scheduleDate.setDate(weekStart.getDate() + i);
            
            // Chuẩn hóa `getDay()` (0-6) sang `day_of_week` (1-7, Thứ 2 là 1)
            const dayOfWeek = scheduleDate.getDay();
            const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

            if (adjustedDayOfWeek === schedule.day_of_week) {
                const scheduleDateStr = datetimeFormatter.formatDateVN(scheduleDate);
                
                // Chỉ thêm nếu ngày này không có exception
                if (!exceptionDatesMap.has(scheduleDateStr)) {
                    processed.push({
                        ...baseScheduleData,
                        id: schedule.id,
                        type: 'REGULAR',
                        status: schedule.isCompleted ? 'COMPLETED' : 'SCHEDULED',
                        date: scheduleDateStr,
                        day_of_week: adjustedDayOfWeek,
                        room: schedule.room,
                        start_lesson: schedule.start_lesson,
                        end_lesson: schedule.end_lesson,
                    });
                }
            }
        }
    }
    return processed;
};

/**
 * Lấy và xử lý lịch trình cho một người dùng trong tuần được chỉ định.
 * @param {string} user_id - ID của người dùng.
 * @param {string} currentDate - Ngày hiện tại (dd/MM/yyyy hoặc dd-MM-yyyy).
 * @returns {Object} - Lịch trình đã xử lý và thông tin điều hướng tuần.
 */
const getSchedulesByUserId = async (user_id, currentDate) => {
    try {
        const currentDateObj = parseDate(currentDate);
        const { weekStart, weekEnd } = calculateWeekRange(currentDateObj);

        // Lấy dữ liệu thô từ DB
        const rawSchedules = await fetchSchedulesFromDb(user_id, weekStart, weekEnd);

        // Lấy tất cả lịch MAKEUP được lên lịch trong tuần hiện tại
        const makeupSchedulesInCurrentWeek = await models.ScheduleException.findAll({
            where: {
                exception_type: 'MAKEUP',
                new_date: {
                    [Op.between]: [weekStart, weekEnd]
                }
            },
            include: [
                {
                    model: models.Schedule,
                    as: 'schedule',
                    where: {
                        user_id: user_id
                    },
                    include: [
                        {
                            model: models.CourseSection,
                            as: 'course_section',
                            include: [
                                { model: models.Clazz, as: 'clazz', attributes: ['name'] },
                                { model: models.Subject, as: 'subject', attributes: ['name'] },
                                {
                                    model: models.LecturerCourseSection,
                                    as: 'lecturers_course_sections',
                                    where: { isMain: true },
                                    include: [{ model: models.Lecturer, as: 'lecturer', attributes: ['name'] }]
                                }
                            ]
                        }
                    ]
                },
                { model: models.Lecturer, as: 'new_lecturer', attributes: ['name'], required: false }
            ]
        });

        // Xử lý và định dạng lại dữ liệu
        let resultSchedules = [];
        const addedScheduleKeys = new Set();

        // Thêm lịch MAKEUP trong tuần hiện tại
        for (const makeupException of makeupSchedulesInCurrentWeek) {
            if (makeupException.schedule?.course_section) {
                const makeupDate = new Date(makeupException.new_date);
                const makeupKey = `${makeupException.schedule.id}-${datetimeFormatter.formatDateVN(makeupDate)}-MAKEUP`;
                
                if (!addedScheduleKeys.has(makeupKey)) {
                    addedScheduleKeys.add(makeupKey);
                    
                    resultSchedules.push({
                        id: makeupException.schedule.id,
                        subjectName: makeupException.schedule.course_section?.subject?.name || 'N/A',
                        clazzName: makeupException.schedule.course_section?.clazz?.name || 'N/A',
                        lecturerName: makeupException.new_lecturer?.name || makeupException.schedule.course_section?.lecturers_course_sections?.[0]?.lecturer?.name || 'N/A',
                        type: 'MAKEUP',
                        status: 'SCHEDULED',
                        date: datetimeFormatter.formatDateVN(makeupDate),
                        day_of_week: getDayOfWeekFromDate(makeupDate),
                        room: makeupException.new_room || makeupException.schedule.room,
                        start_lesson: makeupException.new_start_lesson || makeupException.schedule.start_lesson,
                        end_lesson: makeupException.new_end_lesson || makeupException.schedule.end_lesson
                    });
                }
            }
        }

        // Xử lý các lịch thường
        for (const schedule of rawSchedules) {
            const baseScheduleData = {
                subjectName: schedule.course_section?.subject?.name || 'N/A',
                clazzName: schedule.course_section?.clazz?.name || 'N/A',
                //Lấy tất cả giảng viên
                lecturerName: schedule.course_section?.lecturers_course_sections?.map(lcs => lcs.lecturer?.name).join(', ') || 'N/A',
            };

            // Tạo map các ngày có exception cho schedule này
            const exceptionDatesMap = new Map();
            if (schedule.schedule_exceptions && schedule.schedule_exceptions.length > 0) {
                for (const exception of schedule.schedule_exceptions) {
                    const exceptionDate = new Date(exception.original_date);
                    const exceptionDateStr = datetimeFormatter.formatDateVN(exceptionDate);
                    exceptionDatesMap.set(exceptionDateStr, true);
                }
            }

            // Xử lý schedule - luôn truyền exceptionDatesMap
            let processed = [];
            
            // Nếu có exception, xử lý exception trước
            if (schedule.schedule_exceptions && schedule.schedule_exceptions.length > 0) {
                const exceptionSchedules = processScheduleWithExceptions(schedule, baseScheduleData, weekStart, weekEnd);
                processed.push(...exceptionSchedules);
            }
            
            // Luôn xử lý lịch regular nhưng loại trừ những ngày có exception
            const regularSchedules = processRegularSchedule(schedule, baseScheduleData, weekStart, weekEnd, exceptionDatesMap);
            processed.push(...regularSchedules);
            
            // Thêm vào kết quả với deduplication
            for (const item of processed) {
                const key = `${item.id}-${item.date}-${item.type}-${item.status}-${item.start_lesson}`;
                if (!addedScheduleKeys.has(key)) {
                    addedScheduleKeys.add(key);
                    resultSchedules.push(item);
                }
            }
        }

        // Sắp xếp kết quả cuối cùng theo ngày và tiết học
        resultSchedules.sort((a, b) => {
            if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
            return a.start_lesson - b.start_lesson;
        });

        // Tạo link điều hướng tuần trước/sau
        const prevWeek = new Date(weekStart);
        prevWeek.setDate(weekStart.getDate() - 7);
        const nextWeek = new Date(weekStart);
        nextWeek.setDate(weekStart.getDate() + 7);

        return {
            schedules: resultSchedules,
            prev: `/api/schedules/by-user?currentDate=${datetimeFormatter.formatDateVN(prevWeek)}`,
            next: `/api/schedules/by-user?currentDate=${datetimeFormatter.formatDateVN(nextWeek)}`,
            weekInfo: {
                weekStart: datetimeFormatter.formatDateVN(weekStart),
                weekEnd: datetimeFormatter.formatDateVN(weekEnd),
                currentDate: currentDate
            }
        };

    } catch (error) {
        console.error('Error in getSchedulesByUserId:', error);
        throw error;
    }
};

module.exports = { getSchedulesByUserId };