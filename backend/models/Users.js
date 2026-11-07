


module.exports = (sequelize, DataTypes) => {

    const Users = sequelize.define('Users', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true // validates that the value is in email format
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });

    Users.associate = (models) => {
        Users.hasMany(models.Tasks, {
            foreignKey: 'userId',
            as: 'tasks'
        });
    };

    return Users;
}