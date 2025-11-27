const { QueryTypes } = require('sequelize');
const sequelize = require("../config/mariadb.conf");
const initModels = require("../databases/mariadb/model/init-models");
const models = initModels(sequelize);

const convertToGrade4 = (score10) => {
  if (score10 === null || score10 === undefined) return 0;
  if (score10 >= 9.0) return 4.0;
  if (score10 >= 8.5) return 3.7;
  if (score10 >= 8.0) return 3.5;
  if (score10 >= 7.0) return 3.0;
  if (score10 >= 6.0) return 2.5;
  if (score10 >= 5.5) return 2.0;
  if (score10 >= 5.0) return 1.5;
  if (score10 >= 4.0) return 1.0;
  return 0;
};

const calculateGPA = (scoresList, type = '4') => {
  if (!scoresList || scoresList.length === 0) return 0.00;
  let totalScoreCredits = 0;
  let totalCredits = 0;
  for (const item of scoresList) {
    if (item.avr !== null && item.avr !== undefined) {
      const credits = (item.theo_credit || 0) + (item.pra_credit || 0);
      if (credits > 0) {
        let scoreToCalc = (type === '10') ? parseFloat(item.avr) : convertToGrade4(parseFloat(item.avr));
        totalScoreCredits += scoreToCalc * credits;
        totalCredits += credits;
      }
    }
  }
  if (totalCredits === 0) return 0.00;
  return parseFloat((totalScoreCredits / totalCredits).toFixed(2));
};

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


const getScoreStudentBySession = async (studentId) => {
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
          (COALESCE(sub.theo_credit, 0) + COALESCE(sub.pra_credit, 0)) AS total_credit,
          g.theo_regular1, g.theo_regular2, g.theo_regular3,
          g.pra_regular1, g.pra_regular2, g.pra_regular3,
          g.mid, g.final,
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
        INNER JOIN course_sections cs ON g.course_section_id = cs.id 
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
            'credits', total_credit,
            'theo_credit', theo_credit,
            'pra_credit', pra_credit,
            'theo_regular1', IFNULL(theo_regular1, '-'),
            'theo_regular2', IFNULL(theo_regular2, '-'),
            'theo_regular3', IFNULL(theo_regular3, '-'),
            'pra_regular1', IFNULL(pra_regular1, '-'),
            'pra_regular2', IFNULL(pra_regular2, '-'),
            'pra_regular3', IFNULL(pra_regular3, '-'),
            'midterm', IFNULL(mid, '-'),
            'final', IFNULL(final, '-'),
            'average', IFNULL(score, '-'),
            'grade_point', grade_point
          )
        ) AS subjects,
        COUNT(*) as total_subjects,
        SUM(total_credit) as total_credits,
        
        -- Công thức tính GPA
        FORMAT(
          SUM(
              CASE WHEN score IS NOT NULL THEN grade_point * total_credit ELSE 0 END
          ) / 
          NULLIF(SUM(CASE WHEN score IS NOT NULL THEN total_credit ELSE 0 END), 0), 
          2
        ) as gpa

      FROM ScoreData
      GROUP BY student_id, name, class_name, academic_year, semester
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
};


const getScoreParentStudentBySession = async (ParentId, studentID) => {
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
          (COALESCE(sub.theo_credit, 0) + COALESCE(sub.pra_credit, 0)) AS total_credit,
          g.theo_regular1, g.theo_regular2, g.theo_regular3,
          g.pra_regular1, g.pra_regular2, g.pra_regular3,
          g.mid, g.final,
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
        INNER JOIN course_sections cs ON g.course_section_id = cs.id 
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
            'credits', total_credit,
            'theo_credit', theo_credit,
            'pra_credit', pra_credit,
            'theo_regular1', IFNULL(theo_regular1, '-'),
            'theo_regular2', IFNULL(theo_regular2, '-'),
            'theo_regular3', IFNULL(theo_regular3, '-'),
            'pra_regular1', IFNULL(pra_regular1, '-'),
            'pra_regular2', IFNULL(pra_regular2, '-'),
            'pra_regular3', IFNULL(pra_regular3, '-'),
            'midterm', IFNULL(mid, '-'),
            'final', IFNULL(final, '-'),
            'average', IFNULL(score, '-'),
            'grade_point', grade_point
          )
        ) AS subjects,
        COUNT(*) as total_subjects,
        SUM(total_credit) as total_credits,
        FORMAT(
          SUM(
            CASE WHEN score IS NOT NULL THEN grade_point * total_credit ELSE 0 END
          ) /
          NULLIF(SUM(
            CASE WHEN score IS NOT NULL THEN total_credit ELSE 0 END
          ), 0),
          2
        ) AS gpa
      FROM ScoreData
      GROUP BY student_id, name, class_name, academic_year, semester
      ORDER BY academic_year DESC, semester ASC
    `;

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
};





module.exports = {
  getScoreStudentBySession,
  getScoreParentStudentBySession,
  calculateGPA
};