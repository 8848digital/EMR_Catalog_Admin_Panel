const metColOperation = (() => {
  const COLUMNS = [
    { key: 'PTyp', label: 'Type', hidden: true },
    { key: 'PMCd', label: 'Metal Code', editable: true, type: 'dropdown', width: '150px' },
    { key: 'PSCd', label: 'Color Code', editable: true, type: 'dropdown', width: '150px' },
    { key: 'PDesc', label: 'Description', editable: true, type: 'text', width: '250px', maxlength: 30 },
    { key: 'PValue3', label: 'Sequence', editable: false, type: 'text', width: '100px' }
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
        throw new Error(result.error || 'Failed to load metal code list');
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
        throw new Error('Server returned non-JSON response for Color list');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load color list');
      }

      pscdListCache = result.data || [];
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
      loadpscdList(BASE_URL, operation)
    ]);

    const response = await fetch(`${BASE_URL}/getData?operation=${operation}`);

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to load Metal Color data');
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
      defaultOption.textContent = col.key === 'PMCd' ? '--Select Metal--' : '--Select Color--';
      select.appendChild(defaultOption);

      // Add all options with proper pre-selection
      dataList.forEach(item => {
        const option = document.createElement('option');
        // Extract correct field from data
        const itemValue = col.key === 'PMCd' ? item.PMCd : item.PSCd;
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
    const pmcdField = row.querySelector('[data-field="PMCd"]');
    const pscdField = row.querySelector('[data-field="PSCd"]');
    const pdescField = row.querySelector('[data-field="PDesc"]');

    const PMCd = pmcdField ? pmcdField.value.trim() : '';
    const PSCd = pscdField ? pscdField.value.trim() : '';
    const PDesc = pdescField ? pdescField.value.trim() : '';

    // Validate
    if (!PMCd) {
      throw new Error('Metal Code (PMCd) is required');
    }

    if (!PSCd) {
      throw new Error('Color Code (PSCd) is required');
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
      throw new Error(result.error || 'Failed to update Metal Color');
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
                      <option value="">--Select Metal--</option>
                      ${options}
                    </select>
                  </td>`;
        } else if (col.key === 'PSCd') {
          const options = pscdListCache.map(item =>
            `<option value="${item.PSCd}">${item.PSCd}</option>`
          ).join('');

          return `<td ${widthStyle}>
                    <select class="edit-field" data-field="${col.key}" 
                      style="width: 100%; background-color: white;">
                      <option value="">--Select Color--</option>
                      ${options}
                    </select>
                  </td>`;
        }
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
    const pscdSelect = row.querySelector('select[data-field="PSCd"]');
    const pdescInput = row.querySelector('input[data-field="PDesc"]');

    const PMCd = pmcdSelect ? pmcdSelect.value.trim() : '';
    const PSCd = pscdSelect ? pscdSelect.value.trim() : '';
    const PDesc = pdescInput ? pdescInput.value.trim() : '';

    if (!PMCd) {
      throw new Error('Please select Metal Code (PMCd)');
    }

    if (!PSCd) {
      throw new Error('Please select Color Code (PSCd)');
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
      throw new Error(result.error || 'Failed to add Metal Color');
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
      throw new Error(result.error || 'Failed to delete Metal Color');
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
  module.exports = metColOperation;
}