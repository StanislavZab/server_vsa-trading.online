const cliProgress = require('cli-progress');
const dbService = require('./database-management-service');
const controller = require('./controller');


module.exports = function Event_socket(socket, io){

  socket.on('lua_error', msg => {
    console.log(msg);
  });

  socket.on('isConnected', controller.isConnected);

  socket.on('getCurrentContracts', controller.getCurrentContracts);

  socket.on('setCandles', controller.setCandles);

  socket.on('subscribe_to_contracts', async (msg) => {
    msg = {"cmd":"get_current_candles"}
    socket.write(JSON.stringify(msg)+'\n');
  });

  socket.on('new_candle', controller.newCandle);

  socket.on('get_current_candles', async (msg) => {
    const data = [];
    for(let [code, value] of Object.entries(msg.data)){
      if(code.split('|')[1] === '1'){
        data.push({code:code.split('|')[0], price:value.candle.close})
      }
      const candle = {
        time: value.candle.datetime, 
        open: value.candle.open, 
        close: value.candle.close, 
        high: value.candle.high, 
        low: value.candle.low,
        volume: value.candle.volume
      }
      io.of('/chart').to(`${code.split('|')[0]}${code.split('|')[1]}`).emit("currentCandle", {code:code.split('|')[0], tf:Number(code.split('|')[1]), candle: candle});
    }
    io.of('/quotes').emit("data", data);
    setTimeout(() => {
      const f = {"cmd":"get_current_candles"}
      socket.write(JSON.stringify(f)+'\n');
    }, 1000);
  });
}


  