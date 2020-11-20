const socket = io()

//Elementsts
const $messageForm = document.querySelector("#message-form")
const $messageFormInput = $messageForm.querySelector("input")
const $messageFormButton = $messageForm.querySelector("button")
const $sendLocation = document.querySelector("#send-location")
const $messages = document.querySelector("#messages")
const $rooms = document.querySelector("#sidebar")

//Template
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationMessageTemplate = document.querySelector("#location-message-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

//Options
const {username,room} = Qs.parse(location.search,{ignoreQueryPrefix:true})

const autoScroll = () => {
    const $newMessage = $messages.lastElementChild

    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    // $newMessage.offsetHeight + newMessageMargin
    const visibleHeight = $messages.offsetHeight

    const containerHeight = $messages.scrollHeight

    const scrollOffset = $messages.scrollTop + visibleHeight
    // containerHeight-newMessageHeight<=scrollOffset
    if(containerHeight-newMessageHeight<=scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }

}

socket.on("message",(message)=>{
    console.log(message);
    const html = Mustache.render(messageTemplate,{
        username:message.username,
        message:message.text,
        createdAt:moment(message.createdAt).format("h:mm a")})
    $messages.insertAdjacentHTML("beforeend",html)
    autoScroll()
})

socket.on("locationMessage",(message)=>{
    console.log(message);
    const html = Mustache.render(locationMessageTemplate,{
        username:message.username,
        url:message.url,
        createdAt:moment(message.createdAt).format("h:mm a")})
    $messages.insertAdjacentHTML("beforeend",html)
    autoScroll()
})

socket.on("roomData",({room,users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    $rooms.innerHTML=html
})

$messageForm.addEventListener("submit",(e)=>{
    e.preventDefault()

    $messageFormButton.setAttribute("disabled","disabled")

    const message = e.target.elements.message.value
    socket.emit("sendmessage",message, (msg)=>{
        $messageFormButton.removeAttribute("disabled")
        $messageFormInput.value=""
        $messageFormInput.focus()
        console.log("Message delivered:",msg)
    })
})

$sendLocation.addEventListener("click",()=>{
    if(!navigator.geolocation) {
        return alert("Geolocation is not supported in your browser!")
    }

    $sendLocation.setAttribute("disabled","disabled")

    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit("sendlocation",{
            latitude:position.coords.latitude,
            longitude:position.coords.longitude
        },()=>{
            $sendLocation.removeAttribute("disabled")
            console.log("Location shared!")
        })
    })
})

socket.emit("join",{username,room},(error)=>{
    if(error){
        alert(error)
        location.href="/"
    }
})