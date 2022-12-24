const net = require('net');
const event_socket = require('./event-socket')

module.exports = (io) => {
    const tcp_server = net.createServer( socket => {
        let message = '';
        let startMsg = false;
        console.log('CONNECTED: ' + socket.remoteAddress + ':' + socket.remotePort);
        let setInt = undefined;
        
    
        socket.on('error',data => {
        console.log(data)
        })
    
        socket.on('end', data => {
            console.log('DISCONNECTED: ' + socket.remoteAddress + ':' + socket.remotePort);
            clearInterval(setInt);
        })

        event_socket(socket, io);

        socket.write('{"cmd":"isConnected"}\n');

        socket.on('data', data => {
            let str = data.toString();
            if(!startMsg){
                if(str.startsWith('start')){
                    startMsg = true;
                    if(str.endsWith('end\n')){
                        startMsg = false;
                        message = '';
                        const msg = JSON.parse(str.slice(5,str.indexOf('end')));
                        //console.log(msg.cmd);
                        if(!socket.emit(msg.cmd, msg, socket)){
                            console.log('Нет подписанных обработчиков на событие:',msg.cmd);
                        }
                    }else{
                        message = message + str;
                    }
                }
                }else{
                message = message + str;
                if(str.indexOf('end') >= 0){
                    startMsg = false;
                    const msg = JSON.parse(message.slice(5,message.length - 4));
                    //console.log(msg.cmd);
                    message = '';
                    if(!socket.emit(msg.cmd, msg, socket)){
                        console.log('Нет подписанных обработчиков на событие:',msg.cmd);
                    }
                }
            }
        })
    });
    return tcp_server;
}

  
  
  
  
