window.applyPageConfig({
  autoRole: "admin",
  autoPage: "criteria"
});

(function initAdminCriteriaModule() {
  function renderCriteriaPage(ctx) {
    ensureCriteriaUiState(ctx.state);

    const categories = ctx.getCriteriaCategories();
    const editingItem = ctx.state.editingCriteriaItemId ? ctx.getCriteriaById(ctx.state.editingCriteriaItemId) : null;
    const editingCategory = ctx.state.editingCategoryId ? ctx.getCategoryById(ctx.state.editingCategoryId) : null;
    const showCategoryForm = Boolean(ctx.state.showCategoryForm || editingCategory);
    const showCriteriaItemForm = Boolean(ctx.state.showCriteriaItemForm || editingItem);
    const selectedYearHistory = ctx.getCriteriaHistoryForYear(ctx.state.selectedAcademicYear).slice(0, 6);
    const menuOpen = String(ctx.state.criteriaMenuOpen || "");
    const overlayMode = String(ctx.state.criteriaOverlayMode || "");
    const editingRangeRule = editingItem && editingItem.type === "range" && (editingItem.rules || []).length
      ? editingItem.rules[0]
      : null;

    const yearOptions = ctx.academicYears
      .map((year) => {
        const selected = year === ctx.state.selectedAcademicYear ? " selected" : "";
        const yearState = ctx.state.academicYearState.find((item) => item.year === year);
        const statusLabel = yearState && yearState.isActive ? " (Active)" : "";
        return "<option value=\"" + year + "\"" + selected + ">" + year + statusLabel + "</option>";
      })
      .join("");

    const academicYearStatusRows = ctx.state.academicYearState
      .map((item) => {
        const chipClass = item.isActive ? "status-approved" : "status-pending";
        const chipLabel = item.isActive ? "Active" : "Inactive";
        return "<p><strong>" + ctx.escapeHtml(item.year) + "</strong> <span class=\"status-pill " + chipClass + "\">" + chipLabel + "</span></p>";
      })
      .join("");

    const categoryOptions = categories
      .map((category) => {
        const selected = editingItem && category.category === editingItem.category ? " selected" : "";
        return "<option value=\"" + category.id + "\"" + selected + ">" + ctx.escapeHtml(category.category) + "</option>";
      })
      .join("");

    const fixedSelected = !editingItem || editingItem.type === "fixed" ? " selected" : "";
    const countSelected = editingItem && editingItem.type === "count" ? " selected" : "";
    const rangeSelected = editingItem && editingItem.type === "range" ? " selected" : "";
    const negativeSelected = editingItem && editingItem.type === "negative" ? " selected" : "";
    const rangeFieldHidden = !editingItem || editingItem.type !== "range" ? " hidden" : "";

    const groupedRows = categories
      .map((category) => {
        const itemRows = (category.items || []).length
          ? category.items
              .map((item) => {
                return (
                  "<tr>" +
                  "<td>" + ctx.escapeHtml(category.category) + "</td>" +
                  "<td>" + ctx.escapeHtml(item.title) + "</td>" +
                  "<td>" + ctx.escapeHtml(ctx.getCriteriaTypeLabel(item.type)) + "</td>" +
                  "<td>" + ctx.escapeHtml(getMaxMarksLabel(item)) + "</td>" +
                  "<td>" + ctx.escapeHtml(ctx.getCriteriaRuleSummary(item)) + "</td>" +
                  "<td><div class=\"button-row\"><button type=\"button\" class=\"btn ghost\" data-item-edit=\"" + item.id + "\">Edit</button><button type=\"button\" class=\"btn danger\" data-item-delete=\"" + item.id + "\">Delete</button></div></td>" +
                  "</tr>"
                );
              })
              .join("")
          : "<tr><td>" + ctx.escapeHtml(category.category) + "</td><td colspan=\"5\" class=\"empty-row\">No items in this category.</td></tr>";
        return itemRows;
      })
      .join("");

    const categoryRows = categories
      .map((category) => {
        return (
          "<tr>" +
          "<td>" + ctx.escapeHtml(category.category) + "</td>" +
          "<td>" + (category.items || []).length + "</td>" +
          "<td><div class=\"button-row\"><button type=\"button\" class=\"btn ghost\" data-category-edit=\"" + category.id + "\">Edit</button><button type=\"button\" class=\"btn danger\" data-category-delete=\"" + category.id + "\">Delete</button></div></td>" +
          "</tr>"
        );
      })
      .join("");

    const historyRows = selectedYearHistory.length
      ? selectedYearHistory
          .map((entry) => {
            const when = entry.at ? new Date(entry.at).toLocaleString() : "Now";
            return "<p><strong>" + ctx.escapeHtml(when) + "</strong> - " + ctx.escapeHtml(entry.message || "Updated") + "</p>";
          })
          .join("")
      : "<p>No criteria changes recorded for this academic year.</p>";

    const hubMenuHtml = renderCriteriaHubMenu(menuOpen);
    const workspaceClass = "criteria-workspace" + (overlayMode ? " criteria-workspace-blurred" : "");
    const overlayHtml = overlayMode ? renderCriteriaOverlayCard({
      ctx: ctx,
      overlayMode: overlayMode,
      categories: categories,
      categoryRows: categoryRows,
      groupedRows: groupedRows,
      categoryOptions: categoryOptions,
      fixedSelected: fixedSelected,
      countSelected: countSelected,
      rangeSelected: rangeSelected,
      negativeSelected: negativeSelected,
      editingItem: editingItem,
      editingCategory: editingCategory,
      editingRangeRule: editingRangeRule,
      showCategoryForm: showCategoryForm,
      showCriteriaItemForm: showCriteriaItemForm
    }) : "";

    return (
      "<section class=\"section-header criteria-header\"><div><h1>Criteria Management</h1><p class=\"muted\">Use Control for edit actions and View for lists. A focused overlay opens for each choice.</p></div>" + hubMenuHtml + "</section>" +
      "<div class=\"" + workspaceClass + "\">" +
        "<section class=\"cards-grid two-panel-grid\">" +
          "<article class=\"panel\"><h3>Academic Year</h3><div class=\"field\"><label for=\"academic-year-select\">Select Session</label><select id=\"academic-year-select\">" + yearOptions + "</select></div>" +
          "<div class=\"meta-list\">" + academicYearStatusRows + "</div></article>" +
          "<article class=\"panel\"><h3>Quick Snapshot</h3><div class=\"meta-list\"><p><strong>Categories:</strong> " + categories.length + "</p><p><strong>Criteria Items:</strong> " + ctx.getAllCriteriaItems().length + "</p><p><strong>Focused Year:</strong> " + ctx.escapeHtml(ctx.state.selectedAcademicYear) + "</p></div></article>" +
        "</section>" +
        "<section class=\"cards-grid two-panel-grid\">" +
          "<article class=\"panel\"><h3>Criteria by Category</h3><div class=\"table-wrap\"><table><thead><tr><th>Category</th><th>Item</th><th>Type</th><th>Max Marks</th><th>Marks / Rules</th><th>Actions</th></tr></thead><tbody>" + groupedRows + "</tbody></table></div></article>" +
          "<article class=\"panel\"><h3>Category Hierarchy Controls</h3><div class=\"table-wrap\"><table><thead><tr><th>Criterion (Category)</th><th>Sub-criteria Count</th><th>Actions</th></tr></thead><tbody>" + categoryRows + "</tbody></table></div><div class=\"meta-list\"><p><strong>Rule:</strong> A category can be deleted only when it has no sub-criteria.</p></div></article>" +
        "</section>" +
        "<section class=\"panel\"><h3>Criteria History - " + ctx.escapeHtml(ctx.state.selectedAcademicYear) + "</h3><div class=\"meta-list\">" + historyRows + "</div></section>" +
      "</div>" +
      overlayHtml
    );
  }

  function handleClick(event, ctx) {
    const openCategoryFormButton = event.target.closest("button[data-admin-criteria-action='open-category-form']");
    if (openCategoryFormButton) {
      ctx.state.criteriaMenuOpen = "controls";
      ctx.state.criteriaOverlayMode = "edit-category";
      ctx.state.showCategoryForm = true;
      ctx.state.showCriteriaItemForm = false;
      ctx.state.editingCategoryId = null;
      ctx.state.editingCriteriaItemId = null;
      ctx.renderPage();
      return true;
    }

    const openItemFormButton = event.target.closest("button[data-admin-criteria-action='open-item-form']");
    if (openItemFormButton) {
      ctx.state.criteriaMenuOpen = "controls";
      ctx.state.criteriaOverlayMode = "edit-criteria";
      ctx.state.showCriteriaItemForm = true;
      ctx.state.showCategoryForm = false;
      ctx.state.editingCriteriaItemId = null;
      ctx.state.editingCategoryId = null;
      ctx.renderPage();
      return true;
    }

    const editItemButton = event.target.closest("button[data-item-edit]");
    if (editItemButton) {
      ctx.state.criteriaOverlayMode = "edit-criteria";
      ctx.state.editingCriteriaItemId = Number(editItemButton.dataset.itemEdit);
      ctx.state.showCriteriaItemForm = true;
      ctx.state.showCategoryForm = false;
      ctx.state.editingCategoryId = null;
      ctx.renderPage();
      return true;
    }

    const deleteItemButton = event.target.closest("button[data-item-delete]");
    if (deleteItemButton) {
      const itemId = Number(deleteItemButton.dataset.itemDelete);
      ctx.openConfirmModal("Delete Criteria Item", "Are you sure you want to delete this criteria item?", function () {
        deleteCriteriaItem(itemId, ctx);
      });
      return true;
    }

    const cancelItemEdit = event.target.closest("#cancel-item-edit");
    if (cancelItemEdit) {
      ctx.state.editingCriteriaItemId = null;
      ctx.state.showCriteriaItemForm = false;
      ctx.state.criteriaOverlayMode = "";
      ctx.renderPage();
      return true;
    }

    const editCategoryButton = event.target.closest("button[data-category-edit]");
    if (editCategoryButton) {
      ctx.state.criteriaOverlayMode = "edit-category";
      ctx.state.editingCategoryId = String(editCategoryButton.dataset.categoryEdit || "");
      ctx.state.showCategoryForm = true;
      ctx.state.showCriteriaItemForm = false;
      ctx.state.editingCriteriaItemId = null;
      ctx.renderPage();
      return true;
    }

    const deleteCategoryButton = event.target.closest("button[data-category-delete]");
    if (deleteCategoryButton) {
      const categoryId = String(deleteCategoryButton.dataset.categoryDelete || "");
      ctx.openConfirmModal("Delete Category", "Delete this category? This works only when no sub-criteria exist.", function () {
        deleteCategory(categoryId, ctx);
      });
      return true;
    }

    const cancelCategoryEdit = event.target.closest("#cancel-category-edit");
    if (cancelCategoryEdit) {
      ctx.state.editingCategoryId = null;
      ctx.state.showCategoryForm = false;
      ctx.state.criteriaOverlayMode = "";
      ctx.renderPage();
      return true;
    }

    const criteriaMenuToggle = event.target.closest("button[data-criteria-menu-toggle]");
    if (criteriaMenuToggle) {
      const menu = String(criteriaMenuToggle.dataset.criteriaMenuToggle || "");
      ctx.state.criteriaMenuOpen = ctx.state.criteriaMenuOpen === menu ? "" : menu;
      ctx.renderPage();
      return true;
    }

    const criteriaWorkbenchAction = event.target.closest("button[data-criteria-workbench-action]");
    if (criteriaWorkbenchAction) {
      const action = String(criteriaWorkbenchAction.dataset.criteriaWorkbenchAction || "");
      ctx.state.criteriaMenuOpen = "";

      if (action === "close-overlay") {
        ctx.state.criteriaOverlayMode = "";
        ctx.state.showCategoryForm = false;
        ctx.state.showCriteriaItemForm = false;
        ctx.state.editingCategoryId = null;
        ctx.state.editingCriteriaItemId = null;
        ctx.renderPage();
        return true;
      }

      if (action === "edit-category") {
        ctx.state.criteriaOverlayMode = "edit-category";
        ctx.state.showCategoryForm = true;
        ctx.state.showCriteriaItemForm = false;
        ctx.renderPage();
        return true;
      }

      if (action === "edit-criteria") {
        ctx.state.criteriaOverlayMode = "edit-criteria";
        ctx.state.showCriteriaItemForm = true;
        ctx.state.showCategoryForm = false;
        ctx.renderPage();
        return true;
      }

      if (action === "list-categories") {
        ctx.state.criteriaOverlayMode = "list-categories";
        ctx.state.showCategoryForm = false;
        ctx.state.showCriteriaItemForm = false;
        ctx.renderPage();
        return true;
      }

      if (action === "list-criteria") {
        ctx.state.criteriaOverlayMode = "list-criteria";
        ctx.state.showCategoryForm = false;
        ctx.state.showCriteriaItemForm = false;
        ctx.renderPage();
        return true;
      }
    }

    return false;
  }

  function handleSubmit(event, ctx) {
    const form = event.target;

    if (form.id === "category-form") {
      event.preventDefault();
      submitCategoryForm(form, ctx);
      return true;
    }

    if (form.id === "criteria-item-form") {
      event.preventDefault();
      submitCriteriaItemForm(form, ctx);
      return true;
    }

    return false;
  }

  function handleChange(event, ctx) {
    const target = event.target;
    if (target.id === "academic-year-select") {
      ctx.setSelectedAcademicYear(target.value);
      ctx.renderTopbar();
      ctx.renderPage();
      ctx.showToast("Viewing academic year " + ctx.state.selectedAcademicYear + ". Only the active year can be edited.", "info");
      return true;
    }

    if (target.id === "criteria-item-type") {
      const rangeFields = document.getElementById("criteria-item-range-fields");
      if (rangeFields) {
        if (String(target.value) === "range") {
          rangeFields.classList.remove("hidden");
        } else {
          rangeFields.classList.add("hidden");
        }
      }
      return true;
    }

    if (target.id === "category-title" || target.id === "criteria-item-title" || target.id === "criteria-item-category") {
      return false;
    }

    return false;
  }

  function submitCategoryForm(form, ctx) {
    if (!ctx.ensureYearEditAllowed("Category create/update")) {
      return;
    }

    const formData = new FormData(form);
    const categoryTitle = String(formData.get("categoryTitle") || "").trim();
    if (!categoryTitle) {
      ctx.showToast("Please enter a category name.", "error");
      return;
    }

    const editingCategoryId = String(form.dataset.editingCategory || ctx.state.editingCategoryId || "").trim();

    const duplicate = ctx.criteriaCatalog.some((category) => {
      if (editingCategoryId && String(category.id) === editingCategoryId) {
        return false;
      }
      return normalizeText(category.category) === normalizeText(categoryTitle);
    });

    if (duplicate) {
      ctx.showToast("Category already exists.", "warning");
      return;
    }

    if (editingCategoryId) {
      const targetCategory = ctx.getCategoryById(editingCategoryId);
      if (!targetCategory) {
        ctx.showToast("Category not found.", "error");
        return;
      }

      targetCategory.category = categoryTitle;
      (targetCategory.items || []).forEach((item) => {
        item.category = categoryTitle;
      });
      ctx.state.editingCategoryId = null;
      ctx.state.showCategoryForm = false;
      ctx.touchCriteriaUpdate("Updated category: " + categoryTitle);
      ctx.showToast("Category updated.", "success");
    } else {
      ctx.criteriaCatalog.push({ id: "cat-" + Date.now(), category: categoryTitle, items: [] });
      ctx.state.showCategoryForm = false;
      ctx.touchCriteriaUpdate("Added category: " + categoryTitle);
      ctx.showToast("Category added.", "success");
    }

    form.reset();
    ctx.renderPage();
  }

  function submitCriteriaItemForm(form, ctx) {
    if (!ctx.ensureYearEditAllowed("Criteria item create/update")) {
      return;
    }

    const formData = new FormData(form);
    const categoryId = String(formData.get("categoryId") || "").trim();
    const title = String(formData.get("title") || "").trim();
    const type = ctx.normalizeCriteriaType(formData.get("type"));

    if (!categoryId || !title) {
      ctx.showToast("Please select category and title.", "error");
      return;
    }

    const category = ctx.getCategoryById(categoryId);
    if (!category) {
      ctx.showToast("Category not found.", "error");
      return;
    }

    const marksValue = Number(formData.get("marks"));
    let parsedRules = [];
    if (type === "range") {
      const rangeMin = Number(formData.get("rangeMin"));
      const rangeMax = Number(formData.get("rangeMax"));

      if (!Number.isFinite(rangeMin) || !Number.isFinite(rangeMax)) {
        ctx.showToast("Enter both smaller and larger numbers for the range.", "error");
        return;
      }

      if (rangeMin >= rangeMax) {
        ctx.showToast("Smaller number must be less than larger number.", "error");
        return;
      }

      parsedRules = [{ min: rangeMin, max: rangeMax, marks: Number.isFinite(marksValue) ? marksValue : 0 }];
      if (!parsedRules.length) {
        ctx.showToast("Enter valid smaller and larger numbers for the range.", "error");
        return;
      }
    }

    if (!Number.isFinite(marksValue)) {
      ctx.showToast("Marks value is required for this type.", "error");
      return;
    }

    if (type === "negative" && marksValue > 0) {
      ctx.showToast("Negative criteria must use zero or negative marks.", "error");
      return;
    }

    const editingId = Number(form.dataset.editingItem || ctx.state.editingCriteriaItemId || 0);
    const duplicateItem = hasDuplicateCriteriaItem(category, title, editingId);
    if (duplicateItem) {
      ctx.showToast("Duplicate criteria entry is not allowed in this category.", "warning");
      return;
    }

    if (editingId) {
      const targetItem = ctx.getCriteriaById(editingId);
      if (!targetItem) {
        ctx.showToast("Criteria item not found.", "error");
        return;
      }

      const currentCategory = ctx.getCategoryByItemId(editingId);
      if (currentCategory && currentCategory.id !== categoryId) {
        currentCategory.items = currentCategory.items.filter((item) => item.id !== editingId);
        category.items.push(targetItem);
      }

      targetItem.title = title;
      targetItem.category = category.category;
      targetItem.type = type;
      targetItem.marks = marksValue;
      targetItem.rules = type === "range" ? parsedRules : [];

      ctx.state.editingCriteriaItemId = null;
      ctx.state.showCriteriaItemForm = false;
      ctx.touchCriteriaUpdate("Updated criteria item: " + title);
      ctx.showToast("Criteria item updated.", "success");
    } else {
      const nextId = getNextCriteriaItemId(ctx);
      category.items.push({
        id: nextId,
        category: category.category,
        title: title,
        type: type,
        marks: marksValue,
        rules: type === "range" ? parsedRules : []
      });
      ctx.state.showCriteriaItemForm = false;
      ctx.touchCriteriaUpdate("Added criteria item: " + title);
      ctx.showToast("Criteria item added.", "success");
    }

    ctx.renderPage();
  }

  function renderCriteriaHubMenu(menuOpen) {
    const controlsActive = menuOpen === "controls" ? " active" : "";
    const viewActive = menuOpen === "view" ? " active" : "";
    const controlsMenu = menuOpen === "controls"
      ? "<div class=\"criteria-hub-menu\"><button type=\"button\" class=\"criteria-hub-item\" data-criteria-workbench-action=\"edit-category\">Edit Category</button><button type=\"button\" class=\"criteria-hub-item\" data-criteria-workbench-action=\"edit-criteria\">Edit Criteria</button></div>"
      : "";
    const viewMenu = menuOpen === "view"
      ? "<div class=\"criteria-hub-menu\"><button type=\"button\" class=\"criteria-hub-item\" data-criteria-workbench-action=\"list-categories\">List Categories</button><button type=\"button\" class=\"criteria-hub-item\" data-criteria-workbench-action=\"list-criteria\">List Criteria</button></div>"
      : "";

    return (
      "<div class=\"criteria-hub panel\"><div class=\"criteria-hub-head\"><div><p class=\"eyebrow\">Criteria Hub</p><h3>Choose a mode</h3></div><p class=\"muted\">Open a focused card for list or edit actions.</p></div><div class=\"criteria-hub-actions\"><div class=\"criteria-hub-group\"><button type=\"button\" class=\"btn ghost criteria-hub-toggle" + controlsActive + "\" data-criteria-menu-toggle=\"controls\">Controls</button>" + controlsMenu + "</div><div class=\"criteria-hub-group\"><button type=\"button\" class=\"btn ghost criteria-hub-toggle" + viewActive + "\" data-criteria-menu-toggle=\"view\">View</button>" + viewMenu + "</div></div></div>"
    );
  }

  function renderCriteriaOverlayCard(payload) {
    const titleMap = {
      "edit-category": "Edit Category",
      "edit-criteria": "Edit Criteria",
      "list-categories": "Category List",
      "list-criteria": "Criteria List"
    };

    const overlayBody = buildCriteriaOverlayBody(payload);
    return (
      "<div class=\"criteria-overlay\" role=\"presentation\"><div class=\"criteria-overlay-backdrop\" data-criteria-workbench-action=\"close-overlay\"></div><section class=\"criteria-overlay-card panel\" role=\"dialog\" aria-modal=\"true\" aria-label=\"" + titleMap[payload.overlayMode] + "\"><div class=\"criteria-overlay-head\"><div><p class=\"eyebrow\">Focused View</p><h3>" + titleMap[payload.overlayMode] + "</h3></div><button type=\"button\" class=\"btn ghost\" data-criteria-workbench-action=\"close-overlay\">Close</button></div>" + overlayBody + "</section></div>"
    );
  }

  function buildCriteriaOverlayBody(payload) {
    const ctx = payload.ctx;
    const editingItem = payload.editingItem;
    const editingCategory = payload.editingCategory;
    const editingRangeRule = payload.editingRangeRule;
    const categoryForm = "<form id=\"category-form\" class=\"stack-form\" data-editing-category=\"" + (editingCategory ? editingCategory.id : "") + "\"><div class=\"field\"><label for=\"category-title\">Category Name</label><input id=\"category-title\" name=\"categoryTitle\" type=\"text\" required value=\"" + ctx.escapeAttribute(editingCategory ? editingCategory.category : "") + "\" /></div><div class=\"button-row\"><button type=\"submit\" class=\"btn primary\">" + (editingCategory ? "Update Category" : "Add Category") + "</button><button type=\"button\" id=\"cancel-category-edit\" class=\"btn ghost\">Cancel</button></div></form>";
    const criteriaForm = "<form id=\"criteria-item-form\" class=\"stack-form\" data-editing-item=\"" + (editingItem ? editingItem.id : "") + "\">" +
      "<div class=\"field\"><label for=\"criteria-item-category\">Category</label><select id=\"criteria-item-category\" name=\"categoryId\" required>" + payload.categoryOptions + "</select></div>" +
      "<div class=\"field\"><label for=\"criteria-item-title\">Title</label><input id=\"criteria-item-title\" name=\"title\" type=\"text\" required value=\"" + ctx.escapeAttribute(editingItem ? editingItem.title : "") + "\" /></div>" +
      "<div class=\"field\"><label for=\"criteria-item-type\">Type</label><select id=\"criteria-item-type\" name=\"type\"><option value=\"fixed\"" + payload.fixedSelected + ">Fixed / Boolean</option><option value=\"count\"" + payload.countSelected + ">Count Based</option><option value=\"range\"" + payload.rangeSelected + ">Range Based</option><option value=\"negative\"" + payload.negativeSelected + ">Negative Marks</option></select></div>" +
      "<div class=\"field\"><label for=\"criteria-item-marks\">Max Marks</label><input id=\"criteria-item-marks\" name=\"marks\" type=\"number\" step=\"0.5\" value=\"" + (editingItem && Number.isFinite(editingItem.marks) ? editingItem.marks : "") + "\" /></div>" +
      "<div id=\"criteria-item-range-fields\" class=\"stack-form two-col" + (editingItem && editingItem.type === "range" ? "" : " hidden") + "\">" +
        "<div class=\"field\"><label for=\"criteria-item-range-min\">Smaller number</label><input id=\"criteria-item-range-min\" name=\"rangeMin\" type=\"number\" step=\"0.01\" value=\"" + (editingRangeRule && Number.isFinite(editingRangeRule.min) ? editingRangeRule.min : "") + "\" /></div>" +
        "<div class=\"field\"><label for=\"criteria-item-range-max\">Larger number</label><input id=\"criteria-item-range-max\" name=\"rangeMax\" type=\"number\" step=\"0.01\" value=\"" + (editingRangeRule && Number.isFinite(editingRangeRule.max) ? editingRangeRule.max : "") + "\" /></div>" +
      "</div>" +
      "<div class=\"button-row\"><button type=\"submit\" class=\"btn primary\">" + (editingItem ? "Update Item" : "Add Item") + "</button><button type=\"button\" id=\"cancel-item-edit\" class=\"btn ghost\">Cancel</button></div>" +
    "</form>";

    if (payload.overlayMode === "list-categories") {
      return "<div class=\"table-wrap overlay-table\"><table><thead><tr><th>Criterion (Category)</th><th>Sub-criteria Count</th><th>Actions</th></tr></thead><tbody>" + payload.categoryRows + "</tbody></table></div>";
    }

    if (payload.overlayMode === "list-criteria") {
      return "<div class=\"table-wrap overlay-table\"><table><thead><tr><th>Category</th><th>Item</th><th>Type</th><th>Max Marks</th><th>Marks / Rules</th><th>Actions</th></tr></thead><tbody>" + payload.groupedRows + "</tbody></table></div>";
    }

    if (payload.overlayMode === "edit-category") {
      return "<div class=\"criteria-overlay-stack\"><div class=\"panel soft-panel\"><h4>Category Editor</h4>" + categoryForm + "</div><div class=\"table-wrap overlay-table\"><table><thead><tr><th>Criterion (Category)</th><th>Sub-criteria Count</th><th>Actions</th></tr></thead><tbody>" + payload.categoryRows + "</tbody></table></div></div>";
    }

    if (payload.overlayMode === "edit-criteria") {
      return "<div class=\"criteria-overlay-stack\"><div class=\"panel soft-panel\"><h4>Criteria Editor</h4>" + criteriaForm + "</div><div class=\"table-wrap overlay-table\"><table><thead><tr><th>Category</th><th>Item</th><th>Type</th><th>Max Marks</th><th>Marks / Rules</th><th>Actions</th></tr></thead><tbody>" + payload.groupedRows + "</tbody></table></div></div>";
    }

    return "";
  }

  function ensureCriteriaUiState(state) {
    if (typeof state.criteriaMenuOpen !== "string") {
      state.criteriaMenuOpen = "";
    }

    if (typeof state.criteriaOverlayMode !== "string") {
      state.criteriaOverlayMode = "";
    }
  }

  function deleteCriteriaItem(itemId, ctx) {
    if (!ctx.ensureYearEditAllowed("Criteria item delete")) {
      return;
    }

    const inUse = ctx.submissions.some((submission) => submission.criteriaId === itemId);
    if (inUse) {
      ctx.showToast("Cannot delete item used in submissions.", "warning");
      return;
    }

    let deleted = false;
    ctx.criteriaCatalog.forEach((category) => {
      const previous = category.items.length;
      category.items = category.items.filter((item) => item.id !== itemId);
      if (category.items.length !== previous) {
        deleted = true;
      }
    });

    if (!deleted) {
      ctx.showToast("Criteria item not found.", "error");
      return;
    }

    if (ctx.state.editingCriteriaItemId === itemId) {
      ctx.state.editingCriteriaItemId = null;
    }

    ctx.touchCriteriaUpdate("Deleted criteria item #" + itemId);
    ctx.showToast("Criteria item deleted.", "success");
    ctx.renderPage();
  }

  function formatRulesText(rules) {
    return (rules || [])
      .map((rule) => rule.min + "-" + rule.max + ":" + rule.marks)
      .join(", ");
  }

  function getNextCriteriaItemId(ctx) {
    const allIds = ctx.getAllCriteriaItems().map((item) => Number(item.id)).filter((id) => Number.isFinite(id));
    const max = allIds.length ? Math.max.apply(null, allIds) : 100;
    return max + 1;
  }

  function hasDuplicateCriteriaItem(category, title, editingId) {
    const normalizedTitle = normalizeText(title);
    return (category.items || []).some((item) => {
      if (editingId && Number(item.id) === Number(editingId)) {
        return false;
      }
      return normalizeText(item.title) === normalizedTitle;
    });
  }

  function deleteCategory(categoryId, ctx) {
    if (!ctx.ensureYearEditAllowed("Category delete")) {
      return;
    }

    const target = ctx.getCategoryById(categoryId);
    if (!target) {
      ctx.showToast("Category not found.", "error");
      return;
    }

    if ((target.items || []).length > 0) {
      ctx.showToast("Remove sub-criteria before deleting this category.", "warning");
      return;
    }

    const before = ctx.criteriaCatalog.length;
    for (let i = ctx.criteriaCatalog.length - 1; i >= 0; i -= 1) {
      if (String(ctx.criteriaCatalog[i].id) === String(categoryId)) {
        ctx.criteriaCatalog.splice(i, 1);
      }
    }

    if (ctx.criteriaCatalog.length === before) {
      ctx.showToast("Category not found.", "error");
      return;
    }

    if (ctx.state.editingCategoryId && String(ctx.state.editingCategoryId) === String(categoryId)) {
      ctx.state.editingCategoryId = null;
    }

    ctx.touchCriteriaUpdate("Deleted category: " + target.category);
    ctx.showToast("Category deleted.", "success");
    ctx.renderPage();
  }

  function getMaxMarksLabel(item) {
    if (!item) {
      return "-";
    }

    if (item.type === "range") {
      const marks = (item.rules || []).map((rule) => Number(rule.marks)).filter((value) => Number.isFinite(value));
      return marks.length ? String(Math.max.apply(null, marks)) : "-";
    }

    if (item.type === "count") {
      return String(item.marks) + " / count";
    }

    if (item.type === "negative") {
      return "0";
    }

    return Number.isFinite(item.marks) ? String(item.marks) : "-";
  }

  function normalizeText(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  window.adminCriteriaModule = {
    renderCriteriaPage: renderCriteriaPage,
    handleClick: handleClick,
    handleSubmit: handleSubmit,
    handleChange: handleChange,
    submitCategoryForm: submitCategoryForm,
    submitCriteriaItemForm: submitCriteriaItemForm,
    deleteCriteriaItem: deleteCriteriaItem,
    formatRulesText: formatRulesText,
    getNextCriteriaItemId: getNextCriteriaItemId
  };
})();
