const yRazorpayOperation = (() => {
    const COLUMNS = [
        { key: 'machinName', label: 'Machine Name', editable: true, type: 'text', width: '160px', maxlength: 30 },
        { key: 'serialNum', label: 'Serial Number', editable: true, type: 'text', width: '160px', maxlength: 30 },
        { key: 'apiUserID', label: 'API User ID', editable: true, type: 'text', width: '160px', maxlength: 30 },
        { key: 'appKey', label: 'App Key', editable: true, type: 'text', width: '280px', maxlength: 225 },
        { key: 'Cocd', label: 'Company Code', editable: true, type: 'text', width: '130px', maxlength: 30 }
    ];

    function getColumns() {
        return COLUMNS;
    }

    function generateRowId(row) {
        return `${row.machinName}|${row.serialNum}`;
    }

    async function loadData(BASE_URL, operation) {
        const response = await fetch(`${BASE_URL}/getData?operation=${operation}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to load Razorpay data');
        return result.data || [];
    }

    async function saveRow(row, uniqueId, BASE_URL, operation, originalValues) {
        const fields = {};
        row.querySelectorAll('.edit-field').forEach(el => {
            const field = el.dataset.field;
            if (field) fields[field] = el.value.trim();
        });

        const [defaultOldMachinName, defaultOldSerialNum] = (uniqueId || '').split('|');
        const oldMachinName = (originalValues && originalValues.machinName) || defaultOldMachinName;
        const oldSerialNum = (originalValues && originalValues.serialNum) || defaultOldSerialNum;
        const modUsr = sessionStorage.getItem('modUsr') || 'ADM';

        const response = await fetch(`${BASE_URL}/updateData`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation,
                machinName: fields.machinName,
                serialNum: fields.serialNum,
                apiUserID: fields.apiUserID,
                appKey: fields.appKey,
                Cocd: fields.Cocd,
                OldMachinName: oldMachinName,
                OldSerialNum: oldSerialNum,
                modUsr
            })
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to update Razorpay configuration');
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

        const modUsr = sessionStorage.getItem('modUsr') || 'ADM';

        const response = await fetch(`${BASE_URL}/addData`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation,
                machinName: fields.machinName,
                serialNum: fields.serialNum,
                apiUserID: fields.apiUserID,
                appKey: fields.appKey,
                Cocd: fields.Cocd,
                modUsr
            })
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to add Razorpay configuration');
        return result.data;
    }

    async function deleteRow(uniqueId, BASE_URL, operation) {
        const [machinName, serialNum] = (uniqueId || '').split('|');
        const response = await fetch(`${BASE_URL}/deleteData`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation,
                machinName: machinName,
                serialNum: serialNum
            })
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to delete Razorpay configuration');
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
    module.exports = yRazorpayOperation;
}
