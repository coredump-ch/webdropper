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

    // Add files to form
    const fileInput = document.querySelector('input[name="file"]');
    fileInput.files = event.dataTransfer.files;

    // Submit form
    fileInput.closest('form').submit();
});
