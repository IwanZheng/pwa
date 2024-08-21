// https://www.smashingmagazine.com/2024/04/converting-text-encoded-html-vanilla-javascript/
/* Convert text to HTML */
// Source: https://www.w3docs.com/snippets/javascript/how-to-html-encode-a-string.html

function html_encode(input) {
    const textArea = document.createElement("textarea");
    textArea.innerText = input;
    return textArea.innerHTML.split("<br>").join("\n");
}

function convert_text_to_HTML(txt) {
    let out = "";
    const txt_array = txt.split("\n");
    const txt_array_length = txt_array.length;
    let non_blank_line_count = 0;

    for (let i = 0; i < txt_array_length; i++) {
        const line = txt_array[i];

        if (line === "") {
            continue;
        }

        // Add the sentence to output
        non_blank_line_count++;
        if (non_blank_line_count === 1) {
            out += `<p>${line}</p>`;
        } else {
            out += `<p>${line}</p>`;
        }
        // Add the sentence to output
    }
    return out;
}

function convert_images_and_links_to_HTML(string) {
    //  let formulas_unique = [];
    let codes_unique = [];
    let headers_unique = [];
    let urls_unique = [];
    let images_unique = [];

    const codes = string.match(/```([^`]+)```/gim) ?? [];
    const headers = string.match(/\*{2}(.*?)\*{2}/gim) ?? [];
    const urls = string.match(/https*:\/\/[^\s<),]+[^\s<),.]/gim) ?? [];
    const imgs = string.match(/[^"'>\s]+\.(jpg|jpeg|gif|png|webp)/gim) ?? [];

    const codes_length = codes.length;
    const headers_length = headers.length;
    const urls_length = urls.length;
    const images_length = imgs.length;

    for (let i = 0; i < codes_length; i++) {
        let code = codes[i];

        if (!codes_unique.includes(code)) {
            codes_unique.push(code);
        }
    }

    for (let i = 0; i < headers_length; i++) {
        let header = headers[i];

        if (!headers_unique.includes(header)) {
            headers_unique.push(header);
        }
    }

    for (let i = 0; i < urls_length; i++) {
        const url = urls[i];
        if (!urls_unique.includes(url)) {
            urls_unique.push(url);
        }
    }

    for (let i = 0; i < images_length; i++) {
        const img = imgs[i];
        if (!images_unique.includes(img)) {
            images_unique.push(img);
        }
    }

    const codes_unique_length = codes_unique.length;
    const headers_unique_length = headers_unique.length;
    const urls_unique_length = urls_unique.length;
    const images_unique_length = images_unique.length;

    for (let i = 0; i < codes_unique_length; i++) {
        let code = codes_unique[i];
        let cleanCode = code.replace(/```/g, '')
        const pre_tag = `<pre><code>${cleanCode}</code></pre>`;
        string = string.replace(code, pre_tag);
    }

    for (let i = 0; i < headers_unique_length; i++) {
        let header = headers_unique[i];
        let cleanHeader = header.replace(/\*\*/g, '')
        const b_tag = `<b>${cleanHeader}</b>`;
        string = string.replace(header, b_tag);
    }

    for (let i = 0; i < urls_unique_length; i++) {
        const url = urls_unique[i];
        if (images_unique_length === 0 || !images_unique.includes(url)) {
            const a_tag = `<a href="${url}" target="_blank">${url}</a>`;
            string = string.replace(url, a_tag);
        }
    }

    for (let i = 0; i < images_unique_length; i++) {
        const img = images_unique[i];
        const img_tag = `<img src="${img}" alt="">`;
        const img_link = `<a href="${img}" target="_blank">${img_tag}</a>`;
        string = string.replace(img, img_link);
    }

    return string;
}

function convert(input_string) {
    const response = convert_images_and_links_to_HTML(
        convert_text_to_HTML(html_encode(input_string))
    )
    return response
}

/* Convert text to HTML */
let buttons = document.querySelectorAll("button");
buttons.forEach(button => {
    button.onclick = function (e) {
        // Create span element
        let ripple = document.createElement("span");
        // Add ripple class to span
        ripple.classList.add("ripple");
        // Add span to the button
        this.appendChild(ripple);
        // Get position of X
        let x = e.clientX - e.currentTarget.offsetLeft;
        // Get position of Y
        let y = e.clientY - e.currentTarget.offsetTop;
        // Position the span element
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        // Remove span after 0.3s
        setTimeout(() => {
            ripple.remove();
        }, 200);
    };
});

const i = document.querySelectorAll("i");
i.forEach(button => {
    button.onclick = function (e) {
        // Create span element
        let ripple = document.createElement("span");
        // Add ripple class to span
        ripple.classList.add("ripple");
        // Add span to the button
        this.appendChild(ripple);
        // Get position of X
        let x = e.clientX - e.currentTarget.offsetLeft;
        // Get position of Y
        let y = e.clientY - e.currentTarget.offsetTop;
        // Position the span element
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        // Remove span after 0.3s
        setTimeout(() => {
            ripple.remove();
        }, 200);
    };
});
// Listen for click event

let localCache = {
    set: function (key, value) {
        value = JSON.stringify(value);
        localStorage.setItem(key, value);
    },
    get: function (key) {
        var value = localStorage.getItem(key);
        return JSON.parse(value);
    }
}

/* Create Observable Array */
function createObservableArray({ target, listener }) {
    const handler = {
        get(target, prop, receiver) {
            if (prop === "push") {
                return function (value) {
                    target.push(value);
                    listener({ target, value, method: prop });
                }
            }
            if (prop === "pop") {
                return function () {
                    const value = target.pop();
                    listener({ target, value, method: prop });
                    return value;
                }
            }
            if (prop === "shift") {
                return function () {
                    const value = target.shift();
                    listener({ target, value, method: prop });
                    return value;
                }
            }
            if (prop === "unshift") {
                return function (value) {
                    target.unshift(value);
                    listener({ target, value, method: prop });
                    return value;
                }
            }
            if (prop === "splice") {
                return function (...values) {
                    target.splice(...values);
                    listener({ target, value: values, method: prop });
                }
            }
            // default behavior of properties and methods
            return Reflect.get(target, prop, receiver);
        }
    }
    return new Proxy(target, handler);
}

let timeAndDateHandling = {
    /** Computes the elapsed time since the moment the function is called in the format mm:ss or hh:mm:ss
     * @param {String} startTime - start time to compute the elapsed time since
     * @returns {String} elapsed time in mm:ss format or hh:mm:ss format if elapsed hours are 0.
     */
    getElapsedTime: function (startTime) {

        // Record end time
        let endTime = new Date();

        // Compute time difference in milliseconds
        let timeDiff = endTime.getTime() - startTime.getTime();

        // Convert time difference from milliseconds to seconds
        timeDiff = timeDiff / 1000;

        // Extract integer seconds that dont form a minute using %
        let seconds = Math.floor(timeDiff % 60); //ignoring uncomplete seconds (floor)

        // Pad seconds with a zero if neccessary
        let secondsAsString = seconds < 10 ? "0" + seconds : seconds + "";

        // Convert time difference from seconds to minutes using %
        timeDiff = Math.floor(timeDiff / 60);

        // Extract integer minutes that don't form an hour using %
        let minutes = timeDiff % 60; //no need to floor possible incomplete minutes, becase they've been handled as seconds

        // Pad minutes with a zero if neccessary
        let minutesAsString = minutes < 10 ? "0" + minutes : minutes + "";

        // Convert time difference from minutes to hours
        timeDiff = Math.floor(timeDiff / 60);

        // Extract integer hours that don't form a day using %
        let hours = timeDiff % 24; //no need to floor possible incomplete hours, becase they've been handled as seconds

        // Convert time difference from hours to days
        timeDiff = Math.floor(timeDiff / 24);

        // The rest of timeDiff is number of days
        let days = timeDiff;

        let totalHours = hours + (days * 24); // add days to hours
        let totalHoursAsString = totalHours < 10 ? "0" + totalHours : totalHours + "";

        if (totalHoursAsString === "00") {
            return minutesAsString + ":" + secondsAsString;
        } else {
            return totalHoursAsString + ":" + minutesAsString + ":" + secondsAsString;
        }
    }
}

//Image section
function uploads() {
    return new Promise(async (resolve, reject) => {
        const filePicker = document.querySelector('file-elem');

        if (!filePicker || !filePicker.files || filePicker.files.length <= 0) {
            reject('No file selected.');
            return;
        }
        const myFile = filePicker.files[0];

        try {
            const myBase64File = await convert(myFile);
            console.log(`Your base64 image is ${myBase64File}`);
            resolve();
        } catch (error) {
            reject(error);
        }
    });
}

function convertUint8(myFile) {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        if (fileReader && myFile) {
            fileReader.readAsDataURL(myFile);
            fileReader.onload = () => {
                resolve(fileReader.result);
            };

            fileReader.onerror = (error) => {
                reject(error);
            };
        } else {
            reject('No file provided');
        }
    });
}

/*
async function convertBlob(myFile) {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        if (fileReader && myFile) {
            fileReader.readAsDataURL(myFile);
            fileReader.onload = () => {
                const blob = new Blob([new Uint8Array(
                    fileReader.result)]);
                const blobURL = URL.createObjectURL(blob);
                resolve(blobURL);
            };

            fileReader.onerror = (error) => {
                reject(error);
            };
        } else {
            reject('No file provided');
        }
    });
}

function upload() {
    return new (async (resolve, reject) => {
        const filePicker = document.querySelector('input');

        if (!filePicker || !filePicker.files 
            || filePicker.files.length <= 0) {
            reject('No file selected.');
            return;
        }
        const myFile = filePicker.files[0];
        try {        
          const storagePathAndFilename =
             `myFolder/mySubfolders/${myFile.name}`
          const ref = 
             firebase.storage().ref(storagePathAndFilename);

          await ref.put(myFile);
          const myDownloadUrl = await ref.getDownloadURL();
          console.log(`Your image url is ${myDownloadUrl}`);
          resolve();
        } catch (err) {
          reject(err);
        }
    }); 
}
    */

// Reference to an output container, use 'pre' styling for JSON output
// var output = document.createElement('pre');
// document.body.appendChild(output);
/*
const logElement = document.getElementById('log')
// Reference to native method(s)
var oldLog = console.log;

console.log = function( ...items ) {
    // Call native method first
    oldLog.apply(this,items);
    // Use JSON to transform objects, all others display normally
    items.forEach( (item,i)=>{
        items[i] = (typeof item === 'object' ? JSON.stringify(item,null,4) : item);
    });
    logElement.innerHTML += items.join(' ') + '<br />';
};

// You could even allow Javascript input...
function consoleInput( data ) {
    // Print it to console as typed
    console.log( data + '<br />' );
    try {
        console.log( eval( data ) );
    } catch (e) {
        console.log( e.stack );
    }
}
*/