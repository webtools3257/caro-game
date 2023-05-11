const path = require('path')
const http = require("http")
const express = require("express")
const socketio = require("socket.io")
const app = express()
const httpServer = http.createServer(app);

app.use('/client', express.static(path.join(__dirname, '../client')))
const io = socketio(httpServer, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"]
	}
})

io.on("connection", (socket) => {
	socket.on("user init",function(data){
		let user_name = data.user_name
		let user_id = Date.now()+Math.floor(Math.random()*9999999)
		socket.emit("user ready",{
			id: user_id
		})
		socket.user_id = user_id
		socket.join("a")
	})
	
	
	socket.on("join room",function(data){
		let room_id = data.room_id
		console.log(io.sockets.adapter.rooms.get("a").size);
	})
});


httpServer.listen(3000,function(){
	console.log("Server is running ....")
});