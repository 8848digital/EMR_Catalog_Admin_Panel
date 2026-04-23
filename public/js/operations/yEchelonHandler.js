const yEchelonOperation = (() => {
    const COLUMNS = [
        { key: 'EchelonName', label: 'Echelon Name', editable: true, type: 'text', width: '150px' },
        { key: 'ColumnMapping', label: 'Column Mapping', editable: true, type: 'text', width: '150px' },
        { key: 'Description', label: 'Description', editable: true, type: 'text', width: '250px' }
    ];

    function getColumns() {
        return COLUMNS;
    }

    function generateRowId(row) {
        return row.EchelonName;
    }

    async function loadData(BASE_URL, operation) {
        const response = await fetch(`${BASE_URL}/getData?operation=${operation}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to load Echelon Definition data');
        return result.data || [];
    }

    async function saveRow(row, uniqueId, BASE_URL, operation, originalValues) {
        const fields = {};
        row.querySelectorAll('.edit-field').forEach(el => {
            const field = el.dataset.field;
            if (field) fields[field] = el.value.trim();
        });

        const response = await fetch(`${BASE_URL}/updateData`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation: operation,
                OldEchelonName: originalValues.EchelonName,
                ...fields
            })
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to update Echelon Definition');
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
            if (col.editable) {
                const type = col.type || 'text';
                return `<td ${widthStyle}><input type="${type}" class="edit-field" data-field="${col.key}" style="width: 100%; height: 30px;"></td>`;
            }
            return `<td ${widthStyle}></td>`;
        }).join('');

        const newRow = `<tr data-is-new="true" style="background-color: #f0f7ff;">${cells}
            <td class="action-cell">
                <button class="action-btn save-btn" onclick="ConfigManager.saveNewRow()" title="Save">💾</button>
                <button class="action-btn cancel-btn" onclick="ConfigManager.cancelNewRow()" title="Cancel">❌</button>
            </td></tr>`;

        tableBody.insertAdjacentHTML('afterbegin', newRow);
    }

    async function saveNewRow(row, BASE_URL, operation) {
        const fields = {};
        row.querySelectorAll('.edit-field').forEach(el => {
            const field = el.dataset.field;
            if (field) fields[field] = el.value.trim();
        });

        const response = await fetch(`${BASE_URL}/addData`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation: operation,
                ...fields
            })
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to add Echelon Definition');
        return result.data;
    }

    async function deleteRow(uniqueId, BASE_URL, operation) {
        const response = await fetch(`${BASE_URL}/deleteData`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation: operation,
                EchelonName: uniqueId
            })
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to delete Echelon Definition');
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
    module.exports = yEchelonOperation;
}
