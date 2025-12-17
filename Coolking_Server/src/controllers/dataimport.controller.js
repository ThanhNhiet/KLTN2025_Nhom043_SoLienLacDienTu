const dataImportRepo = require('../repositories/dataimport.repo');
const jwtUtils = require('../utils/jwt.utils');
const fs = require('fs');
const path = require('path');

// POST /api/dataimport/schedules
exports.importSchedules = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const file = req.files[0];
        const filePath = file.path;

        // Validate file extension
        if (!file.originalname.toLowerCase().endsWith('.csv')) {
            // Clean up uploaded file
            fs.unlinkSync(filePath);
            return res.status(400).json({
                success: false,
                message: 'Only CSV files are allowed'
            });
        }

        const result = await dataImportRepo.importSchedulesFromCSV(filePath);

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        res.status(200).json({
            success: true,
            message: `Schedule import completed. Processed: ${result.processed}, Inserted: ${result.inserted}, Updated: ${result.updated}`,
            data: {
                processed: result.processed,
                inserted: result.inserted,
                updated: result.updated,
                errors: result.errors
            }
        });
    } catch (error) {
        // Clean up uploaded file if exists
        if (req.files && req.files[0] && req.files[0].path) {
            try {
                fs.unlinkSync(req.files[0].path);
            } catch (cleanupError) {
                console.error('File cleanup error:', cleanupError);
            }
        }
        res.status(500).json({ message: error.message });
    }
};

// POST /api/dataimport/schedule-exceptions
exports.importScheduleExceptions = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const file = req.files[0];
        const filePath = file.path;

        // Validate file extension
        if (!file.originalname.toLowerCase().endsWith('.csv')) {
            // Clean up uploaded file
            fs.unlinkSync(filePath);
            return res.status(400).json({
                success: false,
                message: 'Only CSV files are allowed'
            });
        }

        const result = await dataImportRepo.importScheduleExceptionsFromCSV(filePath);

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        res.status(200).json({
            success: true,
            message: `Schedule exceptions import completed. Processed: ${result.processed}, Inserted: ${result.inserted}, Updated: ${result.updated}`,
            data: {
                processed: result.processed,
                inserted: result.inserted,
                updated: result.updated,
                errors: result.errors
            }
        });
    } catch (error) {
        // Clean up uploaded file if exists
        if (req.files && req.files[0] && req.files[0].path) {
            try {
                fs.unlinkSync(req.files[0].path);
            } catch (cleanupError) {
                console.error('File cleanup error:', cleanupError);
            }
        }
        res.status(500).json({ message: error.message });
    }
};

// POST /api/dataimport/scores
exports.importScores = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const file = req.files[0];
        const filePath = file.path;

        // Validate file extension
        if (!file.originalname.toLowerCase().endsWith('.csv')) {
            // Clean up uploaded file
            fs.unlinkSync(filePath);
            return res.status(400).json({
                success: false,
                message: 'Only CSV files are allowed'
            });
        }

        const result = await dataImportRepo.importScoresFromCSV(filePath);

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        res.status(200).json({
            success: true,
            message: `Scores import completed. Processed: ${result.processed}, Inserted: ${result.inserted}, Updated: ${result.updated}`,
            data: {
                processed: result.processed,
                inserted: result.inserted,
                updated: result.updated,
                errors: result.errors
            }
        });
    } catch (error) {
        // Clean up uploaded file if exists
        if (req.files && req.files[0] && req.files[0].path) {
            try {
                fs.unlinkSync(req.files[0].path);
            } catch (cleanupError) {
                console.error('File cleanup error:', cleanupError);
            }
        }
        res.status(500).json({ message: error.message });
    }
};

// GET /api/dataimport/history
exports.getImportHistory = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        // This could be expanded to track import history in a dedicated table
        res.status(200).json({
            success: true,
            message: 'Import history feature not implemented yet',
            data: []
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/dataimport/template/:type
exports.downloadTemplate = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { type } = req.params;
        
        let templatePath;
        let filename;
        
        switch (type) {
            case 'schedules':
                templatePath = path.join(__dirname, '../templates/schedules_template.csv');
                filename = 'schedules_template.csv';
                break;
            case 'schedule-exceptions':
                templatePath = path.join(__dirname, '../templates/schedule_exceptions_template.csv');
                filename = 'schedule_exceptions_template.csv';
                break;
            case 'scores':
                templatePath = path.join(__dirname, '../templates/scores_template.csv');
                filename = 'scores_template.csv';
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid template type. Available types: schedules, schedule-exceptions, scores'
                });
        }

        // Check if template file exists
        if (!fs.existsSync(templatePath)) {
            return res.status(404).json({
                success: false,
                message: 'Template file not found'
            });
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        const fileStream = fs.createReadStream(templatePath);
        fileStream.pipe(res);
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
