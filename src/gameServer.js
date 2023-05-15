const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const Game = require('./game');

class GameServer {
    constructor() {
        this.app = express();
        this.server = http.Server(this.app);
        this.io = socketIO(this.server);
        this.game = new Game();
    }

    initialize() {
        this.configureServer();
        this.handleConnections();
        this.startListening();
    }

    configureServer() {
        this.app.use(express.static('public'));
        this.app.use(cors());
        this.app.get('/', (req, res) => {
            res.sendFile('../public/index.html');
        });
    }

    handleConnections() {
        this.io.on('connection', (socket) => {
            this.game.addPlayer(socket);

            socket.emit('playersData', this.game.getActivePlayers());
            socket.emit('paddleData', this.game.paddle);

            socket.on('disconnect', () => {
                this.game.removePlayer(socket.id);
            });

            socket.on('updatePaddle', (data) => {
                if (data.player === 'left') {
                    this.game.leftPaddleY = data.y;
                } else {
                    this.game.rightPaddleY = data.y;
                }
            
                // Transmitir a atualização para todos os clientes, incluindo o cliente que enviou a atualização
                this.io.emit('updatePaddle', data);
            });
        });

        // Atualização do jogo a cada quadro
        setInterval(() => {
            this.game.updateBall();
            this.io.emit('ballData', this.game.ball);
        }, 16); // 60 quadros por segundo (1000ms / 60 = 16)
    }

    startListening() {
        const port = process.env.PORT || 3000;
        this.server.listen(port, () => {
            console.log(`Listening on *:${port}`);
        });
    }
}

module.exports = GameServer;
