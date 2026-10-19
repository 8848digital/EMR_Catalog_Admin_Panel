const yFestPrcAdjOperation = (() => {
    const COLUMNS = [
        { key: 'FpBaseCd', label: 'Base Code',             editable: true,  type: 'text',   width: '120px', maxlength: 10 },
        { key: 'FpMetal',  label: 'Metal (G/S)',            editable: true,  type: 'select', width: '110px', options: ['G', 'S'] },
        { key: 'FpAlwPct', label: 'Allow % (-1<x<1, ≠0)', editable: true,  type: 'text',   width: '200px', maxlength: 12 },
        { key: 'FpFrDt',   label: 'From Date',             editable: true,  type: 'date',   width: '140px' },
        { key: 'FpToDt',   label: 'To Date',               editable: true,  type: 'date',   width: '140px' }
    ];

    function getColumns() {
        return COLUMNS;
    }

    function generateRowId(row) {
        return row.FpIdNo;
    }

    function renderDisplayCell(col, value) {
        if (col.type === 'date') {
            if (value && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
                return value.substring(0, 10);
            }
        }
        return value || '';
    }

    function createEditControl(col, value) {
        if (col.type === 'date') {
            const input = document.createElement('input');
            input.type = 'date';
            input.className = 'edit-field';
            input.dataset.field = col.key;
            let formattedValue = '';
            if (value) {
                if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
                    formattedValue = value.substring(0, 10);
                } else {
                    const date = new Date(value);
                    if (!isNaN(date.getTime())) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        formattedValue = `${year}-${month}-${day}`;
                    } else {
                        formattedValue = value;
                    }
                }
            }
            input.value = formattedValue;
            input.dataset.originalValue = formattedValue;
            input.style.width = '100%';
            input.style.height = '30px';
            return input;
        }
        return null;
    }

    async function loadData(BASE_URL, operation) {
        const response = await fetch(`${BASE_URL}/getData?operation=${operation}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to load Festival Price Adjustment data');
        return result.data || [];
    }

    async function saveRow(row, uniqueId, BASE_URL, operation) {
        const fields = {};
        row.querySelectorAll('.edit-field').forEach(el => {
            const field = el.dataset.field;
            if (field) fields[field] = el.value !== undefined ? el.value.trim() : '';
        });

        const modUsr = sessionStorage.getItem('modUsr') || 'ADM';

        const response = await fetch(`${BASE_URL}/updateData`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation,
                FpIdNo:   uniqueId,
                FpBaseCd: fields.FpBaseCd,
                FpMetal:  fields.FpMetal,
                FpAlwPct: fields.FpAlwPct,
                FpFrDt:   fields.FpFrDt,
                FpToDt:   fields.FpToDt,
                modUsr
            })
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to update Festival Price Adjustment');
        return result.data;
    }

    async function addNewRow(tableBody, showMessage, BASE_URL, operation) {
        const existingNewRow = document.querySelector('tr[data-is-new="true"]');
        if (existingNewRow) {
            showMessage('Please save or cancel the current new row first', 'error');
            return;
        }

        const today = new Date().toISOString().split('T')[0];

        const newRow = `<tr data-is-new="true" style="background-color: #f0f7ff;">
            <td style="min-width: 120px;">
                <input type="text" class="edit-field" data-field="FpBaseCd"
                    maxlength="10" style="width: 100%; height: 30px;" placeholder="Base Code">
            </td>
            <td style="min-width: 110px;">
                <select class="edit-field" data-field="FpMetal" style="width: 100%; height: 30px;">
                    <option value="G">G (Gold)</option>
                    <option value="S">S (Silver)</option>
                </select>
            </td>
            <td style="min-width: 200px;">
                <input type="text" class="edit-field" data-field="FpAlwPct"
                    maxlength="12" style="width: 100%; height: 30px;" placeholder="e.g. 0.05 or -0.02">
            </td>
            <td style="min-width: 140px;">
                <input type="date" class="edit-field" data-field="FpFrDt"
                    style="width: 100%; height: 30px;" value="${today}">
            </td>
            <td style="min-width: 140px;">
                <input type="date" class="edit-field" data-field="FpToDt"
                    style="width: 100%; height: 30px;" value="${today}">
            </td>
            <td class="action-cell">
                <button class="action-btn save-btn" onclick="ConfigManager.saveNewRow()" title="Save">💾</button>
                <button class="action-btn cancel-btn" onclick="ConfigManager.cancelNewRow()" title="Cancel">❌</button>
            </td>
        </tr>`;

        tableBody.insertAdjacentHTML('afterbegin', newRow);
        const firstInput = tableBody.querySelector('tr[data-is-new="true"] input[data-field="FpBaseCd"]');
        if (firstInput) firstInput.focus();
    }

    async function saveNewRow(row, BASE_URL, operation) {
        const fields = {};
        row.querySelectorAll('.edit-field').forEach(el => {
            const field = el.dataset.field;
            if (field) fields[field] = el.value !== undefined ? el.value.trim() : '';
        });

        const modUsr = sessionStorage.getItem('modUsr') || 'ADM';

        const response = await fetch(`${BASE_URL}/addData`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation,
                FpBaseCd: fields.FpBaseCd,
                FpMetal:  fields.FpMetal,
                FpAlwPct: fields.FpAlwPct,
                FpFrDt:   fields.FpFrDt,
                FpToDt:   fields.FpToDt,
                modUsr
            })
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to add Festival Price Adjustment');
        return result.data;
    }

    async function deleteRow(uniqueId, BASE_URL, operation) {
        const response = await fetch(`${BASE_URL}/deleteData`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation,
                FpIdNo: uniqueId
            })
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to delete Festival Price Adjustment');
        return result.data;
    }

    return {
        getColumns,
        generateRowId,
        renderDisplayCell,
        createEditControl,
        loadData,
        saveRow,
        addNewRow,
        saveNewRow,
        deleteRow,
        supportsAdd: true,
        supportsDelete: true,
        supportsEdit: true
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = yFestPrcAdjOperation;
}
