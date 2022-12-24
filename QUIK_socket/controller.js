const dbService = require('./database-management-service');

class QuikController{
    _is_connected = false;
    _lastCandle = {};
    _generator;

    async isConnected(msg, socket){
        console.log('isConnected:',msg.data);
        if(msg.data){
            this._is_connected = true;
            const instruments = await dbService.getInstruments();
            if(instruments){
            socket.write(`{"cmd":"getCurrentContracts","data":${JSON.stringify(instruments)}}\n`);
            }
            return;
        }
        this._is_connected = false;
        setTimeout(() => {
            socket.write('{"cmd":"isConnected"}\n');
        }, 1000);
    }

    async getCurrentContracts(msg, socket){
        try {
            //обновляем данные в таблице инструментов
            for(let key in msg.data){
                await dbService.updateSecuritiesTable(key, msg.data);
                await dbService.updateContractsTable(key, msg.data);
            }
        
            //собираем данные о последних свечах разных ТФ у контрактов и отправляем запрос
            this._lastCandle = await dbService.getMaxTimeCandles();
            msg = {"cmd":"get_candles_from_a_certain_time","data":this._lastCandle};
        } catch (error) {
            console.log(error);
            const instruments = await dbService.getInstruments();
            msg = instruments && {"cmd":"getCurrentContracts","data":instruments};
        }
        socket.write(JSON.stringify(msg)+'\n');
    }

    async setCandles(msg, socket){
        try {
            await dbService.setCandles(msg.data, this._lastCandle);
            msg = {"cmd":"subscribe_to_contracts","data":"RIZ2|SiZ2"};
        } catch (error) {
            console.log(error);
            msg = {"cmd":"get_candles_from_a_certain_time","data":this._lastCandle};
        }
        socket.write(JSON.stringify(msg)+'\n');
    }

    async newCandle(msg, socket){
        if(this._generator == undefined){
            this._generator = gen(msg, this._lastCandle);
        }
        const res = await this._generator.next(msg.data);
        if(res.done == true){
            this._generator = undefined;
        }
        socket.write(JSON.stringify(res.value)+'\n');
    }

}



module.exports = new QuikController()

async function* gen(msg, lastCandle){
    console.log('start generator');
    for(let [code, value] of Object.entries(msg.data)){
        if(value.newCandle){
            const data = yield {"cmd":"get_candles_from_a_certain_time_new","data":lastCandle};
            await dbService.setCandles(data, lastCandle);
        }
    }
    console.log('End generator');
    return {"cmd":"get_current_candles"};
}