// DOM elements
const elements = {
    wrapper: document.querySelector('#wrapper'),
};

/**
 * Generate random string.
 */
const random = (length = 8) => {
    // Declare all characters
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    // Pick characers randomly
    let str = '';
    for (let i = 0; i < length; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return str;
};

/**
 * Listen for *drag* events.
 */
document.addEventListener('dragover', (event) => {
    event.preventDefault();
});
document.addEventListener('dragenter', () => {
    elements.wrapper.className = 'drag-over';
});
document.addEventListener('drop', (event) => {
    event.preventDefault();
    elements.wrapper.className = '';

    // Read first file (if any)
    const files = event.dataTransfer.files;
    if (files.length === 0) {
        console.error('No files in drop event');
        return;
    }
    const file = files[0];
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
        const fileName = file.name;
        const fileType = file.type;
        const fileData = event.target.result;

        // JS still has no API to send multipart requests... m(
        const boundary = random(32);
        let data = '';
        data += `--${boundary}\r\n`;
        data += `content-disposition: form-data; name="file"; filename="${fileName}"\r\n`;
        data += `content-type: ${fileType}\r\n`;
        data += "\r\n";
        data += fileData;
        data += "\r\n";
        data += `--${boundary}--`;

        // Send request
        const request = new XMLHttpRequest();
        request.open('POST', '/', true);
        request.setRequestHeader('Content-Type', `multipart/form-data; boundary=${boundary}`);
        console.log('Sending request');
        request.send(data);
    });
    reader.readAsBinaryString(file);
});
