const ctgFilterOperation = (() => {
  const COLUMNS = [
    { key: 'PTyp', label: 'Type', editable: false, type: 'text', width: '100px', hidden: true },
    { key: 'PMCd', label: 'Category', editable: false, type: 'text', width: '150px', hidden: true },
    { key: 'PSCd', label: 'Filter Code', editable: true, type: 'text', width: '150px', maxlength: 30 },
    { key: 'PDesc', label: 'Description', editable: true, type: 'text', width: '200px', maxlength: 30 },
    
  ];

  let pmcdListCache = null;
  let currentPMCd = null;

  function getColumns() {
    return COLUMNS;
  }

  // Generate unique ID using PMCd + PValue3
  function generateRowId(row) {
    return `${row.PMCd}_${row.PValue3}`;
  }

  // Clear PMCd cache to force refresh
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
        throw new Error('Server returned non-JSON response for PMCd list');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load category list');
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
      throw new Error('Please select a Category (PMCd) first');
    }

    currentPMCd = selectedPMCd;

    const response = await fetch(`${BASE_URL}/getData?operation=${operation}&PMCd=${encodeURIComponent(selectedPMCd)}`);
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to load category filter data');
    }
    
    return result.data || [];
  }

  // Render display cell (not needed for text fields)
  function renderDisplayCell(col, value, row) {
    return null;
  }

  // Create edit control (not needed - all are text/number inputs)
  function createEditControl(col, value, row) {
    return null;
  }

  async function saveRow(row, uniqueId, BASE_URL, operation, originalValues) {
    // Parse uniqueId to get PMCd and PValue3
    const parts = uniqueId.split('_');
    const oldPMCd = parts[0];
    const oldPValue3 = parts.slice(1).join('_'); // Handle cases where PValue3 might contain underscores

    // Get all field values
    const fields = ['PSCd', 'PDesc', 'PDesc225', 'PValue', 'PNum', 'PValue1', 'PNum1', 'PValue2', 'PValidYn', 'PPrtKey'];
    const data = {};

    fields.forEach(field => {
      const element = row.querySelector(`input[data-field="${field}"]`) || 
                     row.querySelector(`td[data-field="${field}"]`);
      
      if (element) {
        if (element.tagName === 'INPUT') {
          data[field] = element.value.trim();
        } else if (element.tagName === 'TD') {
          data[field] = element.textContent.trim();
        }
      }
    });

    // Validate required fields
    if (!data.PSCd) {
      throw new Error('Filter Code (PSCd) is required');
    }
    
    if (!data.PDesc) {
      throw new Error('Description (PDesc) is required');
    }

    if (!oldPValue3) {
      throw new Error('PValue3 is required for update');
    }
    
    const modUsr = sessionStorage.getItem('modUsr') || '';
    
    const requestBody = {
      operation: operation,
      PMCd: currentPMCd,
      PSCd: data.PSCd,
      PDesc: data.PDesc,
      PDesc225: data.PDesc225 || '',
      PValue: data.PValue || '',
      PNum: data.PNum || '0',
      PValue1: data.PValue1 || '',
      PNum1: data.PNum1 || '0',
      PValue2: data.PValue2 || '',
      PValidYn: data.PValidYn || '',
      PPrtKey: data.PPrtKey || 'C',
      PValue3: oldPValue3,  // Add PValue3 field
      OldPValue3: oldPValue3,
      modUsr: modUsr
    };
  
    const response = await fetch(`${BASE_URL}/updateData`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update category filter');
    }
    
    return result.data;
  }

  async function addNewRow(tableBody, showMessage, BASE_URL, operation) {
    const existingNewRow = document.querySelector('tr[data-is-new="true"]');
    if (existingNewRow) {
      showMessage('Please save or cancel the current new row first', 'error');
      return;
    }

    if (!currentPMCd) {
      showMessage('Please select a Category first', 'error');
      return;
    }

    const visibleColumns = COLUMNS.filter(col => !col.hidden);
    
    const cells = visibleColumns.map(col => {
      const widthStyle = col.width ? `style="min-width: ${col.width};"` : '';
      
      if (col.editable && col.type === 'text') {
        const maxlength = col.maxlength ? `maxlength="${col.maxlength}"` : '';
        return `<td ${widthStyle}>
                  <input type="text" class="edit-field" data-field="${col.key}" 
                    ${maxlength} style="width: 100%; background-color: white;">
                </td>`;
      } else if (col.editable && col.type === 'number') {
        return `<td ${widthStyle}>
                  <input type="text" class="edit-field" data-field="${col.key}" 
                    style="width: 100%; background-color: white;" value="0">
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
    
    const firstInput = tableBody.querySelector('tr[data-is-new="true"] input[data-field="PSCd"]');
    if (firstInput) {
      firstInput.focus();
    }
  }

  async function saveNewRow(row, BASE_URL, operation) {
    const fields = ['PSCd', 'PDesc', 'PDesc225', 'PValue', 'PNum', 'PValue1', 'PNum1', 'PValue2', 'PValidYn', 'PPrtKey'];
    const data = {};

    fields.forEach(field => {
      const input = row.querySelector(`input[data-field="${field}"]`);
      if (input) {
        data[field] = input.value.trim();
      }
    });

    const PMCd = currentPMCd;
    const PSCd = data.PSCd || '';
    const PDesc = data.PDesc || '';
    
    if (!PMCd) {
      throw new Error('Category (PMCd) is required');
    }
    
    if (!PSCd) {
      throw new Error('Filter Code (PSCd) is required');
    }
    
    if (!PDesc) {
      throw new Error('Description (PDesc) is required');
    }
    
    const modUsr = sessionStorage.getItem('modUsr') || '';
    
    const requestBody = {
      operation: operation,
      PMCd: PMCd,
      PSCd: PSCd,
      PDesc: PDesc,
      PDesc225: data.PDesc225 || '',
      PValue: data.PValue || '',
      PNum: data.PNum || '0',
      PValue1: data.PValue1 || '',
      PNum1: data.PNum1 || '0',
      PValue2: data.PValue2 || '',
      PValidYn: data.PValidYn || '',
      PPrtKey: data.PPrtKey || 'C',
      modUsr: modUsr
    };

    const response = await fetch(`${BASE_URL}/addData`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to add category filter');
    }
    
    return result.data;
  }

  async function deleteRow(uniqueId, BASE_URL, operation) {
    
    // Parse uniqueId to get PMCd and PValue3
    const [PMCd, PValue3] = uniqueId.split('_');
    
    const modUsr = sessionStorage.getItem('modUsr') || '';
    
    const response = await fetch(`${BASE_URL}/deleteData`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        operation: operation,
        PMCd: PMCd,
        PValue3: PValue3,
        modUsr: modUsr 
      })
    });
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete category filter');
    }
    
    return result.data;
  }

  // Validate numeric input
  function validateInput(input) {
    const field = input.dataset.field;
    
    if (field === 'PNum' || field === 'PNum1') {
      // Allow only numbers and decimal point
      input.value = input.value.replace(/[^0-9.]/g, '');
      
      // Prevent multiple decimal points
      const parts = input.value.split('.');
      if (parts.length > 2) {
        input.value = parts[0] + '.' + parts.slice(1).join('');
      }
    }
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
    loadPMCdList,
    clearPMCdCache,
    validateInput,
    supportsAdd: true,
    supportsDelete: true,
    requiresPMCdFilter: true,
    showAddNewCategory: false  // NEW: Disable "Add New Category" option
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ctgFilterOperation;
}