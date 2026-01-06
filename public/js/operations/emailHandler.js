const EmailHandler = (() => {
  const COLUMNS = [
    { key: 'PTyp', label: 'Type', hidden: true },
    { key: 'PMCd', label: 'Code', hidden: true },
    { key: 'PDesc', label: 'Mail To/CC', width: '120px' },
    { key: 'PDesc225', label: 'Email ID', editable: true, type: 'text', width: '300px' }
  ];

  function getColumns() {
    return COLUMNS;
  }

  function generateRowId(row) {
    return `${row.PDesc}|${row.PDesc225}`;
  }

  async function loadData(BASE_URL, operation) {
    const response = await fetch(`${BASE_URL}/getData?operation=${operation}`);
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to load email data');
    }
    
    return result.data || [];
  }

  async function saveRow(row, uniqueId, BASE_URL, operation) {
    const pDesc225Input = row.querySelector('input[data-field="PDesc225"]');
    const pDesc225 = pDesc225Input.value.trim();
    
    if (!pDesc225) {
      throw new Error('Email ID is required');
    }
    
    const [PDesc, OldPDesc225] = uniqueId.split('|');
    const modUsr = sessionStorage.getItem('modUsr') || '';
    
    const response = await fetch(`${BASE_URL}/updateData`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        operation: operation,
        PDesc,
        PDesc225: pDesc225,
        OldPDesc225: OldPDesc225,
        modUsr: modUsr 
      })
    });
       
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      throw new Error('Server returned non-JSON response. Please check API endpoint');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update email configuration');
    }
    
    return result.data;
  }

  async function addNewRow(tableBody, showMessage) {
    const existingNewRow = document.querySelector('tr[data-is-new="true"]');
    if (existingNewRow) {
      showMessage('Please save or cancel the current new row first', 'error');
      return;
    }

    const visibleColumns = COLUMNS.filter(col => !col.hidden);
    
    const cells = visibleColumns.map(col => {
      const widthStyle = col.width ? `style="min-width: ${col.width};"` : '';
      
      if (col.key === 'PDesc') {
        return `<td ${widthStyle}>
                  <select class="edit-field" data-field="${col.key}" style="background-color:white;">
                    <option value="">--Select--</option>
                    <option value="to">to</option>
                    <option value="cc">cc</option>
                  </select>
                </td>`;
      } else if (col.key === 'PDesc225') {
        return `<td ${widthStyle}><input type="text" class="edit-field" 
                  data-field="${col.key}" value="" 
                  maxlength="225" style="width: 100%; background-color: white;"></td>`;
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
    const pDescSelect = row.querySelector('select[data-field="PDesc"]');
    const pDesc225Input = row.querySelector('input[data-field="PDesc225"]');
    
    const pDesc = pDescSelect.value;
    const pDesc225 = pDesc225Input.value.trim();
    
    if (!pDesc) {
      throw new Error('Please select Mail To/CC (to or cc)');
    }
    
    if (!pDesc225) {
      throw new Error('Please enter Email ID');
    }
    
    const modUsr = sessionStorage.getItem('modUsr') || '';
    
    const response = await fetch(`${BASE_URL}/addData`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        operation: operation,
        PDesc: pDesc,
        PDesc225: pDesc225,
        modUsr: modUsr 
      })
    });
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to add email configuration');
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
    supportsAdd: true
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EmailHandler;
}