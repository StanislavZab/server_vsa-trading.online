module.exports = (sequelize, DataTypes) => {
    const Contracts = sequelize.define('contracts', {
        securities_id: DataTypes.INTEGER,                         
        sec_code: DataTypes.STRING(5),  
        is_completed: DataTypes.BOOLEAN,                 
        mat_date: DataTypes.INTEGER,                      
        name: DataTypes.STRING(20),                           
        },
        {
        timestamps: false,
        tableName: 'contracts',
        });
        return Contracts; 
    };