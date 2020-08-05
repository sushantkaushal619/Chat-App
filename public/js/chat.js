const socket=io()

const $messageForm=document.querySelector('#message-form')
const $messageFormInput=document.querySelector('#message')
const $messageFormButton=document.querySelector('button')
const $sendLocationButton=document.querySelector('#send-location')

// Select the element in which you want to render the template
const $messages=document.querySelector('#messages')
// Select the template
const messageTemplate=document.querySelector('#message-template').innerHTML
// Select the template for location 
const locationMessageTemplate=document.querySelector('#location-message-template').innerHTML
//Selsct template for side-bar
const sidebarTemplate=document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })
const autoScroll=()=>{
    // New message element
 const $newMessage = $messages.lastElementChild
 // Height of the new message
 const newMessageStyles = getComputedStyle($newMessage)
 const newMessageMargin = parseInt(newMessageStyles.marginBottom)
 const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
 // Visible height
 const visibleHeight = $messages.offsetHeight
 // Height of messages container
 const containerHeight = $messages.scrollHeight
 // How far have I scrolled?
 const scrollOffset = $messages.scrollTop + visibleHeight
 if (containerHeight - newMessageHeight <= scrollOffset) {
 $messages.scrollTop = $messages.scrollHeight
 }    

}

socket.on('message',(message)=>{

    /// Render the template with the message data
 const html = Mustache.render(messageTemplate, {
                   username:message.username,
                   message:message.text,
                   createdAt:moment(message.createdAt).format('h:mm a')
    })
    // Insert the template into the DOM
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('locationMessage',(message)=>{
    console.log(message)
    const locationHtml = Mustache.render(locationMessageTemplate, {
        username:message.username,
        url:message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    // Insert the template into the DOM
    $messages.insertAdjacentHTML('beforeend', locationHtml)
    autoScroll()
})

socket.on('roomData',({room,users})=>{
    const html=Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML=html

})

//when some click on send text button
$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()

    //disable the send button
    $messageFormButton.setAttribute('disabled','disabled')
    const message=document.querySelector('#message').value
    
    socket.emit('sendMessage',message,(error)=>{    //send message to server    
    //enable the send button
    $messageFormButton.removeAttribute('disabled')
    // Clear the text from the input
    $messageFormInput.value=''
    // cursor comes back to the input area
    $messageFormInput.focus()


        if(error)           //if error comes from server               
        {
        return alert(error)//prints error
        }

        console.log('The message was delivered')//else send the acknowledgement to the client
    })
})


//when some one click on Location button
document.querySelector('#send-location').addEventListener('click',()=>{

    //disable the location button
    $sendLocationButton.setAttribute('disabled','disabled')
    if(!navigator.geolocation)
    {
        return alert('Geolocation is not supported by your browser')
    }
    navigator.geolocation.getCurrentPosition((position)=>{
        //console.log(position)
        socket.emit('sendLocation',{
           latitude:  position.coords.latitude,
           longitude: position.coords.longitude
        },()=>{

            //disable the location button
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared')
        })
    })

})

socket.emit('join', { username, room }, (error) => {
    if (error) {
    alert(error)
    location.href = '/'
    }
   }) 