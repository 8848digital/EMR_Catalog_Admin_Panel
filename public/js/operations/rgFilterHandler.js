const rgFilterOperation = (() => {
  const COLUMNS = [
    { key: 'PTyp', label: 'Type', editable: false, type: 'text', width: '100px', hidden: true },
    { key: 'PMCd', label: 'Range', editable: false, type: 'text', width: '120px', hidden: true },
    { key: 'PSCd', label: 'Sequence', editable: true, type: 'text', width: '100px', maxlength: 30 },
    { key: 'PDesc', label: 'Description', editable: true, type: 'text', width: '200px', maxlength: 30 },
    { key: 'PNum', label: 'From', editable: true, type: 'number', width: '120px' },
    { key: 'PNum1', label: 'To', editable: true, type: 'number', width: '120px' },
    { key: 'PValue3', label: 'ID', editable: false, type: 'text', width: '80px', hidden: true }
  ];

  let pmcdListCache = null;
  let currentPMCd = null;
  let currentData = [];
  let newRecords = new Set();

  function getColumns() {
    return COLUMNS;
  }

  // Generate unique ID using PMCd + PValue3
  function generateRowId(row) {
    return `${row.PMCd}_${row.PValue3}`;
  }

  // Clear PMCd cache
  function clearPMCdCache() {
    pmcdListCache = null;
  }

  async function loadPMCdList(BASE_URL, operation, forceRefresh = false) {
    if (pmcdListCache && !forceRefresh) {
      return pmcdListCache;
    }

    try {
      const response = await fetch(`${BASE_URL}/pmcdList?operation=${operation}`);
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to load range list');
      }
      
      pmcdListCache = result.data || [];
      return pmcdListCache;
    } catch (error) {
      console.error('Error loading PMCd list:', error);
      throw error;
    }
  }

  async function loadData(BASE_URL, operation, selectedPMCd) {
    if (!selectedPMCd) {
      throw new Error('Please select a Range (PMCd) first');
    }

    currentPMCd = selectedPMCd;
    newRecords.clear();

    const response = await fetch(`${BASE_URL}/getData?operation=${operation}&PMCd=${encodeURIComponent(selectedPMCd)}`);
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response');
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to load range data');
    }
    
    currentData = result.data || [];
    return currentData;
  }

  function renderDisplayCell(col, value, row) {
    return null;
  }

  function createEditControl(col, value, row) {
    return null;
  }

  // Validate single field
  function validateField(input) {
    const field = input.dataset.field;
    const index = parseInt(input.dataset.index);
    const value = input.value.trim();
    
    // Clear previous error
    const errorSpan = input.parentElement.querySelector('.field-error');
    if (errorSpan) errorSpan.remove();
    input.classList.remove('has-error');

    let error = null;

    if (field === 'PSCd') {
      if (!value) {
        error = 'Required';
      } else {
        // Check for duplicate
        const duplicate = currentData.find((r, i) => i !== index && r.PSCd === value);
        if (duplicate) {
          error = `Duplicate sequence`;
        }
      }
    } else if (field === 'PDesc') {
      if (!value) {
        error = 'Required';
      }
    } else if (field === 'PNum') {
      if (!value || value === '') {
        error = 'Required';
      } else {
        const numVal = parseFloat(value);
        const currentRecord = currentData[index];
        
        // Check if this should match previous PNum1
        if (currentRecord && currentRecord.PSCd !== '1') {
          const prevPSCd = (parseInt(currentRecord.PSCd) - 1).toString();
          const prevRecord = currentData.find(r => r.PSCd === prevPSCd);
          if (prevRecord && prevRecord.PNum1) {
            const prevNum1 = parseFloat(prevRecord.PNum1);
            if (!isNaN(prevNum1) && !isNaN(numVal) && prevNum1 !== numVal) {
              error = `Must equal prev To: ${prevNum1}`;
            }
          }
        }

        // Check if PNum < PNum1
        if (!error && currentRecord && currentRecord.PNum1) {
          const num1Val = parseFloat(currentRecord.PNum1);
          if (!isNaN(numVal) && !isNaN(num1Val) && numVal >= num1Val) {
            error = 'From must be < To';
          }
        }
      }
    } else if (field === 'PNum1') {
      const currentRecord = currentData[index];
      if (value && value !== '') {
        const num1Val = parseFloat(value);
        
        // Check if this should match next PNum
        const maxPSCd = Math.max(...currentData.map(r => parseInt(r.PSCd) || 0));
        const currentPSCd = parseInt(currentRecord.PSCd);
        const isLastRange = currentPSCd === maxPSCd;

        if (!isLastRange) {
          const nextPSCd = (parseInt(currentRecord.PSCd) + 1).toString();
          const nextRecord = currentData.find(r => r.PSCd === nextPSCd);
          if (nextRecord && nextRecord.PNum) {
            const nextNum = parseFloat(nextRecord.PNum);
            if (!isNaN(num1Val) && !isNaN(nextNum) && num1Val !== nextNum) {
              error = `Must equal next From: ${nextNum}`;
            }
          }
        }

        // Check if PNum1 > PNum
        if (!error && currentRecord && currentRecord.PNum) {
          const numVal = parseFloat(currentRecord.PNum);
          if (!isNaN(numVal) && !isNaN(num1Val) && num1Val <= numVal) {
            error = 'To must be > From';
          }
        }
      }
    }

    if (error) {
      const errorEl = document.createElement('span');
      errorEl.className = 'field-error';
      errorEl.textContent = error;
      errorEl.style.cssText = 'color: #dc2626; font-size: 11px; display: block; margin-top: 2px;';
      input.parentElement.appendChild(errorEl);
      input.classList.add('has-error');
      return false;
    }

    return true;
  }

  // Validate all fields
  function validateAllFields() {
    const inputs = document.querySelectorAll('#resultsTable input[data-field]');
    let isValid = true;
    
    inputs.forEach(input => {
      if (!validateField(input)) {
        isValid = false;
      }
    });

    return isValid;
  }

  // Add input listeners for real-time validation
  function addValidationListeners() {
    const inputs = document.querySelectorAll('#resultsTable input[data-field]');
    inputs.forEach(input => {
      let timeout;
      
      input.addEventListener('input', (e) => {
        const index = parseInt(e.target.dataset.index);
        const field = e.target.dataset.field;
        currentData[index][field] = e.target.value;

        // Debounced validation
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          validateField(e.target);
          
          // Re-validate related fields
          if (field === 'PSCd' || field === 'PNum' || field === 'PNum1') {
            const allInputs = document.querySelectorAll(`input[data-field="${field}"]`);
            allInputs.forEach(inp => {
              if (inp !== e.target) {
                validateField(inp);
              }
            });
          }
        }, 300);
      });

      input.addEventListener('blur', () => {
        validateField(input);
      });
    });
  }

  async function addNewRow(tableBody, showMessage, BASE_URL, operation) {
    if (!currentPMCd) {
      showMessage('Please select a Range first', 'error');
      return;
    }

    // Calculate next PValue3
    const maxPValue3 = Math.max(...currentData.map(r => parseInt(r.PValue3) || 0), 0);
    const nextPValue3 = (maxPValue3 + 1).toString();

    // Calculate next PSCd
    const maxPSCd = Math.max(...currentData.map(r => parseInt(r.PSCd) || 0), 0);
    const nextPSCd = (maxPSCd + 1).toString();

    // Auto-fill PNum from previous PNum1
    let suggestedPNum = '';
    if (maxPSCd > 0) {
      const prevRecord = currentData.find(r => r.PSCd === maxPSCd.toString());
      if (prevRecord && prevRecord.PNum1) {
        suggestedPNum = prevRecord.PNum1;
      }
    }

    const newRecord = {
      PTyp: 'yFilter',
      PMCd: currentPMCd,
      PSCd: nextPSCd,
      PDesc: '',
      PNum: suggestedPNum,
      PNum1: '',
      PValue3: nextPValue3,
      isNew: true
    };

    currentData.push(newRecord);
    newRecords.add(nextPValue3);

    // Re-render table
    renderRangeTable(tableBody.parentElement.parentElement);
    
    showMessage(`New range added with sequence ${nextPSCd}`, 'success');
  }

  // Render complete table
  function renderRangeTable(container) {
    const tableHeader = container.querySelector('#tableHeader');
    const tableBody = container.querySelector('#tableBody');

    const visibleColumns = COLUMNS.filter(col => !col.hidden);

    // Render header
    tableHeader.innerHTML = '<tr>' + 
      visibleColumns.map(col => {
        const widthStyle = col.width ? `style="min-width: ${col.width}; width: ${col.width};"` : '';
        return `<th ${widthStyle}>${col.label}</th>`;
      }).join('') + 
      '<th style="width: 100px;">Action</th></tr>';

    // Render body
    if (currentData.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="${visibleColumns.length + 1}" style="text-align: center;">No records</td></tr>`;
      return;
    }

    tableBody.innerHTML = currentData.map((row, index) => {
      const rowIdValue = generateRowId(row);
      const isNew = newRecords.has(row.PValue3);

      const cells = visibleColumns.map(col => {
        const value = row[col.key] ?? '';
        const widthStyle = col.width ? `style="min-width: ${col.width};"` : '';

        if (col.editable) {
          if (col.type === 'number') {
            return `<td ${widthStyle} style="position: relative;">
                      <input type="number" step="0.01" class="edit-field" 
                        data-field="${col.key}" data-index="${index}" 
                        value="${value}" style="width: 100%;">
                    </td>`;
          } else {
            const maxlength = col.maxlength ? `maxlength="${col.maxlength}"` : '';
            return `<td ${widthStyle} style="position: relative;">
                      <input type="text" class="edit-field" 
                        data-field="${col.key}" data-index="${index}" 
                        value="${value}" ${maxlength} style="width: 100%;">
                    </td>`;
          }
        }
        return `<td ${widthStyle}>${value}</td>`;
      }).join('');

      const bgColor = isNew ? '#e8f4f8' : '';
      
      return `<tr data-id="${rowIdValue}" style="background-color: ${bgColor}">${cells}
        <td class="action-cell">
          <button class="action-btn delete-btn" onclick="rgFilterOperation.handleDelete('${rowIdValue}')" title="Delete">🗑️</button>
        </td></tr>`;
    }).join('');

    addValidationListeners();
  }

  // Handle delete
  async function handleDelete(rowId) {
    const [pmcd, pvalue3] = rowId.split('_');
    const index = currentData.findIndex(r => r.PMCd === pmcd && r.PValue3 === pvalue3);
    
    if (index === -1) return;

    const isNew = newRecords.has(pvalue3);
    const message = isNew ? 
      'Remove this new record?' : 
      'Delete this record from database?';

    if (!confirm(message)) return;

    if (isNew) {
      // Just remove from array
      currentData.splice(index, 1);
      newRecords.delete(pvalue3);
      renderRangeTable(document.getElementById('resultsTable').parentElement.parentElement);
      return null;
    } else {
      // Return delete info for handler
      return { PMCd: pmcd, PValue3: pvalue3 };
    }
  }

  // Bulk save all changes
  async function bulkSave(BASE_URL, operation, showMessage) {
    // Validate first
    if (!validateAllFields()) {
      showMessage('Please fix validation errors before saving', 'error');
      return false;
    }

    const modUsr = sessionStorage.getItem('modUsr') || '';

    // Prepare records for bulk save
    const records = currentData.map(record => ({
      ...record,
      isNew: newRecords.has(record.PValue3)
    }));

    try {
      const response = await fetch(`${BASE_URL}/bulkSave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: operation,
          PMCd: currentPMCd,
          records: records,
          modUsr: modUsr
        })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Bulk save failed');
      }

      newRecords.clear();
      showMessage(result.message || 'All changes saved successfully', 'success');
      return true;

    } catch (error) {
      console.error('Bulk save error:', error);
      showMessage('Error saving: ' + error.message, 'error');
      return false;
    }
  }

  // Delete single row
  async function deleteRow(uniqueId, BASE_URL, operation) {
    const deleteInfo = await handleDelete(uniqueId);
    
    if (!deleteInfo) return null; // Was a new record, already handled

    const modUsr = sessionStorage.getItem('modUsr') || '';

    const response = await fetch(`${BASE_URL}/deleteData`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: operation,
        PMCd: deleteInfo.PMCd,
        PValue3: deleteInfo.PValue3,
        modUsr: modUsr
      })
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete');
    }

    return result.data;
  }

  return {
    getColumns,
    generateRowId,
    loadData,
    addNewRow,
    deleteRow,
    bulkSave,
    renderDisplayCell,
    createEditControl,
    loadPMCdList,
    clearPMCdCache,
    handleDelete,
    supportsAdd: true,
    supportsDelete: true,
    supportsBulkSave: true, // NEW FLAG
    requiresPMCdFilter: true,
    showAddNewCategory: false,
    renderTable: renderRangeTable // Expose for custom rendering
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = rgFilterOperation;
}