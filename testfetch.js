import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userText: "test message", responseType: "json" })
    });
    console.log("Status:", res.status);
    console.log("Content-Type:", res.headers.get("content-type"));
    const text = await res.text();
    console.log("Body:", text.substring(0, 100));
  } catch (err) {
    console.error(err);
  }
}
test();
