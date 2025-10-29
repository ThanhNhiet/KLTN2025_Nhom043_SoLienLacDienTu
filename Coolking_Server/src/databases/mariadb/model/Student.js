const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Student', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    student_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "students_ibfk_1"
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    dob: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    gender: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    clazz_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'clazz',
        key: 'id'
      }
    },
    major_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'majors',
        key: 'id'
      }
    },
    parent_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'parents',
        key: 'parent_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'students',
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
        unique: true,
        using: "BTREE",
        fields: [
          { name: "student_id" },
        ]
      },
      {
        name: "clazz_id",
        using: "BTREE",
        fields: [
          { name: "clazz_id" },
        ]
      },
      {
        name: "major_id",
        using: "BTREE",
        fields: [
          { name: "major_id" },
        ]
      },
      {
        name: "student_parent_id_fk",
        using: "BTREE",
        fields: [
          { name: "parent_id" },
        ]
      },
    ]
  });
};
