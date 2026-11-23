with open("frontend/src/components/ChatDrawer.tsx", "r", encoding="utf-8") as f:
    code = f.read()

target = """    try {
      const response = await fetch('/api/v1/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: textToSend
        })
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error ${response.status}`);
      }"""

replacement = """    try {
      let response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: textToSend
        })
      });

      if (!response.ok || !response.body) {
        response = await fetch('/api/v1/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            message: textToSend
          })
        });
      }

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error ${response.status}`);
      }"""

# Normalize newlines
code_norm = code.replace("\r\n", "\n")
target_norm = target.replace("\r\n", "\n")
replacement_norm = replacement.replace("\r\n", "\n")

if target_norm in code_norm:
    code_norm = code_norm.replace(target_norm, replacement_norm)
    with open("frontend/src/components/ChatDrawer.tsx", "w", encoding="utf-8") as f:
        f.write(code_norm)
    print("ChatDrawer chat endpoints updated.")
else:
    print("Target not found in ChatDrawer.")
