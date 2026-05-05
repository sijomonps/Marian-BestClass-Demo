window.applyPageConfig({
  autoRole: "admin",
  autoPage: "criteria"
});

(function initAdminCriteriaModule() {
  function renderCriteriaPage(ctx) {
    const categories = ctx.getCriteriaCategories();
    const editingItem = ctx.state.editingCriteriaItemId ? ctx.getCriteriaById(ctx.state.editingCriteriaItemId) : null;
    const editingCategory = ctx.state.editingCategoryId ? ctx.getCategoryById(ctx.state.editingCategoryId) : null;
    const selectedYearHistory = ctx.getCriteriaHistoryForYear(ctx.state.selectedAcademicYear).slice(0, 8);
    const editingRangeRule = editingItem && editingItem.type === "range" && (editingItem.rules || []).length
      ? editingItem.rules[0]
      : null;

    const selectedCategory = ctx.state.selectedCategoryId ? ctx.getCategoryById(ctx.state.selectedCategoryId) : null;
    const isAcademicYearsView = ctx.state.selectedCategoryId === "academic-years";

    const categoryIcons = {
      "Academics": "🎓",
      "Online Courses": "💻",
      "Internships": "💼",
      "Competitive Exams": "📝",
      "Scholarships": "💰",
      "Research": "🧪",
      "Prizes": "🏆",
      "Leadership": "🤝",
      "Programs Organized": "🗓️",
      "Social Responsibility": "🌍",
      "Career Advancement": "🚀",
      "Documentation": "📁",
      "Academic Years": "📅"
    };

    const categoryDescriptions = {
      "Academics": "Criteria related to academic performance and coursework.",
      "Online Courses": "Certifications and modules from online learning platforms.",
      "Internships": "Evaluations for external placements and practical experience.",
      "Competitive Exams": "Performance in state, national, and international exams.",
      "Scholarships": "Recognition and financial support for merit or need.",
      "Research": "Criteria for methodology, publications, and lab work.",
      "Prizes": "Awards and honors won in various competitions.",
      "Leadership": "Roles in student bodies, clubs, and organizations.",
      "Programs Organized": "Management and coordination of various events.",
      "Social Responsibility": "Participation in NSS, NCC, and community service.",
      "Career Advancement": "Placement success and higher studies preparation.",
      "Documentation": "Submission quality and verification proofs.",
      "Academic Years": "Manage active reporting periods and academic terms."
    };

    const yearOptions = ctx.academicYears
      .map((year) => {
        const selected = year === ctx.state.selectedAcademicYear ? " selected" : "";
        return "<option value=\"" + year + "\"" + selected + ">" + year + "</option>";
      })
      .join("");

    const categoryOptions = categories.length
      ? categories
          .map((category) => {
            const isSelected = (editingItem && category.category === editingItem.category) || (selectedCategory && category.id === selectedCategory.id);
            return "<option value=\"" + category.id + "\"" + (isSelected ? " selected" : "") + ">" + ctx.escapeHtml(category.category) + "</option>";
          })
          .join("")
      : "<option value=\"\">No category available</option>";

    const fixedSelected = !editingItem || editingItem.type === "fixed" ? " selected" : "";
    const countSelected = editingItem && editingItem.type === "count" ? " selected" : "";
    const rangeSelected = editingItem && editingItem.type === "range" ? " selected" : "";
    const booleanSelected = editingItem && editingItem.type === "boolean" ? " selected" : "";
    const negativeSelected = editingItem && editingItem.type === "negative" ? " selected" : "";

    const categoryFormHtml = (ctx.state.showCategoryForm || editingCategory) ? (
      "<article class=\"panel\" style=\"margin-bottom: 2rem;\">" +
      "<h3>" + (editingCategory ? "Edit Category" : "Add Category") + "</h3>" +
      "<form id=\"category-form\" class=\"stack-form\" data-editing-category=\"" + (editingCategory ? editingCategory.id : "") + "\">" +
      "<div class=\"field\"><label for=\"category-title\">Category Name</label><input id=\"category-title\" name=\"categoryTitle\" type=\"text\" required value=\"" + ctx.escapeAttribute(editingCategory ? editingCategory.category : "") + "\" /></div>" +
      "<div class=\"button-row\"><button type=\"submit\" class=\"btn primary\">" + (editingCategory ? "Update Category" : "Add Category") + "</button><button type=\"button\" id=\"cancel-category-edit\" class=\"btn ghost\">Cancel</button></div>" +
      "</form></article>"
    ) : "";

    const criteriaItemFormHtml = (ctx.state.showCriteriaItemForm || editingItem) ? (
      "<article class=\"panel\" style=\"margin-bottom: 2rem;\">" +
      "<h3>" + (editingItem ? "Edit Item" : "Add Item") + "</h3>" +
      "<form id=\"criteria-item-form\" class=\"stack-form\" data-editing-item=\"" + (editingItem ? editingItem.id : "") + "\">" +
      "<div class=\"field\"><label for=\"criteria-item-category\">Category Name</label><select id=\"criteria-item-category\" name=\"categoryId\" required>" + categoryOptions + "</select></div>" +
      "<div class=\"field\"><label for=\"criteria-item-title\">Item Name</label><input id=\"criteria-item-title\" name=\"title\" type=\"text\" required value=\"" + ctx.escapeAttribute(editingItem ? editingItem.title : "") + "\" /></div>" +
      "<div class=\"field\"><label for=\"criteria-item-description\">Description</label><input id=\"criteria-item-description\" name=\"description\" type=\"text\" value=\"" + ctx.escapeAttribute(editingItem && editingItem.description ? editingItem.description : "") + "\" placeholder=\"Optional description for students\" /></div>" +
      "<div class=\"field\"><label for=\"criteria-item-type\">Type</label><select id=\"criteria-item-type\" name=\"type\"><option value=\"fixed\"" + fixedSelected + ">Fixed</option><option value=\"count\"" + countSelected + ">Count</option><option value=\"range\"" + rangeSelected + ">Range</option><option value=\"boolean\"" + booleanSelected + ">Boolean</option><option value=\"negative\"" + negativeSelected + ">Negative</option></select></div>" +
      "<div class=\"field\"><label for=\"criteria-item-marks\">Marks</label><input id=\"criteria-item-marks\" name=\"marks\" type=\"number\" step=\"0.5\" value=\"" + (editingItem && Number.isFinite(editingItem.marks) ? editingItem.marks : "") + "\" /></div>" +
      "<div id=\"criteria-item-range-fields\" class=\"stack-form two-col\"" + (editingItem && editingItem.type === "range" ? "" : " hidden") + "><div class=\"field\"><label for=\"criteria-item-range-min\">Range Start</label><input id=\"criteria-item-range-min\" name=\"rangeMin\" type=\"number\" step=\"0.01\" value=\"" + (editingRangeRule && Number.isFinite(editingRangeRule.min) ? editingRangeRule.min : "") + "\" /></div><div class=\"field\"><label for=\"criteria-item-range-max\">Range End</label><input id=\"criteria-item-range-max\" name=\"rangeMax\" type=\"number\" step=\"0.01\" value=\"" + (editingRangeRule && Number.isFinite(editingRangeRule.max) ? editingRangeRule.max : "") + "\" /></div></div>" +
      "<div class=\"button-row\"><button type=\"submit\" class=\"btn primary\">" + (editingItem ? "Update Item" : "Add Item") + "</button><button type=\"button\" id=\"cancel-item-edit\" class=\"btn ghost\">Cancel</button></div>" +
      "</form></article>"
    ) : "";

    if (isAcademicYearsView) {
      const academicYears = ctx.getAcademicYears() || [];
      const activeYear = String(ctx.getActiveAcademicYear() || "");

      const yearRowsHtml = academicYears.map((year) => {
        const isActive = year === activeYear;
        const statusBadge = isActive 
          ? "<span class=\"active-badge\">Active</span>" 
          : "<span class=\"muted\" style=\"font-size: 0.85rem; font-weight: 600; color: var(--color-text-soft);\">Completed</span>";
        
        const actionsHtml = isActive
          ? "<button type=\"button\" class=\"btn-year-edit\" data-year-edit=\"" + ctx.escapeAttribute(year) + "\">Edit</button>"
          : "<button type=\"button\" class=\"btn-make-active\" data-year-activate=\"" + ctx.escapeAttribute(year) + "\">Make Active</button>" +
            "<button type=\"button\" class=\"btn-year-edit\" data-year-edit=\"" + ctx.escapeAttribute(year) + "\">Edit</button>";

        return (
          "<div class=\"year-row\">" +
          "<div class=\"year-info\">" +
          "<div class=\"year-details\">" +
          "<h3>" + ctx.escapeHtml(year) + "</h3>" +
          "<p>" + (isActive ? "Current Evaluation Period" : "Completed") + "</p>" +
          "</div>" +
          (isActive ? statusBadge : "") +
          "</div>" +
          "<div class=\"year-actions\">" + actionsHtml + "</div>" +
          "</div>"
        );
      }).join("");

      const addYearFormHtml = ctx.state.showAddYearForm ? (
        "<article class=\"panel\" style=\"margin-bottom: 2rem;\">" +
        "<h3>Add Academic Year</h3>" +
        "<form id=\"admin-add-year-form\" class=\"stack-form\">" +
        "<div class=\"field\"><label for=\"new-academic-year\">Year Format (e.g. 2026-2027)</label><input type=\"text\" id=\"new-academic-year\" name=\"newYear\" required placeholder=\"YYYY-YYYY\" pattern=\"\\d{4}-\\d{4}\" /></div>" +
        "<div class=\"button-row\"><button type=\"submit\" class=\"btn primary\">Add Year</button><button type=\"button\" id=\"cancel-add-year\" class=\"btn ghost\">Cancel</button></div>" +
        "</form></article>"
      ) : "";

      return (
        "<section class=\"section-header\" style=\"margin-bottom: 2rem;\">" +
        "<div><button type=\"button\" class=\"btn ghost\" id=\"back-to-categories\" style=\"margin-bottom: 1rem;\">← Back to Modules</button><h1>Academic Years</h1><p class=\"muted\">Manage active reporting periods and historical academic terms.</p></div>" +
        "<div class=\"section-controls\">" +
        "<button type=\"button\" class=\"btn primary\" id=\"toggle-add-year\">+ Add Year</button>" +
        "</div>" +
        "</section>" +
        addYearFormHtml +
        "<div class=\"year-card-list\">" + yearRowsHtml + "</div>"
      );
    }

    if (selectedCategory) {
      const itemsHtml = (selectedCategory.items || []).length
        ? "<ul class=\"simple-group-list\">" + selectedCategory.items
            .map((item) => {
              return (
                "<li class=\"simple-group-item\">" +
                "<div class=\"simple-group-main\"><p><strong>" + ctx.escapeHtml(item.title) + "</strong></p><p class=\"muted\">Type: " + ctx.escapeHtml(ctx.getCriteriaTypeLabel(item.type)) + " | Marks: " + ctx.escapeHtml(getMaxMarksLabel(item)) + "</p>" +
                (item.description ? "<p class=\"muted\" style=\"font-size: 0.85rem; margin-top: 4px; color: var(--color-text-soft);\">" + ctx.escapeHtml(item.description) + "</p>" : "") +
                "<p class=\"muted\">" + ctx.escapeHtml(ctx.getCriteriaRuleSummary(item)) + "</p></div>" +
                "<div class=\"button-row\"><button type=\"button\" class=\"btn ghost\" data-item-edit=\"" + item.id + "\">Edit</button><button type=\"button\" class=\"btn danger\" data-item-delete=\"" + item.id + "\">Delete</button></div>" +
                "</li>"
              );
            })
            .join("") + "</ul>"
        : "<p class=\"empty-state\">No items in this category.</p>";

      return (
        "<section class=\"section-header\" style=\"margin-bottom: 2rem;\">" +
        "<div><button type=\"button\" class=\"btn ghost\" id=\"back-to-categories\" style=\"margin-bottom: 1rem;\">← Back to Modules</button><h1>" + ctx.escapeHtml(selectedCategory.category) + "</h1><p class=\"muted\">Detailed view of evaluation items for this module.</p></div>" +
        "<div class=\"section-controls\">" +
        "<button type=\"button\" class=\"btn primary\" id=\"toggle-item-form\">+ Add Item</button>" +
        "</div>" +
        "</section>" +
        criteriaItemFormHtml +
        "<article class=\"panel\">" + itemsHtml + "</article>"
      );
    }

    const categoryCardsHtml = categories.map((cat) => {
          const icon = categoryIcons[cat.category] || "📂";
          const desc = categoryDescriptions[cat.category] || "Manage criteria and marks in this module.";
          return (
            "<button type=\"button\" class=\"category-card\" data-selected-category=\"" + cat.id + "\">" +
            "<div class=\"category-card-icon\">" + icon + "</div>" +
            "<div class=\"category-card-content\">" +
            "<h3>" + ctx.escapeHtml(cat.category) + "</h3>" +
            "<p>" + desc + "</p>" +
            "</div>" +
            "<div class=\"category-card-chevron\">→</div>" +
            "</button>"
          );
        }).join("") +
        "<button type=\"button\" class=\"category-card\" data-selected-category=\"academic-years\">" +
        "<div class=\"category-card-icon\">📅</div>" +
        "<div class=\"category-card-content\">" +
        "<h3>Academic Years</h3>" +
        "<p>Manage active reporting periods and academic terms.</p>" +
        "</div>" +
        "<div class=\"category-card-chevron\">→</div>" +
        "</button>";

    const categoryRows = categories.length
      ? categories.map((category) => {
        return (
          "<li class=\"registry-item\">" +
          "<div class=\"registry-main\">" +
          "<span class=\"count-badge\">" + (category.items || []).length + " items</span>" +
          "<strong>" + ctx.escapeHtml(category.category) + "</strong>" +
          "</div>" +
          "<div class=\"button-row\"><button type=\"button\" class=\"btn ghost\" data-category-edit=\"" + category.id + "\">Edit</button><button type=\"button\" class=\"btn danger\" data-category-delete=\"" + category.id + "\">Delete</button></div>" +
          "</li>"
        );
      })
      .join("")
      : "<li class=\"empty-row\">No categories available.</li>";

    const historyRows = selectedYearHistory.length
      ? selectedYearHistory
          .map((entry) => {
            const when = entry.at ? new Date(entry.at).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : "Now";
            return (
              "<li class=\"timeline-item\">" +
              "<div class=\"timeline-dot\"></div>" +
              "<div class=\"timeline-content\">" +
              "<span class=\"timeline-time\">" + ctx.escapeHtml(when) + "</span>" +
              "<span class=\"timeline-msg\">" + ctx.escapeHtml(entry.message || "Updated") + "</span>" +
              "</div>" +
              "</li>"
            );
          })
          .join("")
      : "<li class=\"empty-state\">No criteria changes recorded.</li>";

    return (
      "<section class=\"section-header\">" +
      "<div><h1>Criteria Categories</h1><p class=\"muted\">Manage and organize evaluation criteria hierarchies.</p></div>" +
      "<div class=\"section-controls\">" +
      "<select id=\"academic-year-select\">" + yearOptions + "</select>" +
      "<button type=\"button\" class=\"btn primary\" id=\"toggle-category-form\">+ Add Category</button>" +
      "</div>" +
      "</section>" +
      categoryFormHtml +
      "<div class=\"category-card-grid\">" + categoryCardsHtml + "</div>" +
      "<section class=\"cards-grid two-panel-grid\" style=\"margin-top: 4rem;\">" +
      "<article class=\"panel\"><h3>Recent Activity</h3><ul class=\"timeline\">" + historyRows + "</ul></article>" +
      "<article class=\"panel\"><h3>Quick Registry</h3><ul class=\"category-registry\">" + categoryRows + "</ul></article>" +
      "</section>"
    );
  }

  function handleClick(event, ctx) {
    const toggleCategoryForm = event.target.closest("#toggle-category-form");
    if (toggleCategoryForm) {
      ctx.state.showCategoryForm = !ctx.state.showCategoryForm;
      ctx.state.editingCategoryId = null;
      ctx.renderPage();
      return true;
    }

    const toggleItemForm = event.target.closest("#toggle-item-form");
    if (toggleItemForm) {
      ctx.state.showCriteriaItemForm = !ctx.state.showCriteriaItemForm;
      ctx.state.editingCriteriaItemId = null;
      ctx.renderPage();
      return true;
    }

    const categoryCard = event.target.closest(".category-card");
    if (categoryCard) {
      const categoryId = String(categoryCard.dataset.selectedCategory || "");
      ctx.state.selectedCategoryId = categoryId;
      ctx.state.showCriteriaItemForm = false;
      ctx.state.editingCriteriaItemId = null;
      ctx.renderPage();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return true;
    }

    const backBtn = event.target.closest("#back-to-categories");
    if (backBtn) {
      ctx.state.selectedCategoryId = null;
      ctx.state.showCriteriaItemForm = false;
      ctx.state.editingCriteriaItemId = null;
      ctx.state.showAddYearForm = false;
      ctx.renderPage();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return true;
    }

    const toggleAddYear = event.target.closest("#toggle-add-year");
    if (toggleAddYear) {
      ctx.state.showAddYearForm = !ctx.state.showAddYearForm;
      ctx.renderPage();
      return true;
    }

    const cancelAddYear = event.target.closest("#cancel-add-year");
    if (cancelAddYear) {
      ctx.state.showAddYearForm = false;
      ctx.renderPage();
      return true;
    }

    const activateBtn = event.target.closest("button[data-year-activate]");
    if (activateBtn) {
      const year = activateBtn.dataset.yearActivate;
      ctx.openConfirmModal("Activate Academic Year", "Set " + year + " as the active academic year?", function() {
        if (typeof ctx.setActiveAcademicYear === "function") {
          ctx.setActiveAcademicYear(year);
          ctx.showToast("Activated academic year: " + year, "success");
          ctx.renderTopbar();
          ctx.renderPage();
        }
      });
      return true;
    }

    const editYearBtn = event.target.closest("button[data-year-edit]");
    if (editYearBtn) {
      ctx.showToast("Editing academic years is restricted to maintaining historical records.", "info");
      return true;
    }

    const editItemButton = event.target.closest("button[data-item-edit]");
    if (editItemButton) {
      ctx.state.editingCriteriaItemId = Number(editItemButton.dataset.itemEdit);
      ctx.state.editingCategoryId = null;
      ctx.state.showCriteriaItemForm = true;
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
      ctx.renderPage();
      return true;
    }

    const editCategoryButton = event.target.closest("button[data-category-edit]");
    if (editCategoryButton) {
      ctx.state.editingCategoryId = String(editCategoryButton.dataset.categoryEdit || "");
      ctx.state.editingCriteriaItemId = null;
      ctx.state.showCategoryForm = true;
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
      ctx.renderPage();
      return true;
    }

    return false;
  }

  function handleSubmit(event, ctx) {
    const form = event.target;

    if (form.id === "admin-add-year-form") {
      event.preventDefault();
      const formData = new FormData(form);
      const newYear = String(formData.get("newYear") || "").trim();

      if (!newYear.match(/^\d{4}-\d{4}$/)) {
        ctx.showToast("Invalid format. Please use YYYY-YYYY format.", "error");
        return true;
      }

      const years = ctx.getAcademicYears();
      if (years.includes(newYear)) {
        ctx.showToast("Academic year already exists.", "warning");
        return true;
      }

      if (typeof ctx.addAcademicYear === "function") {
        ctx.addAcademicYear(newYear);
        ctx.showToast("Added new academic year: " + newYear, "success");
        ctx.state.showAddYearForm = false;
        ctx.renderPage();
      }
      return true;
    }

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
    const description = String(formData.get("description") || "").trim();
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
      targetItem.description = description;
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
        description: description,
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
      "<div class=\"field\"><label for=\"criteria-item-description\">Description</label><input id=\"criteria-item-description\" name=\"description\" type=\"text\" value=\"" + ctx.escapeAttribute(editingItem && editingItem.description ? editingItem.description : "") + "\" /></div>" +
      "<div class=\"field\"><label for=\"criteria-item-type\">Type</label><select id=\"criteria-item-type\" name=\"type\"><option value=\"fixed\"" + payload.fixedSelected + ">Fixed</option><option value=\"count\"" + payload.countSelected + ">Count Based</option><option value=\"range\"" + payload.rangeSelected + ">Range Based</option><option value=\"boolean\"" + payload.booleanSelected + ">Boolean</option><option value=\"negative\"" + payload.negativeSelected + ">Negative Marks</option></select></div>" +
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
