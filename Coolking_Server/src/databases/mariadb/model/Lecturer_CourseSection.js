const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Lecturer_CourseSection', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    lecturer_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      references: {
        model: 'lecturers',
        key: 'lecturer_id'
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
    isMain: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    practice_gr: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'lecturers_coursesections',
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
        name: "lecturer_id",
        using: "BTREE",
        fields: [
          { name: "lecturer_id" },
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
