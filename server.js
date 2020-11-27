// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var port = process.env.PORT| 5000
var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.set('port',port);
app.use('/static', express.static(__dirname + '/static'));
// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});
// Starts the server.
server.listen(port, function() {
  console.log('Starting server on port 5000');
});

// Add the WebSocket handlers
var players = {};
var gameN=0;
var games={}
io.on('connection', function(socket) {
  socket.on('new player', function() {
  	let check=true;
  	check=findGame(socket.id);
  	if(check){
  		createGame(socket.id);
	}
});
	socket.on('disconnect', () => {
			let pO;
			if(players[socket.id]!=null){
				let game=players[socket.id].game
				if(players[socket.id].color==2)pO=games[game].player1
				else pO=games[game].player2
				delete games[game]
				if(players[pO]!=null)delete players[pO]
				delete players[socket.id]
				disconnectOther(game)
			}
	});

	socket.on('drop',function(x,num,player){
		var pO;
		games[num].table=enter(games[num]||{},x,player);
		if(games[num].turn==2)games[num].turn=1;
		else games[num].turn=2;
		if(checkWin(games[num],player)){
			console.log(false)
			if(player==1) pO=games[num].player2;
			else pO=games[num].player1
			players[socket.id].wins+=1
			players[pO].losses+=1
			resetGame(games[num]);
			updateState(num,'win',player)
		}
		if(checkTie(games[num])){
			if(player==1) pO=games[num].player2;
			else pO=games[num].player1
			players[socket.id].ties+=1
			players[pO].ties+=1
			resetGame(games[num]);
			updateState(num,'tied',player)
		}
		update(games[num])
		draw(games[num],num);
	});

});

function enter(game,x,player){
	let tab=game.table
	for (i=0;i<tab.length;i++){
		if(i==6){
			tab[x][i]=player;
			break;
		}
		else if(tab[x][i]==0&&tab[x][i+1]!=0){
			tab[x][i]=player;
			break;
		}
	}
	return tab
}
function draw(game,num){
  io.sockets.emit('draw', game,num);
}

function update(game){
	io.sockets.emit('info',game,players)
}

function updateState(game,state,num){
	io.sockets.emit('gameend',game,state,num);
}
function checkWin(game,player){
	let tab=game.table
	for(i=0;i<tab.length;i++){
		for(j=0;j<tab.length;j++){
			if(i+3<tab.length)if(tab[i][j]==player&&tab[i+1][j]==player&&tab[i+2][j]==player&&tab[i+3][j]==player)return true;
			if(j+3<tab.length)if(tab[i][j]==player&&tab[i][j+1]==player&&tab[i][j+2]==player&&tab[i][j+3]==player)return true;
			if(i+3<tab.length&&j+3<tab.length)if(tab[i][j]==player&&tab[i+1][j+1]==player&&tab[i+2][j+2]==player&&tab[i+3][j+3]==player)return true;
			if(i+3<tab.length&&j-3-1)if(tab[i][j]==player&&tab[i+1][j-1]==player&&tab[i+2][j-2]==player&&tab[i+3][j-3]==player)return true;	
		}
	}
	return false;
}
function checkTie(game){
	let tab=game.table
	for(i=0;i<tab.length-4;i++){
		for(j=0;j<tab.length-4;j++){
			if(tab[i][j]==0)return false;
		}
	}
	return true

}
function resetGame(game){
	game.table= [[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]]
}


function disconnectOther(game){
	io.sockets.emit('disconnect',game);
}

function findGame(socket){
	for(i=0;i<gameN;i++){
  		if(games[i]!=null){
	  		if(games[i].players==1){
	  			games[i].game=true;
	  			games[i].player2=socket
	  			games[i].players=2
	  			players[socket]={
	  				wins:0,
	  				losses:0,
					ties: 0,
					color:2,
					game:i
	  			};
	  			io.sockets.emit('message',socket,i,2);
	  			update(games[i])
	  			draw(games[i],i);
	  			return false
	  		}
  		}
  	}
  	return true
}


function createGame(socket){
	games[gameN]={
  			table:[[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]],
  			players:1,
  			player1: socket,
  			player2:0,
  			turn:1,
  			game:false,
  			gameN:gameN

  		};

  		players[socket]={
  			wins:0,
  			losses:0,
			ties: 0,
			color:1,
			game:gameN
  		};

  		io.sockets.emit('message', socket,gameN,1);
  		update(games[gameN])
  		draw(games[gameN],gameN);
  		gameN++;
}
