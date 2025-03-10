/*
(c) 2025 Louis D. Nel
Based on:
https://socket.io
see in particular:
https://socket.io/docs/
https://socket.io/get-started/chat/

Before you run this app first execute
>npm install
to install npm modules dependencies listed in the package.json file
Then launch this server:
>node server.js

To test open several browsers to: http://localhost:3000/chatClient.html

*/
const server = require('http').createServer(handler)
const io = require('socket.io')(server) //wrap server app in socket io capability
const fs = require('fs'); //file system to server static files
const { type } = require('os');
const url = require('url'); //to parse url strings
const PORT = process.argv[2] || process.env.PORT || 3000 //useful if you want to specify port through environment variable
                                                         //or command-line arguments

const ROOT_DIR = 'html' //dir to serve static files from

const MIME_TYPES = {
  'css': 'text/css',
  'gif': 'image/gif',
  'htm': 'text/html',
  'html': 'text/html',
  'ico': 'image/x-icon',
  'jpeg': 'image/jpeg',
  'jpg': 'image/jpeg',
  'js': 'application/javascript',
  'json': 'application/json',
  'png': 'image/png',
  'svg': 'image/svg+xml',
  'txt': 'text/plain'
}

function get_mime(filename) {
  for (let ext in MIME_TYPES) {
    if (filename.indexOf(ext, filename.length - ext.length) !== -1) {
      return MIME_TYPES[ext]
    }
  }
  return MIME_TYPES['txt']
}

server.listen(PORT) //start http server listening on PORT

function handler(request, response) {
  //handler for http server requests including static files
  let urlObj = url.parse(request.url, true, false)
  console.log('\n============================')
  console.log("PATHNAME: " + urlObj.pathname)
  console.log("REQUEST: " + ROOT_DIR + urlObj.pathname)
  console.log("METHOD: " + request.method)

  let filePath = ROOT_DIR + urlObj.pathname
  if (urlObj.pathname === '/') filePath = ROOT_DIR + '/index.html'

  fs.readFile(filePath, function(err, data) {
    if (err) {
      //report error to console
      console.log('ERROR: ' + JSON.stringify(err))
      //respond with not found 404 to client
      response.writeHead(404);
      response.end(JSON.stringify(err))
      return
    }
    response.writeHead(200, {
      'Content-Type': get_mime(filePath)
    })
    response.end(data)
  })

}

// Track connected users
let registeredUsers = new Map();
let userSockets = new Map(); // Map usernames to socket IDs

//Socket Server
io.on('connection', function(socket) {
  console.log('client connected',socket.id);

  // Handle username registration
  socket.on('registerUser', function(username) {
    if (registeredUsers.has(username)) {
      socket.emit('registrationFailed'); // Notify user if name is taken
    } else {
      registeredUsers.set(socket.id,username);
      userSockets.set(username,socket.id);
      socket.emit('registrationSuccess', username);

      // ** Send private acknowledgement only to the registering client **
      socket.emit('serverSays', { user: username, text: `:✅ Welcome, ${username}! You are now connected. `});
      
      socket.broadcast.emit('serverSays', { user: username, text: `:🟢 ${username} has joined the chat.`});
      console.log(`User registered: ${username}`);
    }
  });
  //console.dir(socket)

  socket.emit('serverSays', 'You are connected to CHAT SERVER')

  socket.on('clientSays', function(data) {
    console.log('RECEIVED: ' + JSON.stringify(data))

    let recipents=[];
    let messageContent=data.text;

    if(data.text.includes(':')){
      let parts=data.text.split(':');
      if(parts.length>1){
        let recipientList = parts[0].split(',').map(name => name.trim());
        let validRecipients = recipientList.filter(name => userSockets.has(name));

        if(validRecipients.length > 0){
          recipents=validRecipients;
          messageContent=parts.slice(1).join(':').trim();
        }else{
          io.to(socket.id).emit('serverSays', { user: "System", text: `❌ ${possibleRecipient} is not there.` });
          return;
        }
      }
    }

    if(recipents.length>0){
      recipents.forEach(recipent => {
        let recipentSocket = userSockets.get(recipent);
        if(recipentSocket){
          io.to(recipentSocket).emit('serverSays',{user: data.user,text:` : ${messageContent}`,type: "private"})
        }
      });
      io.to(socket.id).emit('serverSays',{user: data.user,text:`<span style="font-weight: bold;"> {to: ${recipents}}</span> : ${messageContent}`, type:"private" })
    }else{
      io.emit('serverSays', { user: data.user, text: `: ${data.text}`})
    }
  })

  socket.on('disconnect', function(data) {
    let username = registeredUsers.get(socket.id);
    if (username) {
      registeredUsers.delete(socket.id);
      userSockets.delete(username);

      io.emit('serverSays', { user: username,text:`🔴 ${username} has left the chat.`});
      console.log(`User disconnected: ${username}`);
    }
  })
})

console.log(`Server Running at port ${PORT}  CNTL-C to quit`)
console.log(`To Test:`)
console.log(`Open several browsers to: http://localhost:${PORT}/chatClient.html`)
