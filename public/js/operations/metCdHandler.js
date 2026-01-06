const metCdOperation = (() => {
  const COLUMNS = [
    { key: 'PTyp', label: 'Type', hidden: true },
    { key: 'PMCd', label: 'Metal Code', editable: true, type: 'text', width: '150px', maxlength: 30 },
    { key: 'PDesc', label: 'Short Description', editable: true, type: 'text', width: '200px', maxlength: 30 },
    { key: 'PDesc225', label: 'Description', editable: true, type: 'text', width: '300px', maxlength: 225 },
    { key: 'PValue3', label: 'Sequence', editable: false, type: 'text', width: '100px' }
  ];

  function getColumns() {
    return COLUMNS;
  }

  // Generate unique ID using PMCd
  function generateRowId(row) {
    return row.PMCd;
  }

  async function loadData(BASE_URL, operation) {
    const response = await fetch(`${BASE_URL}/getData?operation=${operation}`);
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to load Metal Code data');
    }
    
    return result.data || [];
  }

  async function saveRow(row, uniqueId, BASE_URL, operation) {
    const pmcdField = row.querySelector('[data-field="PMCd"]');
    const pdescField = row.querySelector('[data-field="PDesc"]');
    const pdesc225Field = row.querySelector('[data-field="PDesc225"]');
    
    const PMCd = pmcdField ? pmcdField.value.trim() : '';
    const PDesc = pdescField ? pdescField.value.trim() : '';
    const PDesc225 = pdesc225Field ? pdesc225Field.value.trim() : '';
    
    // Validate
    if (!PMCd) {
      throw new Error('Metal Code (PMCd) is required');
    }
    
    if (!PDesc) {
      throw new Error('Short Description (PDesc) is required');
    }
    
    if (!PDesc225) {
      throw new Error('Description (PDesc225) is required');
    }
    
    const modUsr = sessionStorage.getItem('modUsr') || '';
    
    const response = await fetch(`${BASE_URL}/updateData`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        operation: operation,
        PMCd: PMCd,
        PDesc: PDesc,
        PDesc225: PDesc225,
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
      throw new Error(result.error || 'Failed to update Metal Code');
    }
    
    return result.data;
  }

  async function addNewRow(tableBody, showMessage, BASE_URL, operation) {
    const existingNewRow = document.querySelector('tr[data-is-new="true"]');
    if (existingNewRow) {
      showMessage('Please save or cancel the current new row first', 'error');
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
    const pmcdInput = row.querySelector('input[data-field="PMCd"]');
    const pdescInput = row.querySelector('input[data-field="PDesc"]');
    const pdesc225Input = row.querySelector('input[data-field="PDesc225"]');
    
    const PMCd = pmcdInput ? pmcdInput.value.trim() : '';
    const PDesc = pdescInput ? pdescInput.value.trim() : '';
    const PDesc225 = pdesc225Input ? pdesc225Input.value.trim() : '';
    
    if (!PMCd) {
      throw new Error('Metal Code (PMCd) is required');
    }
    
    if (!PDesc) {
      throw new Error('Short Description (PDesc) is required');
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
        PDesc: PDesc,
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
      throw new Error(result.error || 'Failed to add Metal Code');
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
      throw new Error(result.error || 'Failed to delete Metal Code');
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
    supportsAdd: true,
    supportsDelete: true
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = metCdOperation;
}