const ySalesPersonOperation = (() => {
    let cachedData = [];

    const COLUMNS = [
        { key: 'SPId', label: 'Sales Person ID', editable: true, type: 'text', width: '150px', maxlength: 30 },
        { key: 'Name', label: 'Name', editable: true, type: 'text', width: '250px', maxlength: 30 },
        { key: 'CoCd', label: 'Company Code', editable: true, type: 'text', width: '150px', maxlength: 30 }
    ];

    function getColumns() {
        return COLUMNS;
    }

    function generateRowId(row) {
        return row.SPId;
    }

    async function loadData(BASE_URL, operation) {
        const response = await fetch(`${BASE_URL}/getData?operation=${operation}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to load Sales Person data');
        cachedData = result.data || [];
        return cachedData;
    }

    async function saveRow(row, uniqueId, BASE_URL, operation, originalValues) {
        const fields = {};
        row.querySelectorAll('.edit-field').forEach(el => {
            const field = el.dataset.field;
            if (field) fields[field] = el.value.trim();
        });

        const oldSPId = (originalValues && originalValues.SPId) || uniqueId;
        const newSPId = fields.SPId;

        // Client-side uniqueness validation
        if (newSPId.toLowerCase() !== oldSPId.toLowerCase()) {
            const exists = cachedData.some(r => (r.SPId || '').trim().toLowerCase() === newSPId.toLowerCase() && (r.SPId || '').trim().toLowerCase() !== oldSPId.toLowerCase());
            if (exists) {
                throw new Error(`Sales Person ID "${newSPId}" already exists. Sales Person ID must be unique.`);
            }
        }

        const modUsr = sessionStorage.getItem('modUsr') || 'ADM';

        const response = await fetch(`${BASE_URL}/updateData`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation,
                SPId: fields.SPId,
                Name: fields.Name,
                CoCd: fields.CoCd,
                OldSPId: oldSPId,
                modUsr
            })
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to update Sales Person');
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
            const maxlength = col.maxlength ? `maxlength="${col.maxlength}"` : '';
            if (col.editable) {
                return `<td ${widthStyle}><input type="text" class="edit-field" data-field="${col.key}" ${maxlength} style="width: 100%; height: 30px;"></td>`;
            }
            return `<td ${widthStyle}></td>`;
        }).join('');

        const newRow = `<tr data-is-new="true" style="background-color: #f0f7ff;">${cells}
            <td class="action-cell">
                <button class="action-btn save-btn" onclick="ConfigManager.saveNewRow()" title="Save">💾</button>
                <button class="action-btn cancel-btn" onclick="ConfigManager.cancelNewRow()" title="Cancel">❌</button>
            </td></tr>`;

        tableBody.insertAdjacentHTML('afterbegin', newRow);
        const firstInput = tableBody.querySelector('tr[data-is-new="true"] input');
        if (firstInput) firstInput.focus();
    }

    async function saveNewRow(row, BASE_URL, operation) {
        const fields = {};
        row.querySelectorAll('.edit-field').forEach(el => {
            const field = el.dataset.field;
            if (field) fields[field] = el.value.trim();
        });

        if (!fields.SPId) throw new Error('Sales Person ID (SPId) is required');

        // Client-side uniqueness check
        const exists = cachedData.some(r => (r.SPId || '').trim().toLowerCase() === fields.SPId.toLowerCase());
        if (exists) {
            throw new Error(`Sales Person ID "${fields.SPId}" already exists. Sales Person ID must be unique.`);
        }

        const modUsr = sessionStorage.getItem('modUsr') || 'ADM';

        const response = await fetch(`${BASE_URL}/addData`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation,
                SPId: fields.SPId,
                Name: fields.Name,
                CoCd: fields.CoCd,
                modUsr
            })
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to add Sales Person');
        return result.data;
    }

    async function deleteRow(uniqueId, BASE_URL, operation) {
        const response = await fetch(`${BASE_URL}/deleteData`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation,
                SPId: uniqueId
            })
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to delete Sales Person');
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
        supportsDelete: true,
        supportsEdit: true
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ySalesPersonOperation;
}
