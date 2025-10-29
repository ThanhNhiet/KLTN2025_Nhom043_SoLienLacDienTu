const scheduleRepo = require("../repositories/schedule.repo");
const jwtUtils = require('../utils/jwt.utils');

//GET /schedules/by-user?currentDate=&subUserID=
exports.getSchedulesByUserId = async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const decoded = jwtUtils.verifyAccessToken(token);
    const { currentDate, subUserID } = req.query;
    //Nếu là PARENT thì lấy lịch của subUserID
    if (decoded.role === 'PARENT' && subUserID) {
        try {
            const result = await scheduleRepo.getSchedulesByUserId(subUserID, currentDate);
            return res.json(result);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    try {
        const result = await scheduleRepo.getSchedulesByUserId(decoded.user_id, currentDate);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
