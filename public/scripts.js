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

// Drag & drop

const handleDragOver = (event) => {
    event.preventDefault();
    elements.wrapper.classList.add('drag-over');
}
const handleDragEnd = (event) => {
    elements.wrapper.classList.remove('drag-over');
}
document.addEventListener('dragenter', handleDragOver);
document.addEventListener('dragover', handleDragOver);
document.addEventListener('dragleave', handleDragEnd);

document.addEventListener('drop', (event) => {
    event.preventDefault();
    elements.wrapper.className = '';

    // Read files
    const files = event.dataTransfer.files;
    if (files.length === 0) {
        console.error('No files in drop event');
        return;
    }
    for (const file of files) {
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
            console.log(`Sending request for file ${fileName}`);
            request.send(data);
        });
        reader.readAsBinaryString(file);
    }
});
