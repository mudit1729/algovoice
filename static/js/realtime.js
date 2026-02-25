// realtime.js - OpenAI Realtime API WebRTC client

class RealtimeClient extends EventTarget {
    constructor() {
        super();
        this.pc = null;
        this.dc = null;
        this.audioEl = null;
        this.mediaStream = null;
        this.connected = false;
    }

    /**
     * Connect to the OpenAI Realtime API via WebRTC.
     * @param {string} slug - Algorithm slug for session context
     */
    async connect(slug) {
        // Step 1: Get ephemeral token from our Flask backend
        const tokenRes = await fetch('/api/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug }),
        });

        if (!tokenRes.ok) {
            const err = await tokenRes.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to get session token');
        }

        const { token } = await tokenRes.json();

        // Step 2: Create RTCPeerConnection
        this.pc = new RTCPeerConnection();

        // Step 3: Set up audio playback for the agent's voice
        this.audioEl = document.createElement('audio');
        this.audioEl.autoplay = true;

        this.pc.ontrack = (event) => {
            this.audioEl.srcObject = event.streams[0];
        };

        // Step 4: Get microphone access
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
            },
        });

        this.mediaStream.getTracks().forEach((track) => {
            this.pc.addTrack(track, this.mediaStream);
        });

        // Step 5: Create data channel for Realtime API events
        this.dc = this.pc.createDataChannel('oai-events');

        this.dc.onopen = () => {
            this.connected = true;
            this._emit('connected');
        };

        this.dc.onclose = () => {
            this.connected = false;
            this._emit('disconnected');
        };

        this.dc.onmessage = (event) => {
            try {
                this._handleServerEvent(JSON.parse(event.data));
            } catch (e) {
                console.error('Failed to parse server event:', e);
            }
        };

        // Step 6: SDP offer/answer exchange with OpenAI
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);

        const model = 'gpt-4o-realtime-preview';
        const sdpRes = await fetch(
            `https://api.openai.com/v1/realtime?model=${model}`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/sdp',
                },
                body: offer.sdp,
            }
        );

        if (!sdpRes.ok) {
            throw new Error('SDP exchange with OpenAI failed');
        }

        const answerSdp = await sdpRes.text();
        await this.pc.setRemoteDescription({
            type: 'answer',
            sdp: answerSdp,
        });
    }

    /**
     * Send an event to the Realtime API via the data channel.
     */
    sendEvent(event) {
        if (this.dc && this.dc.readyState === 'open') {
            this.dc.send(JSON.stringify(event));
        }
    }

    /**
     * Send a text message to the conversation to trigger a response.
     */
    sendTextMessage(text) {
        this.sendEvent({
            type: 'conversation.item.create',
            item: {
                type: 'message',
                role: 'user',
                content: [
                    {
                        type: 'input_text',
                        text,
                    },
                ],
            },
        });
        this.sendEvent({ type: 'response.create' });
    }

    /**
     * Send function call output back to the API and request the next response.
     */
    sendFunctionCallOutput(callId, output) {
        this.sendEvent({
            type: 'conversation.item.create',
            item: {
                type: 'function_call_output',
                call_id: callId,
                output: JSON.stringify(output),
            },
        });
        // Must request a new response after sending function output
        this.sendEvent({ type: 'response.create' });
    }

    /**
     * Handle all server events from the data channel.
     */
    _handleServerEvent(event) {
        switch (event.type) {
            case 'session.created':
            case 'session.updated':
                this._emit(event.type, event);
                break;

            case 'response.audio_transcript.delta':
                this._emit('transcript.delta', {
                    role: 'assistant',
                    delta: event.delta,
                });
                break;

            case 'response.audio_transcript.done':
                this._emit('transcript.done', {
                    role: 'assistant',
                    text: event.transcript,
                });
                break;

            case 'conversation.item.input_audio_transcription.completed':
                this._emit('transcript.done', {
                    role: 'user',
                    text: event.transcript,
                });
                break;

            case 'response.output_item.done':
                if (event.item && event.item.type === 'function_call') {
                    this._handleFunctionCall(event.item);
                }
                break;

            case 'response.done':
                this._emit('response.done', event);
                break;

            case 'error':
                console.error('Realtime API error:', event.error);
                this._emit('error', event.error);
                break;
        }
    }

    /**
     * Handle function calls from the agent.
     */
    _handleFunctionCall(item) {
        const { name, arguments: argsJson, call_id } = item;
        let args;
        try {
            args = JSON.parse(argsJson);
        } catch (e) {
            console.error('Failed to parse function call args:', argsJson);
            this.sendFunctionCallOutput(call_id, { success: false, error: 'Invalid JSON' });
            return;
        }

        this._emit('function_call', { name, args, call_id });
    }

    /**
     * Disconnect and clean up all resources.
     */
    disconnect() {
        if (this.dc) {
            this.dc.close();
            this.dc = null;
        }
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach((t) => t.stop());
            this.mediaStream = null;
        }
        if (this.audioEl) {
            this.audioEl.srcObject = null;
            this.audioEl = null;
        }
        this.connected = false;
        this._emit('disconnected');
    }

    /**
     * Emit a CustomEvent.
     */
    _emit(type, detail = null) {
        this.dispatchEvent(new CustomEvent(type, { detail }));
    }
}
