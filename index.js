//version 1

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const db = require('./models');
const router = require('./router/index');
const errorMiddleware = require('./middlewares/error-middleware');



const PORT = process.env.PORT || 5001;

const app = express();
const http_server = http.createServer(app);
const io = require('socket.io')(http_server, {
    cors: {
        origin: '*',
    }
});
const tcp_server = require('./socket.Quik');
//const { fn } = require('sequelize/types');



app.use(express.json());
app.use(cors({credentials: true, origin: ['http://localhost:3000']}));
app.use(cookieParser());

app.use((reg, res, next) => {
    console.log(reg.connection.remoteAddress);
    next();
});
app.use('/api', router);
app.use(errorMiddleware);


let clients = [];
let subscribes = new Map();

io.use((socket, next) => {
    console.log(socket.handshake.auth);
    next();
});

tcp_server.on('NewCandle', data => {
    const key = `${data.class}|${data.sec}|${data.interval}`;
    if(subscribes.has(key)) {
        const subCode = subscribes.get(key);

        subCode.forEach(id => {
            io.in(id).emit('newCandle', data);
        });
    }
});

tcp_server.on('UpdateCandle', data => {
    const key = `${data.class}|${data.sec}|${data.interval}`;
    console.log(key)

    if(subscribes.has(key)) {
        const subCode = subscribes.get(key);

        subCode.forEach(id => {
            io.in(id).emit('updateCandle', data);
        });
    }
});

io.on('connection', (socket) => {
    console.log(`Client with id ${socket.id} connected`)
    clients.push(socket.id)

    socket.emit('connectedQuik', tcp_server.isConnected);
    
    socket.on('data', (cmd, data, cb) => {
        console.log(cmd, data);
        tcp_server.sendRequest(cmd, data)
        .then((res) => {
            cb(res);
        })
        .catch((err) => {
            console.log(err);
        })
        
    });

    socket.on('subCode', (index, class_code, sec_code, timeframe) => {
        const key = `${class_code}|${sec_code}|${timeframe}`;
        console.log('subCode', index, class_code, sec_code, timeframe, subscribes);

        if(subscribes.has(key)) {
            const subCode = subscribes.get(key);

            subCode.add(socket.id);
        } else {
            const set = new Set([socket.id]);
            subscribes.set(key, set);
        }
        
        tcp_server.sendRequest('subscribe_to_candles', key)
        .then(res => {})
        .catch((err) => {
            console.log(err);
        })

        console.log(subscribes);
    });

    socket.on('unsubCode', (index, class_code, sec_code, timeframe) => { 
        const key = `${class_code}|${sec_code}|${timeframe}`;
        console.log('unsubCode', index, class_code, sec_code, timeframe, subscribes);

        if(subscribes.has(key)) {
            const subCode = subscribes.get(key);
            subCode.delete(socket.id);
            if(subCode.size === 0) {
                subscribes.delete(key);
                tcp_server.sendRequest('unsubscribe_from_candles', key)
                .then(res => {})
                .catch((err) => {
                    console.log(err);
                })
            }
        }
        console.log(subscribes);
    });

    socket.on('disconnect', () => {
        clients.splice(clients.indexOf(socket.id), 1);
        console.log(`Client with id ${socket.id} disconnected`);
    })
})

tcp_server.on('connect', con => io.emit('connectedQuik', true));
tcp_server.on('disconnect', con => io.emit('connectedQuik', false));

const start = () => {
    try {
        http_server.listen(PORT, () => console.log(`HTTP-server started on port ${PORT}`));
        tcp_server.listen(4000, (port) => console.log(`TCP-server started on port ${port}`));
    } catch (e) {
        console.log(e);
    }
}

start();
