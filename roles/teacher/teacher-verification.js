window.applyPageConfig({
  autoRole: "teacher",
  autoPage: "verification"
});

(function initTeacherVerificationRowView() {
  var isTransforming = false;

  function getStatusType(statusText) {
    var normalized = String(statusText || "").toLowerCase();
    if (normalized.indexOf("completed") > -1 || normalized.indexOf("verified") > -1) {
      return "completed";
    }
    if (normalized.indexOf("correction") > -1 || normalized.indexOf("reject") > -1) {
      return "correction";
    }
    return "pending";
  }

  function extractEmail(card) {
    var emailNode = card.querySelector(".student-card-info .muted");
    if (!emailNode) {
      return "-";
    }
    var text = (emailNode.textContent || "").trim();
    return text || "-";
  }

  function extractProgress(card) {
    var fill = card.querySelector(".student-progress .progress-fill");
    var fillStyle = fill ? fill.getAttribute("style") || "" : "";
    var match = /width\s*:\s*([0-9]+)%/i.exec(fillStyle);
    var percent = match ? Number(match[1]) : 0;

    var summary = card.querySelector(".student-progress p.muted");
    var summaryText = summary ? (summary.textContent || "").trim() : "0 of 0 items verified";

    var ratioText = summaryText;
    var ratioMatch = /(\d+)\s+of\s+(\d+)/i.exec(summaryText);
    if (ratioMatch) {
      ratioText = ratioMatch[1] + " / " + ratioMatch[2] + " verified";
    }

    return {
      percent: Math.max(0, Math.min(100, percent)),
      summary: ratioText
    };
  }

  function buildHeaderRow() {
    var header = document.createElement("div");
    header.className = "verification-header";
    header.innerHTML =
      "<div>Name</div>" +
      "<div>Email</div>" +
      "<div>Progress</div>" +
      "<div>Status</div>" +
      "<div>Action</div>";
    return header;
  }

  function createCol(className, label) {
    var col = document.createElement("div");
    col.className = "col " + className;
    col.setAttribute("data-col-label", label);
    return col;
  }

  function buildSubmissionTable(expandContent) {
    var table = document.createElement("div");
    table.className = "submission-table";

    var header = document.createElement("div");
    header.className = "submission-header";
    header.innerHTML =
      "<div>Criteria</div>" +
      "<div>Proof</div>" +
      "<div>Status</div>" +
      "<div>Actions</div>";
    table.appendChild(header);

    var items = expandContent.querySelectorAll(".verification-item");
    for (var i = 0; i < items.length; i += 1) {
      var row = document.createElement("div");
      row.className = "submission-row";

      var criteriaCol = document.createElement("div");
      var titleNode = items[i].querySelector("h4");
      var title = titleNode ? (titleNode.textContent || "").trim() : "-";
      var mutedNodes = items[i].querySelectorAll("p.muted");
      var categoryNode = mutedNodes.length ? mutedNodes[0] : null;
      var category = categoryNode ? (categoryNode.textContent || "").trim() : "";

      var titleStrong = document.createElement("strong");
      titleStrong.textContent = title;
      criteriaCol.appendChild(titleStrong);

      if (category) {
        var categoryMeta = document.createElement("div");
        categoryMeta.className = "muted";
        categoryMeta.textContent = category;
        criteriaCol.appendChild(categoryMeta);
      }

      var proofCol = document.createElement("div");
      var proofButton = items[i].querySelector("[data-view-doc]");
      if (proofButton) {
        proofCol.appendChild(proofButton);
      } else {
        proofCol.textContent = "-";
      }

      var statusCol = document.createElement("div");
      var statusPill = items[i].querySelector(".status-pill");
      if (statusPill) {
        statusCol.appendChild(statusPill);
      } else {
        statusCol.textContent = "Pending";
      }

      var actionsCol = document.createElement("div");
      actionsCol.className = "submission-actions";

      var remarkField = items[i].querySelector(".field");
      if (remarkField) {
        actionsCol.appendChild(remarkField);
      }

      var buttonRow = items[i].querySelector(".button-row");
      if (buttonRow) {
        actionsCol.appendChild(buttonRow);
      }

      var staticRemark = mutedNodes.length > 1 ? mutedNodes[mutedNodes.length - 1] : null;
      if (!remarkField && !buttonRow && staticRemark) {
        actionsCol.appendChild(staticRemark);
      }

      row.appendChild(criteriaCol);
      row.appendChild(proofCol);
      row.appendChild(statusCol);
      row.appendChild(actionsCol);
      table.appendChild(row);
    }

    return table;
  }

  function convertCardToRow(card) {
    var nameNode = card.querySelector(".student-name");
    var studentName = nameNode ? (nameNode.textContent || "").trim() : "Student";
    var email = extractEmail(card);
    var progress = extractProgress(card);

    var statusPill = card.querySelector(".student-card-header .status-pill");
    var statusText = statusPill ? (statusPill.textContent || "").trim() : "Pending";
    var statusType = getStatusType(statusText);

    var row = document.createElement("div");
    row.className = "verification-row";

    var nameCol = createCol("name", "Name");
    var nameStrong = document.createElement("strong");
    nameStrong.textContent = studentName;
    nameCol.appendChild(nameStrong);

    var emailCol = createCol("email", "Email");
    var emailSpan = document.createElement("span");
    emailSpan.className = "email";
    emailSpan.textContent = email;
    emailCol.appendChild(emailSpan);

    var progressCol = createCol("progress", "Progress");
    var progressBar = document.createElement("div");
    progressBar.className = "progress-bar";
    var progressFill = document.createElement("div");
    progressFill.className = "progress-fill";
    progressFill.style.width = progress.percent + "%";
    progressBar.appendChild(progressFill);
    var progressText = document.createElement("span");
    progressText.textContent = progress.summary;
    progressCol.appendChild(progressBar);
    progressCol.appendChild(progressText);

    var statusCol = createCol("status", "Status");
    var statusBadge = document.createElement("span");
    statusBadge.className = "status " + statusType;
    statusBadge.textContent = statusText;
    statusCol.appendChild(statusBadge);

    var actionCol = createCol("action", "Action");
    var reviewButton = card.querySelector("[data-expand-student]");
    if (reviewButton) {
      reviewButton.classList.add("review-btn");
      actionCol.appendChild(reviewButton);
    }

    row.appendChild(nameCol);
    row.appendChild(emailCol);
    row.appendChild(progressCol);
    row.appendChild(statusCol);
    row.appendChild(actionCol);

    var fragment = document.createDocumentFragment();
    fragment.appendChild(row);

    var expandContent = card.querySelector(".student-expand-content");
    if (expandContent) {
      var detailsRow = document.createElement("div");
      detailsRow.className = "submission-details";
      detailsRow.appendChild(buildSubmissionTable(expandContent));
      fragment.appendChild(detailsRow);
    }

    return fragment;
  }

  function applyRowLayout() {
    if (isTransforming) {
      return;
    }

    var root = document.getElementById("page-content");
    if (!root) {
      return;
    }

    var grid = root.querySelector(".student-grid");
    if (!grid) {
      return;
    }

    var cards = grid.querySelectorAll(".student-card");
    if (!cards.length) {
      return;
    }

    isTransforming = true;

    var table = document.createElement("div");
    table.className = "verification-table";
    table.appendChild(buildHeaderRow());

    for (var i = 0; i < cards.length; i += 1) {
      table.appendChild(convertCardToRow(cards[i]));
    }

    grid.innerHTML = "";
    grid.appendChild(table);
    grid.classList.add("verification-list-host");

    isTransforming = false;
  }

  function observePageChanges() {
    var root = document.getElementById("page-content");
    if (!root) {
      return;
    }

    var observer = new MutationObserver(function () {
      applyRowLayout();
    });

    observer.observe(root, { childList: true, subtree: true });
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyRowLayout();
    observePageChanges();
  });

  window.addEventListener("load", applyRowLayout);
})();
