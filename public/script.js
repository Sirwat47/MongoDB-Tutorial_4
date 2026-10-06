const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const refreshBtn = document.getElementById("refreshBtn");
const usersTable = document.getElementById("usersTable");
const messageBox = document.getElementById("message");
const currentUserBox = document.getElementById("currentUser");

function showMessage(text, isError) {
  messageBox.textContent = text;
  messageBox.className = isError ? "error" : "success";
  messageBox.style.display = "block";
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("th-TH");
}

async function api(path, options) {
  let response;
  try {
    response = await fetch(path, options);
  } catch {
    throw new Error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์");
  return data;
}

async function loadUsers() {
  try {
    const data = await api("/api/users");
    if (!data.users || data.users.length === 0) {
      usersTable.innerHTML = '<tr><td colspan="6" style="text-align:center;">ยังไม่มีสมาชิกในระบบ</td></tr>';
      return;
    }
    usersTable.innerHTML = data.users.map((u) => `
      <tr>
        <td>${escapeHtml(u.username)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>${u.loginCount}</td>
        <td>${formatDate(u.lastLogin)}</td>
        <td>${formatDate(u.createdAt)}</td>
        <td><button type="button" class="delete-btn" data-delete="${escapeHtml(u.username)}">ลบ</button></td>
      </tr>`).join("");
  } catch (err) {
    showMessage(err.message, true);
  }
}

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    username: document.getElementById("regUsername").value,
    email: document.getElementById("regEmail").value,
    password: document.getElementById("regPassword").value
  };
  try {
    const data = await api("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    showMessage(data.message);
    registerForm.reset();
    await loadUsers();
  } catch (err) {
    showMessage(err.message, true);
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    username: document.getElementById("loginUsername").value,
    password: document.getElementById("loginPassword").value
  };
  try {
    const data = await api("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    showMessage(`ยินดีต้อนรับ, ${data.user.username} (เข้าสู่ระบบครั้งที่ ${data.user.loginCount})`);
    currentUserBox.textContent = `ผู้ใช้งานปัจจุบัน: ${data.user.username} <${data.user.email}>`;
    loginForm.reset();
    await loadUsers();
  } catch (err) {
    showMessage(err.message, true);
  }
});

usersTable.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-delete]");
  if (!btn) return;
  const username = btn.getAttribute("data-delete");
  if (!confirm(`ต้องการลบผู้ใช้ "${username}" หรือไม่?`)) return;
  try {
    const data = await api(`/api/users/${encodeURIComponent(username)}`, { method: "DELETE" });
    showMessage(data.message);
    await loadUsers();
  } catch (err) {
    showMessage(err.message, true);
  }
});

refreshBtn.addEventListener("click", loadUsers);

loadUsers();
