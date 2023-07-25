addEventListener("DOMContentLoaded", (event) => {
    // DOM elements
    const elements = {
        wrapper: document.querySelector('#wrapper'),
        uploadProgressWrapper: document.querySelector('#upload-progress-wrapper'),
        uploadProgress: document.querySelector('#upload-progress'),
        uploadForm: document.querySelector('#upload-form'),
        uploadStatus: document.querySelector('#upload-status'),
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

    const uploadStart = (max) => {
        elements.uploadStatus.style.display = 'none';
        elements.uploadProgressWrapper.style.display = 'block';
        elements.uploadProgress.max = max;
        elements.uploadProgress.value = 0;
    }

    const uploadProgress = (progress) => {
        elements.uploadProgress.value = progress;
    }

    const uploadDone = () => {
        elements.uploadProgressWrapper.style.display = 'none';
    }

    const uploadFailed = (event) => {
        elements.uploadProgressWrapper.style.display = 'none';
        elements.uploadStatus.innerHTML = `Upload failed: #{event.type}`
        elements.uploadStatus.style.display = 'block';
    }

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
        fileInput.closest('form').requestSubmit();
    });

    elements.uploadForm.addEventListener('submit', (event) => {
        event.preventDefault();
        console.log("Submit event:");
        console.log(event);

        var xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('loadstart', (event) => {
            uploadStart(event.total);
        }, false);
        xhr.upload.addEventListener('progress', (event) => {
            uploadProgress(event.loaded);
        }, false);
        xhr.upload.addEventListener('load', (event) => {
            uploadProgress(event.total);
        }, false);

        xhr.addEventListener('readystatechange', (event) => {
            console.log(event.target.readyState);
            if (event.target.readyState === XMLHttpRequest.DONE) {
                const status = event.target.status;
                if (status === 0 || (status >= 200 && status < 400) && event.target.responseText) {
                    console.log('readystatechange', event);
                    //we got a response from the server and we're replacing the whole current document content with it, simulating a page reload
                    var newDocument = document.open();
                    newDocument.write(event.target.responseText);
                    newDocument.close();
                } else {
                    console.error(event);
                    uploadFailed(event);
                    //throw new Error('Error in the response.');
                }
            }
        }, false);

        xhr.upload.addEventListener("error", uploadFailed);
        xhr.upload.addEventListener("abort", uploadFailed);
        xhr.upload.addEventListener("timeout", uploadFailed);

        console.log(elements.uploadForm);
        var openResult = xhr.open(elements.uploadForm.getAttribute('method'), elements.uploadForm.getAttribute('action'), true);
        console.log('openResult:', openResult)
        var sendResult = xhr.send(new FormData(elements.uploadForm));
        console.log('sendResult:', sendResult)
    });
});
