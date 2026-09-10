document.addEventListener("DOMContentLoaded", function () {
  if (window.OneSpaceAuth && window.OneSpaceAuth.isAuthenticated()) {
    window.location.replace("workspaces.html");
    return;
  }

  const form = document.getElementById("registerForm");
  const passwordInput = document.getElementById("password");
  const confirmInput = document.getElementById("confirmPassword");
  const toggleBtn = document.getElementById("togglePassword");
  const toggleIcon = toggleBtn.querySelector("i");
  const registerBtn = document.getElementById("registerBtn");
  const btnText = registerBtn.querySelector(".btn-text");
  const btnLoading = registerBtn.querySelector(".btn-loading");
  const errorAlert = document.getElementById("registerError");
  const successAlert = document.getElementById("registerSuccess");

  toggleBtn.addEventListener("click", function () {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
    confirmInput.type = type;
    toggleIcon.classList.toggle("bi-eye");
    toggleIcon.classList.toggle("bi-eye-slash");
    toggleBtn.setAttribute("aria-label", type === "password" ? "Show passwords" : "Hide passwords");
  });

  function validatePasswordMatch() {
    if (confirmInput.value && passwordInput.value !== confirmInput.value) {
      confirmInput.setCustomValidity("Passwords do not match.");
    } else {
      confirmInput.setCustomValidity("");
    }
  }

  passwordInput.addEventListener("input", validatePasswordMatch);
  confirmInput.addEventListener("input", validatePasswordMatch);

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    event.stopPropagation();

    validatePasswordMatch();

    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    setLoading(true);
    hideMessages();

    try {
      const users = getStoredUsers();
      const email = document.getElementById("email").value.trim().toLowerCase();
      if (users.some(function (u) { return u.email.toLowerCase() === email; })) {
        throw new Error("An account with this email already exists.");
      }

      const newUser = {
        id: createUserId(),
        name: document.getElementById("name").value.trim(),
        email: email,
        password: passwordInput.value
      };

      users.push(newUser);
      saveUsers(users);

      showSuccess("Account created successfully! Redirecting to login…");
      window.setTimeout(function () {
        window.location.replace("login.html");
      }, 1200);
    } catch (err) {
      showError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  });

  function getStoredUsers() {
    try {
      return JSON.parse(window.localStorage.getItem("onespace_users") || "[]");
    } catch (e) {
      return [];
    }
  }

  function saveUsers(users) {
    window.localStorage.setItem("onespace_users", JSON.stringify(users));
  }

  function createUserId() {
    return "user-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function setLoading(isLoading) {
    registerBtn.disabled = isLoading;
    btnText.classList.toggle("d-none", isLoading);
    btnLoading.classList.toggle("d-none", !isLoading);
  }

  function showError(message) {
    errorAlert.textContent = message;
    errorAlert.classList.remove("d-none");
    successAlert.classList.add("d-none");
  }

  function showSuccess(message) {
    successAlert.textContent = message;
    successAlert.classList.remove("d-none");
    errorAlert.classList.add("d-none");
  }

  function hideMessages() {
    errorAlert.classList.add("d-none");
    successAlert.classList.add("d-none");
    errorAlert.textContent = "";
    successAlert.textContent = "";
  }
});