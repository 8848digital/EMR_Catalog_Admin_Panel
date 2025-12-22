const roleOperation = (() => {
  const COLUMNS = [
    { key: 'PTyp', label: 'Type', hidden: true },
    { key: 'PMCd', label: 'User Code', editable: true, type: 'dropdown', width: '200px' },
    { key: 'PSCd', label: 'Role Code', editable: true, type: 'dropdown', width: '200px' }, // Changed from text to dropdown
    { key: 'PNum', label: 'Active', editable: true, type: 'dropdown', width: '100px' }
  ];

  let pmcdListCache = null;
  let pscdListCache = null; // NEW: Cache for PSCd (Role Code) dropdown

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
        throw new Error(result.error || 'Failed to load user list');
      }
      
      pmcdListCache = result.data || [];
      console.log('Loaded User list (PMCd):', pmcdListCache);
      return pmcdListCache;
    } catch (error) {
      console.error('Error loading PMCd list:', error);
      throw error;
    }
  }

  // NEW: Load PSCd (Role Code) dropdown list
  async function loadPSCdList(BASE_URL, operation) {
    if (pscdListCache) {
      return pscdListCache;
    }

    try {
      const response = await fetch(`${BASE_URL}/pscdList?operation=${operation}`);
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response for PSCd list');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load role code list');
      }
      
      pscdListCache = result.data || [];
      console.log('Loaded Role Code list (PSCd):', pscdListCache);
      return pscdListCache;
    } catch (error) {
      console.error('Error loading PSCd list:', error);
      throw error;
    }
  }

  async function loadData(BASE_URL, operation) {
    // Load both PMCd and PSCd dropdown lists first
    await loadPMCdList(BASE_URL, operation);
    await loadPSCdList(BASE_URL, operation);

    const response = await fetch(`${BASE_URL}/getData?operation=${operation}`);
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to load role data');
    }
    
    return result.data || [];
  }

  // This function is called during table rendering to show plain text
  function renderDisplayCell(col, value, row) {
    if (col.type === 'dropdown') {
      if (col.key === 'PNum') {
        // Display True/False for PNum
        return value == 1 ? 'True' : 'False';
      }
      // For PMCd and PSCd, show just the value as plain text when not editing
      return value;
    }
    return null;
  }

  // This function creates the edit control when editing mode is activated
  function createEditControl(col, value, row) {
    if (col.type === 'dropdown') {
      if (col.key === 'PMCd') {
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
        defaultOption.textContent = '--Select User--';
        select.appendChild(defaultOption);
        
        // Add all options with proper pre-selection
        dataList.forEach(item => {
          const option = document.createElement('option');
          const itemValue = item.PMCd;
          option.value = itemValue;
          option.textContent = itemValue;
          
          if (itemValue === value || itemValue?.trim() === value?.trim()) {
            option.selected = true;
          }
          
          select.appendChild(option);
        });
        
        return select;
      } else if (col.key === 'PSCd') {
        // NEW: Create dropdown for PSCd (Role Code)
        const dataList = pscdListCache;
        
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
        defaultOption.textContent = '--Select Role--';
        select.appendChild(defaultOption);
        
        // Add all options with proper pre-selection
        dataList.forEach(item => {
          const option = document.createElement('option');
          const itemValue = item.vPMCd; // The query returns vPMCd column
          option.value = itemValue;
          option.textContent = itemValue;
          
          if (itemValue === value || itemValue?.trim() === value?.trim()) {
            option.selected = true;
          }
          
          select.appendChild(option);
        });
        
        return select;
      } else if (col.key === 'PNum') {
        // Create True/False dropdown for PNum
        const select = document.createElement('select');
        select.className = 'edit-field';
        select.dataset.field = col.key;
        select.dataset.originalValue = value;
        select.style.width = '100%';
        
        const trueOption = document.createElement('option');
        trueOption.value = '1';
        trueOption.textContent = 'True';
        if (value == 1) trueOption.selected = true;
        
        const falseOption = document.createElement('option');
        falseOption.value = '0';
        falseOption.textContent = 'False';
        if (value == 0 || !value) falseOption.selected = true;
        
        select.appendChild(trueOption);
        select.appendChild(falseOption);
        
        return select;
      }
    }
    return null;
  }

  async function saveRow(row, uniqueId, BASE_URL, operation, originalValues) {
    // Use more flexible selectors to find fields
    const pmcdField = row.querySelector('select[data-field="PMCd"]') || 
                      row.querySelector('input[data-field="PMCd"]') || 
                      row.querySelector('[data-field="PMCd"]');
    const pscdField = row.querySelector('select[data-field="PSCd"]') || 
                      row.querySelector('input[data-field="PSCd"]') || 
                      row.querySelector('[data-field="PSCd"]');
    const pnumField = row.querySelector('select[data-field="PNum"]') || 
                      row.querySelector('[data-field="PNum"]');
    
    // Extract values with proper null/undefined checking
    let PMCd = '';
    let PSCd = '';
    let PNum = '0';
    
    if (pmcdField) {
      PMCd = (pmcdField.value !== undefined) ? pmcdField.value.trim() : 
             (pmcdField.dataset?.value || pmcdField.textContent || '').trim();
    }
    
    if (pscdField) {
      PSCd = (pscdField.value !== undefined) ? pscdField.value.trim() : 
             (pscdField.dataset?.value || pscdField.textContent || '').trim();
    }
    
    if (pnumField) {
      PNum = (pnumField.value !== undefined) ? pnumField.value : 
             (pnumField.dataset?.value || pnumField.textContent || '0');
    }
    
    // Validate
    if (!PMCd) {
      throw new Error('User Code (PMCd) is required');
    }
    
    if (!PSCd) {
      throw new Error('Role Code (PSCd) is required');
    }
    
    if (PNum === undefined || PNum === null || PNum === '') {
      throw new Error('Active Status (PNum) is required');
    }
    
    // Extract old values from composite key
    const [OldPMCd, OldPSCd] = uniqueId.split('|');
    
    const modUsr = sessionStorage.getItem('modUsr') || '';
    
    console.log('Saving row:', { PMCd, PSCd, PNum, OldPMCd, OldPSCd });
    
    const response = await fetch(`${BASE_URL}/updateData`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        operation: operation,
        PMCd: PMCd,
        PSCd: PSCd,
        PNum: PNum,
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
      throw new Error(result.error || 'Failed to update role');
    }
    
    return result.data;
  }

  async function addNewRow(tableBody, showMessage, BASE_URL, operation) {
    const existingNewRow = document.querySelector('tr[data-is-new="true"]');
    if (existingNewRow) {
      showMessage('Please save or cancel the current new row first', 'error');
      return;
    }

    // Load both dropdown lists if not already loaded
    try {
      if (!pmcdListCache) {
        await loadPMCdList(BASE_URL, operation);
      }
      if (!pscdListCache) {
        await loadPSCdList(BASE_URL, operation);
      }
    } catch (error) {
      showMessage('Failed to load dropdown list: ' + error.message, 'error');
      return;
    }

    const visibleColumns = COLUMNS.filter(col => !col.hidden);
    
    const cells = visibleColumns.map(col => {
      const widthStyle = col.width ? `style="min-width: ${col.width};"` : '';
      
      if (col.editable) {
        if (col.type === 'dropdown' && col.key === 'PMCd') {
          const options = pmcdListCache.map(item => 
            `<option value="${item.PMCd}">${item.PMCd}</option>`
          ).join('');

          return `<td ${widthStyle}>
                    <select class="edit-field" data-field="${col.key}" 
                      style="width: 100%; background-color: white;">
                      <option value="">--Select User--</option>
                      ${options}
                    </select>
                  </td>`;
        } else if (col.type === 'dropdown' && col.key === 'PSCd') {
          // NEW: Create dropdown for PSCd in add new row
          const options = pscdListCache.map(item => 
            `<option value="${item.vPMCd}">${item.vPMCd}</option>`
          ).join('');

          return `<td ${widthStyle}>
                    <select class="edit-field" data-field="${col.key}" 
                      style="width: 100%; background-color: white;">
                      <option value="">--Select Role--</option>
                      ${options}
                    </select>
                  </td>`;
        } else if (col.type === 'dropdown' && col.key === 'PNum') {
          return `<td ${widthStyle}>
                    <select class="edit-field" data-field="${col.key}" 
                      style="width: 100%; background-color: white;">
                      <option value="1">True</option>
                      <option value="0" selected>False</option>
                    </select>
                  </td>`;
        } else if (col.type === 'text') {
          const maxlength = col.maxlength ? `maxlength="${col.maxlength}"` : '';
          return `<td ${widthStyle}>
                    <input type="text" class="edit-field" data-field="${col.key}" 
                      ${maxlength} style="width: 100%; background-color: white;">
                  </td>`;
        }
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
    const pscdSelect = row.querySelector('select[data-field="PSCd"]'); // Changed from input to select
    const pnumSelect = row.querySelector('select[data-field="PNum"]');
    
    const PMCd = pmcdSelect ? pmcdSelect.value.trim() : '';
    const PSCd = pscdSelect ? pscdSelect.value.trim() : ''; // Get value from dropdown
    const PNum = pnumSelect ? pnumSelect.value : '0';
    
    if (!PMCd) {
      throw new Error('Please select User Code (PMCd)');
    }
    
    if (!PSCd) {
      throw new Error('Please select Role Code (PSCd)');
    }
    
    if (PNum === undefined || PNum === null || PNum === '') {
      throw new Error('Active Status (PNum) is required');
    }
    
    const modUsr = sessionStorage.getItem('modUsr') || '';
    
    const response = await fetch(`${BASE_URL}/addData`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        operation: operation,
        PMCd: PMCd,
        PSCd: PSCd,
        PNum: PNum,
        modUsr: modUsr 
      })
    });
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to add role');
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
      throw new Error(result.error || 'Failed to delete role');
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
  module.exports = roleOperation;
}