const Tesseract = require('tesseract.js');

// Access the video element
const video = document.getElementById('video');

// Access the canvas element for capturing the image
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

// Button to capture the image
const captureButton = document.getElementById('capture');

// Elements to display extracted text
const extractedTextElement = document.getElementById('extractedText');
const nameElement = document.getElementById('name');
const fatherNameElement = document.getElementById('fatherName');

// Start video stream from the camera
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(error => {
        console.error('Error accessing the camera', error);
    });

// Capture the image when the button is clicked
captureButton.addEventListener('click', () => {
    // Adjust canvas to the video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert the canvas image to grayscale for better OCR accuracy
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const grayscaleData = new Uint8ClampedArray(imageData.data.length);
    for (let i = 0; i < imageData.data.length; i += 4) {
        const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
        grayscaleData[i] = grayscaleData[i + 1] = grayscaleData[i + 2] = avg;
        grayscaleData[i + 3] = imageData.data[i + 3];
    }
    context.putImageData(new ImageData(grayscaleData, canvas.width, canvas.height), 0, 0);

    // Convert the canvas image to a data URL
    const imageDataUrl = canvas.toDataURL('image/png');

    // Use Tesseract.js to recognize text from the image
    Tesseract.recognize(
        imageDataUrl,
        'eng', // You can also try 'osd' or 'jpn' models if applicable
        {
            logger: m => console.log(`${m.status} ${m.progress}`)
        }
    )
    .then(({ data: { text } }) => {
        // Display all the extracted text
        extractedTextElement.textContent = `Extracted Text: ${text}`;
        console.log('Extracted Text:', text);

        // Optionally, process specific fields like Name and Father's Name
        const nameMatch = text.match(/Name\s*:\s*(.*)/i);
        const fatherNameMatch = text.match(/Father['’]s Name\s*:\s*(.*)/i);

        nameElement.textContent = `Name: ${nameMatch ? nameMatch[1] : 'Not found'}`;
        fatherNameElement.textContent = `Father's Name: ${fatherNameMatch ? fatherNameMatch[1] : 'Not found'}`;
    })
    .catch(error => {
        console.error('Error during text recognition:', error);
    });
});
