


module.exports = (sequelize, DataTypes) => {
  const Subjects = sequelize.define('Subjects', {
    subject_ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_ID: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    subject_Name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true }
    }
  }, {
    tableName: 'Subjects',
    timestamps: false,
    // is this index
    indexes: [
      { unique: true, fields: ['user_ID', 'subject_Name'] }
    ]
  });

  Subjects.associate = (models) => {
    Subjects.belongsTo(models.Users, {
      foreignKey: { name: 'user_ID', allowNull: false },
      onDelete: 'CASCADE'
    });
    // One subject contains many activities
    Subjects.hasMany(models.Activities, {
      foreignKey: { name: 'subject_ID', allowNull: false },
      onDelete: 'CASCADE',
      hooks: true
    });
  };

  return Subjects;
};