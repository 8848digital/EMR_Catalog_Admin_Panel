const usersOperation = (() => {
  const COLUMNS = [
    { key: 'UserName', label: 'Username', editable: true, type: 'text', width: '250px', maxlength: 50 },
    { key: 'SyncStock', label: 'Sync Stock', editable: true, type: 'dropdown', width: '120px' },
    { key: 'Verticals', label: 'Verticals', editable: true, type: 'dropdown', width: '300px' }
  ];

  let verticalsListCache = null;

  function getColumns() {
    return COLUMNS;
  }

  function generateRowId(row) {
    return row.UserName;
  }

  async function loadVerticalsList(BASE_URL, operation) {
    if (verticalsListCache) {
      return verticalsListCache;
    }

    try {
      const response = await fetch(`${BASE_URL}/pmcdList?operation=${operation}`);

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response for Verticals list');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load Verticals list');
      }

      verticalsListCache = result.data || [];
      return verticalsListCache;
    } catch (error) {
      console.error('Error loading Verticals list:', error);
      throw error;
    }
  }

  async function loadData(BASE_URL, operation) {
    await loadVerticalsList(BASE_URL, operation);

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

  // Display cell when NOT editing
  function renderDisplayCell(col, value, row) {
    if (col.key === 'SyncStock') {
      const checked = value === true || value === 1 || value === '1' || value === 'true';
      return checked ? 'true' : 'false';
    }
    if (col.type === 'dropdown') {
      return value || '';
    }
    return null;
  }

  // Build a <select> for Verticals — shows "PSCd - PDesc", saves only PSCd
  function buildVerticalsSelect(value) {
    const dataList = verticalsListCache;

    if (!dataList || dataList.length === 0) {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'edit-field';
      input.dataset.field = 'Verticals';
      input.value = value || '';
      input.dataset.originalValue = value || '';
      return input;
    }

    const select = document.createElement('select');
    select.className = 'edit-field';
    select.dataset.field = 'Verticals';
    select.dataset.originalValue = value || '';
    select.style.width = '100%';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '--Select Vertical--';
    select.appendChild(defaultOption);

    dataList.forEach(item => {
      const option = document.createElement('option');
      const pscd = (item.PSCd || '').trim();
      const pdesc = (item.PDesc || '').trim();
      option.value = pscd;                                         // save only PSCd
      option.textContent = pdesc ? `${pscd} - ${pdesc}` : pscd;   // display PSCd - PDesc

      if (pscd === (value || '').trim()) {
        option.selected = true;
      }

      select.appendChild(option);
    });

    return select;
  }

  // Create edit controls per column type
  function createEditControl(col, value, row) {
    if (col.key === 'SyncStock') {
      const checked = value === true || value === 1 || value === '1' || value === 'true';
      const select = document.createElement('select');
      select.className = 'edit-field';
      select.dataset.field = col.key;
      select.dataset.originalValue = checked ? '1' : '0';
      select.style.width = '100%';
      ['true', 'false'].forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        if ((opt === 'true') === checked) option.selected = true;
        select.appendChild(option);
      });
      return select;
    }

    if (col.type === 'dropdown' && col.key === 'Verticals') {
      return buildVerticalsSelect(value);
    }

    return null;
  }

  async function saveRow(row, uniqueId, BASE_URL, operation) {
    const userNameField = row.querySelector('input[data-field="UserName"]');
    const syncStockField = row.querySelector('select[data-field="SyncStock"]');
    let verticalsField = row.querySelector('select[data-field="Verticals"]');
    if (!verticalsField) {
      verticalsField = row.querySelector('input[data-field="Verticals"]');
    }

    const UserName = userNameField ? userNameField.value.trim() : '';
    const SyncStock = syncStockField ? (syncStockField.value === 'true' ? 1 : 0) : 0;
    const Verticals = verticalsField ? (verticalsField.value || '').trim() : '';

    if (!UserName) {
      throw new Error('UserName is required');
    }

    const modUsr = sessionStorage.getItem('modUsr') || '';

    const response = await fetch(`${BASE_URL}/updateData`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: operation,
        UserName: UserName,
        SyncStock: SyncStock,
        Verticals: Verticals || null,
        OldUserName: uniqueId,
        modUsr: modUsr
      })
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

    try {
      if (!verticalsListCache) {
        await loadVerticalsList(BASE_URL, operation);
      }
    } catch (error) {
      showMessage('Failed to load dropdown list: ' + error.message, 'error');
      return;
    }

    // Build options HTML: value=PSCd, label="PSCd - PDesc"
    const verticalOptions = (verticalsListCache || []).map(item => {
      const pscd = (item.PSCd || '').trim();
      const pdesc = (item.PDesc || '').trim();
      const label = pdesc ? `${pscd} - ${pdesc}` : pscd;
      return `<option value="${pscd}">${label}</option>`;
    }).join('');

    const newRow = `<tr data-is-new="true" style="background-color: #e8e6dfff;">
      <td style="min-width: 250px;">
        <input type="text" class="edit-field" data-field="UserName"
          maxlength="50" style="width: 100%; background-color: white;" placeholder="Username">
      </td>
      <td style="min-width: 120px;">
        <select class="edit-field" data-field="SyncStock" style="width: 100%; background-color: white;">
          <option value="false">false</option>
          <option value="true">true</option>
        </select>
      </td>
      <td style="min-width: 300px;">
        <select class="edit-field" data-field="Verticals"
          style="width: 100%; background-color: white;">
          <option value="">--Select Vertical--</option>
          ${verticalOptions}
        </select>
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
    const userNameInput = row.querySelector('input[data-field="UserName"]');
    const syncStockInput = row.querySelector('select[data-field="SyncStock"]');
    const verticalsSelect = row.querySelector('select[data-field="Verticals"]');

    const UserName = userNameInput ? userNameInput.value.trim() : '';
    const SyncStock = syncStockInput ? (syncStockInput.value === 'true' ? 1 : 0) : 0;
    const Verticals = verticalsSelect ? (verticalsSelect.value || '').trim() : '';

    if (!UserName) {
      throw new Error('UserName is required');
    }

    const modUsr = sessionStorage.getItem('modUsr') || '';

    const response = await fetch(`${BASE_URL}/addData`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: operation,
        UserName: UserName,
        SyncStock: SyncStock,
        Verticals: Verticals || null,
        modUsr: modUsr
      })
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
    renderDisplayCell,
    createEditControl,
    supportsAdd: true,
    supportsDelete: true
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = usersOperation;
}