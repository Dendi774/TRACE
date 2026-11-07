


module.exports = (sequelize, DataTypes) => {

    const Tasks = sequelize.define('Tasks', {

        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        activityName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        subject: {
            type: DataTypes.STRING,
            allowNull: false
        },
        deadline: {
            type: DataTypes.DATE,
            allowNull: false
        },
        isCompleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
        
    });

    Tasks.associate = (models) => {
        Tasks.belongsTo(models.Users, {
            foreignKey: 'userId',
            as: 'user',
            onDelete: 'CASCADE'
        });
    }

    return Tasks;
}