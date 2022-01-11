// DOM elements
const elements = {
    wrapper: document.querySelector('#wrapper'),
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
    console.log(files[0]);
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
        console.log(event.target.result);
    });
    reader.readAsText(files[0]);
});
