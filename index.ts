import * as express from "express";
import * as http from "http";
import * as socketio from "socket.io";
import * as cors from "cors"

type User = {
	id: string;
	username: string;
}

type Msg = {
	receiver: string;
	sender: string;
	msg: string;
	view: boolean;
}

const app = express();

const server = http.createServer(app);
const io = new socketio.Server(server, {
	cors: {
		origin: "*"
	}
});

const sortName = (username1, username2) => {
	return [username1, username2].sort().join("-");
}

app.use(cors())

const allMsg = {} 

const users: User[] = [] 

io.on("connection", (socket: socketio.Socket) => {

	const id = socket.id
	console.log(id)

	socket.on("create", (username, callback) => {
		
		const existingUser = users.find((user: User) => user.username === username);
		if (existingUser) return callback("This username is been taken!");
		const user: User = { id: id, username: username}

		users.push(user)
		
		socket.on("getUsers", () => {
			io.emit("users", users)
		})
	})

	socket.on("disconnect", () => {
		const index = users.findIndex((user) => user.id === id)

		if (index !== -1) {
			users.splice(index, 1)[0]
		}

		io.emit("users", users);
	})

	socket.on("send_msg", ({ receiver, message }) => {
		const senderData: User = users.find((user) => user.id === socket.id)
		const receiverData: User = users.find((user) => user.username === receiver)
		const key = sortName(senderData.username, receiverData.username)

		console.log(`${senderData.username} send ${message} to ${receiverData.username}`)

		const msg = {
			receiver: receiverData.username,
			sender: senderData.username,
			msg: message,
			view: false
		}

		if (key in allMsg) {
			allMsg[key] = [...allMsg[key], msg]
		} else {
			allMsg[key] = [msg]
		}
		console.log(msg[key])
		io.to(receiverData.id).to(senderData.id).emit("get_msg", allMsg[key])
	})
});

server.listen(process.env.PORT || 1100, () => {
	console.log("1100")
});
