const diaGrdOperation = (() => {
  const COLUMNS = [
    { key: 'PTyp', label: 'Type', hidden: true },
    { key: 'PMCd', label: 'Diamond Grade Code', editable: true, type: 'dropdown', width: '200px' },
    { key: 'PDesc', label: 'Description', editable: true, type: 'text', width: '400px', maxlength: 30 }
  ];

  let pmcdListCache = null;

  function getColumns() {
    return COLUMNS;
  }

  // Generate unique ID using PMCd
  function generateRowId(row) {
    return row.PMCd;
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
        throw new Error(result.error || 'Failed to load Diamond Grade code list');
      }
      
      pmcdListCache = result.data || [];
      console.log('Loaded PMCd list:', pmcdListCache);
      return pmcdListCache;
    } catch (error) {
      console.error('Error loading PMCd list:', error);
      throw error;
    }
  }

  async function loadData(BASE_URL, operation) {
    // Load dropdown list first
    await loadPMCdList(BASE_URL, operation);

    const response = await fetch(`${BASE_URL}/getData?operation=${operation}`);
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to load Diamond Grade data');
    }
    
    return result.data || [];
  }

  // Show plain text when not editing
  function renderDisplayCell(col, value, row) {
    if (col.type === 'dropdown') {
      return value;
    }
    return null;
  }

  // Create dropdown for editing
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
      defaultOption.textContent = '--Select Diamond Grade--';
      select.appendChild(defaultOption);
      
      // Add all options with proper pre-selection
      dataList.forEach(item => {
        const option = document.createElement('option');
        const itemValue = item.PSCd;
        option.value = itemValue;
        option.textContent = itemValue;
        
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
    // Look for PMCd field (dropdown)
    let pmcdField = row.querySelector('select[data-field="PMCd"]');
    if (!pmcdField) {
      pmcdField = row.querySelector('input[data-field="PMCd"]');
    }
    if (!pmcdField) {
      pmcdField = row.querySelector('td[data-field="PMCd"]');
    }

    // Look for PDesc field (text input)
    const pdescField = row.querySelector('input[data-field="PDesc"]');
    
    let PMCd = '';
    if (pmcdField) {
      if (pmcdField.tagName === 'SELECT' || pmcdField.tagName === 'INPUT') {
        PMCd = (pmcdField.value || '').trim();
      } else if (pmcdField.tagName === 'TD') {
        PMCd = (pmcdField.dataset.value || pmcdField.textContent || '').trim();
      }
    }
    
    const PDesc = pdescField ? pdescField.value.trim() : '';
    
    // Validate
    if (!PMCd) {
      throw new Error('Diamond Grade Code (PMCd) is required');
    }
    
    if (!PDesc) {
      throw new Error('Description (PDesc) is required');
    }
    
    const modUsr = sessionStorage.getItem('modUsr') || '';
    
    const response = await fetch(`${BASE_URL}/updateData`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        operation: operation,
        PMCd: PMCd,
        PDesc: PDesc,
        OldPMCd: uniqueId,
        modUsr: modUsr 
      })
    });
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update Diamond Grade');
    }
    
    return result.data;
  }

  async function addNewRow(tableBody, showMessage, BASE_URL, operation) {
    const existingNewRow = document.querySelector('tr[data-is-new="true"]');
    if (existingNewRow) {
      showMessage('Please save or cancel the current new row first', 'error');
      return;
    }

    // Load dropdown list if not already loaded
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
      
      if (col.editable && col.type === 'dropdown' && col.key === 'PMCd') {
        const options = pmcdListCache.map(item => 
          `<option value="${item.PSCd}">${item.PSCd}</option>`
        ).join('');

        return `<td ${widthStyle}>
                  <select class="edit-field" data-field="${col.key}" 
                    style="width: 100%; background-color: white;">
                    <option value="">--Select Diamond Grade--</option>
                    ${options}
                  </select>
                </td>`;
      } else if (col.editable && col.type === 'text') {
        const maxlength = col.maxlength ? `maxlength="${col.maxlength}"` : '';
        return `<td ${widthStyle}>
                  <input type="text" class="edit-field" data-field="${col.key}" 
                    ${maxlength} style="width: 100%; background-color: white;">
                </td>`;
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
    const pdescInput = row.querySelector('input[data-field="PDesc"]');
    
    const PMCd = pmcdSelect ? pmcdSelect.value.trim() : '';
    const PDesc = pdescInput ? pdescInput.value.trim() : '';
    
    if (!PMCd) {
      throw new Error('Please select Diamond Grade Code (PMCd)');
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
      throw new Error(result.error || 'Failed to add Diamond Grade');
    }
    
    return result.data;
  }

  async function deleteRow(uniqueId, BASE_URL, operation) {

    
    const modUsr = sessionStorage.getItem('modUsr') || '';
    
    const response = await fetch(`${BASE_URL}/deleteData`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        operation: operation,
        PMCd: uniqueId,
        modUsr: modUsr 
      })
    });
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete Diamond Grade');
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
  module.exports = diaGrdOperation;
}