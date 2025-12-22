const metKtOperation = (() => {
  const COLUMNS = [
    { key: 'PTyp', label: 'Type', hidden: true },
    { key: 'PMCd', label: 'Metal Code', editable: true, type: 'dropdown', width: '120px' },
    { key: 'PSCd', label: 'Purity Code', editable: true, type: 'text', width: '120px', maxlength: 30 },
    { key: 'PValue', label: 'Purity Value', editable: true, type: 'text', width: '120px', maxlength: 30 },
    { key: 'PDesc', label: 'Description', editable: true, type: 'text', width: '200px', maxlength: 30 },
    { key: 'PValue3', label: 'Sequence', editable: false, type: 'text', width: '100px' }
  ];

  let pmcdListCache = null;

  function getColumns() {
    return COLUMNS;
  }

  // Generate unique ID using PMCd|PSCd composite key
  function generateRowId(row) {
    return `${row.PMCd}|${row.PSCd}`;
  }

  async function loadPMCdList(BASE_URL, operation) {
    if (pmcdListCache) {
      return pmcdListCache;
    }

    try {
      const response = await fetch(`${BASE_URL}/pmcdList?operation=${operation}`);
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response for PMCd list');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load metal code list');
      }
      
      pmcdListCache = result.data || [];
      console.log('Loaded Metal Code list (PMCd):', pmcdListCache);
      return pmcdListCache;
    } catch (error) {
      console.error('Error loading PMCd list:', error);
      throw error;
    }
  }

  async function loadData(BASE_URL, operation) {
    // Load PMCd dropdown list first
    await loadPMCdList(BASE_URL, operation);

    const response = await fetch(`${BASE_URL}/getData?operation=${operation}`);
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to load Metal Purity data');
    }
    
    return result.data || [];
  }

  // This function is called during table rendering to show plain text
  function renderDisplayCell(col, value, row) {
    if (col.type === 'dropdown') {
      // Show just the value as plain text when not editing
      return value;
    }
    return null;
  }

  // This function creates the edit control when editing mode is activated
  function createEditControl(col, value, row) {
    if (col.type === 'dropdown' && col.key === 'PMCd') {
      const dataList = pmcdListCache;
      
      if (!dataList || dataList.length === 0) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'edit-field';
        input.dataset.field = col.key;
        input.value = value;
        input.dataset.originalValue = value;
        return input;
      }

      const select = document.createElement('select');
      select.className = 'edit-field';
      select.dataset.field = col.key;
      select.dataset.originalValue = value;
      select.style.width = '100%';
      
      // Add default option
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = '--Select Metal--';
      select.appendChild(defaultOption);
      
      // Add all options with proper pre-selection
      dataList.forEach(item => {
        const option = document.createElement('option');
        const itemValue = item.PMCd;
        option.value = itemValue;
        option.textContent = itemValue;
        
        // Proper comparison for selection
        if (itemValue === value || itemValue?.trim() === value?.trim()) {
          option.selected = true;
          console.log('Pre-selected:', col.key, '=', itemValue);
        }
        
        select.appendChild(option);
      });
      
      return select;
    }
    return null;
  }

  async function saveRow(row, uniqueId, BASE_URL, operation) {
    const pmcdField = row.querySelector('[data-field="PMCd"]');
    const pscdField = row.querySelector('[data-field="PSCd"]');
    const pvalueField = row.querySelector('[data-field="PValue"]');
    const pdescField = row.querySelector('[data-field="PDesc"]');
    
    const PMCd = pmcdField ? pmcdField.value.trim() : '';
    const PSCd = pscdField ? pscdField.value.trim() : '';
    const PValue = pvalueField ? pvalueField.value.trim() : '';
    const PDesc = pdescField ? pdescField.value.trim() : '';
    
    // Validate
    if (!PMCd) {
      throw new Error('Metal Code (PMCd) is required');
    }
    
    if (!PSCd) {
      throw new Error('Purity Code (PSCd) is required');
    }

    if (!PValue) {
      throw new Error('Purity Value (PValue) is required');
    }
    
    if (!PDesc) {
      throw new Error('Description (PDesc) is required');
    }
    
    // Extract old values from composite key
    const [OldPMCd, OldPSCd] = uniqueId.split('|');
    
    const modUsr = sessionStorage.getItem('modUsr') || '';
    
    const response = await fetch(`${BASE_URL}/updateData`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        operation: operation,
        PMCd: PMCd,
        PSCd: PSCd,
        PValue: PValue,
        PDesc: PDesc,
        OldPMCd: OldPMCd,
        OldPSCd: OldPSCd,
        modUsr: modUsr 
      })
    });
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update Metal Purity');
    }
    
    return result.data;
  }

  async function addNewRow(tableBody, showMessage, BASE_URL, operation) {
    const existingNewRow = document.querySelector('tr[data-is-new="true"]');
    if (existingNewRow) {
      showMessage('Please save or cancel the current new row first', 'error');
      return;
    }

    // Load PMCd dropdown list if not already loaded
    try {
      if (!pmcdListCache) {
        await loadPMCdList(BASE_URL, operation);
      }
    } catch (error) {
      showMessage('Failed to load dropdown list: ' + error.message, 'error');
      return;
    }

    const visibleColumns = COLUMNS.filter(col => !col.hidden);
    
    const cells = visibleColumns.map(col => {
      const widthStyle = col.width ? `style="min-width: ${col.width};"` : '';
      
      if (col.editable && col.type === 'dropdown') {
        const options = pmcdListCache.map(item => 
          `<option value="${item.PMCd}">${item.PMCd}</option>`
        ).join('');

        return `<td ${widthStyle}>
                  <select class="edit-field" data-field="${col.key}" 
                    style="width: 100%; background-color: white;">
                    <option value="">--Select Metal--</option>
                    ${options}
                  </select>
                </td>`;
      } else if (col.editable && col.type === 'text') {
        const maxlength = col.maxlength ? `maxlength="${col.maxlength}"` : '';
        return `<td ${widthStyle}>
                  <input type="text" class="edit-field" data-field="${col.key}" 
                    ${maxlength} style="width: 100%; background-color: white;">
                </td>`;
      } else if (!col.editable) {
        // For non-editable fields like PValue3, show empty (will be auto-generated)
        return `<td ${widthStyle} style="color: #64748b; font-style: italic;">Auto</td>`;
      }
      return `<td ${widthStyle}></td>`;
    }).join('');
    
    const newRow = `<tr data-is-new="true" style="background-color: #e8e6dfff;">${cells}
      <td class="action-cell">
        <button class="action-btn save-btn" onclick="ConfigManager.saveNewRow()" title="Save">💾</button>
        <button class="action-btn cancel-btn" onclick="ConfigManager.cancelNewRow()" title="Cancel">❌</button>
      </td></tr>`;
    
    tableBody.insertAdjacentHTML('afterbegin', newRow);
    
    const firstInput = tableBody.querySelector('tr[data-is-new="true"] .edit-field');
    if (firstInput) {
      firstInput.focus();
    }
  }

  async function saveNewRow(row, BASE_URL, operation) {
    const pmcdSelect = row.querySelector('select[data-field="PMCd"]');
    const pscdInput = row.querySelector('input[data-field="PSCd"]');
    const pvalueInput = row.querySelector('input[data-field="PValue"]');
    const pdescInput = row.querySelector('input[data-field="PDesc"]');
    
    const PMCd = pmcdSelect ? pmcdSelect.value.trim() : '';
    const PSCd = pscdInput ? pscdInput.value.trim() : '';
    const PValue = pvalueInput ? pvalueInput.value.trim() : '';
    const PDesc = pdescInput ? pdescInput.value.trim() : '';
    
    if (!PMCd) {
      throw new Error('Please select Metal Code (PMCd)');
    }
    
    if (!PSCd) {
      throw new Error('Purity Code (PSCd) is required');
    }

    if (!PValue) {
      throw new Error('Purity Value (PValue) is required');
    }
    
    if (!PDesc) {
      throw new Error('Description (PDesc) is required');
    }
    
    const modUsr = sessionStorage.getItem('modUsr') || '';
    
    const response = await fetch(`${BASE_URL}/addData`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        operation: operation,
        PMCd: PMCd,
        PSCd: PSCd,
        PValue: PValue,
        PDesc: PDesc,
        modUsr: modUsr 
      })
    });
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to add Metal Purity');
    }
    
    return result.data;
  }

  async function deleteRow(uniqueId, BASE_URL, operation) {

    
    // Extract PMCd and PSCd from composite key
    const [PMCd, PSCd] = uniqueId.split('|');
    
    const modUsr = sessionStorage.getItem('modUsr') || '';
    
    const response = await fetch(`${BASE_URL}/deleteData`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        operation: operation,
        PMCd: PMCd,
        PSCd: PSCd,
        modUsr: modUsr 
      })
    });
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete Metal Purity');
    }
    
    return result.data;
  }

  return {
    getColumns,
    generateRowId,
    loadData,
    saveRow,
    addNewRow,
    saveNewRow,
    deleteRow,
    renderDisplayCell,
    createEditControl,
    supportsAdd: true,
    supportsDelete: true
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = metKtOperation;
}