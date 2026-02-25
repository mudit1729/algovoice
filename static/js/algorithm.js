// algorithm.js - Algorithm view: voice agent + code highlight orchestration

document.addEventListener('DOMContentLoaded', () => {
    const slug = document.querySelector('meta[name="algorithm-slug"]').content;
    const lineCount = parseInt(
        document.querySelector('meta[name="algorithm-line-count"]').content,
        10
    );

    const codeBlock = document.getElementById('codeBlock');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const statusEl = document.getElementById('agentStatus');
    const statusDot = statusEl.querySelector('.status-dot');
    const statusText = statusEl.querySelector('.status-text');
    const transcriptEl = document.getElementById('transcript');
    const highlightInfoEl = document.getElementById('currentHighlight');

    let client = null;

    // -----------------------------------------------------------------------
    // Line Highlighting
    // Uses Prism's .line-numbers-rows spans as position references for
    // pixel-accurate overlay placement, regardless of font/padding.
    // -----------------------------------------------------------------------

    function highlightLines(startLine, endLine) {
        // Clamp to valid range
        startLine = Math.max(1, Math.min(startLine, lineCount));
        endLine = Math.max(startLine, Math.min(endLine, lineCount));

        // Remove previous highlights
        codeBlock.querySelectorAll('.voice-highlight').forEach((el) => el.remove());

        // Use line-numbers-rows spans as position references (1 span per line)
        const lineRows = codeBlock.querySelectorAll('.line-numbers-rows > span');
        if (lineRows.length === 0) return;

        const preRect = codeBlock.getBoundingClientRect();
        const firstRow = lineRows[startLine - 1];
        const lastRow = lineRows[endLine - 1];
        if (!firstRow || !lastRow) return;

        const firstRect = firstRow.getBoundingClientRect();
        const lastRect = lastRow.getBoundingClientRect();

        // Position relative to the <pre> element's top-left corner (accounting for scroll)
        const top = firstRect.top - preRect.top + codeBlock.scrollTop;
        const height = lastRect.bottom - firstRect.top;

        const overlay = document.createElement('div');
        overlay.className = 'voice-highlight';
        overlay.style.cssText = `
            position: absolute;
            left: 0;
            right: 0;
            top: ${top}px;
            height: ${height}px;
            background: rgba(255, 213, 0, 0.12);
            border-left: 3px solid #ffd500;
            pointer-events: none;
            z-index: 1;
            transition: top 0.3s ease, height 0.3s ease;
        `;

        codeBlock.style.position = 'relative';
        codeBlock.appendChild(overlay);

        // Scroll the highlight into view within the code container
        const codeContainer = codeBlock.closest('.code-container');
        if (codeContainer) {
            const containerRect = codeContainer.getBoundingClientRect();
            if (firstRect.top < containerRect.top || lastRect.bottom > containerRect.bottom) {
                firstRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        // Update info display
        const label = startLine === endLine ? `line ${startLine}` : `lines ${startLine}-${endLine}`;
        highlightInfoEl.textContent = `Discussing ${label}`;
    }

    function clearHighlight() {
        codeBlock.querySelectorAll('.voice-highlight').forEach((el) => el.remove());
        highlightInfoEl.textContent = '';
    }

    // -----------------------------------------------------------------------
    // Status
    // -----------------------------------------------------------------------

    function setStatus(state, text) {
        statusEl.className = `agent-status ${state}`;
        statusText.textContent = text;
    }

    // -----------------------------------------------------------------------
    // Transcript
    // -----------------------------------------------------------------------

    function clearTranscriptPlaceholder() {
        const ph = transcriptEl.querySelector('.transcript-placeholder');
        if (ph) ph.remove();
    }

    function addTranscriptEntry(role, text) {
        if (!text || !text.trim()) return;
        clearTranscriptPlaceholder();

        const entry = document.createElement('div');
        entry.className = `transcript-entry ${role}`;

        const roleLabel = document.createElement('span');
        roleLabel.className = 'role';
        roleLabel.textContent = role === 'assistant' ? 'Tutor' : 'You';

        const body = document.createElement('span');
        body.textContent = text;

        entry.appendChild(roleLabel);
        entry.appendChild(body);
        transcriptEl.appendChild(entry);
        transcriptEl.scrollTop = transcriptEl.scrollHeight;
    }

    // -----------------------------------------------------------------------
    // Start Session
    // -----------------------------------------------------------------------

    startBtn.addEventListener('click', async () => {
        startBtn.disabled = true;
        setStatus('connecting', 'Connecting...');

        try {
            client = new RealtimeClient();

            // --- Event Handlers ---

            client.addEventListener('connected', () => {
                setStatus('connected', 'Connected - Tutor is speaking');
                stopBtn.disabled = false;

                // Trigger the walkthrough
                client.sendTextMessage(
                    'Please begin the walkthrough of this algorithm from the top.'
                );
            });

            client.addEventListener('disconnected', () => {
                setStatus('', 'Disconnected');
                startBtn.disabled = false;
                stopBtn.disabled = true;
                clearHighlight();
            });

            client.addEventListener('transcript.done', (e) => {
                const { role, text } = e.detail;
                addTranscriptEntry(role, text);
            });

            client.addEventListener('function_call', (e) => {
                const { name, args, call_id } = e.detail;

                if (name === 'highlight_lines') {
                    highlightLines(args.start_line, args.end_line);
                    client.sendFunctionCallOutput(call_id, {
                        success: true,
                        highlighted: `${args.start_line}-${args.end_line}`,
                    });
                } else if (name === 'clear_highlight') {
                    clearHighlight();
                    client.sendFunctionCallOutput(call_id, { success: true });
                } else {
                    client.sendFunctionCallOutput(call_id, {
                        success: false,
                        error: `Unknown function: ${name}`,
                    });
                }
            });

            client.addEventListener('error', (e) => {
                const msg = e.detail?.message || 'Unknown error';
                console.error('Realtime API error:', e.detail);
                setStatus('error', `Error: ${msg}`);
            });

            // Connect
            await client.connect(slug);
        } catch (err) {
            console.error('Connection failed:', err);

            let msg = err.message;
            if (err.name === 'NotAllowedError') {
                msg = 'Microphone access denied. Please allow mic access and try again.';
            } else if (err.name === 'NotFoundError') {
                msg = 'No microphone found. Please connect a microphone.';
            }

            setStatus('error', msg);
            startBtn.disabled = false;
        }
    });

    // -----------------------------------------------------------------------
    // Stop Session
    // -----------------------------------------------------------------------

    stopBtn.addEventListener('click', () => {
        if (client) {
            client.disconnect();
            client = null;
        }
    });

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        if (client) {
            client.disconnect();
            client = null;
        }
    });
});
