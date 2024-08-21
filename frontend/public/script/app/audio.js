import { 
    getStorage, ref, uploadBytes, storage, uploadBytesResumable, getDownloadURL, 
    db, doc, updateDoc } from './firebase/firebase.js'
import { HOST,currentUser, currentContact, postChat,queryServer } from './chat.js'

const recordButton = document.querySelector('#record-button')

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    console.log("The mediaDevices.getUserMedia() method is supported.");
    const constraints = { audio: true };
    let chunks = [];

    let onSuccess = function (stream) {
        // console.log('Media detected')
        const mediaRecorder = new MediaRecorder(stream);
     
        let elapsedTimeText = document.getElementById("chat-input")
        /** Stores the reference to the elapsed time interval*/
        let elapsedTimeIntervalRef;
        /** Pauses stopwatch */
        function stopStopwatch() {
            // Clear interval 
            if (typeof elapsedTimeIntervalRef !== "undefined") {
                clearInterval(elapsedTimeIntervalRef);
                elapsedTimeIntervalRef = undefined;
                elapsedTimeText.value = ''
            }
        }

        /** Starts the stopwatch */
        function startStopwatch(start) {
            // Every second
            elapsedTimeIntervalRef = setInterval(() => {
                // Compute the elapsed time & display
                elapsedTimeText.value = timeAndDateHandling.getElapsedTime(start) + ' recording ...'; //pass the actual record start time
                // Improvement: Can Stop elapsed time and resert when a maximum elapsed time
                //              has been reached.
            }, 1000);
        }

        recordButton.onmousedown = startRecord
        recordButton.ontouchstart = startRecord
        recordButton.onmouseup = startRecord
        recordButton.ontouchend = startRecord

        function startRecord(evt) {
            if (evt.type === "touchstart" || evt.type === "mousedown") {
                startRecorder()
            }
            else if (evt.type === "touchend" || evt.type === "mouseup") {
                stopRecorder()
            }
        }

        function startRecorder() {
            mediaRecorder.start();
            const startTimer = new Date();
            startStopwatch(startTimer)
           // console.log("Recorder started.");
        };

        function stopRecorder() {
            mediaRecorder.stop();
            stopStopwatch();
          //  console.log("Recorder stopped.");
        }

        mediaRecorder.ondataavailable = function (e) {
            chunks.push(e.data);
        };

        mediaRecorder.onstop = function (e) {
            // console.log("Last data to read (after MediaRecorder.stop() called).");
            const clipName = Date.now() + ".wav"
            const blob = new Blob(chunks, { type: "audio/wav" });
          
            const messageObj = {
                "sender": currentUser.uid,
                "recipient": currentContact,
                "content": clipName,
                "type": "audio/wav",
            }
       
            postChat(messageObj)
                .then((id) => {
                    messageObj.id = id
                    uploadFile(blob, clipName, messageObj)
                })
            // console.log("recorder stopped");
            chunks = [];
        }
    }
    let onError = function (err) {
        console.log("The following error occured: " + err);
    };
    navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
} else {
    console.log("getUserMedia not supported on your browser!");
}

const uploadFile = (file, filename, messageObj) => {
    const metadata = {
        contentType: 'audio/wav'
    };

    const storageRef = ref(storage, '/users/' + currentUser.uid + '/audio/' + filename);
    // 'file' comes from the Blob or File API
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    // Listen for state changes, errors, and completion of the upload.
    uploadTask.on('state_changed',
        (snapshot) => {
            // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
            // const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            // console.log('Upload is ' + progress + '% done');
            switch (snapshot.state) {
                case 'paused':
                    // console.log('Upload is paused');
                    break;
                case 'running':
                    // console.log('Upload is running');
                    break;
            }
        },
        (error) => {
            // A full list of error codes is available at
            // https://firebase.google.com/docs/storage/web/handle-errors
            switch (error.code) {
                case 'storage/unauthorized':
                    // User doesn't have permission to access the object
                    break;
                case 'storage/canceled':
                    // User canceled the upload
                    break;
                case 'storage/unknown':
                    // Unknown error occurred, inspect error.serverResponse
                    break;
            }
        },
        () => {
            // Upload completed successfully, now we can get the download URL
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                messageObj.downloadURL = downloadURL
                   
                updateAudioPost(messageObj)
                queryServer(messageObj)
            });
        }
    );
}

const updateAudioPost = async (messageObj) => {
    const docRef = doc(db, "users", currentUser.uid, "messages", messageObj.id)
    await updateDoc(docRef,messageObj);
    updateAudioNode(messageObj)
}

const updateAudioNode = async (messageObj) => {
    const element = document.getElementById(messageObj.id)
    const audioNode = element.querySelector('audio')
    // const audioLoader = element.querySelector('.audio-loader')
    audioNode.src = messageObj.downloadURL
}

export async function getSpeech(speechObj) {
    fetch(HOST + '/tts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(speechObj),
        // Add any other necessary options or data here
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            const filePath = data.message.content
            const fileRef = ref(storage, filePath);
            const speechAudio = document.getElementById('output')
            // Get the download URL
            getDownloadURL(fileRef)
                .then((file) => {
                    speechAudio.src = file
                    //    const latestChat = document.getElementById(speechObj.id)
                    //  latestChat.firstChild.appendChild(speechAudio)
                })

            return
        })
        .catch((error) => {
            console.error("Error fetching data from server:", error);
        });
}