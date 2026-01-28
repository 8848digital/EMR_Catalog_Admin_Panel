const ConfigManager = (() => {
  const BASE_URL = '/api';
  const editingRows = new Map();
  let currentOperation = null;
  let currentHandler = null;
  let currentData = [];
  let currentPMCd = null;
  let newCategoryListCache = null;
  let pendingDeleteRowId = null;

  const handlers = {
    'add_custMst': CustMstHandler,
    'add_email': EmailHandler,
    'add_design_size': designSizeHandler,
    'add_usr_map': UsrMapHandler,
    'add_cs_grd': csGrdOperation,
    'add_cust_mp': custMpOperation,
    'add_dia_grd': diaGrdOperation,
    'add_role': roleOperation,
    'add_sls_prsn': slsPrsnOperation,
    'add_met_cd': metCdOperation,
    'add_met_col': metColOperation,
    'add_met_kt': metKtOperation,
    'add_ctg_filter': ctgFilterOperation,
    'add_rg_filter': rgFilterOperation,
    'add_adv_event': advEventOperation,
    'add_PosCTA': PosCTAOperation,
  };

  // Helper function to escape HTML
  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  }

  function init() {
    const modUsr = sessionStorage.getItem('modUsr');
    if (!modUsr) {
      window.location.href = '/login';
      return;
    }

    loadOperations();

    const operationSelect = document.getElementById('operation');
    if (operationSelect) {
      operationSelect.addEventListener('change', handleOperationChange);
    }

    document.getElementById('filterForm')?.addEventListener('submit', handleFormSubmit);

    const addBtn = document.getElementById('addBtn');
    if (addBtn) {
      addBtn.addEventListener('click', handleAddData);
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }

    const saveAllBtn = document.getElementById('saveAllBtn');
    if (saveAllBtn) {
      saveAllBtn.addEventListener('click', handleSaveAll);
    }

    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', confirmDelete);
    }

    if (cancelDeleteBtn) {
      cancelDeleteBtn.addEventListener('click', cancelDelete);
    }

    const confirmDialog = document.getElementById('confirmDialog');
    if (confirmDialog) {
      confirmDialog.addEventListener('click', (e) => {
        if (e.target === confirmDialog) {
          cancelDelete();
        }
      });
    }
  }

  async function loadOperations() {
    try {
      const response = await fetch(`${BASE_URL}/getOperations`);
      const result = await response.json();

      if (result.success) {
        const operationSelect = document.getElementById('operation');
        operationSelect.innerHTML = '<option value="">--Select Operation--</option>';

        result.data.forEach(op => {
          const option = document.createElement('option');
          option.value = op.value;
          option.textContent = op.label;
          operationSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error loading operations:', error);
      showMessage('Error loading operations', 'error');
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('modUsr');
    window.location.href = '/login';
  }

  function resetPageState() {
    currentOperation = null;
    currentHandler = null;
    currentData = [];
    currentPMCd = null;
    newCategoryListCache = null;
    editingRows.clear();
    pendingDeleteRowId = null;

    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
      resultsSection.classList.add('hidden');
    }

    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    if (tableHeader) tableHeader.innerHTML = '';
    if (tableBody) tableBody.innerHTML = '';

    const dataTitle = document.getElementById('dataTitle');
    if (dataTitle) dataTitle.textContent = '';

    const addBtn = document.getElementById('addBtn');
    if (addBtn) addBtn.classList.add('hidden');

    const messageContainer = document.getElementById('messageContainer');
    if (messageContainer) messageContainer.innerHTML = '';

    const pmcdGroup = document.getElementById('pmcdFilterGroup');
    const newPMCdGroup = document.getElementById('newPMCdGroup');
    if (pmcdGroup) pmcdGroup.classList.add('hidden');
    if (newPMCdGroup) newPMCdGroup.classList.add('hidden');

    const pmcdSelect = document.getElementById('pmcdSelect');
    if (pmcdSelect) pmcdSelect.innerHTML = '<option value="">--Select Category--</option>';

    const newPMCdInput = document.getElementById('newPMCdInput');
    if (newPMCdInput) {
      if (newPMCdInput.tagName === 'SELECT') {
        const parent = newPMCdInput.parentElement;
        const newInput = document.createElement('input');
        newInput.type = 'text';
        newInput.id = 'newPMCdInput';
        newInput.placeholder = 'Enter new category';
        newInput.style.cssText = 'padding: 8px; border: 1px solid #ddd; border-radius: 4px; width: 100%;';
        parent.replaceChild(newInput, newPMCdInput);
      } else {
        newPMCdInput.value = '';
      }
    }
  }

  async function handleOperationChange(e) {
    const operation = e.target.value;

    resetPageState();

    if (!operation) {
      return;
    }

    currentOperation = operation;
    currentHandler = handlers[operation];

    if (!currentHandler) {
      showMessage('Handler not found for this operation', 'error');
      return;
    }

    if (currentHandler.requiresPMCdFilter) {
      await loadPMCdDropdown();
      const pmcdGroup = document.getElementById('pmcdFilterGroup');
      if (pmcdGroup) pmcdGroup.classList.remove('hidden');
    }
  }

  async function loadPMCdDropdown() {
    try {
      showLoading(true);
      const pmcdList = await currentHandler.loadPMCdList(BASE_URL, currentOperation);

      const pmcdSelect = document.getElementById('pmcdSelect');
      if (!pmcdSelect) return;

      const options = pmcdList.map(item =>
        `<option value="${item.PMCd}">${item.PMCd}</option>`
      ).join('');

      const showAddNewCategory = currentHandler.showAddNewCategory !== false;
      const addNewOption = showAddNewCategory ? '<option value="__NEW__">+ Add New Category</option>' : '';

      pmcdSelect.innerHTML = `
        <option value="">--Select Category--</option>
        ${options}
        ${addNewOption}
      `;
    } catch (error) {
      console.error('Error loading PMCd list:', error);
      showMessage('Error loading design categories: ' + error.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  async function loadNewCategoryDropdown() {
    try {
      if (newCategoryListCache) {
        return newCategoryListCache;
      }

      const response = await fetch(`${BASE_URL}/newCategoryList?operation=${currentOperation}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load new category list');
      }

      newCategoryListCache = result.data || [];
      return newCategoryListCache;
    } catch (error) {
      console.error('Error loading new category list:', error);
      throw error;
    }
  }

  async function handlePMCdChange() {
    const pmcdSelect = document.getElementById('pmcdSelect');
    const newPMCdGroup = document.getElementById('newPMCdGroup');

    if (pmcdSelect.value === '__NEW__') {
      try {
        showLoading(true);

        const categoryList = await loadNewCategoryDropdown();

        const newPMCdInput = document.getElementById('newPMCdInput');
        const parent = newPMCdInput.parentElement;

        const select = document.createElement('select');
        select.id = 'newPMCdInput';
        select.style.cssText = 'padding: 8px; border: 1px solid #ddd; border-radius: 4px; width: 100%;';

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '--Select New Category--';
        select.appendChild(defaultOption);

        categoryList.forEach(item => {
          const option = document.createElement('option');
          option.value = item.PMCd;
          option.textContent = `${item.PMCd} - ${item.PDesc}`;
          select.appendChild(option);
        });

        parent.replaceChild(select, newPMCdInput);

        newPMCdGroup.classList.remove('hidden');
        select.focus();

      } catch (error) {
        showMessage('Error loading new categories: ' + error.message, 'error');
      } finally {
        showLoading(false);
      }
    } else {
      newPMCdGroup.classList.add('hidden');
    }
  }

  window.handlePMCdChange = handlePMCdChange;

  async function handleFormSubmit(e) {
    e.preventDefault();
    const operation = document.getElementById('operation').value;

    if (!operation) {
      showMessage('Please select an operation', 'error');
      return;
    }

    currentOperation = operation;
    currentHandler = handlers[operation];

    if (!currentHandler) {
      showMessage('Handler not found for this operation', 'error');
      return;
    }

    if (currentHandler.requiresPMCdFilter) {
      const pmcdSelect = document.getElementById('pmcdSelect');
      const selectedValue = pmcdSelect.value;

      if (!selectedValue) {
        showMessage('Please select a Design Category', 'error');
        return;
      }

      if (selectedValue === '__NEW__') {
        const newPMCdInput = document.getElementById('newPMCdInput');

        let newPMCd = '';
        if (newPMCdInput.tagName === 'SELECT') {
          newPMCd = newPMCdInput.value.trim();
        } else {
          newPMCd = newPMCdInput.value.trim();
        }

        if (!newPMCd) {
          showMessage('Please select or enter a new category', 'error');
          return;
        }
        currentPMCd = newPMCd;
      } else {
        currentPMCd = selectedValue;
      }

      await loadDataWithPMCd(currentPMCd);
    } else {
      await loadData();
    }
  }

  async function loadDataWithPMCd(pmcd) {
    showLoading(true);
    editingRows.clear();

    try {
      currentData = await currentHandler.loadData(BASE_URL, currentOperation, pmcd);
      const columns = currentHandler.getColumns();

      if (currentHandler.renderTable) {
        const resultsSection = document.getElementById('resultsSection');
        currentHandler.renderTable(resultsSection);
      } else {
        renderTable(currentData, columns);
      }

      const operationSelect = document.getElementById('operation');
      const selectedOption = operationSelect.options[operationSelect.selectedIndex];
      document.getElementById('dataTitle').textContent =
        `${selectedOption.textContent} - ${pmcd}`;

      document.getElementById('resultsSection').classList.remove('hidden');

      const addBtn = document.getElementById('addBtn');
      if (addBtn) {
        if (currentHandler.supportsAdd) {
          addBtn.classList.remove('hidden');

          if (currentHandler.supportsBulkSave) {
            addBtn.textContent = 'Add Range';
          } else {
            addBtn.textContent = 'Add Data';
          }
        } else {
          addBtn.classList.add('hidden');
        }
      }

      const saveAllBtn = document.getElementById('saveAllBtn');
      if (saveAllBtn) {
        if (currentHandler.supportsBulkSave) {
          saveAllBtn.classList.remove('hidden');
        } else {
          saveAllBtn.classList.add('hidden');
        }
      }

      if (!currentData || currentData.length === 0) {
        showMessage(`No data available for category "${pmcd}". Click "Add Range" to create records.`, 'info');
      }

    } catch (error) {
      console.error('Load data error:', error);
      showMessage('Error loading data: ' + error.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  async function handleSaveAll() {
    if (!currentHandler || !currentHandler.bulkSave) {
      showMessage('Bulk save not supported', 'error');
      return;
    }

    try {
      showLoading(true);
      const success = await currentHandler.bulkSave(BASE_URL, currentOperation, showMessage);

      if (success) {
        if (currentHandler.requiresPMCdFilter && currentPMCd) {
          await loadDataWithPMCd(currentPMCd);
        } else {
          await loadData();
        }
      }
    } catch (error) {
      console.error('Save all error:', error);
      showMessage('Error saving all: ' + error.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  async function loadData() {
    showLoading(true);
    editingRows.clear();

    try {
      currentData = await currentHandler.loadData(BASE_URL, currentOperation);
      const columns = currentHandler.getColumns();

      renderTable(currentData, columns);

      const operationSelect = document.getElementById('operation');
      const selectedOption = operationSelect.options[operationSelect.selectedIndex];
      document.getElementById('dataTitle').textContent = selectedOption.textContent;

      document.getElementById('resultsSection').classList.remove('hidden');

      const addBtn = document.getElementById('addBtn');
      if (addBtn) {
        if (currentHandler.supportsAdd) {
          addBtn.classList.remove('hidden');
        } else {
          addBtn.classList.add('hidden');
        }
      }
    } catch (error) {
      console.error('Load data error:', error);
      showMessage('Error loading data: ' + error.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  function handleAddData() {
    if (!currentHandler || !currentHandler.supportsAdd) {
      showMessage('Add operation not supported', 'error');
      return;
    }

    if (currentHandler.addNewRow) {
      const tableBody = document.getElementById('tableBody');
      currentHandler.addNewRow(tableBody, showMessage, BASE_URL, currentOperation);
    }
  }

  function renderTable(data, columns) {
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');

    const visibleColumns = columns.filter(col => !col.hidden);

    tableHeader.innerHTML = '<tr>' +
      visibleColumns.map(col => {
        const widthStyle = col.width ? `style="min-width: ${col.width}; width: ${col.width};"` : '';
        return `<th ${widthStyle}>${col.label}</th>`;
      }).join('') +
      '<th style="width: 120px;">Action</th></tr>';

    if (!data || data.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="${visibleColumns.length + 1}" style="text-align: center;">No data available</td></tr>`;
      return;
    }

    tableBody.innerHTML = data.map(row => {
      const rowIdValue = currentHandler.generateRowId(row);

      const cells = visibleColumns.map(col => {
        const value = row[col.key] ?? '';
        const widthStyle = col.width ? `style="min-width: ${col.width};"` : '';

        // For fields that need special edit handling (image, textarea, date)
        if (col.editable && (col.type === 'image' || col.type === 'textarea' || col.type === 'date')) {
          let displayValue = value;
          if (currentHandler.renderDisplayCell) {
            const customDisplay = currentHandler.renderDisplayCell(col, value, row);
            if (customDisplay !== null) {
              displayValue = customDisplay;
            }
          }
          return `<td ${widthStyle} data-field="${col.key}" data-type="${col.type}" data-original-value="${escapeHtml(value || '')}">${displayValue}</td>`;
        }

        if (col.editable) {
          if (col.type === 'dropdown') {
            let displayValue = value;
            return `<td ${widthStyle} data-field="${col.key}" data-value="${escapeHtml(value)}" data-original-value="${escapeHtml(value)}">${displayValue}</td>`;
          } else if (col.type === 'number') {
            return `<td ${widthStyle}><input type="text" class="edit-field" 
                      data-field="${col.key}" value="${escapeHtml(value)}" 
                      data-original-value="${escapeHtml(value)}"
                      oninput="ConfigManager.validateInput(this)" disabled></td>`;
          } else if (col.type === 'select') {
            if (col.options) {
              return `<td ${widthStyle}>
                        <select class="edit-field" data-field="${col.key}" 
                          data-original-value="${escapeHtml(value)}" disabled>
                          ${col.options.map(opt =>
                `<option value="${escapeHtml(opt)}" ${value === opt ? 'selected' : ''}>${escapeHtml(opt)}</option>`
              ).join('')}
                        </select>
                      </td>`;
            }
          } else if (col.type === 'text') {
            const maxlength = col.maxlength ? `maxlength="${col.maxlength}"` : '';
            return `<td ${widthStyle}><input type="text" class="edit-field" 
                      data-field="${col.key}" value="${escapeHtml(value)}" 
                      data-original-value="${escapeHtml(value)}"
                      ${maxlength} disabled style="width: 100%;"></td>`;
          }
        }
        return `<td ${widthStyle}>${escapeHtml(value)}</td>`;
      }).join('');

      const supportsDelete = currentHandler.supportsDelete;
      const deleteBtn = supportsDelete
        ? `<button class="action-btn delete-btn" onclick="ConfigManager.deleteRow('${rowIdValue}')" title="Delete">🗑️</button>`
        : '';

      return `<tr data-id="${rowIdValue}">${cells}
        <td class="action-cell">
  <button class="action-btn edit-btn" onclick="ConfigManager.toggleEdit('${rowIdValue}')" title="Edit">
    <i class="fa-solid fa-pen-to-square"></i>
  </button>

  <button class="action-btn save-btn hidden" onclick="ConfigManager.saveRow('${rowIdValue}')" title="Save">
    <i class="fa-solid fa-floppy-disk"></i>
  </button>

  <button class="action-btn cancel-btn hidden" onclick="ConfigManager.cancelEdit('${rowIdValue}')" title="Cancel">
    <i class="fa-solid fa-xmark"></i>
  </button>

  ${supportsDelete
          ? `<button class="action-btn delete-btn" onclick="ConfigManager.deleteRow('${rowIdValue}')" title="Delete">
           <i class="fa-solid fa-trash"></i>
         </button>`
          : ''
        }
</td>
</tr>`;
    }).join('');
  }

  function toggleEdit(rowId) {
    const row = document.querySelector(`tr[data-id="${rowId}"]`);
    if (!row) return;

    const newRow = document.querySelector('tr[data-is-new="true"]');
    if (newRow) {
      showMessage('Please save or cancel the new row first', 'error');
      return;
    }

    const editBtn = row.querySelector('.edit-btn');
    const saveBtn = row.querySelector('.save-btn');
    const cancelBtn = row.querySelector('.cancel-btn');
    const deleteBtn = row.querySelector('.delete-btn');

    const rowData = currentData.find(r => currentHandler.generateRowId(r) === rowId);

    const originalValues = {};
    const columns = currentHandler.getColumns();

    // Handle ALL editable fields including textarea, date, and image
    columns.filter(col => col.editable).forEach(col => {
      const cell = row.querySelector(`td[data-field="${col.key}"]`);

      if (cell) {
        // Get original value from data-original-value attribute
        const originalValue = cell.getAttribute('data-original-value') || cell.dataset.originalValue || '';
        originalValues[col.key] = originalValue;

        // For fields that need special edit controls (image, textarea, date)
        if (col.type === 'image' || col.type === 'textarea' || col.type === 'date') {
          if (currentHandler.createEditControl) {
            // Call createEditControl even without rowData - it doesn't actually need it
            const editControl = currentHandler.createEditControl(col, originalValue, rowData || {});

            if (editControl) {
              cell.innerHTML = '';
              cell.appendChild(editControl);
            }
          }
        }
      }
    });

    // Handle regular input fields that are already in the DOM
    const inputs = row.querySelectorAll('.edit-field:not([type="hidden"])');
    inputs.forEach(input => {
      const field = input.dataset.field;
      if (!originalValues[field]) {
        originalValues[field] = input.dataset.originalValue || input.value;
      }
      input.disabled = false;
      input.classList.add('editing');
    });

    // Handle select fields
    const selects = row.querySelectorAll('select.edit-field');
    selects.forEach(select => {
      const field = select.dataset.field;
      if (!originalValues[field]) {
        originalValues[field] = select.dataset.originalValue || select.value;
      }
      select.disabled = false;
      select.classList.add('editing');
    });

    editingRows.set(rowId, originalValues);

    // Focus first editable field (with slight delay for DOM updates)
    setTimeout(() => {
      const allEditableFields = row.querySelectorAll('.edit-field:not([type="hidden"]), select.edit-field, textarea.edit-field, input[type="date"]');
      const firstEditableInput = Array.from(allEditableFields).find(input => !input.disabled);
      if (firstEditableInput) {
        firstEditableInput.focus();
        if (firstEditableInput.type === 'text' || firstEditableInput.tagName === 'TEXTAREA') {
          firstEditableInput.select();
        }
      }
    }, 100);

    editBtn.classList.add('hidden');
    saveBtn.classList.remove('hidden');
    cancelBtn.classList.remove('hidden');
    if (deleteBtn) deleteBtn.classList.add('hidden');
    row.classList.add('editing-row');
  }

  function cancelEdit(rowId) {
    const row = document.querySelector(`tr[data-id="${rowId}"]`);
    if (!row) return;

    const originalValues = editingRows.get(rowId);
    if (!originalValues) return;

    const inputs = row.querySelectorAll('.edit-field');
    const editBtn = row.querySelector('.edit-btn');
    const saveBtn = row.querySelector('.save-btn');
    const cancelBtn = row.querySelector('.cancel-btn');
    const deleteBtn = row.querySelector('.delete-btn');

    const columns = currentHandler.getColumns();
    const rowData = currentData.find(r => currentHandler.generateRowId(r) === rowId);

    // Restore custom display cells (image, textarea, date, dropdown)
    columns.filter(col => col.editable).forEach(col => {
      const cell = row.querySelector(`td[data-field="${col.key}"]`);
      if (cell) {
        const originalValue = originalValues[col.key] || '';

        if (col.type === 'image' || col.type === 'textarea' || col.type === 'date' || col.type === 'dropdown') {
          let displayValue = originalValue;
          if (currentHandler.renderDisplayCell && rowData) {
            const customDisplay = currentHandler.renderDisplayCell(col, originalValue, rowData);
            if (customDisplay !== null) {
              displayValue = customDisplay;
            }
          } else {
            // Fallback for images if no custom display
            if (col.type === 'image') {
              if (originalValue && originalValue.trim() !== '') {
                displayValue = `<img src="${escapeHtml(originalValue)}" alt="Image" style="max-width: 100px; max-height: 100px; cursor: pointer; display: block; border: 1px solid #ddd; border-radius: 4px;">`;
              } else {
                displayValue = '<span style="color: #999; font-size: 12px;">No image</span>';
              }
            }
          }
          cell.innerHTML = displayValue;
          if (col.type === 'dropdown') {
            cell.dataset.value = originalValue;
          }
        }
      }
    });

    // Restore regular input fields
    inputs.forEach(input => {
      const field = input.dataset.field;
      if (originalValues[field] !== undefined) {
        input.value = originalValues[field];
      }
      input.disabled = true;
      input.classList.remove('editing');
    });

    editBtn.classList.remove('hidden');
    saveBtn.classList.add('hidden');
    cancelBtn.classList.add('hidden');
    if (deleteBtn) deleteBtn.classList.remove('hidden');
    row.classList.remove('editing-row');

    editingRows.delete(rowId);
  }

  async function saveRow(rowId) {
    const row = document.querySelector(`tr[data-id="${rowId}"]`);
    if (!row) return;

    const originalValues = editingRows.get(rowId);

    try {
      showLoading(true);
      await currentHandler.saveRow(row, rowId, BASE_URL, currentOperation, originalValues);
      showMessage('Record updated successfully', 'success');

      if (currentHandler.requiresPMCdFilter && currentPMCd) {
        await loadDataWithPMCd(currentPMCd);
      } else {
        await loadData();
      }
    } catch (error) {
      console.error('Save error:', error);
      showMessage(error.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  async function deleteRow(rowId) {
    if (!currentHandler || !currentHandler.deleteRow) {
      showMessage('Delete operation not supported', 'error');
      return;
    }

    pendingDeleteRowId = rowId;

    const confirmDialog = document.getElementById('confirmDialog');
    const confirmMessage = document.getElementById('confirmMessage');

    if (confirmMessage) {
      confirmMessage.textContent = 'Are you sure you want to delete this record?';
    }

    if (confirmDialog) {
      confirmDialog.classList.remove('hidden');
    }
  }

  async function confirmDelete() {
    if (!pendingDeleteRowId) return;

    const confirmDialog = document.getElementById('confirmDialog');
    if (confirmDialog) {
      confirmDialog.classList.add('hidden');
    }

    try {
      showLoading(true);
      const result = await currentHandler.deleteRow(pendingDeleteRowId, BASE_URL, currentOperation);

      if (result !== null) {
        showMessage('Record deleted successfully', 'success');

        if (currentHandler.requiresPMCdFilter && currentHandler.clearPMCdCache) {
          currentHandler.clearPMCdCache();
          await loadPMCdDropdown();
        }

        if (currentHandler.requiresPMCdFilter && currentPMCd) {
          await loadDataWithPMCd(currentPMCd);
        } else {
          await loadData();
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
      showMessage(error.message, 'error');
    } finally {
      showLoading(false);
      pendingDeleteRowId = null;
    }
  }

  function cancelDelete() {
    const confirmDialog = document.getElementById('confirmDialog');
    if (confirmDialog) {
      confirmDialog.classList.add('hidden');
    }
    pendingDeleteRowId = null;
  }

  async function saveNewRow() {
    const newRow = document.querySelector('tr[data-is-new="true"]');
    if (!newRow) return;

    if (!currentHandler || !currentHandler.saveNewRow) {
      showMessage('Save new row not supported', 'error');
      return;
    }

    try {
      showLoading(true);
      const result = await currentHandler.saveNewRow(newRow, BASE_URL, currentOperation);
      showMessage('Record added successfully', 'success');

      if (currentHandler.requiresPMCdFilter) {
        const pmcdSelect = document.getElementById('pmcdSelect');
        const wasNewCategory = pmcdSelect && pmcdSelect.value === '__NEW__';

        if (wasNewCategory) {
          const newPMCdInput = document.getElementById('newPMCdInput');
          let newCategoryName = '';

          if (newPMCdInput.tagName === 'SELECT') {
            newCategoryName = newPMCdInput.value.trim();
          } else {
            newCategoryName = newPMCdInput.value.trim();
          }

          if (currentHandler.clearPMCdCache) {
            currentHandler.clearPMCdCache();
          }

          await loadPMCdDropdown();

          if (pmcdSelect && newCategoryName) {
            pmcdSelect.value = newCategoryName;
            currentPMCd = newCategoryName;
          }

          const newPMCdGroup = document.getElementById('newPMCdGroup');
          if (newPMCdGroup) newPMCdGroup.classList.add('hidden');
        }

        await loadDataWithPMCd(currentPMCd);
      } else {
        await loadData();
      }
    } catch (error) {
      console.error('Add error:', error);
      showMessage(error.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  function cancelNewRow() {
    const newRow = document.querySelector('tr[data-is-new="true"]');
    if (newRow) {
      newRow.remove();
    }
  }

  function validateInput(input) {
    if (currentHandler && currentHandler.validateInput) {
      currentHandler.validateInput(input);
    }
  }

  function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
      overlay?.classList.remove('hidden');
    } else {
      overlay?.classList.add('hidden');
    }
  }

  function showMessage(message, type = 'info') {
    const container = document.getElementById('messageContainer');
    if (!container) return;

    const div = document.createElement('div');
    div.textContent = message;
    const escapedMessage = div.innerHTML;

    container.innerHTML = `<div class="message ${type}">${escapedMessage}</div>`;

    setTimeout(() => {
      container.innerHTML = '';
    }, 5000);
  }

  return {
    init,
    toggleEdit,
    cancelEdit,
    saveRow,
    deleteRow,
    validateInput,
    saveNewRow,
    cancelNewRow,
    handleSaveAll
  };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ConfigManager.init);
} else {
  ConfigManager.init();
}