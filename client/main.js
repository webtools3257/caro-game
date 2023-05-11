if (!io) {
	alert("Unable to start websocket module")
}

const socket = io("https://third-oval-nail.glitch.me")
socket.emit("user init",{
	user_name:"sm"
})

socket.on("user ready",function(d){
	socket.emit("join room",{
		room_id:"1234"
	})
})

socket.on("room empty",function(d){
	console.log(d);
})