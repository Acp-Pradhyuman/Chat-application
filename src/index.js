const path = require("path")
const http = require("http")
const express = require("express")
const socketio = require("socket.io")
const {generateMessage,generateLocationMessage} = require("./utils/messages")
const {addUser,removeUser,getUser,getUsersInRoom} = require("./utils/user")

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath=path.join(__dirname,"../public")
app.use(express.static(publicDirectoryPath))

io.on("connect",(socket)=>{
    console.log("New Websocket Connection")

    socket.on("join",(options,callbackfn)=>{
        const {error,user} = addUser({id:socket.id,...options})

        if(error){
            return callbackfn(error)
        }

        socket.join(user.room)

        socket.emit("message", generateMessage("Chat-Bot","Welcome!"))
        socket.broadcast.to(user.room).emit("message",generateMessage("Chat-Bot",`${user.username} joined!`))
        io.to(user.room).emit("roomData",{
            room:user.room,
            users:getUsersInRoom(user.room)
        })

        callbackfn()
    })

    socket.on("sendmessage",(message, callbackfn)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit("message",generateMessage(user.username,message))
        callbackfn(message)
    })

    socket.on("disconnect",()=>{
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit("message",generateMessage("Chat-Bot",`${user.username} left!`))
            io.to(user.room).emit("roomData",{
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }

    })

    socket.on("sendlocation",(position, callbackfn)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit("locationMessage",generateLocationMessage(user.username,`https://www.google.com/maps?q=${position.latitude},${position.longitude}`))
        callbackfn()
    })
})

server.listen(port,()=>{
    console.log(`Server is up on port ${port}!`)
})