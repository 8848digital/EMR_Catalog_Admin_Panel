const slsPrsnOperation = (() => {
  const COLUMNS = [
    { key: 'PTyp', label: 'Type', hidden: true },
    { key: 'PMCd', label: 'Sales Person Code', editable: true, type: 'dropdown', width: '200px' },
    { key: 'PSCd', label: 'Short Code', editable: true, type: 'dropdown', width: '150px' },
    { key: 'PDesc225', label: 'Description', editable: true, type: 'text', width: '300px', maxlength: 225 }
  ];

  let pmcdListCache = null;
  let pscdListCache = null;

  function getColumns() {
    return COLUMNS;
  }

  // Generate unique ID using PMCd and PSCd
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
        throw new Error(result.error || 'Failed to load sales person list');
      }
      
      pmcdListCache = result.data || [];
      console.log('Loaded Sales Person list (PMCd):', pmcdListCache);
      return pmcdListCache;
    } catch (error) {
      console.error('Error loading PMCd list:', error);
      throw error;
    }
  }

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
        throw new Error(result.error || 'Failed to load user list');
      }
      
      pscdListCache = result.data || [];
      console.log('Loaded User list (PSCd):', pscdListCache);
      return pscdListCache;
    } catch (error) {
      console.error('Error loading PSCd list:', error);
      throw error;
    }
  }

  async function loadData(BASE_URL, operation) {
    // Load both dropdown lists first
    await Promise.all([
      loadPMCdList(BASE_URL, operation),
      loadPSCdList(BASE_URL, operation)
    ]);

    const response = await fetch(`${BASE_URL}/getData?operation=${operation}`);
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to load sales person data');
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
    if (col.type === 'dropdown') {
      let dataList = null;
      
      if (col.key === 'PMCd') {
        dataList = pmcdListCache;
      } else if (col.key === 'PSCd') {
        dataList = pscdListCache;
      }
      
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
      defaultOption.textContent = col.key === 'PMCd' ? '--Select Sales Person--' : '--Select User--';
      select.appendChild(defaultOption);
      
      // Add all options with proper pre-selection
      dataList.forEach(item => {
        const option = document.createElement('option');
        const itemValue = col.key === 'PMCd' ? item.PDesc : item.PMCd;
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

  async function saveRow(row, uniqueId, BASE_URL, operation, originalValues) {
    // Use more flexible selectors to find fields
    const pmcdField = row.querySelector('select[data-field="PMCd"]') || 
                      row.querySelector('input[data-field="PMCd"]') || 
                      row.querySelector('[data-field="PMCd"]');
    const pscdField = row.querySelector('select[data-field="PSCd"]') || 
                      row.querySelector('input[data-field="PSCd"]') || 
                      row.querySelector('[data-field="PSCd"]');
    const pdesc225Field = row.querySelector('input[data-field="PDesc225"]') || 
                          row.querySelector('[data-field="PDesc225"]');
    
    // Extract values with proper null/undefined checking
    let PMCd = '';
    let PSCd = '';
    let PDesc225 = '';
    
    if (pmcdField) {
      PMCd = (pmcdField.value !== undefined) ? pmcdField.value.trim() : 
             (pmcdField.dataset?.value || pmcdField.textContent || '').trim();
    }
    
    if (pscdField) {
      PSCd = (pscdField.value !== undefined) ? pscdField.value.trim() : 
             (pscdField.dataset?.value || pscdField.textContent || '').trim();
    }
    
    if (pdesc225Field) {
      PDesc225 = (pdesc225Field.value !== undefined) ? pdesc225Field.value.trim() : 
                 (pdesc225Field.textContent || '').trim();
    }
    
    // Validate
    if (!PMCd) {
      throw new Error('Sales Person Code (PMCd) is required');
    }
    
    if (!PSCd) {
      throw new Error('Short Code (PSCd) is required');
    }
    
    if (!PDesc225) {
      throw new Error('Description (PDesc225) is required');
    }
    
    const modUsr = sessionStorage.getItem('modUsr') || '';
    
    // Split uniqueId to get both old values
    const [OldPMCd, OldPSCd] = uniqueId.split('|');
    
    console.log('Saving row:', { PMCd, PSCd, PDesc225, OldPMCd, OldPSCd });
    
    const response = await fetch(`${BASE_URL}/updateData`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        operation: operation,
        PMCd: PMCd,
        PSCd: PSCd,
        PDesc225: PDesc225,
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
      throw new Error(result.error || 'Failed to update sales person');
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
      if (!pmcdListCache || !pscdListCache) {
        await Promise.all([
          loadPMCdList(BASE_URL, operation),
          loadPSCdList(BASE_URL, operation)
        ]);
      }
    } catch (error) {
      showMessage('Failed to load dropdown lists: ' + error.message, 'error');
      return;
    }

    const visibleColumns = COLUMNS.filter(col => !col.hidden);
    
    const cells = visibleColumns.map(col => {
      const widthStyle = col.width ? `style="min-width: ${col.width};"` : '';
      
      if (col.editable) {
        if (col.type === 'dropdown' && col.key === 'PMCd') {
          const options = pmcdListCache.map(item => 
            `<option value="${item.PDesc}">${item.PDesc}</option>`
          ).join('');

          return `<td ${widthStyle}>
                    <select class="edit-field" data-field="${col.key}" 
                      style="width: 100%; background-color: white;">
                      <option value="">--Select Sales Person--</option>
                      ${options}
                    </select>
                  </td>`;
        } else if (col.type === 'dropdown' && col.key === 'PSCd') {
          const options = pscdListCache.map(item => 
            `<option value="${item.PMCd}">${item.PMCd}</option>`
          ).join('');

          return `<td ${widthStyle}>
                    <select class="edit-field" data-field="${col.key}" 
                      style="width: 100%; background-color: white;">
                      <option value="">--Select User--</option>
                      ${options}
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
    const pscdSelect = row.querySelector('select[data-field="PSCd"]');
    const pdesc225Input = row.querySelector('input[data-field="PDesc225"]');
    
    const PMCd = pmcdSelect ? pmcdSelect.value.trim() : '';
    const PSCd = pscdSelect ? pscdSelect.value.trim() : '';
    const PDesc225 = pdesc225Input ? pdesc225Input.value.trim() : '';
    
    if (!PMCd) {
      throw new Error('Please select Sales Person Code (PMCd)');
    }
    
    if (!PSCd) {
      throw new Error('Please select Short Code (PSCd)');
    }
    
    if (!PDesc225) {
      throw new Error('Description (PDesc225) is required');
    }
    
    const modUsr = sessionStorage.getItem('modUsr') || '';
    
    const response = await fetch(`${BASE_URL}/addData`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        operation: operation,
        PMCd: PMCd,
        PSCd: PSCd,
        PDesc225: PDesc225,
        modUsr: modUsr 
      })
    });
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to add sales person');
    }
    
    return result.data;
  }

  async function deleteRow(uniqueId, BASE_URL, operation) {

    
    const modUsr = sessionStorage.getItem('modUsr') || '';
    
    // Extract PMCd from uniqueId
    const [PMCd] = uniqueId.split('|');
    
    const response = await fetch(`${BASE_URL}/deleteData`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        operation: operation,
        PMCd: PMCd,
        modUsr: modUsr 
      })
    });
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete sales person');
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
  module.exports = slsPrsnOperation;
}