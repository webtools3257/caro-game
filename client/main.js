if (!io) {
	alert("Unable to start websocket module")
}

const socket = io("https://third-oval-nail.glitch.me")
socket.emit("user init", {
	user_name: prompt("Input name : ")


})

socket.on("user ready", function(d) {

})

function createRoom() {
	socket.emit("create room", {})
	socket.on("create room success", function(d) {
		alert("ID room is " + d.room_id)
		document.write("Room :", d.room_id)
	})

	socket.on("opponent joined", function(d) {
		document.write("Opponent joined")
	})
}

function joinRoom(){
	socket.emit("join room",{
		room_id:prompt("Input ID")
	})
	
	socket.on("room joined",function(d){
		document.write("Room joined")
	})
	
}