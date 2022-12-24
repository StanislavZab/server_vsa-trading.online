module.exports = (sequelize, DataTypes) => {
const Securities = sequelize.define('securities', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        instrument: DataTypes.STRING(5),                         // Финансовый инструмент (RI, Si, SR ...)
        current_contract: DataTypes.STRING(5),                   // Текущий фьючерсный контракт 
        next_contract: DataTypes.STRING(5),                      // Следующий фьючерсный контракт
        scale: DataTypes.INTEGER,                             // Точность (количество значащих цифр после запятой)
        min_price_step: DataTypes.INTEGER,                    // Минимальный шаг цены
    },
    {
        timestamps: false,
        tableName: 'securities',
    });
    return Securities;
};