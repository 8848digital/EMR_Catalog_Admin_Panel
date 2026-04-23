const yDStoreOperation = (() => {
    const COLUMNS = [
        { key: 'Code', label: 'Code', editable: true, type: 'text', width: '150px' },
        { key: 'Description', label: 'Description', editable: true, type: 'text', width: '300px' }
    ];
    function getColumns() { return COLUMNS; }
    function generateRowId(row) { return row.Code; }
    async function loadData(BASE_URL, operation) {
        const response = await fetch(`${BASE_URL}/getData?operation=${operation}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to load data');
        return result.data || [];
    }
    async function saveRow(row, uniqueId, BASE_URL, operation) {
        const fields = {};
        row.querySelectorAll('.edit-field').forEach(el => { fields[el.dataset.field] = el.value.trim(); });
        const response = await fetch(`${BASE_URL}/updateData`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operation, Code: fields.Code, Description: fields.Description, OldCode: uniqueId })
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to update');
        return result.data;
    }
    async function addNewRow(tableBody, showMessage, BASE_URL, operation) {
        if (document.querySelector('tr[data-is-new="true"]')) { showMessage('Please save or cancel the current new row first', 'error'); return; }
        const cells = COLUMNS.filter(c => !c.hidden).map(col => {
            const ws = col.width ? `style="min-width:${col.width};"` : '';
            return col.editable ? `<td ${ws}><input type="text" class="edit-field" data-field="${col.key}" style="width:100%;height:30px;"></td>` : `<td ${ws}></td>`;
        }).join('');
        tableBody.insertAdjacentHTML('afterbegin', `<tr data-is-new="true" style="background-color:#f0f7ff;">${cells}<td class="action-cell"><button class="action-btn save-btn" onclick="ConfigManager.saveNewRow()" title="Save">💾</button><button class="action-btn cancel-btn" onclick="ConfigManager.cancelNewRow()" title="Cancel">❌</button></td></tr>`);
    }
    async function saveNewRow(row, BASE_URL, operation) {
        const fields = {};
        row.querySelectorAll('.edit-field').forEach(el => { fields[el.dataset.field] = el.value.trim(); });
        const response = await fetch(`${BASE_URL}/addData`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ operation, ...fields }) });
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to add');
        return result.data;
    }
    async function deleteRow(uniqueId, BASE_URL, operation) {
        const response = await fetch(`${BASE_URL}/deleteData`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ operation, Code: uniqueId }) });
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to delete');
        return result.data;
    }
    return { getColumns, generateRowId, loadData, saveRow, addNewRow, saveNewRow, deleteRow, supportsAdd: true, supportsDelete: true };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = yDStoreOperation;
