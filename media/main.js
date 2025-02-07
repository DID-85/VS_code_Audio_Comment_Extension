(function () {
    const vscode = acquireVsCodeApi();

    console.log('navigator.mediaDevices:', navigator.mediaDevices);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('navigator.mediaDevices.getUserMedia is not available.');
        alert('Your browser does not support audio recording.');
        return;
    }

    let mediaRecorder;
    let audioChunks = [];

    const recordButton = document.getElementById('recordButton');
    const stopButton = document.getElementById('stopButton');

    recordButton.addEventListener('click', async () => {
        console.log('Record button clicked');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('Media stream obtained:', stream);
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();
            console.log('MediaRecorder started:', mediaRecorder);
            audioChunks = [];

            mediaRecorder.addEventListener('dataavailable', event => {
                console.log('Data available:', event.data);
                audioChunks.push(event.data);
            });

            mediaRecorder.addEventListener('stop', async () => {
                console.log('Recording stopped');
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                console.log('Audio Blob:', audioBlob);
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = function () {
                    const base64data = reader.result;
                    vscode.postMessage({
                        command: 'saveAudio',
                        audioData: base64data
                    });
                    console.log('Audio data sent to extension');
                }
            });

            recordButton.disabled = true;
            stopButton.disabled = false;
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Error accessing microphone: ' + err.message);
        }
    });

    stopButton.addEventListener('click', () => {
        console.log('Stop button clicked');
        mediaRecorder.stop();
        recordButton.disabled = false;
        stopButton.disabled = true;
    });
})();
