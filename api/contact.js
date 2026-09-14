export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const token = process.env.GITHUB_TOKEN;
  const owner = "neharuvicharvedike";
  const repo = "neharuvicharvedike";
  const path = "messages.json";
  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  try {
    // Get current file (if it exists) to append to it
    let items = [];
    let sha = null;
    const getRes = await fetch(apiBase, {
      headers: { Authorization: `token ${token}` },
    });
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
      const decoded = Buffer.from(fileData.content, "base64").toString("utf-8");
      items = JSON.parse(decoded).items || [];
    }

    items.unshift({
      name,
      email,
      subject,
      message,
      date: new Date().toISOString(),
    });

    const newContent = Buffer.from(
      JSON.stringify({ items }, null, 2)
    ).toString("base64");

    const putRes = await fetch(apiBase, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `New contact message from ${name}`,
        content: newContent,
        sha: sha || undefined,
      }),
    });

    if (!putRes.ok) {
      const err = await putRes.json();
      return res.status(500).json({ error: err.message || "GitHub write failed" });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}