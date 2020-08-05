const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter=require('bad-words')
const { generateMessage,generateLocationMessage } = require('./utils/messages')
const{ addUser,removeUser,getUser,getUsersInRoom}=require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('New WebSocket connection')
    
    
    socket.on('join', ({username, room},callback) => {
        //validate/track the user
        const {error,user}= addUser({id:socket.id,username,room})
        //if error ,send message back to client
        if(error){
        return callback(error)
        }

        // Else Join the room
        socket.join(user.room)
        // Welcome the user to the room
        socket.emit('message', generateMessage('Admin','Welcome!'))
        // Broadcast an event to everyone in the room
        socket.broadcast.to(user.room).emit('message', generateMessage(user.username, ' has joined!'))
        
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
        callback()
        
       })

    socket.on('sendMessage',(receivedMessage,callback)=>{ //receives the client message
        const user=getUser(socket.id)
        const filter=new Filter()               //filter use to filter bad-words
        if(filter.isProfane(receivedMessage))
        {   //check if there is  a bad words
        return callback('Profanity is not allowed') // yes, return a error message to the client
        }
        
        io.to(user.room).emit('message',generateMessage(user.username,receivedMessage))        //else, send the msg to all the client
        callback()                                 //callback to client


    })
    socket.on('disconnect',()=>{
        const user=removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessage(user.username,' has left!!'))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }

        
        
    }) 


    socket.on('sendLocation',(coords,callback)=>{
        const user=getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})