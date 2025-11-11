const ConfigManager = (() => {
  const BASE_URL = '/api';
  const editingRows = new Map();
  let currentOperation = null;
  let currentData = [];
  let currentColumns = [];
  let currentIdKey = '';
  
  const CUSTOMER_COLUMNS = [
    { key: 'yCmId', label: 'Customer ID' },
    { key: 'yCmCd', label: 'Customer Code' },
    { key: 'yCmName', label: 'Name' },
    { key: 'yCmEmail', label: 'Email' },
    { key: 'yCmCurCd', label: 'Currency' },
    { key: 'yCmDfltLng', label: 'Language' },
    { key: 'yCmMulBy', label: 'Multiplier', editable: true, type: 'number' },
    { key: 'yCmValidYN', label: 'Valid Y/N', editable: true, type: 'select', options: ['Y', 'N'] }
  ];

  const EMAIL_COLUMNS = [
    { key: 'PDesc', label: 'Mail To/CC', editable: true, type: 'select', options: ['to', 'cc'], newRowOnly: true },
    { key: 'PDesc225', label: 'Email ID', editable: true, type: 'text' },
    { key: 'yPIdNo', label: 'ID', hidden: true }
  ];

  // Initialize
  function init() {
    const modUsr = sessionStorage.getItem('modUsr');
    if (!modUsr) {
      window.location.href = '/login';
      return;
    }
    
    document.getElementById('filterForm')?.addEventListener('submit', handleFormSubmit);
    
    // Add event listener for Add Data button
    const addBtn = document.getElementById('addBtn');
    if (addBtn) {
      addBtn.addEventListener('click', handleAddData);
    }
  }

  // Handle form submission
  async function handleFormSubmit(e) {
    e.preventDefault();
    const operation = document.getElementById('operation').value;
    
    if (!operation) {
      showMessage('Please select an operation', 'error');
      return;
    }
    
    currentOperation = operation;
    
    if (operation === 'add_custMst') {
      await loadCustomerData();
    } else if (operation === 'add_email') {
      await loadEmailData();
    }
  }

  // Handle Add Data button click
  function handleAddData() {
    if (currentOperation === 'add_email') {
      addNewEmailRow();
    }
  }

  // Add new email row inline
  function addNewEmailRow() {
    // Check if there's already a new row being added
    const existingNewRow = document.querySelector('tr[data-is-new="true"]');
    if (existingNewRow) {
      showMessage('Please save or cancel the current new row first', 'error');
      return;
    }

    const tableBody = document.getElementById('tableBody');
    const visibleColumns = EMAIL_COLUMNS.filter(col => !col.hidden);
    
    // Create new row with editable fields
    const cells = visibleColumns.map(col => {
      const widthStyle = col.width ? `style="min-width: ${col.width};"` : '';
      
      if (col.readonly && col.defaultValue) {
        return `<td ${widthStyle}>${col.defaultValue}</td>`;
      } else if (col.editable || col.newRowOnly) {
        if (col.type === 'text') {
          return `<td ${widthStyle}><input type="text" class="edit-field" 
                    data-field="${col.key}" value="" 
                    maxlength="225" style="width: 100%; background-color: white;"></td>`;
        } else if (col.type === 'select' && col.options) {
          return `<td ${widthStyle}>
                    <select class="edit-field" data-field="${col.key}" style="background-color:white;">
                      <option value="">--Select--</option>
                      ${col.options.map(opt => 
                        `<option value="${opt}">${opt}</option>`
                      ).join('')}
                    </select>
                  </td>`;
        }
      }
      return `<td ${widthStyle}></td>`;
    }).join('');
    
    const newRow = `<tr data-is-new="true" data-id-key="yPIdNo" style="background-color: #e8e6dfff;">${cells}
      <td class="action-cell">
        <button class="action-btn save-btn" onclick="ConfigManager.saveNewRow()" title="Save">💾</button>
        <button class="action-btn cancel-btn" onclick="ConfigManager.cancelNewRow()" title="Cancel">❌</button>
      </td></tr>`;
    
    // Insert at the top of the table
    tableBody.insertAdjacentHTML('afterbegin', newRow);
    
    // Focus on the first editable field
    const firstInput = tableBody.querySelector('tr[data-is-new="true"] .edit-field');
    if (firstInput) {
      firstInput.focus();
    }
  }

  // Save new row
  async function saveNewRow() {
    const newRow = document.querySelector('tr[data-is-new="true"]');
    if (!newRow) return;
    
    if (currentOperation === 'add_email') {
      await saveNewEmailRow(newRow);
    }
  }

  // Save new email row
  async function saveNewEmailRow(row) {
    const pDescSelect = row.querySelector('select[data-field="PDesc"]');
    const pDesc225Input = row.querySelector('input[data-field="PDesc225"]');
    
    const pDesc = pDescSelect.value;
    const pDesc225 = pDesc225Input.value.trim();
    
    // Validate
    if (!pDesc) {
      showMessage('Please select Description (to/cc)', 'error');
      pDescSelect.focus();
      return;
    }
    
    if (!pDesc225) {
      showMessage('Please enter Description 225 (email address)', 'error');
      pDesc225Input.focus();
      return;
    }
    
    showLoading(true);
    const modUsr = sessionStorage.getItem('modUsr') || '';
    
    try {
      const response = await fetch(`${BASE_URL}/addEmail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          PDesc: pDesc,
          PDesc225: pDesc225,
          modUsr: modUsr 
        })
      });
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response. Please check API endpoint.');
      }
      
      const result = await response.json();
      
      if (result.success) {
        showMessage('Email configuration added successfully.', 'success');
        await loadEmailData(); // Reload data
      } else {
        showMessage(result.error || 'Failed to add email configuration', 'error');
      }
    } catch (error) {
      console.error('Add email error:', error);
      showMessage('Error adding email configuration: ' + error.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  // Cancel new row
  function cancelNewRow() {
    const newRow = document.querySelector('tr[data-is-new="true"]');
    if (newRow) {
      newRow.remove();
    }
  }

  // Load customer data
  async function loadCustomerData() {
    showLoading(true);
    editingRows.clear();
    
    try {
      const response = await fetch(`${BASE_URL}/getCustMst`);
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response. Please check API endpoint.');
      }
      
      const result = await response.json();
      
      if (result.success) {
        currentData = result.data || [];
        currentColumns = CUSTOMER_COLUMNS;
        currentIdKey = 'yCmId';
        renderTable(currentData, currentColumns, currentIdKey, false);
        document.getElementById('dataTitle').textContent = 'Customer Management';
        document.getElementById('resultsSection').classList.remove('hidden');
      } else {
        showMessage(result.error || 'Failed to load customer data', 'error');
      }
    } catch (error) {
      console.error('Load customer data error:', error);
      showMessage('Error loading customer data: ' + error.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  // Load email data
  async function loadEmailData() {
    showLoading(true);
    editingRows.clear();
    
    try {
      const response = await fetch(`${BASE_URL}/getEmail`);
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response. Please check API endpoint.');
      }
      
      const result = await response.json();
      
      if (result.success) {
        currentData = result.data || [];
        currentColumns = EMAIL_COLUMNS;
        currentIdKey = 'yPIdNo';
        renderTable(currentData, currentColumns, currentIdKey, true);
        document.getElementById('dataTitle').textContent = 'Email Configuration Management';
        document.getElementById('resultsSection').classList.remove('hidden');
      } else {
        showMessage(result.error || 'Failed to load email data', 'error');
      }
    } catch (error) {
      console.error('Load email data error:', error);
      showMessage('Error loading email data: ' + error.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  // Update customer
  async function updateCustomer(rowId, multiplierValue, validYN) {
    showLoading(true);
    const modUsr = sessionStorage.getItem('modUsr') || '';
    
    try {
      const response = await fetch(`${BASE_URL}/updateCustMst`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          yCmId: rowId, 
          yCmMulBy: parseFloat(multiplierValue),
          yCmValidYN: validYN,
          modUsr: modUsr 
        })
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response. Please check API endpoint.');
      }
      
      const result = await response.json();
      
      if (result.success) {
        showMessage('Customer updated successfully.', 'success');
        return true;
      } else {
        showMessage(result.error || 'Failed to update customer', 'error');
        return false;
      }
    } catch (error) {
      console.error('Update customer error:', error);
      showMessage('Error updating customer: ' + error.message, 'error');
      return false;
    } finally {
      showLoading(false);
    }
  }

  // Update email
  async function updateEmail(rowId, pDesc225) {
    showLoading(true);
    const modUsr = sessionStorage.getItem('modUsr') || '';
    
    try {  
      const response = await fetch(`${BASE_URL}/updateEmail`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          yPIdNo: parseInt(rowId, 10),
          PDesc225: pDesc225,
          modUsr: modUsr 
        })
      });
         
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned non-JSON response. Please check API endpoint: ' + BASE_URL + '/updateEmail');
      }
      
      const result = await response.json();
      
      if (result.success) {
        showMessage('Email configuration updated successfully.', 'success');
        return true;
      } else {
        showMessage(result.error || 'Failed to update email configuration', 'error');
        return false;
      }
    } catch (error) {
      console.error('Update email error:', error);
      showMessage('Error updating email configuration: ' + error.message, 'error');
      return false;
    } finally {
      showLoading(false);
    }
  }

  // Render table
  function renderTable(data, columns, idKey, showAddButton) {
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    const addBtn = document.getElementById('addBtn');
    
    // Show/hide add button
    if (addBtn) {
      if (showAddButton) {
        addBtn.classList.remove('hidden');
      } else {
        addBtn.classList.add('hidden');
      }
    }
    
    // Filter out hidden columns for header
    const visibleColumns = columns.filter(col => !col.hidden);
    
    // Render header with custom widths
    tableHeader.innerHTML = '<tr>' + 
      visibleColumns.map(col => {
        const widthStyle = col.width ? `style="min-width: ${col.width}; width: ${col.width};"` : '';
        return `<th ${widthStyle}>${col.label}</th>`;
      }).join('') + 
      '<th style="width: 120px;">Action</th></tr>';
    
    // Render body
    if (!data || data.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="${visibleColumns.length + 1}" style="text-align: center;">No data available</td></tr>`;
      return;
    }
    
    tableBody.innerHTML = data.map(row => {
      const rowIdValue = row[idKey];
      const cells = visibleColumns.map(col => {
        const value = row[col.key] ?? '';
        const widthStyle = col.width ? `style="min-width: ${col.width};"` : '';
        
        if (col.editable && !col.newRowOnly) {
          if (col.type === 'number') {
            return `<td ${widthStyle}><input type="number" step="0.01" min="0" class="edit-field" 
                      data-field="${col.key}" value="${value}" 
                      oninput="ConfigManager.validateDecimalInput(this)" disabled></td>`;
          } else if (col.type === 'text') {
            return `<td ${widthStyle}><input type="text" class="edit-field" 
                      data-field="${col.key}" value="${value}" 
                      maxlength="225" disabled style="width: 100%;"></td>`;
          } else if (col.type === 'select' && col.options) {
            return `<td ${widthStyle}>
                      <select class="edit-field" data-field="${col.key}" disabled>
                        ${col.options.map(opt => 
                          `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`
                        ).join('')}
                      </select>
                    </td>`;
          }
        }
        return `<td ${widthStyle}>${value}</td>`;
      }).join('');
      
      return `<tr data-id="${rowIdValue}" data-id-key="${idKey}">${cells}
        <td class="action-cell">
          <button class="action-btn edit-btn" onclick="ConfigManager.toggleEdit('${rowIdValue}', '${idKey}')" title="Edit">✏️</button>
          <button class="action-btn save-btn hidden" onclick="ConfigManager.saveRow('${rowIdValue}', '${idKey}')" title="Save">💾</button>
          <button class="action-btn cancel-btn hidden" onclick="ConfigManager.cancelEdit('${rowIdValue}', '${idKey}')" title="Cancel">❌</button>
        </td></tr>`;
    }).join('');
  }

  // Toggle edit mode
  function toggleEdit(rowId, idKey) {
    const row = document.querySelector(`tr[data-id="${rowId}"][data-id-key="${idKey}"]`);
    if (!row) return;
    
    // Check if there's a new row being added
    const newRow = document.querySelector('tr[data-is-new="true"]');
    if (newRow) {
      showMessage('Please save or cancel the new row first', 'error');
      return;
    }
    
    const inputs = row.querySelectorAll('.edit-field');
    const editBtn = row.querySelector('.edit-btn');
    const saveBtn = row.querySelector('.save-btn');
    const cancelBtn = row.querySelector('.cancel-btn');
    
    // Store original values
    const originalValues = {};
    inputs.forEach(input => {
      const field = input.dataset.field;
      originalValues[field] = input.value;
    });
    editingRows.set(rowId, originalValues);
    
    // Enable editing
    inputs.forEach(input => {
      input.disabled = false;
      input.classList.add('editing');
    });
    
    const firstInput = row.querySelector('.edit-field');
    if (firstInput) {
      firstInput.focus();
      if (firstInput.type === 'number' || firstInput.tagName === 'INPUT') {
        firstInput.select();
      }
    }
    
    editBtn.classList.add('hidden');
    saveBtn.classList.remove('hidden');
    cancelBtn.classList.remove('hidden');
    row.classList.add('editing-row');
  }

  // Cancel edit
  function cancelEdit(rowId, idKey) {
    const row = document.querySelector(`tr[data-id="${rowId}"][data-id-key="${idKey}"]`);
    if (!row) return;
    
    const originalValues = editingRows.get(rowId);
    if (!originalValues) return;
    
    const inputs = row.querySelectorAll('.edit-field');
    const editBtn = row.querySelector('.edit-btn');
    const saveBtn = row.querySelector('.save-btn');
    const cancelBtn = row.querySelector('.cancel-btn');
    
    // Restore original values
    inputs.forEach(input => {
      const field = input.dataset.field;
      input.value = originalValues[field];
      input.disabled = true;
      input.classList.remove('editing');
    });
    
    editBtn.classList.remove('hidden');
    saveBtn.classList.add('hidden');
    cancelBtn.classList.add('hidden');
    row.classList.remove('editing-row');
    
    editingRows.delete(rowId);
  }

  // Save row
  async function saveRow(rowId, idKey) {
    const row = document.querySelector(`tr[data-id="${rowId}"][data-id-key="${idKey}"]`);
    if (!row) return;
    
    if (currentOperation === 'add_custMst') {
      await saveCustomerRow(row, rowId);
    } else if (currentOperation === 'add_email') {
      await saveEmailRow(row, rowId);
    }
  }

  // Save customer row
  async function saveCustomerRow(row, rowId) {
    const multiplierInput = row.querySelector('input[data-field="yCmMulBy"]');
    const validYNSelect = row.querySelector('select[data-field="yCmValidYN"]');
    
    const multiplierValue = multiplierInput.value.trim();
    const validYNValue = validYNSelect.value;
    
    // Validate multiplier
    if (!multiplierValue) {
      showMessage('Multiplier value is required', 'error');
      multiplierInput.focus();
      return;
    }
    
    if (isNaN(multiplierValue) || parseFloat(multiplierValue) < 1) {
      showMessage('Multiplier must be 1 or greater', 'error');
      multiplierInput.focus();
      return;
    }
    
    // Validate Valid Y/N
    if (!validYNValue || (validYNValue !== 'Y' && validYNValue !== 'N')) {
      showMessage('Valid Y/N must be Y or N', 'error');
      validYNSelect.focus();
      return;
    }
    
    // Save to server
    const success = await updateCustomer(rowId, multiplierValue, validYNValue);
    
    if (success) {
      disableEditMode(row, rowId);
    }
  }

  // Save email row
  async function saveEmailRow(row, rowId) {
    const pDesc225Input = row.querySelector('input[data-field="PDesc225"]');
    const pDesc225 = pDesc225Input.value.trim();
    
    // Validate PDesc225
    if (!pDesc225) {
      showMessage('Description 225 is required', 'error');
      pDesc225Input.focus();
      return;
    }
    
    // Save to server
    const success = await updateEmail(rowId, pDesc225);
    
    if (success) {
      disableEditMode(row, rowId);
    }
  }

  // Disable edit mode after successful save
  function disableEditMode(row, rowId) {
    const inputs = row.querySelectorAll('.edit-field');
    const editBtn = row.querySelector('.edit-btn');
    const saveBtn = row.querySelector('.save-btn');
    const cancelBtn = row.querySelector('.cancel-btn');
    
    inputs.forEach(input => {
      input.disabled = true;
      input.classList.remove('editing');
    });
    
    editBtn.classList.remove('hidden');
    saveBtn.classList.add('hidden');
    cancelBtn.classList.add('hidden');
    row.classList.remove('editing-row');
    
    editingRows.delete(rowId);
  }

  // Validate decimal input
  function validateDecimalInput(input) {
    let value = input.value;
    if (value === '') return;
    
    // Remove invalid characters
    value = value.replace(/[^\d.-]/g, '');
    
    // For customer multiplier, enforce minimum value of 1
    if (currentOperation === 'add_custMst') {
      if (parseFloat(value) < 1 && value !== '' && value !== '-') {
        value = '1';
      }
    } else {
      // For email values, enforce minimum value of 0
      if (parseFloat(value) < 0 && value !== '' && value !== '-') {
        value = '0';
      }
    }
    
    // Limit to 2 decimal places
    if (value.includes('.')) {
      const parts = value.split('.');
      if (parts[1] && parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].substring(0, 2);
      }
    }
    
    input.value = value;
  }

  // Show loading overlay
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
    validateDecimalInput,
    saveNewRow,
    cancelNewRow
  };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ConfigManager.init);
} else {
  ConfigManager.init();
}