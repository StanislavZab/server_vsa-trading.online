const net = require('net');
const uuid = require('uuid');
const EventEmitter = require('events');

class quikSocket extends EventEmitter {
    _sockets = [];
    _isFree = {};
    isConnected = false;
    _isSendRequest = null;
    _queueSendRequest = [];

    setEventsSocket(socket) {
        this._sockets.push(socket)
        socket.id = uuid.v4();
        socket.queueSub = [];
        socket.queueNewSub = [];
        this._isFree[socket.id] = true;
        this.isConnected = true;
        let message = '';
        
        socket.on('error',data => {
        console.log(data)
        })
    
        socket.on('end', data => {
            this.isConnected = false;
            const index = this._sockets.indexOf(socket);
            if (index > -1) { 
                this._sockets.splice(index, 1);
            }
            if(this._sockets.length === 0) this.emit('disconnect');
            console.log('DISCONNECTED: ' + socket.remoteAddress + ':' + socket.remotePort);
            this._socket = null;
        })

        const _this = this;
        socket.on('readable', function () {
            let data;
            
            while ((data = this.read())) {
                message = message + data.toString();
            }
            
            if(message.slice(message.length - 4, -1) === 'end') {
                _this._isFree[socket.id] = true;
                try {
                    const msg = JSON.parse(message.slice(0,message.length - 4));
                    message = '';
                    if(!_this.emit(msg.id, msg)){
                        console.log('Нет подписанных обработчиков на событие:',msg.id);
                    }
                    if(!_this.sendSub(socket)) {
                        if(_this._queueSendRequest.length > 0) {
                            const send = _this._queueSendRequest.shift();
                            _this.send(socket, send);
                        }
                    }
                } catch (error) {
                    console.log(error);
                }
            }
        });

        if(this._sockets.length === 1) this.emit('connect');
    }

    setEventsSocketCb(socket) {
        const _this = this;
        let message = '';

        socket.on('readable', function () {
            let data;
            
            while ((data = this.read())) {
                message = message + data.toString();
            }
            
            if(message.slice(message.length - 4, -1) === 'end') {
                let temp = message.split('end\n');
                temp = temp.splice(0, temp.length - 1);
                message = '';
                temp.forEach(mes => {
                    try {
                        const msg = JSON.parse(mes);
                        if(msg.error) throw new Error(msg.error);
                        _this.emit(msg.cmd, msg.data)
                    } catch (error) {
                        console.log(error, message);
                        _this.emit('err', error);
                    }
                })
                
            }
        });

        socket.on('end', data => {
            console.log('DISCONNECTED: ' + socket.remoteAddress + ':' + socket.remotePort);
        })
    }

    server = net.createServer( socket => {
        const _this = this;
        const timer = setTimeout(() => {
            socket.destroy();
        }, 3000);

        socket.once('data', function (data) {
            const mes = data.toString();

            if(mes === 'tcp_client') {
                clearTimeout(timer);
                _this.setEventsSocket(socket);
                console.log('tcp_client CONNECTED: ' + socket.remoteAddress + ':' + socket.remotePort);
            } else if(mes === 'callback_client') {
                clearTimeout(timer);
                _this.setEventsSocketCb(socket);
                console.log('callback_client CONNECTED: ' + socket.remoteAddress + ':' + socket.remotePort);
            }
        });

    });

    listen(port, cb) {
        this.server.listen(port || this._port, () => cb(port || this._port));
    }

    sendRequest(cmd, data) {
        //const socket = this._sockets[0];
        const id = uuid.v4();
        return new Promise((resolve, reject) => {
            if(!this.isConnected) return reject('No connected QUIK');

            let isSend = false;

            for(let socket of this._sockets) {
                if(this._isFree[socket.id] && !isSend) {
                    isSend = true;
                    this._isFree[socket.id] = false;
                    this.send(socket, {cmd, id, data});
                } 
            }
            
            if(!isSend) {
                this._queueSendRequest.push({cmd, id, data});
                console.log('Сообщение добавлено в очередь');
            }

            this.once(id, msg => {
                if(msg.error) reject(msg.error);
                resolve(msg.data);
            });
        })
    }

    subscription(data) {
        if(!this.isConnected) return false;
        if(this._sockets.length === 1) {
            this._sockets[0].queueNewSub.push(data);
        }
        return true;
    }

    sendSub(socket) {
        if(socket.queueNewSub.length === 0) return false;

        const subData = socket.queueNewSub.shift();
        
        if(socket.queueSub.indexOf(subData) !== -1) return false;

        socket.queueSub.push(subData);

        let isSend = false;

        for(let socket of this._sockets) {
            if(this._isFree[socket.id] && !isSend) {
                isSend = true;
                this._isFree[socket.id] = false;
                this.send(socket, {cmd: 'subscribe_to_candles', data: subData});
            } 
        }
        
        if(!isSend) {
            this._queueSendRequest.push({cmd: 'subscribe_to_candles', data: subData});
        }
        return true;
    }

    send(socket, mes) {
        console.log('Send message', mes)
        socket.write(JSON.stringify(mes) + '\n');
    }
}

module.exports = new quikSocket();



  
  
  
  
