const yDiscOperation = (() => {
    // Cache for lookup data
    let lookupCache = {};

    const COLUMNS = [
        { key: 'dcIdNo', label: 'ID', hidden: true, editable: false, type: 'text', width: '60px' },
        { key: 'dcPrmCd', label: 'Promo Code', editable: true, type: 'dropdown', lookupSource: 'yPromo', width: '160px' },
        { key: 'dcRuleCd', label: 'Rule Code', editable: true, type: 'text', width: '140px' },
        { key: 'dcTyp', label: 'Description', editable: true, type: 'text', width: '160px' },
        { key: 'dcValMode', label: 'Val Mode', editable: true, type: 'dropdown', lookupSource: 'yValMode', width: '110px' },
        { key: 'dcVal', label: 'Value', editable: true, type: 'number', width: '80px' },
        { key: 'dcIngTgt', label: 'Ingredient Target', editable: true, type: 'dropdown', lookupSource: 'yIngTrgt', allowBlank: true, width: '120px' },
        { key: 'dcSlabBas', label: 'Slab Basis', editable: true, type: 'dropdown', lookupSource: 'ySlabBas', allowBlank: true, width: '130px' },
        {
            key: 'dcEchelon', label: 'Echelon', editable: true, type: 'dropdown', lookupSource: 'yEchelon', staticPrefix: [
                { value: 'ALL', label: 'ALL' },
                { value: 'MANUAL', label: 'MANUAL' }
            ], width: '140px'
        },
        {
            key: 'dcExcYN', label: 'Exclusive', editable: true, type: 'dropdown', staticOptions: [
                { value: 'Y', label: 'Y' },
                { value: 'N', label: 'N' }
            ], width: '80px'
        },
        { key: 'dcPriority', label: 'Priority', editable: true, type: 'number', width: '70px' },
        { key: 'dcStkGrp', label: 'stacking Group', editable: true, type: 'dropdown', lookupSource: 'yStckGrp', allowBlank: true, width: '130px' },
        { key: 'dcMaxCap', label: 'Max Cap', editable: true, type: 'number', width: '80px' },
        { key: 'dcMinInvVal', label: 'Min Inv', editable: true, type: 'number', width: '80px' },
        {
            key: 'dcValidYN', label: 'Valid', editable: true, type: 'dropdown', staticOptions: [
                { value: 'Y', label: 'Y' },
                { value: 'N', label: 'N' }
            ], width: '70px'
        }
    ];

    function getColumns() { return COLUMNS; }
    function generateRowId(row) { return row.dcIdNo; }

    // Fetch lookup data from server
    async function fetchLookup(BASE_URL, source) {
        if (lookupCache[source]) return lookupCache[source];
        try {
            const response = await fetch(`${BASE_URL}/lookupData?source=${source}`);
            const result = await response.json();
            if (result.success) {
                lookupCache[source] = result.data || [];
                return lookupCache[source];
            }
        } catch (e) {
            console.error(`Failed to load lookup: ${source}`, e);
        }
        return [];
    }

    // Load all lookups needed by dropdown columns
    async function loadAllLookups(BASE_URL) {
        const sources = [...new Set(COLUMNS.filter(c => c.lookupSource).map(c => c.lookupSource))];
        await Promise.all(sources.map(s => fetchLookup(BASE_URL, s)));
    }

    // Get options for a column (static + dynamic)
    function getOptionsForColumn(col) {
        let options = [];
        if (col.staticPrefix) options = [...col.staticPrefix];
        if (col.staticOptions) return col.staticOptions;
        if (col.lookupSource && lookupCache[col.lookupSource]) {
            options = options.concat(lookupCache[col.lookupSource]);
        }
        return options;
    }

    // Build a <select> element
    function buildSelect(col, currentValue) {
        const options = getOptionsForColumn(col);
        const blankLabel = col.allowBlank ? '--None--' : `--Select--`;
        let html = `<select class="edit-field" data-field="${col.key}" style="width:100%;height:30px;">`;
        html += `<option value="">${blankLabel}</option>`;
        options.forEach(opt => {
            const sel = (opt.value === currentValue || opt.value === (currentValue || '').trim()) ? ' selected' : '';
            html += `<option value="${opt.value}"${sel}>${opt.label}</option>`;
        });
        html += `</select>`;
        return html;
    }

    // Render display cell — show the value as text
    function renderDisplayCell(col, value) {
        if (col.type === 'dropdown') return value || '';
        return null;
    }

    // Create edit control — render a <select> for dropdown columns
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
        if (!result.success) throw new Error(result.error || 'Failed to load Discount data');
        return result.data || [];
    }

    async function saveRow(row, uniqueId, BASE_URL, operation) {
        const fields = {};
        row.querySelectorAll('.edit-field').forEach(el => {
            fields[el.dataset.field] = el.value.trim();
        });
        const response = await fetch(`${BASE_URL}/updateData`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operation, dcIdNo: uniqueId, ...fields })
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to update Discount');
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
            if (col.type === 'dropdown') {
                return `<td ${ws}>${buildSelect(col, '')}</td>`;
            }
            const t = col.type === 'number' ? 'number' : 'text';
            return `<td ${ws}><input type="${t}" class="edit-field" data-field="${col.key}" style="width:100%;height:30px;"></td>`;
        }).join('');

        const newRow = `<tr data-is-new="true" style="background-color:#f0f7ff;">${cells}
            <td class="action-cell">
                <button class="action-btn save-btn" onclick="ConfigManager.saveNewRow()" title="Save">💾</button>
                <button class="action-btn cancel-btn" onclick="ConfigManager.cancelNewRow()" title="Cancel">❌</button>
            </td></tr>`;
        tableBody.insertAdjacentHTML('afterbegin', newRow);
        const firstInput = tableBody.querySelector('tr[data-is-new="true"] .edit-field');
        if (firstInput) firstInput.focus();
    }

    async function saveNewRow(row, BASE_URL, operation) {
        const fields = {};
        row.querySelectorAll('.edit-field').forEach(el => {
            fields[el.dataset.field] = el.value.trim();
        });
        const response = await fetch(`${BASE_URL}/addData`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operation, ...fields })
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to add Discount');
        return result.data;
    }

    async function deleteRow(uniqueId, BASE_URL, operation) {
        const response = await fetch(`${BASE_URL}/deleteData`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operation, dcIdNo: uniqueId })
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to delete Discount');
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
    module.exports = yDiscOperation;
}
