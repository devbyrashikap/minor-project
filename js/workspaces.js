document.addEventListener("DOMContentLoaded", async function () {
  if (!window.OneSpaceAuth.requireAuth()) return;

  const listContainer = document.getElementById("workspaceList");
  const emptyState = document.getElementById("emptyState");
  const createForm = document.getElementById("createWorkspaceForm");
  const createNameInput = document.getElementById("workspaceName");
  const createDescInput = document.getElementById("workspaceDescription");
  const createSubmit = document.getElementById("createWorkspaceSubmit");
  const createBtnText = createSubmit.querySelector(".btn-text");
  const createBtnLoading = createSubmit.querySelector(".btn-loading");
  const logoutBtn = document.getElementById("logoutBtn");
  const createModalEl = document.getElementById("createWorkspaceModal");
  const createModal = new bootstrap.Modal(createModalEl);

  logoutBtn.addEventListener("click", async function () {
    await window.OneSpaceAuth.logout();
    window.location.replace("login.html");
  });

  createForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    event.stopPropagation();

    if (!createForm.checkValidity()) {
      createForm.classList.add("was-validated");
      return;
    }

    setCreateLoading(true);
    try {
      const workspace = await window.OneSpaceAPI.createWorkspace({
        name: createNameInput.value.trim(),
        description: createDescInput.value.trim()
      });
      window.OneSpaceUtils.showSuccess("Workspace created");
      createModal.hide();
      createForm.reset();
      createForm.classList.remove("was-validated");
      renderWorkspaces();
    } catch (err) {
      window.OneSpaceUtils.showError(err.message || "Failed to create workspace");
    } finally {
      setCreateLoading(false);
    }
  });

  createModalEl.addEventListener("hidden.bs.modal", function () {
    createForm.reset();
    createForm.classList.remove("was-validated");
  });

  async function renderWorkspaces() {
    try {
      const workspaces = await window.OneSpaceAPI.getWorkspaces();
      listContainer.innerHTML = "";

      if (!workspaces.length) {
        listContainer.classList.add("d-none");
        emptyState.classList.remove("d-none");
        return;
      }

      listContainer.classList.remove("d-none");
      emptyState.classList.add("d-none");

      workspaces.forEach(function (ws) {
        const card = createWorkspaceCard(ws);
        listContainer.appendChild(card);
      });
    } catch (err) {
      window.OneSpaceUtils.showError(err.message || "Failed to load workspaces");
    }
  }

  function createWorkspaceCard(ws) {
    const col = document.createElement("div");
    col.className = "col";

    const archivedBadge = ws.archived
      ? '<span class="badge bg-secondary ms-2"><i class="bi bi-archive me-1"></i>Archived</span>'
      : "";

    const updated = window.OneSpaceUtils.formatRelativeTime(ws.updated_at);
    const description = ws.description ? window.OneSpaceUtils.escapeHtml(ws.description) : '<span class="text-muted">No description</span>';

    col.innerHTML = `
      <div class="card h-100 shadow-sm ${ws.archived ? "opacity-75" : ""}">
        <div class="card-body d-flex flex-column">
          <div class="d-flex align-items-start justify-content-between mb-2">
            <h5 class="card-title mb-0">${window.OneSpaceUtils.escapeHtml(ws.name)}</h5>
            ${archivedBadge}
          </div>
          <p class="card-text text-muted small flex-grow-1">${description}</p>
          <div class="d-flex align-items-center justify-content-between mt-3 pt-2 border-top">
            <small class="text-muted"><i class="bi bi-clock-history me-1"></i>Updated ${updated}</small>
            <div class="btn-group btn-group-sm">
              <button type="button" class="btn btn-outline-primary open-btn" data-id="${ws.id}" ${ws.archived ? "disabled" : ""} aria-label="Open workspace">
                <i class="bi bi-box-arrow-up-right"></i> Open
              </button>
              <button type="button" class="btn btn-outline-secondary archive-btn" data-id="${ws.id}" data-archived="${ws.archived}" aria-label="${ws.archived ? "Unarchive" : "Archive"} workspace">
                <i class="bi ${ws.archived ? "bi-box-arrow-up" : "bi-archive"}"></i>
              </button>
              <button type="button" class="btn btn-outline-danger delete-btn" data-id="${ws.id}" aria-label="Delete workspace">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    col.querySelector(".open-btn").addEventListener("click", function () {
      window.location.href = `dashboard.html?workspace_id=${ws.id}`;
    });

    col.querySelector(".archive-btn").addEventListener("click", async function () {
      const confirmMsg = ws.archived ? "Unarchive this workspace?" : "Archive this workspace? This hides it from the main list but keeps all data.";
      if (!confirm(confirmMsg)) return;

      try {
        if (ws.archived) {
          await window.OneSpaceAPI.updateWorkspace(ws.id, { archived: false });
        } else {
          await window.OneSpaceAPI.archiveWorkspace(ws.id);
        }
        window.OneSpaceUtils.showSuccess(ws.archived ? "Workspace unarchived" : "Workspace archived");
        renderWorkspaces();
      } catch (err) {
        window.OneSpaceUtils.showError(err.message);
      }
    });

    col.querySelector(".delete-btn").addEventListener("click", async function () {
      if (!confirm("Delete this workspace? This will permanently remove all tasks, notes, resources, files, and activity.")) return;

      try {
        await window.OneSpaceAPI.deleteWorkspace(ws.id);
        window.OneSpaceUtils.showSuccess("Workspace deleted");
        renderWorkspaces();
      } catch (err) {
        window.OneSpaceUtils.showError(err.message);
      }
    });

    return col;
  }

  function setCreateLoading(isLoading) {
    createSubmit.disabled = isLoading;
    createBtnText.classList.toggle("d-none", isLoading);
    createBtnLoading.classList.toggle("d-none", !isLoading);
  }

  // Initial load
  renderWorkspaces();
});