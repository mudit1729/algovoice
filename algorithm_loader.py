import os
import re
import frontmatter

ALGORITHMS_DIR = os.path.join(os.path.dirname(__file__), 'algorithms')


def extract_code_block(content):
    """Extract the first Python fenced code block from markdown content."""
    pattern = r'```python\n(.*?)```'
    match = re.search(pattern, content, re.DOTALL)
    return match.group(1).rstrip('\n') if match else None


def load_algorithm(slug):
    """Load a single algorithm by slug. Returns dict or None."""
    filepath = os.path.join(ALGORITHMS_DIR, f'{slug}.md')
    if not os.path.exists(filepath):
        return None

    post = frontmatter.load(filepath)
    code = extract_code_block(post.content)
    code_lines = code.split('\n') if code else []

    return {
        'slug': post.metadata.get('slug', slug),
        'title': post.metadata.get('title', slug.replace('-', ' ').title()),
        'difficulty': post.metadata.get('difficulty', 'medium'),
        'tags': post.metadata.get('tags', []),
        'estimated_minutes': post.metadata.get('estimated_minutes', 10),
        'code': code,
        'code_lines': code_lines,
        'line_count': len(code_lines),
        'full_markdown': post.content,
    }


def load_all_algorithms():
    """Load all algorithm markdown files. Returns list of dicts."""
    algorithms = []
    if not os.path.isdir(ALGORITHMS_DIR):
        return algorithms
    for filename in sorted(os.listdir(ALGORITHMS_DIR)):
        if filename.endswith('.md'):
            slug = filename[:-3]
            algo = load_algorithm(slug)
            if algo:
                algorithms.append(algo)
    return algorithms
