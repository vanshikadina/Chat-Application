//connect to server and retain the socket
//connect to same host that served the document

//const socket = io('http://' + window.document.location.host)
const socket = io() //by default connects to same server that served the page
let username=""

// Function to scroll the messages container to the bottom
function scrollToBottom() {
  var messagesDiv = document.getElementById("messages");
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

socket.on('serverSays', function(message) {
  if (message && message.user && message.text) {  
    // Check if 'user' and 'text' exist
    let msgDiv = document.createElement('div');

    // Check if the message is from the current user and apply the right alignment
    if (message.user === username) {
      msgDiv.classList.add('user-align'); // Add right-align for the user's message
      msgDiv.style.backgroundColor = "#a8d8ed";
      msgDiv.innerHTML = `<span style="font-weight: bold;">Me</span> ${message.text}`;
    } else {
      msgDiv.classList.add('other-align');  // Add left-align for others' messages
      msgDiv.innerHTML = `<span style="font-weight: bold;">${message.user}</span> ${message.text}`;
    }

    if (message.type === "private") {
      msgDiv.classList.add('private-message'); // Apply private message style
    }

    document.getElementById('messages').appendChild(msgDiv);

    // Scroll the container to the bottom
    scrollToBottom();

  } else {
    console.log('Invalid message received: ', message);
  }
})

// Scroll to the bottom when the page loads
window.onload = scrollToBottom;

document.getElementById("connect_button").addEventListener("click",function(){
  let enteredUsername= document.getElementById("usernameBox").value.trim();
  if(enteredUsername===""){
    alert("Please enter a username.");
    return;
  }

  // Remove any existing error messages when "Connect As" is clicked
  document.querySelectorAll(".error-message").forEach((msg) => msg.remove());

  // Regular Expression for Valid Username
  let validUsernameRegex = /^[A-Za-z][A-Za-z0-9]*(?: [A-Za-z0-9]+)*[A-Za-z0-9]$/;

  // Check if the username is valid
  if (!validUsernameRegex.test(enteredUsername) || enteredUsername.toLowerCase() === "me") {
    
    // Clear the input field
    document.getElementById("usernameBox").value = "";

    // Show error message in the chat
    let errorMessage = `ERROR: "${enteredUsername}" IS NOT A VALID USER NAME`;
    let errorDiv = document.createElement("div");
    errorDiv.classList.add("left-align", "error-message"); // Style like a system message
    errorDiv.style.color = "red"; // Make error messages red
    errorDiv.textContent = errorMessage;

    document.getElementById("errorContainer").appendChild(errorDiv);
    console.log("Invalid username. Error displayed.");

    return; // Stop further execution
  }

  // Send username to the server for validation
  socket.emit("registerUser", enteredUsername);
})

socket.on("registrationSuccess",function(confirmedUsername){
  username=confirmedUsername;

  document.getElementById("usernameBox").disabled = true;
  document.getElementById("connect_button").disabled = true;
  document.getElementById("msgBox").disabled = false;
  document.getElementById("send_button").disabled = false;
  document.getElementById("clear_button").disabled = false; // Enable clear button
  document.getElementById("send_button").style.background = "#0a86e6";
  document.getElementById("clear_button").style.background = "#0be95d";
  document.getElementById('messages').style.display = 'block';

  // Move the username input and button off the screen
  document.getElementById("connect_button").disabled = true;
  document.getElementById("connect_button").style.background = "#97a0a7";
  //document.querySelector("h2").classList.add("move-out");
  //document.querySelector("label[for='usernameBox']").classList.add("move-out");
})

// Server response: Username already in use
socket.on("registrationFailed", function() {
  alert("Username already in use. Try another.");
});

function sendMessage() {
  let message = document.getElementById('msgBox').value.trim()
  if(message === '') return //do nothing

  socket.emit('clientSays', { user: username, text: message });
  document.getElementById('msgBox').value = ''; // Clear input field
}


function handleKeyDown(event) {
  const ENTER_KEY = 13 //keycode for enter key
  if (event.keyCode === ENTER_KEY) {
    sendMessage()
    return false //don't propogate event
  }
}

//Add event listeners
document.addEventListener('DOMContentLoaded', function() {
  //This function is called after the browser has loaded the web page

  //add listener to buttons
  document.getElementById('send_button').addEventListener('click', sendMessage)

  //add keyboard handler for the document as a whole, not separate elements.
  document.addEventListener('keydown', handleKeyDown)
  //document.addEventListener('keyup', handleKeyUp)

  // Handle clearing chat locally
  document.getElementById("clear_button").addEventListener("click", function() {
    if (confirm("Are you sure you want to clear your chat?")) {
      document.getElementById("messages").innerHTML = "";
    }
  });

  // Add Enter key support for the username input field
  document.getElementById("usernameBox").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      document.getElementById("connect_button").click();
    }
  });
})
