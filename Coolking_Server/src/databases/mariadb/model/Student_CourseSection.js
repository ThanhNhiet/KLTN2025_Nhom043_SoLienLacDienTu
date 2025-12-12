const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Student_CourseSection', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    student_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      references: {
        model: 'students',
        key: 'student_id'
      }
    },
    course_section_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'course_sections',
        key: 'id'
      }
    },
    practice_gr: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'students_coursesections',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "student_id",
        using: "BTREE",
        fields: [
          { name: "student_id" },
        ]
      },
      {
        name: "course_section_id",
        using: "BTREE",
        fields: [
          { name: "course_section_id" },
        ]
      },
    ]
  });
};
