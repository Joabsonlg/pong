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
        this.games = {};
    }

    /**
     * Initialize the server and start listening for connections
     */
    initialize() {
        this.configureServer();
        this.handleConnections();
        this.startListening();
    }

    /**
     * Configure the express app
     */
    configureServer() {
        this.app.use(express.static('public'));
        this.app.use(cors());
        this.app.get('/', (req, res) => {
            res.sendFile('../public/index.html');
        });
    }

    /**
     * Handle incoming socket connections
     */
    handleConnections() {
        this.io.on('connection', (socket) => {
            // Verificar se existe um jogo disponível
            let game = this.findAvailableGame();

            // Se não houver um jogo disponível, cria um
            if (!game) {
                const roomId = this.generateRoomId();
                game = new Game(roomId);
                game.setSocketIO(this.io);
                this.games[roomId] = game;
                game.initGame();
            }

            // Adicione o jogador ao jogo
            game.addPlayer(socket);

            socket.emit('playersData', game.getActivePlayers());
            socket.emit('paddleData', game.paddle);

            socket.on('disconnect', () => {
                game.removePlayer(socket.id);

                if (game.isEmpty()) {
                    delete this.games[game.roomId];
                } else {
                    this.io.to(game.roomId).emit('playersData', game.getActivePlayers());
                    this.io.to(game.roomId).emit('scoreUpdate', {left: game.leftScore, right: game.rightScore});
                    this.io.to(game.roomId).emit('paddleData', game.paddle);
                    game.gameStarted = false;
                    this.io.to(game.roomId).emit('waitForPlayer');
                }
            });

            socket.on('updatePaddle', (data) => {
                if (data.player === 'left') {
                    game.leftPaddleY = data.y;
                } else {
                    game.rightPaddleY = data.y;
                }

                // Transmitir a atualização para todos os clientes do jogo
                this.io.to(game.roomId).emit('updatePaddle', data);
            });

            // Quando o jogo estiver cheio, inicie o jogo
            if (game.isFull()) {
                console.log(`Game ${game.roomId} is full!`);
                this.io.to(game.roomId).emit('startGame');

                setTimeout(() => {
                    game.gameStarted = true;
                }, 1000);
            } else {
                game.gameStarted = false;
                this.io.to(game.roomId).emit('waitForPlayer');
            }
        });
    }

    /**
     * Find an available game
     * @returns {Game|null}
     */
    findAvailableGame() {
        for (const roomId in this.games) {
            const game = this.games[roomId];
            if (!game.isFull()) {
                return game;
            }
        }
        return null;
    }

    /**
     * Generate a random room ID
     * @returns {string}
     */
    generateRoomId() {
        // Gere um 'ID' de sala aleatório
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let roomId = '';
        for (let i = 0; i < 6; i++) {
            roomId += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return roomId;
    }

    /**
     * Start listening for connections
     */
    startListening() {
        const port = process.env.PORT || 3000;
        this.server.listen(port, () => {
            console.log(`Listening on *:${port}`);
        });
    }
}

module.exports = GameServer;
