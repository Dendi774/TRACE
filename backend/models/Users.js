

module.exports = (sequelize, DataTypes) => {
  const Users = sequelize.define('Users', {
    user_ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: { notEmpty: true, len: [3, 50] }
    },
    password: {
      type: DataTypes.STRING(255), // store the bcrypt hash password
      allowNull: false
    }
  }, {
    tableName: 'Users',
    timestamps: false
  });

  Users.associate = (models) => {
    // One user registers many subjects
    Users.hasMany(models.Subjects, {
      foreignKey: { name: 'user_ID', allowNull: false },
      onDelete: 'CASCADE',
      hooks: true
    });
    // One user creates many activities
    Users.hasMany(models.Activities, {
      foreignKey: { name: 'user_ID', allowNull: false },
      onDelete: 'CASCADE',
      hooks: true
    });
  };

  return Users;
};