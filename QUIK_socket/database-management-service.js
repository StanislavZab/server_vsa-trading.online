const db = require('../models');
const { Op } = require('sequelize')
const { Base_candles, Contracts, Securities } = require('../models');


class DatabaseManagementService {
    arrayTf = [1,2,3,4,5,10,15,20,30,60];
    async getInstruments(){
        try {
            const data = await Securities.findAll();
            if(data){
                const instruments = data.map(item => {
                    return item.dataValues.instrument;
                })
                return instruments;
            }
            return null;
        } catch (error) {
            console.log(`Ошибка базы данных: ${error}`);
            return null;
        }
        
    }

    //принимает объект типа {"RTS":[{"code":"RIZ2","scale":10,"min_price_step":10},{"code":"RIH3","scale":10,"min_price_step":10}]}
    async updateSecuritiesTable(key, data){
        await db.Securities.update(
            {
              current_contract:data[key][0].code,
              next_contract:data[key][1].code,
              scale:data[key][0].scale,
              min_price_step:data[key][0].min_price_step
            },
            {where:{instrument: key}}
        )
    }

    async updateContractsTable(key, data){
        for(let j = 0; j < data[key].length;j++){
            const res = await db.Contracts.findOne({where:{sec_code:data[key][j].code}});
            if(!res){
                const inst = await db.Securities.findOne({where: {instrument:key}});
                await db.Contracts.create({
                    sec_code:data[key][j].code,
                    mat_date:data[key][j].mat_date,
                    name:data[key][j].name,
                    securities_id:inst.id
                }) 
            }
        }
    }

    async getMaxTimeCandles(){
        const lastTimeCandles = {};
        const securities = (await db.Securities.findAll({
            attributes: ['current_contract'],
            row: true,
        })).map(item => {
            return item.dataValues
        });

        for(let i = 0; i < securities.length; i++) { 
            const id = (await db.Contracts.findOne({where: {sec_code: securities[i].current_contract}})).dataValues.id;
            for(let j = 0; j < this.arrayTf.length; j++){
                const lastCandle = await db.Base_candles.findOne({
                    where: {
                        contract_id:{
                            [db.Sequelize.Op.eq]: id,
                        },
                        timeframe:{
                            [db.Sequelize.Op.eq]: this.arrayTf[j],
                        },
                    },
                    attributes: [[db.Sequelize.fn('max', db.Sequelize.col('time')), 'maxTime']],
                    row: true,
                })
                const time = lastCandle.dataValues.maxTime;
                const objTf = {};
                if(time){
                    objTf[this.arrayTf[j]] = time;
                }else{
                    objTf[this.arrayTf[j]] = 0;
                }
                lastTimeCandles[securities[i].current_contract] = {...lastTimeCandles[securities[i].current_contract], ...objTf};
            }
        }
        return lastTimeCandles;
    }

    async getContractId(code){
        return (await db.Contracts.findOne({where:{sec_code:code}})).dataValues.id;
    }

    // async getMaxIndexCandles(db){
    //     const lastIndexCandles = {};
    //     const securities = (await db.Securities.findAll({
    //         attributes: ['current_contract'],
    //         row: true,
    //     })).map(item => {
    //         return item.dataValues
    //     });

    //     for(let i = 0; i < securities.length; i++) { 
    //         const id = (await db.Contracts.findOne({where: {sec_code: securities[i].current_contract}})).dataValues.id;
    //         for(let j = 0; j < this.arrayTf.length; j++){
    //             const lastCandle = await db.Base_candles.findOne({
    //                 where: {
    //                     contract_id:{
    //                         [db.Sequelize.Op.eq]: id,
    //                     },
    //                     timeframe:{
    //                         [db.Sequelize.Op.eq]: this.arrayTf[j],
    //                     },
    //                 },
    //                 attributes: [[db.Sequelize.fn('max', db.Sequelize.col('index')), 'maxIndex']],
    //                 row: true,
    //             })
    //             const index = lastCandle.dataValues.maxIndex;
    //             const objTf = {};
    //             if(index){
    //                 objTf[this.arrayTf[j]] = index;
    //             }else{
    //                 objTf[this.arrayTf[j]] = 0;
    //             }
    //             lastIndexCandles[securities[i].current_contract] = {...lastIndexCandles[securities[i].current_contract], ...objTf};
    //         }
    //     }
    //     return lastIndexCandles;
    // }

    async setCandle(id, candle, timeframe){
        try {
            await Base_candles.create({
                contract_id: id,
                timeframe:timeframe,
                time:candle.datetime,
                open:candle.open,
                close:candle.close,
                low:candle.low,
                high:candle.high,
                volume:candle.volume
            })
        } catch (error) {
            console.log(error)
        }
    }

    async setCandles(data, lastCandle){
        for(let code of data){
            console.log(code.code);
            let contract_id = await this.getContractId(code.code);
            for(let tf of code.data){
                console.log('----timeframe',tf.timeframe,'load',tf?.candles?.length,'candles');
                if(tf.candles?.length){
                    for(let candle of tf.candles){
                        const g = {}
                        g[tf.timeframe] = candle.datetime;
                        lastCandle[code.code] = {...lastCandle[code.code], ...g};
                        await this.setCandle(contract_id, candle, tf.timeframe);
                    }
                    console.log('----OK');
                }
            }
            console.log('')
        }
    }
}

module.exports = new DatabaseManagementService();