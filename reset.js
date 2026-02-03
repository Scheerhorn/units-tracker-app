import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  "https://fxpaqqpddrcunxcwnjgk.supabase.co",
  "sb_publishable_AmyQ5z5fnhOX8KL5pySplQ_Td16NI02"
);

const form = document.querySelector("form");
const button = document.getElementById("set-password-button");
const passwordInput = document.getElementById("new-password");
const msg = document.getElementById("reset-error");

function setLoading(isLoading) {
  button.disabled = isLoading;
  button.textContent = isLoading ? "Saving…" : "Set new password";
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.textContent = "";
  msg.style.color = "";

  const newPassword = passwordInput.value.trim();
  if (newPassword.length < 6) {
    msg.textContent = "Password must be at least 6 characters.";
    return;
  }

  setLoading(true);

  // If the user arrived via Supabase recovery link, they will have a recovery session in the URL.
  // updateUser will work once Supabase establishes that session.
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    msg.textContent = error.message;
    setLoading(false);
    return;
  }

  msg.style.color = "green";
  msg.textContent = "Password updated. Redirecting to login…";

  setTimeout(() => {
    window.location.href = "./index.html";
  }, 800);
});
