const GameServer = require('./gameServer');

const gameServer = new GameServer();
gameServer.game.setSocketIO(gameServer.io);
gameServer.initialize();
