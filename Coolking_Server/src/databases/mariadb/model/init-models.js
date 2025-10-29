var DataTypes = require("sequelize").DataTypes;

var _Account = require("./Account");
var _Staff = require("./Staff");
var _Attendance = require("./Attendance");
var _AttendanceStudent = require("./Attendance_Student");
var _Schedule = require("./Schedule");
var _ScheduleException = require("./ScheduleException");
var _Clazz = require("./Clazz");
var _CourseSection = require("./CourseSection");
var _Faculty = require("./Faculty");
var _Lecturer = require("./Lecturer");
var _LecturerCourseSection = require("./Lecturer_CourseSection");
var _Major = require("./Major");
var _Parent = require("./Parent");
var _RefreshToken = require("./RefreshToken");
var _Score = require("./Score");
var _Session = require("./Session");
var _Student = require("./Student");
var _StudentCourseSection = require("./Student_CourseSection");
var _Subject = require("./Subject");

function initModels(sequelize) {
  const Staff = _Staff(sequelize, DataTypes);
  const Attendance = _Attendance(sequelize, DataTypes);
  const AttendanceStudent = _AttendanceStudent(sequelize, DataTypes);
  const Clazz = _Clazz(sequelize, DataTypes);
  const CourseSection = _CourseSection(sequelize, DataTypes);
  const Faculty = _Faculty(sequelize, DataTypes);
  const Lecturer = _Lecturer(sequelize, DataTypes);
  const LecturerCourseSection = _LecturerCourseSection(sequelize, DataTypes);
  const Major = _Major(sequelize, DataTypes);
  const Parent = _Parent(sequelize, DataTypes);
  const Score = _Score(sequelize, DataTypes);
  const Session = _Session(sequelize, DataTypes);
  const Student = _Student(sequelize, DataTypes);
  const StudentCourseSection = _StudentCourseSection(sequelize, DataTypes);
  const Subject = _Subject(sequelize, DataTypes);
  const Account = _Account(sequelize, DataTypes);
  const Schedule = _Schedule(sequelize, DataTypes);
  const ScheduleException = _ScheduleException(sequelize, DataTypes);
  const RefreshToken = _RefreshToken(sequelize, DataTypes);

  // ===== Associations =====

  // Clazz - CourseSection
  CourseSection.belongsTo(Clazz, { as: "clazz", foreignKey: "clazz_id" });
  Clazz.hasMany(CourseSection, { as: "course_sections", foreignKey: "clazz_id" });

  // Clazz - Student
  Student.belongsTo(Clazz, { as: "clazz", foreignKey: "clazz_id" });
  Clazz.hasMany(Student, { as: "students", foreignKey: "clazz_id" });

  // Lecturer - Clazz (homeroom_class)
  Lecturer.belongsTo(Clazz, { as: "clazz", foreignKey: "homeroom_class_id" });
  Clazz.hasOne(Lecturer, { as: "lecturer", foreignKey: "homeroom_class_id" });
  // CourseSection - Attendance
  Attendance.belongsTo(CourseSection, { as: "course_section", foreignKey: "course_section_id" });
  CourseSection.hasMany(Attendance, { as: "attendances", foreignKey: "course_section_id" });

  // Lecturer - Attendance
  Attendance.belongsTo(Lecturer, { as: "lecturer", foreignKey: "lecturer_id", targetKey: "lecturer_id" });
  Lecturer.hasMany(Attendance, { as: "attendances", foreignKey: "lecturer_id", sourceKey: "lecturer_id" });

  // Attendance - AttendanceStudent
  AttendanceStudent.belongsTo(Attendance, { as: "attendance", foreignKey: "attendance_id" });
  Attendance.hasMany(AttendanceStudent, { as: "attendance_students", foreignKey: "attendance_id" });

  // Student - AttendanceStudent
  AttendanceStudent.belongsTo(Student, { as: "student", foreignKey: "student_id", targetKey: "student_id" });
  Student.hasMany(AttendanceStudent, { as: "attendance_students", foreignKey: "student_id", sourceKey: "student_id" });

  // CourseSection - Schedule
  Schedule.belongsTo(CourseSection, { as: "course_section", foreignKey: "course_section_id" });
  CourseSection.hasMany(Schedule, { as: "schedules", foreignKey: "course_section_id" });

  // Schedule - ScheduleException
  ScheduleException.belongsTo(Schedule, { as: "schedule", foreignKey: "schedule_id" });
  Schedule.hasMany(ScheduleException, { as: "schedule_exceptions", foreignKey: "schedule_id" });

  // ScheduleException - Lecturer (new_lecturer_id)
  ScheduleException.belongsTo(Lecturer, { as: "new_lecturer", foreignKey: "new_lecturer_id", targetKey: "lecturer_id" });
  Lecturer.hasMany(ScheduleException, { as: "schedule_exceptions", foreignKey: "new_lecturer_id", sourceKey: "lecturer_id" });

  // CourseSection - LecturerCourseSection
  LecturerCourseSection.belongsTo(CourseSection, { as: "course_section", foreignKey: "course_section_id" });
  CourseSection.hasMany(LecturerCourseSection, { as: "lecturers_course_sections", foreignKey: "course_section_id" });

  // CourseSection - Score
  Score.belongsTo(CourseSection, { as: "course_section", foreignKey: "course_section_id" });
  CourseSection.hasMany(Score, { as: "scores", foreignKey: "course_section_id" });

  // CourseSection - StudentCourseSection
  StudentCourseSection.belongsTo(CourseSection, { as: "course_section", foreignKey: "course_section_id" });
  CourseSection.hasMany(StudentCourseSection, { as: "students_course_sections", foreignKey: "course_section_id" });
  
  // Faculty - Lecturer
  Lecturer.belongsTo(Faculty, { as: "faculty", foreignKey: "faculty_id", targetKey: "faculty_id" });
  Faculty.hasMany(Lecturer, { as: "lecturers", foreignKey: "faculty_id", sourceKey: "faculty_id" });

  // Faculty - Clazz
  Clazz.belongsTo(Faculty, { as: "faculty", foreignKey: "faculty_id", targetKey: "faculty_id" });
  Faculty.hasMany(Clazz, { as: "clazzes", foreignKey: "faculty_id", sourceKey: "faculty_id" });

  // Faculty - Subject
  Subject.belongsTo(Faculty, { as: "faculty", foreignKey: "faculty_id", targetKey: "faculty_id" });
  Faculty.hasMany(Subject, { as: "subjects", foreignKey: "faculty_id", sourceKey: "faculty_id" });

  // Faculty - Major
  Major.belongsTo(Faculty, { as: "faculty", foreignKey: "faculty_id", targetKey: "faculty_id" });
  Faculty.hasMany(Major, { as: "majors", foreignKey: "faculty_id", sourceKey: "faculty_id" });

  // Major - Student
  Student.belongsTo(Major, { as: "major", foreignKey: "major_id" });
  Major.hasMany(Student, { as: "students", foreignKey: "major_id" });

  // Faculty - Dean (Lecturer)
  Faculty.belongsTo(Lecturer, { as: "dean", foreignKey: "dean_id", targetKey: "lecturer_id" });
  Lecturer.hasMany(Faculty, { as: "faculties", foreignKey: "dean_id", sourceKey: "lecturer_id" });

  // Lecturer - LecturerCourseSection
  LecturerCourseSection.belongsTo(Lecturer, { as: "lecturer", foreignKey: "lecturer_id", targetKey: "lecturer_id" });
  Lecturer.hasMany(LecturerCourseSection, { as: "lecturers_course_sections", foreignKey: "lecturer_id", sourceKey: "lecturer_id" });

  // Session - CourseSection
  CourseSection.belongsTo(Session, { as: "session", foreignKey: "session_id" });
  Session.hasMany(CourseSection, { as: "course_sections", foreignKey: "session_id" });

  // Student - Parent
  Student.belongsTo(Parent, { as: "parent", foreignKey: "parent_id", targetKey: "parent_id" });
  Parent.hasMany(Student, { as: "students", foreignKey: "parent_id", sourceKey: "parent_id" });

  // Student - Score
  Score.belongsTo(Student, { as: "student", foreignKey: "student_id", targetKey: "student_id" });
  Student.hasMany(Score, { as: "scores", foreignKey: "student_id", sourceKey: "student_id" });

  // Student - StudentCourseSection
  StudentCourseSection.belongsTo(Student, { as: "student", foreignKey: "student_id", targetKey: "student_id" });
  Student.hasMany(StudentCourseSection, { as: "students_course_sections", foreignKey: "student_id", sourceKey: "student_id" });

  // Subject - CourseSection
  CourseSection.belongsTo(Subject, { as: "subject", foreignKey: "subject_id", targetKey: "subject_id" });
  Subject.hasMany(CourseSection, { as: "course_sections", foreignKey: "subject_id", sourceKey: "subject_id" });

  // Account không quan hệ trực tiếp với Student/Lecturer/Parent
  // vì user_id có thể map đến nhiều bảng khác nhau → xử lý bằng hook trong Account.js

  // RefreshToken - Account
  RefreshToken.belongsTo(Account, { as: "account", foreignKey: "user_id", targetKey: "user_id" });
  Account.hasMany(RefreshToken, { as: "refresh_tokens", foreignKey: "user_id", sourceKey: "user_id" });

  return {
    Staff,
    Account,
    Attendance,
    AttendanceStudent,
    Schedule,
    ScheduleException,
    Clazz,
    CourseSection,
    Faculty,
    Lecturer,
    LecturerCourseSection,
    Major,
    Parent,
    RefreshToken,
    Score,
    Session,
    Student,
    StudentCourseSection,
    Subject,
  };
}

module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
