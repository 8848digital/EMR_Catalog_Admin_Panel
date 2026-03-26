const usersOperation = (() => {
  const COLUMNS = [
    { key: 'UserName', label: 'Username', editable: false, type: 'text', width: '200px', maxlength: 50 },
    { key: 'EmrMapUser', label: 'Emr Map User', editable: false, type: 'text', width: '200px', maxlength: 50 },
    { key: 'UserAbbreviation', label: 'User Abbreviation', editable: false, type: 'text', width: '150px' },
    { key: 'location', label: 'Location', editable: true, type: 'text', width: '150px', maxlength: 15 },
    { key: 'CoCd', label: 'CoCd', editable: true, type: 'text', width: '100px', maxlength: 5 },
    { key: 'MaxItemDiscPer', label: 'Max Item Disc %', editable: true, type: 'text', width: '150px', maxlength: 10 },
    { key: 'MaxSalesDiscPer', label: 'Max Sales Disc %', editable: true, type: 'text', width: '150px', maxlength: 10 }
  ];

  function getColumns() {
    return COLUMNS;
  }

  function generateRowId(row) {
    return row.UserName;
  }

  async function loadData(BASE_URL, operation) {
    const response = await fetch(`${BASE_URL}/getData?operation=${operation}`);

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to load Users data');
    }

    return result.data || [];
  }

  async function saveRow(row, uniqueId, BASE_URL, operation) {
    const fields = ['UserName', 'EmrMapUser', 'location', 'CoCd', 'MaxItemDiscPer', 'MaxSalesDiscPer'];
    const data = { operation: operation, OldUserName: uniqueId };

    fields.forEach(field => {
      const input = row.querySelector(`[data-field="${field}"]`);
      if (input) {
        data[field] = input.value.trim();
      } else {
        // For non-editable cells, get value from table cell text or original-value
        const cell = row.querySelector(`td[data-field="${field}"]`);
        if (cell) {
          data[field] = (cell.dataset.originalValue || cell.textContent).trim();
        }
      }
    });

    if (!data.UserName) {
      throw new Error('UserName is required');
    }

    const modUsr = sessionStorage.getItem('modUsr') || '';
    data.modUsr = modUsr;

    const response = await fetch(`${BASE_URL}/updateData`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to update User');
    }

    return result.data;
  }

  async function addNewRow(tableBody, showMessage, BASE_URL, operation) {
    const existingNewRow = document.querySelector('tr[data-is-new="true"]');
    if (existingNewRow) {
      showMessage('Please save or cancel the current new row first', 'error');
      return;
    }

    const newRow = `<tr data-is-new="true" style="background-color: #e8e6dfff;">
      <td style="min-width: 200px;">
        <input type="text" class="edit-field" data-field="UserName"
          maxlength="50" style="width: 100%; background-color: white;" placeholder="Username">
      </td>
      <td style="min-width: 200px;">
        <input type="text" class="edit-field" data-field="EmrMapUser"
          maxlength="50" style="width: 100%; background-color: white;" placeholder="Emr Map User">
      </td>
      <td style="min-width: 150px;">
        <span style="color: grey;">(DB Generated)</span>
      </td>
      <td style="min-width: 150px;">
        <input type="text" class="edit-field" data-field="location"
          maxlength="15" style="width: 100%; background-color: white;" placeholder="Location">
      </td>
      <td style="min-width: 100px;">
        <input type="text" class="edit-field" data-field="CoCd"
          maxlength="5" style="width: 100%; background-color: white;" placeholder="CoCd">
      </td>
      <td style="min-width: 150px;">
        <input type="text" class="edit-field" data-field="MaxItemDiscPer"
          maxlength="10" style="width: 100%; background-color: white;" placeholder="Max Item Disc %">
      </td>
      <td style="min-width: 150px;">
        <input type="text" class="edit-field" data-field="MaxSalesDiscPer"
          maxlength="10" style="width: 100%; background-color: white;" placeholder="Max Sales Disc %">
      </td>
      <td class="action-cell">
        <button class="action-btn save-btn" onclick="ConfigManager.saveNewRow()" title="Save">💾</button>
        <button class="action-btn cancel-btn" onclick="ConfigManager.cancelNewRow()" title="Cancel">❌</button>
      </td>
    </tr>`;

    tableBody.insertAdjacentHTML('afterbegin', newRow);

    const firstInput = tableBody.querySelector('tr[data-is-new="true"] input[data-field="UserName"]');
    if (firstInput) firstInput.focus();
  }

  async function saveNewRow(row, BASE_URL, operation) {
    const fields = ['UserName', 'EmrMapUser', 'location', 'CoCd', 'MaxItemDiscPer', 'MaxSalesDiscPer'];
    const data = { operation: operation };

    fields.forEach(field => {
      const input = row.querySelector(`[data-field="${field}"]`);
      if (input) {
        data[field] = input.value.trim();
      }
    });

    if (!data.UserName) {
      throw new Error('UserName is required');
    }

    const modUsr = sessionStorage.getItem('modUsr') || '';
    data.modUsr = modUsr;

    const response = await fetch(`${BASE_URL}/addData`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to add User');
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
        UserName: uniqueId,
        modUsr: modUsr
      })
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete User');
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
  module.exports = usersOperation;
}