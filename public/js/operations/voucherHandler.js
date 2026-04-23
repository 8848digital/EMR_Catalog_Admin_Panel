const voucherOperation = (() => {
    let lookupCache = {};

    const COLUMNS = [
        { key: 'VchIdNo', label: 'ID', hidden: true, editable: false, type: 'text', width: '60px' },
        { key: 'VchVbIdNo', label: 'Batch', editable: true, type: 'dropdown', lookupSource: 'voucherBatch', width: '200px' },
        { key: 'VchCd', label: 'Voucher Code', editable: true, type: 'text', width: '150px' },
        { key: 'VchCmCd', label: 'Customer', editable: true, type: 'text', width: '100px' },
        {
            key: 'VchSts', label: 'Status', editable: true, type: 'dropdown', staticOptions: [
                { value: 'A', label: 'A - Active' },
                { value: 'U', label: 'U - Used' },
                { value: 'E', label: 'E - Expired' }
            ], width: '110px'
        },
        { key: 'VchUsedCnt', label: 'Used Count', editable: true, type: 'number', width: '80px' },
        { key: 'VchIssDt', label: 'Issue Date', editable: true, type: 'date', width: '130px' },
        { key: 'VchRedDt', label: 'Redeem Date', editable: true, type: 'date', width: '130px' },
        { key: 'VchExpDt', label: 'Expiry Date', editable: true, type: 'date', width: '130px' }
    ];

    function getColumns() { return COLUMNS; }
    function generateRowId(row) { return row.VchIdNo; }

    async function fetchLookup(BASE_URL, source) {
        if (lookupCache[source]) return lookupCache[source];
        try {
            const response = await fetch(`${BASE_URL}/lookupData?source=${source}`);
            const result = await response.json();
            if (result.success) { lookupCache[source] = result.data || []; return lookupCache[source]; }
        } catch (e) { console.error(`Failed to load lookup: ${source}`, e); }
        return [];
    }

    async function loadAllLookups(BASE_URL) {
        const sources = [...new Set(COLUMNS.filter(c => c.lookupSource).map(c => c.lookupSource))];
        await Promise.all(sources.map(s => fetchLookup(BASE_URL, s)));
    }

    function getOptionsForColumn(col) {
        if (col.staticOptions) return col.staticOptions;
        if (col.lookupSource && lookupCache[col.lookupSource]) return lookupCache[col.lookupSource];
        return [];
    }

    function buildSelect(col, currentValue) {
        const options = getOptionsForColumn(col);
        let html = `<select class="edit-field" data-field="${col.key}" style="width:100%;height:30px;">`;
        html += `<option value="">--Select--</option>`;
        options.forEach(opt => {
            const sel = (opt.value == currentValue) ? ' selected' : '';
            html += `<option value="${opt.value}"${sel}>${opt.label}</option>`;
        });
        html += `</select>`;
        return html;
    }

    function renderDisplayCell(col, value) {
        if (col.type === 'dropdown') {
            if (col.lookupSource && lookupCache[col.lookupSource]) {
                const match = lookupCache[col.lookupSource].find(o => o.value == value);
                if (match) return match.label;
            }
            if (col.staticOptions) {
                const match = col.staticOptions.find(o => o.value == value);
                if (match) return match.label;
            }
            return value || '';
        }
        return null;
    }

    function createEditControl(col, value) {
        if (col.type === 'dropdown') {
            const wrapper = document.createElement('span');
            wrapper.innerHTML = buildSelect(col, value);
            const select = wrapper.firstChild;
            select.dataset.originalValue = value || '';
            return select;
        }
        return null;
    }

    async function loadData(BASE_URL, operation) {
        await loadAllLookups(BASE_URL);
        const response = await fetch(`${BASE_URL}/getData?operation=${operation}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to load Voucher data');
        return result.data || [];
    }

    async function saveRow(row, uniqueId, BASE_URL, operation) {
        const fields = {};
        row.querySelectorAll('.edit-field').forEach(el => { fields[el.dataset.field] = el.value.trim(); });
        const response = await fetch(`${BASE_URL}/updateData`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operation, VchIdNo: uniqueId, ...fields })
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to update Voucher');
        return result.data;
    }

    async function addNewRow(tableBody, showMessage, BASE_URL, operation) {
        const existingNewRow = document.querySelector('tr[data-is-new="true"]');
        if (existingNewRow) { showMessage('Please save or cancel the current new row first', 'error'); return; }
        await loadAllLookups(BASE_URL);

        const visibleColumns = COLUMNS.filter(col => !col.hidden);
        const cells = visibleColumns.map(col => {
            const ws = col.width ? `style="min-width:${col.width};"` : '';
            if (!col.editable) return `<td ${ws}></td>`;
            if (col.type === 'dropdown') return `<td ${ws}>${buildSelect(col, '')}</td>`;
            const t = col.type || 'text';
            return `<td ${ws}><input type="${t}" class="edit-field" data-field="${col.key}" style="width:100%;height:30px;"></td>`;
        }).join('');

        const newRow = `<tr data-is-new="true" style="background-color:#f0f7ff;">${cells}
            <td class="action-cell">
                <button class="action-btn save-btn" onclick="ConfigManager.saveNewRow()" title="Save">💾</button>
                <button class="action-btn cancel-btn" onclick="ConfigManager.cancelNewRow()" title="Cancel">❌</button>
            </td></tr>`;
        tableBody.insertAdjacentHTML('afterbegin', newRow);
    }

    async function saveNewRow(row, BASE_URL, operation) {
        const fields = {};
        row.querySelectorAll('.edit-field').forEach(el => { fields[el.dataset.field] = el.value.trim(); });
        const response = await fetch(`${BASE_URL}/addData`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operation, ...fields })
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to add Voucher');
        return result.data;
    }

    async function deleteRow(uniqueId, BASE_URL, operation) {
        const response = await fetch(`${BASE_URL}/deleteData`, {
            method: 'DELETE', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operation, VchIdNo: uniqueId })
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to delete Voucher');
        return result.data;
    }

    return {
        getColumns, generateRowId, loadData, saveRow,
        addNewRow, saveNewRow, deleteRow,
        renderDisplayCell, createEditControl,
        supportsAdd: true, supportsDelete: true
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = voucherOperation;
}
