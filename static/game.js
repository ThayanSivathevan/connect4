var socket = io();

var boardXMin=0;
var boardXMax=boardXMin+350;
var x;
var divisor=Math.floor(boardXMax/7);
var table=[]

var info,gameN,player;
var game  
var playerInfo;

var width=50
var height=width;

var offX=0,offY=50;

var turn=true;
var wins = 0;
var losses = 0;
var ties = 0;

var gameState,playerState=" ";

var tile = document.getElementById("tile");
var tileRed = document.getElementById("tileRed");
var tileBlue = document.getElementById("tileBlue");
var red = document.getElementById("red");
var blue = document.getElementById("blue");


document.addEventListener('mousemove', function(event) {
	if(turn&&gameState){
		if(event.offsetX>=boardXMin && event.offsetX<=boardXMax){
			x=Math.floor((event.offsetX-boardXMin)/divisor);
		}
		else if(event.offsetX<boardXMin){
			x=0;
		}
		else{
			x=6;
		}
		drawPosition();
	}
});
document.addEventListener('mousedown', function(event) {
	if(table[x][0]==0&&turn&&gameState){
		playerState=" "
		socket.emit('drop',x,gameN,player);
		context.clearRect(offX,0,width*7,height)
	}
});


socket.on('message', function(data,game,playerN,state) {
	if (info == null) {
		info = data;
		gameN=game;
		player=playerN;
	    console.log(info+" "+player+" "+game);

	}
});


socket.on('disconnect',function(data){
	if(data==gameN)location.reload();
});

socket.emit('new player');


socket.on('info',function(game,players){
	if(game.gameN==gameN){
		context.clearRect(offX,0,width*8,height)
		gameState=game.game;
		table=game.table;
		playerInfo=players[info];
		wins=playerInfo.wins
		losses=playerInfo.losses
		ties=playerInfo.ties
		if(player==game.turn)turn=true;
		else turn=false;
	}
});	

socket.on('gameend',function(game,state,num){
	if(game==game){
		if(state=='win'&&num==player){
			playerState="Won last round"
		}
		else if(state=='win'){
			playerState="Lost last round"
		}
		else{
			playerState="Tied last round"
		}
	}
});

var canvas = document.getElementById('canvas');
canvas.width = 550;
canvas.height = 500;
var context = canvas.getContext('2d');


socket.on('draw', function(game,num) {
	let text="not started"
	context.clearRect(offX,0,550,50*7+offY)
	for( i=0;i<table.length;i++){
		for( j=0;j<table.length;j++){
			if(table[i][j]==0)context.drawImage(tile, 50*i+offX,50*j+offY);
			else if (table[i][j]==1)context.drawImage(tileRed, 50*i+offX,50*j+offY);
			else if(table[i][j]==2)context.drawImage(tileBlue, 50*i+offX,50*j+offY);
		}
	}
	
	context.font = "20px Arial";
	context.fillStyle = 'black';
	context.fillText("WINS: " + wins, 350, 30+offY);
	context.fillText("LOSSES: " + losses, 350, 55+offY);
	context.fillText("TIES: " + ties, 350, 80+offY);
	context.fillText(playerState, 350, 140+offY);
	if(game.game)text="started"
	context.fillText("Game has "+text, 350, 120+offY);
	if(turn)context.fillText("Its your turn", 350, 100+offY);

});

function drawPosition(){
	context.clearRect(offX,0,width*7,height)
	if(x<7){
		if(player==1)context.drawImage(red,x*50+offX,0, width, height);
		if(player==2)context.drawImage(blue,x*50+offX,0, width, height);
	}
}
