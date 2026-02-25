import os
import requests
from flask import Flask, render_template, jsonify, request, abort
from dotenv import load_dotenv
from algorithm_loader import load_algorithm, load_all_algorithms

load_dotenv()

app = Flask(__name__)

OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
REALTIME_MODEL = os.environ.get('REALTIME_MODEL', 'gpt-4o-realtime-preview')


# ---------------------------------------------------------------------------
# System prompt & tools for the voice agent
# ---------------------------------------------------------------------------

SYSTEM_PROMPT_TEMPLATE = """\
You are an expert algorithm tutor in a voice-guided learning app. \
You are currently teaching the algorithm: {title}.

## Your Role
You are a patient, encouraging computer science tutor. You explain algorithms clearly using \
analogies and step-by-step reasoning. You speak in a conversational, natural tone -- not \
like reading a textbook. You use short sentences suitable for spoken delivery.

## The Algorithm
Here is the complete reference material for this algorithm:

---
{full_markdown}
---

## The Code
The student is looking at the following Python code in their code viewer. \
The code has {line_count} lines, numbered 1 through {line_count}:

```python
{code}
```

## How to Use Tools

You have a `highlight_lines` tool. You MUST call it every time you start discussing \
specific lines of code. This visually highlights those lines in the student's code viewer \
so they can follow along.

Rules for using highlight_lines:
1. ALWAYS call highlight_lines BEFORE you start explaining a section of code.
2. Use 1-based line numbers that correspond to the code above.
3. Highlight only the lines you are currently discussing -- not the entire code.
4. When you move to a new section, call highlight_lines again with the new range.
5. If you are answering a general question not about specific lines, call clear_highlight.

## Walkthrough Instructions

When the session starts (the student says to begin the walkthrough):
1. Greet the student briefly and tell them what algorithm you will cover.
2. Give a one-sentence overview of what the algorithm does and when it is useful.
3. Then walk through the code section by section, following the Walkthrough steps \
in the reference material above.
4. For each step, FIRST call highlight_lines with the relevant line range, \
THEN explain those lines in 2-3 spoken sentences.
5. After covering all steps, summarize the key takeaways and invite questions.

## Answering Questions

When the student asks a question:
- If it is about specific lines, call highlight_lines for those lines, then answer.
- If it is a general conceptual question, call clear_highlight, then answer.
- If the student seems confused, try a different analogy or explanation.
- If the student asks about time/space complexity, refer to the Complexity section.
- Keep answers concise (2-4 sentences) unless the student asks for more detail.

## Speaking Style
- Use short, clear sentences (this is spoken aloud, not written text).
- Pause naturally between concepts.
- Say "line 5" or "lines 7 through 12" when referring to code.
- Do NOT read code character by character. Describe what the code does in plain English.
- Use analogies when helpful (e.g., "think of binary search like looking up a word in a dictionary").
"""

DEFAULT_SYSTEM_PROMPT = (
    "You are a helpful algorithm tutor. The student has not selected "
    "a specific algorithm yet. Encourage them to pick one from the list."
)


def build_system_prompt(algo):
    return SYSTEM_PROMPT_TEMPLATE.format(
        title=algo['title'],
        full_markdown=algo['full_markdown'],
        line_count=algo['line_count'],
        code=algo['code'],
    )


def get_tools_schema():
    return [
        {
            "type": "function",
            "name": "highlight_lines",
            "description": (
                "Highlight specific lines of code in the code viewer. "
                "Call this EVERY TIME you begin discussing a new section of code. "
                "The highlighted lines will be visually emphasized in the user's code panel. "
                "Use 1-based line numbers."
            ),
            "parameters": {
                "type": "object",
                "strict": True,
                "properties": {
                    "start_line": {
                        "type": "integer",
                        "description": "The first line number to highlight (1-based, inclusive).",
                    },
                    "end_line": {
                        "type": "integer",
                        "description": "The last line number to highlight (1-based, inclusive). Same as start_line for a single line.",
                    },
                },
                "required": ["start_line", "end_line"],
                "additionalProperties": False,
            },
        },
        {
            "type": "function",
            "name": "clear_highlight",
            "description": (
                "Remove all line highlights from the code viewer. "
                "Call this when you finish discussing the code and are answering a general question, "
                "or when transitioning between topics where no specific lines are relevant."
            ),
            "parameters": {
                "type": "object",
                "strict": True,
                "properties": {},
                "required": [],
                "additionalProperties": False,
            },
        },
    ]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route('/')
def index():
    algorithms = load_all_algorithms()
    return render_template('index.html', algorithms=algorithms)


@app.route('/algorithm/<slug>')
def algorithm_detail(slug):
    algo = load_algorithm(slug)
    if not algo:
        abort(404)
    return render_template('algorithm.html', algo=algo)


@app.route('/api/session', methods=['POST'])
def create_session():
    """Mint an ephemeral token for the OpenAI Realtime API."""
    if not OPENAI_API_KEY:
        return jsonify({'error': 'OPENAI_API_KEY not configured'}), 500

    body = request.get_json(silent=True) or {}
    slug = body.get('slug')

    algo = load_algorithm(slug) if slug else None
    system_prompt = build_system_prompt(algo) if algo else DEFAULT_SYSTEM_PROMPT

    response = requests.post(
        'https://api.openai.com/v1/realtime/sessions',
        headers={
            'Authorization': f'Bearer {OPENAI_API_KEY}',
            'Content-Type': 'application/json',
        },
        json={
            'model': REALTIME_MODEL,
            'voice': 'ash',
            'modalities': ['audio', 'text'],
            'instructions': system_prompt,
            'tools': get_tools_schema(),
            'tool_choice': 'auto',
            'input_audio_transcription': {
                'model': 'gpt-4o-mini-transcription',
            },
        },
    )

    if response.status_code != 200:
        return jsonify({'error': 'Failed to create session', 'detail': response.text}), 502

    data = response.json()
    return jsonify({
        'token': data['client_secret']['value'],
        'expires_at': data['client_secret']['expires_at'],
    })


if __name__ == '__main__':
    app.run(debug=True, port=5001)
