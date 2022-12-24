const db = require('../models');
const { Op } = require('sequelize')
const ApiError = require('../exceptions/api-error');
const { Base_candles, Contracts } = require('../models');

class ChartService{
    async getCandles(code, tf, time){
        // if(index < 0){
        //     const ind = await db.Contracts.findOne({
        //         where: {sec_code: code},
        //         attributes: ['name'],
        //         include: {
        //             model: Base_candles,
        //             as: 'candles',
        //             where:{timeFrame: tf},
        //             attributes : [[db.Sequelize.fn('max', db.Sequelize.col('index')), 'maxIndex']],
                    
        //         }
        //     })
        //     index = ind.dataValues.candles[0].dataValues.maxIndex + index;
        //     if(index < 0){index = 0}
        // }
        const data = await db.Securities.findOne({
            where: {current_contract: code},
            attributes: ['scale', 'min_price_step', 'instrument'],
            include: {
                model: Contracts,
                where: {sec_code: code},
                attributes: ['name', 'mat_date'],
                include: {
                    model: Base_candles,
                    as: 'candles',
                    where: {
                        timeFrame: {
                            [db.Sequelize.Op.eq]: tf
                        },
                        time: {
                            [db.Sequelize.Op.gt]: time
                        }
                    },
                    attributes: ['time', 'open', 'close', 'high', 'low', 'volume']
                }
            }
        })
        const securitie = data.dataValues;
        const contract = securitie.contracts[0].dataValues;
        const res = {
            code: code, 
            timeframe: tf, 
            scale: securitie.scale,
            step_price: securitie.min_price_step,
            instrument: securitie.instrument,
            ...contract
        }
        return res;
    }
}

module.exports = new ChartService();