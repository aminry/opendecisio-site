// Registrations built from complete local files, using the public HTTP contract.
const post = `base_url = os.environ.get("DECISIO_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
request = urllib.request.Request(
    base_url + "/v1/tasks", data=json.dumps(body).encode(),
    headers={"Content-Type": "application/json"},
)
with urllib.request.urlopen(request, timeout=300) as response:
    print(json.dumps(json.load(response), indent=2))`;
const imports = 'import json\nimport os\nimport urllib.request\n\n';

export function taskRegistration(kind) {
    const files = {context:'task.json',dynamic:'dynamic-task.json',table:'task.json',fastpath:'task.json'};
    if (!files[kind]) throw new Error(`unknown registration kind: ${kind}`);
    const edits = {
        context:'with open("context.txt", encoding="utf-8") as context:\n    body["context"] = context.read()',
        dynamic:'body["options"] = "dynamic"\nbody["match"] = "instructions"\nbody.setdefault("certify", {"alpha": 0.05})',
        fastpath:'with open("context.txt", encoding="utf-8") as context:\n    body["context"] = context.read()\nif not isinstance(body.get("fast_table"), dict):\n    body["fast_table"] = True\nbody.setdefault("certify", {"alpha": 0.05})',
        table:'body["fast_table"] = True\nbody.setdefault("certify", {"alpha": 0.05})',
    };
    return imports + `with open("${files[kind]}", encoding="utf-8") as source:\n    body = json.load(source)\n${edits[kind]}\n\n${post}`;
}

export function learningRegistration() {
    return imports + `body = {
    "id": "support-queue-learn",
    "question": {
        "type": "choice", "instructions": "Which support queue should handle this ticket?",
        "criteria": {"billing": "Invoices, charges and refunds",
                     "access": "Login and permissions", "other": "Anything else"},
    },
    "fast_table": {"learn": True},
    "certify": {"alpha": 0.05},
}

${post}`;
}

export const fastPathRegistration = () => taskRegistration('fastpath');

export function fastPathRequest() {
    return imports + `with open("task.json", encoding="utf-8") as source:
    task = json.load(source)
with open("state.json", encoding="utf-8") as source:
    state = json.load(source)

if "question" in task:
    questions = {"decision": task["question"]}
else:
    questions = task["examples"][0]["request"]["questions"]
body = {"state": state, "task": task["id"], "questions": questions}
if "layout" in task:
    body["layout"] = task["layout"]

${post.replace('/v1/tasks', '/v1/systemone')}`;
}
