const UsrMapHandler = (() => {
  const COLUMNS = [
    { key: 'PTyp', label: 'Type', hidden: true },
    { key: 'PMCd', label: 'User Code', editable: true, type: 'dropdown', width: '200px' },
    { key: 'PSCd', label: 'Customer Code', editable: true, type: 'dropdown', width: '200px' }
  ];

  let pmcdListCache = null;
  let pscdListCache = null;

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
      return pmcdListCache;
    } catch (error) {
      console.error('Error loading PMCd list:', error);
      throw error;
    }
  }

  async function loadpscdList(BASE_URL, operation) {
    if (pscdListCache) {
      return pscdListCache;
    }

    try {
      const response = await fetch(`${BASE_URL}/pscdList?operation=${operation}`);
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response for Customer list');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load customer list');
      }
      
      pscdListCache = result.data || [];
      return pscdListCache;
    } catch (error) {
      console.error('Error loading Customer list:', error);
      throw error;
    }
  }

  async function loadData(BASE_URL, operation) {
    // Load both dropdown lists first
    await Promise.all([
      loadPMCdList(BASE_URL, operation),
      loadpscdList(BASE_URL, operation)
    ]);

    const response = await fetch(`${BASE_URL}/getData?operation=${operation}`);
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to load user mapping data');
    }
    
    return result.data || [];
  }

  // This function is called during table rendering to show plain text
  function renderDisplayCell(col, value, row) {
    if (col.type === 'dropdown') {
      return value;
    }
    return null;
  }

  // This function properly pre-selects the current value
  function createEditControl(col, value, row) {
    if (col.type === 'dropdown') {
      let dataList;
      
      // Determine which list to use
      if (col.key === 'PMCd') {
        dataList = pmcdListCache;
        if (!dataList || dataList.length === 0) {
          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'edit-field';
          input.dataset.field = col.key;
          input.value = value;
          input.dataset.originalValue = value;
          return input;
        }
      } else if (col.key === 'PSCd') {
        dataList = pscdListCache;
        if (!dataList || dataList.length === 0) {
          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'edit-field';
          input.dataset.field = col.key;
          input.value = value;
          input.dataset.originalValue = value;
          return input;
        }
      }

      const select = document.createElement('select');
      select.className = 'edit-field';
      select.dataset.field = col.key;
      select.dataset.originalValue = value;
      select.style.width = '100%';
      
      // Add default option
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = col.key === 'PMCd' ? '--Select User--' : '--Select Customer--';
      select.appendChild(defaultOption);
      
      // Add all options with proper pre-selection
      dataList.forEach(item => {
        const option = document.createElement('option');
        // Extract correct field from data
        const itemValue = col.key === 'PMCd' ? item.PMCd : item.CmCd;
        option.value = itemValue;
        option.textContent = itemValue;
        
        // Proper comparison for selection
        if (itemValue === value || itemValue?.trim() === value?.trim()) {
          option.selected = true;
        }
        
        select.appendChild(option);
      });
      
      return select;
    }
    return null;
  }

  async function saveRow(row, uniqueId, BASE_URL, operation) {
    // Look for both select and input elements for dropdown fields
    let pmcdField = row.querySelector('select[data-field="PMCd"]');
    if (!pmcdField) {
      pmcdField = row.querySelector('input[data-field="PMCd"]');
    }
    if (!pmcdField) {
      pmcdField = row.querySelector('td[data-field="PMCd"]');
    }
    
    let pscdField = row.querySelector('select[data-field="PSCd"]');
    if (!pscdField) {
      pscdField = row.querySelector('input[data-field="PSCd"]');
    }
    if (!pscdField) {
      pscdField = row.querySelector('td[data-field="PSCd"]');
    }
    
    let PMCd = '';
    let PSCd = '';
    
    // Get value based on element type
    if (pmcdField) {
      if (pmcdField.tagName === 'SELECT' || pmcdField.tagName === 'INPUT') {
        PMCd = (pmcdField.value || '').trim();
      } else if (pmcdField.tagName === 'TD') {
        PMCd = (pmcdField.dataset.value || pmcdField.textContent || '').trim();
      }
    }
    
    if (pscdField) {
      if (pscdField.tagName === 'SELECT' || pscdField.tagName === 'INPUT') {
        PSCd = (pscdField.value || '').trim();
      } else if (pscdField.tagName === 'TD') {
        PSCd = (pscdField.dataset.value || pscdField.textContent || '').trim();
      }
    }
    
    // Validate
    if (!PMCd) {
      throw new Error('User Code (PMCd) is required');
    }
    
    if (!PSCd) {
      throw new Error('Customer Code (PSCd) is required');
    }
    
    // Extract old values from composite key - with validation
    if (!uniqueId || typeof uniqueId !== 'string' || !uniqueId.includes('|')) {
      throw new Error('Invalid row identifier');
    }
    
    const parts = uniqueId.split('|');
    if (parts.length !== 2) {
      throw new Error('Invalid row identifier format');
    }
    
    const OldPMCd = (parts[0] || '').trim();
    const OldPSCd = (parts[1] || '').trim();
    
    if (!OldPMCd || !OldPSCd) {
      throw new Error('Cannot determine original values');
    }
    
    const modUsr = sessionStorage.getItem('modUsr') || '';
    
    const response = await fetch(`${BASE_URL}/updateData`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        operation: operation,
        PMCd: PMCd,
        PSCd: PSCd,
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
      throw new Error(result.error || 'Failed to update user mapping');
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
      await Promise.all([
        pmcdListCache ? Promise.resolve() : loadPMCdList(BASE_URL, operation),
        pscdListCache ? Promise.resolve() : loadpscdList(BASE_URL, operation)
      ]);
    } catch (error) {
      showMessage('Failed to load dropdown lists: ' + error.message, 'error');
      return;
    }

    const visibleColumns = COLUMNS.filter(col => !col.hidden);
    
    const cells = visibleColumns.map(col => {
      const widthStyle = col.width ? `style="min-width: ${col.width};"` : '';
      
      if (col.editable && col.type === 'dropdown') {
        if (col.key === 'PMCd') {
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
        } else if (col.key === 'PSCd') {
          const options = pscdListCache.map(item => 
            `<option value="${item.CmCd}">${item.CmCd}</option>`
          ).join('');

          return `<td ${widthStyle}>
                    <select class="edit-field" data-field="${col.key}" 
                      style="width: 100%; background-color: white;">
                      <option value="">--Select Customer--</option>
                      ${options}
                    </select>
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
    const pscdSelect = row.querySelector('select[data-field="PSCd"]');
    
    const PMCd = pmcdSelect ? pmcdSelect.value.trim() : '';
    const PSCd = pscdSelect ? pscdSelect.value.trim() : '';
    
    if (!PMCd) {
      throw new Error('Please select User Code (PMCd)');
    }
    
    if (!PSCd) {
      throw new Error('Please select Customer Code (PSCd)');
    }
    
    const modUsr = sessionStorage.getItem('modUsr') || '';
    
    const response = await fetch(`${BASE_URL}/addData`, {
      method: 'POST',
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
      throw new Error(result.error || 'Failed to add user mapping');
    }
    
    return result.data;
  }

  async function deleteRow(uniqueId, BASE_URL, operation) {

    
    // Extract PMCd and PSCd from composite key - with validation
    if (!uniqueId || typeof uniqueId !== 'string' || !uniqueId.includes('|')) {
      throw new Error('Invalid row identifier');
    }
    
    const parts = uniqueId.split('|');
    if (parts.length !== 2) {
      throw new Error('Invalid row identifier format');
    }
    
    const PMCd = parts[0] || '';
    const PSCd = parts[1] || '';
    
    if (!PMCd || !PSCd) {
      throw new Error('Cannot determine row to delete');
    }
    
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
      throw new Error(result.error || 'Failed to delete user mapping');
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
  module.exports = UsrMapHandler;
}