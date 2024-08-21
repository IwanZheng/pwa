import {
  auth, onAuthStateChanged,
  getDatabase, set, child, get, onValue,
  db, setDoc, addDoc, collection, getFirestore, updateDoc, getDoc, getDocFromCache, doc, onSnapshot, serverTimestamp, orderBy, query, limit,
} from './firebase/firebase.js'
import { getSpeech } from './audio.js'

export let currentUser
export let currentContact
export let HOST = 'https://server.tokokita.app/api'
if (window.location.hostname === "localhost") HOST = 'http://localhost:3000'

let chatHistory = []
let textHistory = []
let textIndex = 0;
let chatLoaded
let userData
let contactsObj =
{
  "bi": {
    "displayName": "Bahasa Indonesia",
    "photoURL": "./assets/images/panda.svg",
    "contact_status": "offline",
    "last_message": "Halo, mari belajar Bahasa Indonesia"
  },
  "eng": {
    "displayName": "Bahasa Inggris",
    "photoURL": "./assets/images/panda2.svg",
    "contact_status": "offline",
    "last_message": "Hello, let's learn english"
  }
}
const chatBackIcon = document.querySelector('.chat-back-icon')
const chatButton = document.querySelector('#chat-button')
const recordButton = document.querySelector('#record-button')
const chatInput = document.querySelector('.chat-input');
// Add an event listener for the keyup event
chatBackIcon.addEventListener('click', (e) => closeChat())

function setChatButton() {
  if (!chatInput.value.trim()) {
    recordButton.style.display = "flex"
    chatButton.style.display = "none"
  } else {
    recordButton.style.display = "none"
    chatButton.style.display = "flex"
  }
}

chatInput.addEventListener('keyup', (event) => {
    switch (event.key) {
      case "Enter":
        sendChat()
        break;
      case "ArrowUp":
        if (textIndex < textHistory.length) {
          textIndex++;  // Increment x
          chatInput.value = textHistory[textHistory.length - textIndex];
        }
        break;
      case "ArrowDown":
        // Handle ArrowDown key
        if (textIndex >= 1) {
          chatInput.value = textHistory[textHistory.length - textIndex];
          textIndex--; // Decrement x 
        } else {
          chatInput.value = ''
          setChatButton()
        }
        break;
    }

    if (chatInput.value.trim())return setChatButton()
  });

chatButton.onclick = sendChat

function sendChat() {
  // clear question response field
  if (!chatInput.value.trim()) return setChatButton()

  textIndex = 0
  if (textHistory.length > 10) textHistory.shift()
  textHistory.push(chatInput.value)

  if (!currentContact) return
  const messageObj = {}
  messageObj.content = chatInput.value
  messageObj.sender = currentUser.uid
  messageObj.recipient = currentContact
  messageObj.type = 'text/plain'

  postChat(messageObj)
  queryServer(messageObj)

  chatInput.value = ''
  setChatButton()
}

const processInput = async (messageObj) => {
  const messageContainer = document.createElement('li')
  const questionNode = document.createElement('div')
  let elementID
  let timeValue = Date.now()
  let type = messageObj.type
  switch (type) {
    case "audio/wav":
      const audioNode = document.createElement('audio')
      const audioDiv = document.createElement('div')
      audioNode.setAttribute("controls", "true");
      audioNode.src = messageObj.downloadURL || '';
      questionNode.appendChild(audioNode);
      audioDiv.textContent = messageObj.content;
      questionNode.appendChild(audioDiv)
      break;
    // https://stackoverflow.com/questions/2896626/switch-statement-for-string-matching-in-javascript
    case type.match('image')?.input:
      const imageNode = document.createElement('img')
      const imageDiv = document.createElement('div')
      const imageText = document.createElement('div')

      imageDiv.appendChild(imageNode)

      imageNode.classList.add('thumbnail')
      imageNode.src = messageObj.downloadURL || '';

      imageText.textContent = messageObj.content;

      questionNode.appendChild(imageNode);
      questionNode.appendChild(imageText)

      break;
    case type.match('video')?.input:
      const videoNode = document.createElement('video')
      const videoDiv = document.createElement('div')

      videoNode.setAttribute('controls',true)
      videoNode.classList.add('thumbnail')
      videoNode.src = messageObj.downloadURL || '';

      videoDiv.textContent = messageObj.content;

      questionNode.appendChild(videoNode);
      questionNode.appendChild(videoDiv)

      break;
    default:
      const quastionHTML = document.createElement('div')
      quastionHTML.innerHTML = messageObj.content
      questionNode.appendChild(quastionHTML)
  }

  if (messageObj.timestamp) timeValue = messageObj.timestamp.toDate()
  const time = new Date(timeValue).toLocaleTimeString(navigator.language, { hour: '2-digit', minute: '2-digit', hour12: false });
  const timeNode = document.createElement('div')
  timeNode.classList.add('time-posted')
  timeNode.innerHTML = time;

  if (messageObj.sender === "self" || messageObj.sender === currentUser.uid) {
    elementID = messageObj.recipient
    questionNode.classList.add("self")
  }
  else {
    elementID = messageObj.sender
    questionNode.classList.add("response")
  }

  questionNode.appendChild(timeNode)
  messageContainer.appendChild(questionNode)
  if (messageObj.id) messageContainer.setAttribute('id', messageObj.id)

  postChatNode(messageContainer, elementID)
}

export async function queryServer(reqObj) {
  /*let usingHistory = false
  if (usingHistory) reqObj.history = chatHistory */
  fetch(HOST + '/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reqObj),
    // Add any other necessary options or data here
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      const answerObj = data.message
      answerObj.type = 'text/plain'
      answerObj.content = convert(answerObj.content)
      postChat(answerObj)
        .then((id) => {
          answerObj.id = id
          getSpeech(answerObj)
        })
      /*
        TODO use chat history to enable multiturn chat
        if (chatHistory.length > 0) chatHistory.shift()
        chatHistory.push(answerObj.content)
      */
    })
    .catch((error) => {
      console.error("Error fetching data from server:", error);
    });
}

function createChatNode(elementID) {
  const chatNode = document.createElement('div')
  chatNode.classList.add('chat')

  const contactChat = document.createElement('ul')
  contactChat.classList.add('contact-chat')

  chatNode.setAttribute('id', elementID)
  chatNode.appendChild(contactChat)

  const chatContainer = document.querySelector(".chat-content")
  chatContainer.appendChild(chatNode)

  return chatNode
}

function postChatNode(sentenceNode, contactID) {
  let chatNode = document.getElementById(contactID)
  if (!chatNode) chatNode = createChatNode(contactID)
  if (!chatLoaded)
    chatNode.firstChild.prepend(sentenceNode)
  else
    chatNode.firstChild.appendChild(sentenceNode)

  renderMathInElement(document.body)
}

const openChat = (tabTarget) => {
  if (currentContact === tabTarget) return

  const chat = document.querySelector('.chat-container')
  chat.style.display = "flex"
  chat.classList.add('onStackTop')
  currentContact = tabTarget
  window.currentContact = tabTarget
  openMessages(tabTarget)
}

const closeChat = () => {
  const chat = document.querySelector(".chat-container")
  chat.style.display = "none"
  chat.classList.remove('onStackTop')
}

const formatPage = async () => {
  const username = document.querySelector('.user-name')
  username.innerHTML = userData.displayName
  getContacts()
  getMessages()
}

async function getContacts() {
  if (userData.contacts)
    console.log(userData.contacts)
  else
    appendContactList(contactsObj)
}

function appendContactList(contactsObj) {
  const contactListNode = document.querySelector('.contacts-list-container')

  const objKeys = Object.keys(contactsObj);
  objKeys.forEach(objKey => {
    const contactNode = createContact(contactsObj[objKey], objKey)
    const contactChatNode = createChatNode(objKey)
    contactListNode.appendChild(contactNode)
  });

  const contacts = document.querySelectorAll('.contact-profile-bar')
  contacts.forEach((contact) => {
    contact.addEventListener('click', (e) => openChat(e.currentTarget.dataset.target))
  })
}

function createContact(contact, id) {
  const contactNode = document.createElement('div')
  contactNode.classList.add('contact-profile-bar')
  contactNode.dataset['target'] = id

  const html =
    `
      <div class="contact-profile-photo">
          <img src="${contact.photoURL}" alt="">
      </div>
      <div class="contact-profile">
          <div class="contact-profile-name">
              <div class="user-name">${contact.displayName}</div>
          </div>
          <div class="contact-profile-status">
              <small>1 hour ago</small>
          </div>
      </div>
    `
  contactNode.innerHTML = html

  return contactNode
}

function openMessages(target) {
  const chatImage = document.getElementById("chat-picture")
  const chatContact = document.querySelector(".chat-name")
  const chatContent = document.querySelector(".chat-content")
  const chatContactMessage = document.querySelector(`#${target}`)

  chatContact.textContent = contactsObj[target].displayName
  chatImage.src = contactsObj[target].photoURL

  for (const child of chatContent.children) {
    child.style.display = "none"
  }

  chatContactMessage.style.display = "flex"
}

async function getMessages() {
  let target = [];
  function listener(results) {
    processInput(results.value)
  }
  const list = createObservableArray({ target, listener });

  const messagesRef = collection(db, "users", userData.uid, "messages");
  const q = query(
    messagesRef,
    orderBy("timestamp", "desc"),
    limit(100),
  )
  const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      let value = change.doc.data()
      value.id = change.doc.id
      if (change.type === "added") {
        list.push(value)
        //console.log("Document added: ", change.doc.data());
      }
      if (change.type === "modified") {
        let itemID = target.filter((item) => {
          if (item.id === change.doc.id) {
          } return true
        })
        if (!itemID) list.push(value)
      }
    });
    chatLoaded = true
  },
    (error) => {
      console.log("Error occured : ", error)
    })
}

export async function postChat(messageObj) {
  let messageRef = collection(db, "users", userData.uid, "messages")
  messageObj.timestamp = serverTimestamp();

  const docRef = await addDoc(messageRef, messageObj)
  return docRef.id
}

//Login section 

// Listening for auth state changes.
onAuthStateChanged(auth, function (user) {
  if (user) {
    /*
    User is signed in.
    const displayName = user.displayName;
    const email = user.email;
    const emailVerified = user.emailVerified;
    const photoURL = user.photoURL;
    const isAnonymous = user.isAnonymous;
    const uid = user.uid;
    const providerData = user.providerData;
    */
    currentUser = user
    getUser()
  } else {
    if (window.location.pathname !== '/') {
      currentUser = ''
      window.location.replace("./");
    }
  }
});

async function getUser() {
  const docRef = doc(db, "users", currentUser.uid);
  let userObj = localCache.get("user")

  if (!userObj || userObj.uid !== currentUser.uid) {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      userData = docSnap.data();
    }
    else {
      setUserData();
    }
    localCache.set("user", userData)
  }
  else {
    console.log("Getting user data from local cache")
    userData = userObj
  }
  formatPage()
}

async function setUserData() {
  const docRef = doc(db, `users/${currentUser.uid}`,)
  const userObj = {
    "uid": currentUser.uid,
    "email": currentUser.email,
    "displayName": currentUser.displayName,
    "photoURL": currentUser.photoURL,
  }
  await setDoc(docRef, userObj)
    .then(() => {
      getUser()
    })
    .catch((error) => {
      console.log(error)
    });
}
