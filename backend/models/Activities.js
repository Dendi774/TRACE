


module.exports = (sequelize, DataTypes) => {
  const Activities = sequelize.define('Activities', {
    activity_ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_ID: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    subject_ID: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    task_Name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: { notEmpty: true }
    },
    deadline: {
      type: DataTypes.DATE, // MySQL DATETIME
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'Pending',
      validate: { isIn: [['Pending', 'Due Soon', 'Overdue', 'Completed']] }
    }
  }, {
    tableName: 'Activities',
    timestamps: false
  });

  Activities.associate = (models) => {
    Activities.belongsTo(models.Users, {
      foreignKey: { name: 'user_ID', allowNull: false },
      onDelete: 'CASCADE'
    });
    Activities.belongsTo(models.Subjects, {
      foreignKey: { name: 'subject_ID', allowNull: false },
      onDelete: 'CASCADE'
    });
  };

  return Activities;
};