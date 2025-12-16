const sequelize = require("../config/mariadb.conf");
const initModels = require("../databases/mariadb/model/init-models");
const models = initModels(sequelize);
const csv = require('csv-parser');
const fs = require('fs');

class DataImportRepository {
    // Import Schedules từ CSV
    async importSchedulesFromCSV(filePath) {
        const results = [];
        const errors = [];
        let processedCount = 0;
        let insertedCount = 0;
        let updatedCount = 0;

        return new Promise((resolve, reject) => {
            const requiredFields = ['user_id', 'course_section_id', 'room', 'start_lesson', 'end_lesson', 'start_date', 'end_date'];
            
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => {
                    // Validate required fields
                    const missingFields = requiredFields.filter(field => !data[field]);
                    if (missingFields.length > 0) {
                        errors.push({
                            row: processedCount + 1,
                            error: `Missing required fields: ${missingFields.join(', ')}`,
                            data
                        });
                        return;
                    }

                    // Validate and convert date fields
                    const validateDate = (dateStr) => {
                        if (!dateStr || dateStr.trim() === '' || dateStr === 'null' || dateStr === 'undefined') {
                            return null;
                        }
                        const date = new Date(dateStr);
                        return isNaN(date.getTime()) ? null : dateStr;
                    };

                    // Validate required date fields
                    const startDate = validateDate(data.start_date);
                    const endDate = validateDate(data.end_date);
                    
                    if (!startDate || !endDate) {
                        errors.push({
                            row: processedCount + 1,
                            error: 'start_date and end_date must be valid dates (YYYY-MM-DD format)',
                            data
                        });
                        return;
                    }

                    // Validate numeric fields
                    const startLesson = parseInt(data.start_lesson);
                    const endLesson = parseInt(data.end_lesson);
                    
                    if (isNaN(startLesson) || isNaN(endLesson)) {
                        errors.push({
                            row: processedCount + 1,
                            error: 'start_lesson and end_lesson must be valid numbers',
                            data
                        });
                        return;
                    }

                    // Convert data types
                    const scheduleData = {
                        id: data.id || null, // UUID nếu có, nếu không sẽ auto generate
                        user_id: data.user_id,
                        course_section_id: data.course_section_id,
                        isExam: data.isExam === 'true' || data.isExam === '1',
                        day_of_week: data.day_of_week ? parseInt(data.day_of_week) : null,
                        date: validateDate(data.date), // Only for exam schedules
                        room: data.room,
                        start_lesson: startLesson,
                        end_lesson: endLesson,
                        start_date: startDate,
                        end_date: endDate,
                        isCompleted: data.isCompleted === 'true' || data.isCompleted === '1'
                    };

                    results.push(scheduleData);
                    processedCount++;
                })
                .on('end', async () => {
                    try {
                        const transaction = await sequelize.transaction();
                        
                        for (const scheduleData of results) {
                            try {
                                if (scheduleData.id) {
                                    // Kiểm tra xem record có tồn tại không
                                    const existing = await models.Schedule.findByPk(scheduleData.id, { transaction });
                                    
                                    if (existing) {
                                        // Update
                                        await models.Schedule.update(scheduleData, {
                                            where: { id: scheduleData.id },
                                            transaction
                                        });
                                        updatedCount++;
                                    } else {
                                        // Insert với ID cụ thể
                                        await models.Schedule.create(scheduleData, { transaction });
                                        insertedCount++;
                                    }
                                } else {
                                    // Insert mới (auto generate ID)
                                    delete scheduleData.id;
                                    await models.Schedule.create(scheduleData, { transaction });
                                    insertedCount++;
                                }
                            } catch (error) {
                                errors.push({
                                    data: scheduleData,
                                    error: error.message
                                });
                            }
                        }

                        await transaction.commit();
                        
                        resolve({
                            success: true,
                            processed: processedCount,
                            inserted: insertedCount,
                            updated: updatedCount,
                            errors: errors
                        });
                    } catch (error) {
                        await transaction.rollback();
                        reject(error);
                    }
                })
                .on('error', (error) => {
                    reject(error);
                });
        });
    }

    // Import ScheduleExceptions từ CSV
    async importScheduleExceptionsFromCSV(filePath) {
        const results = [];
        const errors = [];
        let processedCount = 0;
        let insertedCount = 0;
        let updatedCount = 0;

        return new Promise((resolve, reject) => {
            const requiredFields = ['schedule_id', 'exception_type', 'original_date'];
            
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => {
                    // Validate required fields
                    const missingFields = requiredFields.filter(field => !data[field]);
                    if (missingFields.length > 0) {
                        errors.push({
                            row: processedCount + 1,
                            error: `Missing required fields: ${missingFields.join(', ')}`,
                            data
                        });
                        return;
                    }

                    // Validate exception_type enum
                    const validTypes = ['CANCELED', 'MAKEUP', 'ROOM_CHANGED', 'LECTURER_CHANGED'];
                    if (!validTypes.includes(data.exception_type)) {
                        errors.push({
                            row: processedCount + 1,
                            error: `Invalid exception_type: ${data.exception_type}. Must be one of: ${validTypes.join(', ')}`,
                            data
                        });
                        return;
                    }

                    const exceptionData = {
                        id: data.id || null,
                        schedule_id: data.schedule_id,
                        exception_type: data.exception_type,
                        original_date: data.original_date,
                        new_date: data.new_date || null,
                        new_room: data.new_room || null,
                        new_start_lesson: data.new_start_lesson ? parseInt(data.new_start_lesson) : null,
                        new_end_lesson: data.new_end_lesson ? parseInt(data.new_end_lesson) : null,
                        new_lecturer_id: data.new_lecturer_id || null
                    };

                    results.push(exceptionData);
                    processedCount++;
                })
                .on('end', async () => {
                    try {
                        const transaction = await sequelize.transaction();
                        
                        for (const exceptionData of results) {
                            try {
                                if (exceptionData.id) {
                                    const existing = await models.ScheduleException.findByPk(exceptionData.id, { transaction });
                                    
                                    if (existing) {
                                        await models.ScheduleException.update(exceptionData, {
                                            where: { id: exceptionData.id },
                                            transaction
                                        });
                                        updatedCount++;
                                    } else {
                                        await models.ScheduleException.create(exceptionData, { transaction });
                                        insertedCount++;
                                    }
                                } else {
                                    delete exceptionData.id;
                                    await models.ScheduleException.create(exceptionData, { transaction });
                                    insertedCount++;
                                }
                            } catch (error) {
                                errors.push({
                                    data: exceptionData,
                                    error: error.message
                                });
                            }
                        }

                        await transaction.commit();
                        
                        resolve({
                            success: true,
                            processed: processedCount,
                            inserted: insertedCount,
                            updated: updatedCount,
                            errors: errors
                        });
                    } catch (error) {
                        await transaction.rollback();
                        reject(error);
                    }
                })
                .on('error', (error) => {
                    reject(error);
                });
        });
    }

    // Import Scores từ CSV
    async importScoresFromCSV(filePath) {
        const results = [];
        const errors = [];
        let processedCount = 0;
        let insertedCount = 0;
        let updatedCount = 0;

        return new Promise((resolve, reject) => {
            const requiredFields = ['student_id', 'course_section_id'];
            
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => {
                    // Validate required fields
                    const missingFields = requiredFields.filter(field => !data[field]);
                    if (missingFields.length > 0) {
                        errors.push({
                            row: processedCount + 1,
                            error: `Missing required fields: ${missingFields.join(', ')}`,
                            data
                        });
                        return;
                    }

                    const scoreData = {
                        id: data.id || null,
                        student_id: data.student_id,
                        course_section_id: data.course_section_id,
                        theo_regular1: data.theo_regular1 ? parseFloat(data.theo_regular1) : null,
                        theo_regular2: data.theo_regular2 ? parseFloat(data.theo_regular2) : null,
                        theo_regular3: data.theo_regular3 ? parseFloat(data.theo_regular3) : null,
                        pra_regular1: data.pra_regular1 ? parseFloat(data.pra_regular1) : null,
                        pra_regular2: data.pra_regular2 ? parseFloat(data.pra_regular2) : null,
                        pra_regular3: data.pra_regular3 ? parseFloat(data.pra_regular3) : null,
                        mid: data.mid ? parseFloat(data.mid) : null,
                        final: data.final ? parseFloat(data.final) : null,
                        avr: data.avr ? parseFloat(data.avr) : null
                    };

                    results.push(scoreData);
                    processedCount++;
                })
                .on('end', async () => {
                    try {
                        const transaction = await sequelize.transaction();
                        
                        for (const scoreData of results) {
                            try {
                                if (scoreData.id) {
                                    const existing = await models.Score.findByPk(scoreData.id, { transaction });
                                    
                                    if (existing) {
                                        await models.Score.update(scoreData, {
                                            where: { id: scoreData.id },
                                            transaction
                                        });
                                        updatedCount++;
                                    } else {
                                        await models.Score.create(scoreData, { transaction });
                                        insertedCount++;
                                    }
                                } else {
                                    // Kiểm tra duplicate dựa trên student_id + course_section_id
                                    const existing = await models.Score.findOne({
                                        where: {
                                            student_id: scoreData.student_id,
                                            course_section_id: scoreData.course_section_id
                                        },
                                        transaction
                                    });

                                    if (existing) {
                                        delete scoreData.id;
                                        await models.Score.update(scoreData, {
                                            where: {
                                                student_id: scoreData.student_id,
                                                course_section_id: scoreData.course_section_id
                                            },
                                            transaction
                                        });
                                        updatedCount++;
                                    } else {
                                        delete scoreData.id;
                                        await models.Score.create(scoreData, { transaction });
                                        insertedCount++;
                                    }
                                }
                            } catch (error) {
                                errors.push({
                                    data: scoreData,
                                    error: error.message
                                });
                            }
                        }

                        await transaction.commit();
                        
                        resolve({
                            success: true,
                            processed: processedCount,
                            inserted: insertedCount,
                            updated: updatedCount,
                            errors: errors
                        });
                    } catch (error) {
                        await transaction.rollback();
                        reject(error);
                    }
                })
                .on('error', (error) => {
                    reject(error);
                });
        });
    }
}

module.exports = new DataImportRepository();