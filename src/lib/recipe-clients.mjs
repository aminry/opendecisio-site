// Complete Python clients for the application recipes.
const question = (r) => ({ type: r.type, instructions: r.instructions, ...(r.criteria ? { criteria: r.criteria } : {}) });
const pythonQuestion = (r) => JSON.stringify(question(r), null, 4).replace(/: null/g, ': None');
const review = (id) => ({ 'support-routing': 'to a person', gatekeeper: 'ask', 'issue-triage': 'to a maintainer', guardrails: 'to a moderator', 'rag-gate': 'to a larger model or a person', 'document-classification': 'to a person' })[id];

export function recipeClient(id, r) {
	const validate = r.type === 'noul'
		? 'type(answer.get("noul")) in (int, float) and 0 <= answer["noul"] <= 1'
		: 'answer.get("choice") in QUESTION["criteria"]';
	return `import json
import os
import urllib.error
import urllib.request

${r.pre ?? ''}QUESTION = ${pythonQuestion(r)}
BASE_URL = os.environ.get("DECISIO_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
TIMEOUT = 15
REVIEW = ${JSON.stringify(review(id))}


def route(text):
    request = urllib.request.Request(
        BASE_URL + "/v1/systemone",
        data=json.dumps({"state": text, "questions": {"${r.key}": QUESTION}}).encode(),
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
            answer = json.load(response)["answers"]["${r.key}"]
        if not isinstance(answer, dict) or answer.get("type") != QUESTION["type"]:
            return REVIEW
        if not (${validate}):
            return REVIEW
        # A gold certificate is about correctness; agreement alone is insufficient.
        if (answer.get("certified") is True
                and answer.get("certificate_kind") == "gold"
                and isinstance(answer.get("certificate"), str)
                and answer["certificate"]):
            return ${r.act}
        return ${r.person}
    except (urllib.error.URLError, TimeoutError, OSError, ValueError, KeyError, TypeError):
        return REVIEW


if __name__ == "__main__":
    print(route(${JSON.stringify(r.text.replace(/\\n/g, '\n'))}))`;
}

export function recipeRegistration(id, r) {
	return `import json
import os
import urllib.request

QUESTION = ${pythonQuestion(r)}
# One JSON object per line: state and the answer chosen by a person.
with open("${id}-labels.jsonl", encoding="utf-8") as source:
    rows = [json.loads(line) for line in source if line.strip()]
examples = [
    {"request": {"state": row["state"], "questions": {"${r.key}": QUESTION}},
     "answer": row["answer"]}
    for row in rows
]
body = {"id": "${id}", "examples": examples, "certify": {"alpha": 0.05}}
base_url = os.environ.get("DECISIO_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
request = urllib.request.Request(
    base_url + "/v1/tasks", data=json.dumps(body).encode(),
    headers={"Content-Type": "application/json"},
)
# Registration reads all your examples; allow more time than an ordinary decision.
with urllib.request.urlopen(request, timeout=300) as response:
    record = json.load(response)
print(json.dumps(record.get("certificate"), indent=2))`;
}
