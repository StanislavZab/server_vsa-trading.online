module.exports = (sequelize, DataTypes) => {
    const Base_candles = sequelize.define('base_candles', {
            contract_id: {
                type: DataTypes.INTEGER
            },
            timeframe: DataTypes.INTEGER,
            time: DataTypes.BIGINT,
            high: DataTypes.INTEGER,
            open: DataTypes.INTEGER,
            close: DataTypes.INTEGER,
            low: DataTypes.INTEGER,
            volume: DataTypes.INTEGER,
        },
        {
            indexes: [
                {
                    unique: true,
                    fields: ['contract_id', 'timeframe', 'time']
                }
            ],
            timestamps: false,
            tableName: 'base_candles',
        });
        return Base_candles;
    };