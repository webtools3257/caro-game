if (!io) {
	alert("Unable to start websocket module")
}

const socket = io("https://third-oval-nail.glitch.me")
socket.emit("user init",{
	user_name:"Sang"
})

socket.on("user ready",function(d){
	console.log(d);
	socket.emit("join room",{})
})