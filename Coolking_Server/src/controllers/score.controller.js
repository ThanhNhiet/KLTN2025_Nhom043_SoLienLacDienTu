const jwtUtils = require('../utils/jwt.utils');
const scoreRepo = require('../repositories/score.repo');

// GET /scores/student/:id
exports.getStudentScoresBySemester = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        const studentId = req.params.id;
        if (decoded.role === 'STUDENT' && decoded.user_id !== studentId) {
            return res.status(403).json({ message: 'You can only access your own scores' });
        }
        const scores = await scoreRepo.getScoreStudentBySession(studentId);
        if (!scores) {
            return res.status(404).json({ message: 'Scores not found' });
        }
        res.status(200).json(scores);
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};


exports.getParentStudentScoresBySemester = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        const parentId = req.params.id;
        const studentId = req.params.studentId;
        if (decoded.role === 'PARENT' && decoded.user_id !== parentId) {
            return res.status(403).json({ message: 'You can only access your own scores' });
        }
        const scores = await scoreRepo.getScoreParentStudentBySession(parentId, studentId);
        if (!scores) {
            return res.status(404).json({ message: 'Scores not found' });
        }
        res.status(200).json(scores);
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};