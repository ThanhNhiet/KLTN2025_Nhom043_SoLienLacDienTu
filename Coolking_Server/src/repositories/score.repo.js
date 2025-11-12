const { QueryTypes } = require('sequelize');
const sequelize = require("../config/mariadb.conf");
const initModels = require("../databases/mariadb/model/init-models");
const models = initModels(sequelize);

// Thêm helper này phía trên hoặc ngoài hàm
function safeParseJSON(value) {
  if (value == null) return null;
  if (typeof value === 'object') return value; // đã là object -> giữ nguyên
  if (typeof value !== 'string') return value; // không phải string -> giữ nguyên

  try {
    return JSON.parse(value);
  } catch (e) {
    console.warn('⚠️ JSON parse error:', e.message);
    return value; // giữ nguyên nếu không parse được
  }
}


const  getScoreStudentBySession = async (studentId) =>{
    try {
        const query = `
      WITH ScoreData AS (
        SELECT 
          s.student_id,
          s.name,
          c.name AS class_name,
          sem.years AS academic_year,
          sem.name AS semester,
          sub.name AS subject_name,
          sub.theo_credit,
          sub.pra_credit,
          g.theo_regular1,
          g.theo_regular2,
          g.theo_regular3,
          g.pra_regular1,
          g.pra_regular2,
          g.pra_regular3,
          g.mid,
          g.final,
          g.avr AS score,
          CASE 
            WHEN g.avr >= 9.0 THEN 4.0
            WHEN g.avr >= 8.5 THEN 3.7
            WHEN g.avr >= 8.0 THEN 3.5
            WHEN g.avr >= 7.0 THEN 3.0
            WHEN g.avr >= 6.5 THEN 2.5
            WHEN g.avr >= 5.5 THEN 2.0
            WHEN g.avr >= 5.0 THEN 1.5
            WHEN g.avr >= 4.0 THEN 1.0
            ELSE 0
          END AS grade_point
        FROM scores g
        INNER JOIN students s ON g.student_id = s.student_id AND s.isDeleted = false
        INNER JOIN clazz c ON s.clazz_id = c.id 
        INNER JOIN course_sections cs ON g.course_section_id = cs.id AND cs.isCompleted = false
        INNER JOIN subjects sub ON cs.subject_id = sub.subject_id AND sub.isDeleted = false
        INNER JOIN sessions sem ON cs.session_id = sem.id
        WHERE s.student_id = :studentId
      )
      SELECT 
        student_id,
        name,
        class_name,
        academic_year,
        semester,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'subject_name', subject_name,
            'credits', (COALESCE(theo_credit, 0) + COALESCE(pra_credit, 0)),
            'theo_credit', theo_credit,
            'pra_credit', pra_credit,
            'theo_regular1', IF(theo_regular1 IS NULL, '-', FORMAT(theo_regular1, 1)),
            'theo_regular2', IF(theo_regular2 IS NULL, '-', FORMAT(theo_regular2, 1)),
            'theo_regular3', IF(theo_regular3 IS NULL, '-', FORMAT(theo_regular3, 1)),
            'pra_regular1', IF(pra_regular1 IS NULL, '-', FORMAT(pra_regular1, 1)),
            'pra_regular2', IF(pra_regular2 IS NULL, '-', FORMAT(pra_regular2, 1)),
            'pra_regular3', IF(pra_regular3 IS NULL, '-', FORMAT(pra_regular3, 1)),
            'midterm', IF(mid IS NULL, '-', FORMAT(mid, 1)),
            'final', IF(final IS NULL, '-', FORMAT(final, 1)),
            'average', IF(score IS NULL, '-', FORMAT(score, 1)),
            'grade_point', FORMAT(grade_point, 1)
          )
        ) AS subjects,
        COUNT(*) as total_subjects,
        SUM(COALESCE(theo_credit, 0) + COALESCE(pra_credit, 0)) as total_credits,
        FORMAT(
          AVG(grade_point * (COALESCE(theo_credit, 0) + COALESCE(pra_credit, 0))) / 
          AVG(COALESCE(theo_credit, 0) + COALESCE(pra_credit, 0)), 
          2
        ) as gpa
      FROM ScoreData
      GROUP BY student_id,name,class_name, academic_year, semester
      ORDER BY academic_year DESC, semester ASC`;

    const results = await sequelize.query(query, {
      replacements: { studentId },
      type: QueryTypes.SELECT
    });

    if (results.length === 0) {
      return {
        message: 'Không tìm thấy điểm của sinh viên này',
        data: []
      };
    }


    // Parse the JSON string in subjects field
        const formattedResults = results.map(result => ({
            ...result,
            subjects: safeParseJSON(result.subjects)
        }));

        return {
            data: formattedResults
        };
        
    } catch (error) {
        console.error('Error fetching student scores:', error);
        throw new Error('Lỗi khi lấy điểm sinh viên');
    }
}


const  getScoreParentStudentBySession = async (ParentId, studentID) =>{
    try {
        const query = `
      WITH ScoreData AS (
        SELECT 
          s.student_id,
          s.name,
          c.name AS class_name,
          sem.years AS academic_year,
          sem.name AS semester,
          sub.name AS subject_name,
          sub.theo_credit,
          sub.pra_credit,
          g.theo_regular1,
          g.theo_regular2,
          g.theo_regular3,
          g.pra_regular1,
          g.pra_regular2,
          g.pra_regular3,
          g.mid,
          g.final,
          g.avr AS score,
          CASE 
            WHEN g.avr >= 9.0 THEN 4.0
            WHEN g.avr >= 8.5 THEN 3.7
            WHEN g.avr >= 8.0 THEN 3.5
            WHEN g.avr >= 7.0 THEN 3.0
            WHEN g.avr >= 6.5 THEN 2.5
            WHEN g.avr >= 5.5 THEN 2.0
            WHEN g.avr >= 5.0 THEN 1.5
            WHEN g.avr >= 4.0 THEN 1.0
            ELSE 0
          END AS grade_point
        FROM scores g
        INNER JOIN students s ON g.student_id = s.student_id AND s.isDeleted = false
        INNER JOIN clazz c ON s.clazz_id = c.id 
        INNER JOIN course_sections cs ON g.course_section_id = cs.id AND cs.isCompleted = false
        INNER JOIN subjects sub ON cs.subject_id = sub.subject_id AND sub.isDeleted = false
        INNER JOIN sessions sem ON cs.session_id = sem.id
        INNER JOIN parents p ON s.parent_id = p.parent_id
        WHERE p.parent_id = :ParentId AND s.student_id = :studentID
      )
      SELECT 
        student_id,
        name,
        class_name,
        academic_year,
        semester,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'subject_name', subject_name,
            'credits', (COALESCE(theo_credit, 0) + COALESCE(pra_credit, 0)),
            'theo_credit', theo_credit,
            'pra_credit', pra_credit,
            'theo_regular1', IF(theo_regular1 IS NULL, '-', FORMAT(theo_regular1, 1)),
            'theo_regular2', IF(theo_regular2 IS NULL, '-', FORMAT(theo_regular2, 1)),
            'theo_regular3', IF(theo_regular3 IS NULL, '-', FORMAT(theo_regular3, 1)),
            'pra_regular1', IF(pra_regular1 IS NULL, '-', FORMAT(pra_regular1, 1)),
            'pra_regular2', IF(pra_regular2 IS NULL, '-', FORMAT(pra_regular2, 1)),
            'pra_regular3', IF(pra_regular3 IS NULL, '-', FORMAT(pra_regular3, 1)),
            'midterm', IF(mid IS NULL, '-', FORMAT(mid, 1)),
            'final', IF(final IS NULL, '-', FORMAT(final, 1)),
            'average', IF(score IS NULL, '-', FORMAT(score, 1)),
            'grade_point', FORMAT(grade_point, 1)
          )
        ) AS subjects,
        COUNT(*) as total_subjects,
        SUM(COALESCE(theo_credit, 0) + COALESCE(pra_credit, 0)) as total_credits,
        FORMAT(
          AVG(grade_point * (COALESCE(theo_credit, 0) + COALESCE(pra_credit, 0))) / 
          AVG(COALESCE(theo_credit, 0) + COALESCE(pra_credit, 0)), 
          2
        ) as gpa
      FROM ScoreData
      GROUP BY student_id, name, class_name, academic_year, semester
      ORDER BY academic_year DESC, semester ASC`;

    const results = await sequelize.query(query, {
      replacements: { ParentId, studentID },
      type: QueryTypes.SELECT
    });

    if (results.length === 0) {
      return {
        message: 'Không tìm thấy điểm của con phụ huynh này',
        data: []
      };
    }

    // Parse the JSON string in subjects field
        const formattedResults = results.map(result => ({
            ...result,
            subjects: safeParseJSON(result.subjects)
        }));


    return {
      data: formattedResults,
    };
        
    } catch (error) {
        console.error('Error fetching student scores:', error);
        throw new Error('Lỗi khi lấy điểm sinh viên');
    }
}




module.exports = {
    getScoreStudentBySession,
    getScoreParentStudentBySession
};