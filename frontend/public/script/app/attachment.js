import {
    db, doc, updateDoc, getStorage, ref, uploadBytes, storage, uploadBytesResumable, getDownloadURL,
} from './firebase/firebase.js'
import { currentUser, HOST, postChat, queryServer } from './chat.js'

const fileSelect = document.getElementById('attachment')
const fileElem = document.getElementById('file-elem')

const attachment = {
    openFile: async function () {
        fileElem.click()
    },
    uploadAttachments: function (file, filename, messageObj) {
        const metadata = {
            contentType: file.type
        };
        const storageRef = ref(storage, '/files/images/' + filename);
        // 'file' comes from the Blob or File API
        const uploadTask = uploadBytesResumable(storageRef, file, metadata);
        // Listen for state changes, errors, and completion of the upload.
        uploadTask.on('state_changed',
            (snapshot) => {
                // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
                switch (snapshot.state) {
                    case 'paused':
                        console.log('Upload is paused');
                        break;
                    case 'running':
                        console.log('Upload is running');
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
                    console.log('File available at', downloadURL);
                    messageObj.downloadURL = downloadURL
                    this.updatePost(messageObj)
                    if(messageObj.type.match('video')) {
                        console.log('Video type detected!')
                        this.updateImageNode(messageObj)
                    }
                    //queryServer(messageObj)
                });
            }
        );
    },
    updateImageNode: async (messageObj) => {
        let element = document.getElementById(messageObj.id)
        let videoElement = element.querySelector('video')
        videoElement.src=messageObj.downloadURL
    },
    updatePost: async (messageObj) => {
        // this.updateImageNode(messageObj)
        const docRef = doc(db, "users", currentUser.uid, "messages", messageObj.id)
        try {
            const result = await updateDoc(docRef, messageObj);
        }
        catch (err) {
            console.log(err)
        }
    },
    // https://gist.github.com/webolizzer/329f3713886f51750d587abc65374ea9
    change: function (event) {
        let file = event.target.files[0];
        let fileReader = new FileReader();

        if (file.type.match('image')) {
            fileReader.onload = function () {
              
            };

            fileReader.readAsDataURL(file);

            const messageObj = {}
            messageObj.content = file.name
            messageObj.sender = currentUser.uid
            messageObj.recipient = currentContact
            messageObj.type = file.type

            postChat(messageObj)
                .then((id) => {
                    messageObj.id = id
                    let element = document.getElementById(id)
                    let imageElement = element.querySelector('img')
                    imageElement.src = fileReader.result
                    attachment.uploadAttachments(file, file.name, messageObj)
                })
        }
        else {
            fileReader.onload = function () {
                let blob = new Blob([fileReader.result], { type: file.type });
                let url = URL.createObjectURL(blob);
                let video = document.createElement('video');
                let timeupdate = function () {
                    if (snapImage()) {
                        video.removeEventListener('timeupdate', timeupdate);
                        video.pause();
                    }
                };
                video.addEventListener('loadeddata', function () {
                    if (snapImage()) {
                        video.removeEventListener('timeupdate', timeupdate);
                    }
                });
                let snapImage = function () {
                    let canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
                    let image = canvas.toDataURL();
                    let success = image.length > 100000;

                    if (success) {
                        URL.revokeObjectURL(url);
                    }

                    const messageObj = {}
                    messageObj.content = file.name
                    messageObj.sender = currentUser.uid
                    messageObj.recipient = currentContact
                    messageObj.type = file.type

                    postChat(messageObj)
                        .then((id) => {
                            messageObj.id = id
                            let element = document.getElementById(id)
                            let videoElement = element.querySelector('video');
                            videoElement.setAttribute('poster',image)
                            attachment.uploadAttachments(file, file.name, messageObj)
                        })

                    return success;
                };

                video.addEventListener('timeupdate', timeupdate);
                video.preload = 'metadata';
                video.src = url;
                // Load video in Safari / IE11
                video.muted = true;
                video.playsInline = true;
                video.play();
            };
            fileReader.readAsArrayBuffer(file);
        }
    },
}

fileSelect.onclick = attachment.openFile
fileElem.onchange = attachment.change
