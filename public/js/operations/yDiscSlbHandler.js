const yDiscSlbOperation = (() => {
    let lookupCache = {};

    const COLUMNS = [
        { key: 'RuleCode', label: 'Rule Code', editable: true, type: 'dropdown', lookupSource: 'yDiscRule', width: '150px' },
        { key: 'ValueMode', label: 'Value Mode', editable: true, type: 'dropdown', lookupSource: 'yValMode', width: '120px' },
        { key: 'TierName', label: 'Tier Name', editable: true, type: 'text', width: '150px' },
        { key: 'TierOrder', label: 'Order', editable: true, type: 'number', width: '60px' },
        { key: 'MinValue', label: 'Min Val', editable: true, type: 'number', width: '100px' },
        { key: 'MaxValue', label: 'Max Val', editable: true, type: 'number', width: '100px' },
        { key: 'DiscountValue', label: 'Disc Val', editable: true, type: 'number', width: '100px' }
    ];

    function getColumns() {
        return COLUMNS;
    }

    function generateRowId(row) {
        return `${row.RuleCode}|${row.TierOrder}|${row.MinValue}|${row.MaxValue}|${row.TierName}|${row.DiscountValue}`;
    }

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

    // Load all lookups needed
    async function loadAllLookups(BASE_URL) {
        const sources = [...new Set(COLUMNS.filter(c => c.lookupSource).map(c => c.lookupSource))];
        await Promise.all(sources.map(s => fetchLookup(BASE_URL, s)));
    }

    // Get options for a column
    function getOptionsForColumn(col) {
        if (col.lookupSource && lookupCache[col.lookupSource]) {
            return lookupCache[col.lookupSource];
        }
        return [];
    }

    // Build a <select> element
    function buildSelect(col, currentValue) {
        const options = getOptionsForColumn(col);
        let html = `<select class="edit-field" data-field="${col.key}" style="width:100%;height:30px;">`;
        html += `<option value="">--Select--</option>`;
        options.forEach(opt => {
            const sel = (opt.value == currentValue || opt.value === (currentValue || '').trim()) ? ' selected' : '';
            html += `<option value="${opt.value}"${sel}>${opt.label}</option>`;
        });
        html += `</select>`;
        return html;
    }

    // Render display cell
    function renderDisplayCell(col, value) {
        if (col.type === 'dropdown') return value || '';
        return null;
    }

    // Create edit control
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
        if (!result.success) throw new Error(result.error || 'Failed to load Discount Slab data');
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
                OldRuleCode: originalValues.RuleCode,
                OldTierOrder: originalValues.TierOrder,
                OldMinValue: originalValues.MinValue,
                OldMaxValue: originalValues.MaxValue,
                OldTierName: originalValues.TierName,
                OldDiscountValue: originalValues.DiscountValue,
                ...fields
            })
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to update Discount Slab');
        return result.data;
    }

    async function addNewRow(tableBody, showMessage, BASE_URL, operation) {
        const existingNewRow = document.querySelector('tr[data-is-new="true"]');
        if (existingNewRow) {
            showMessage('Please save or cancel the current new row first', 'error');
            return;
        }

        await loadAllLookups(BASE_URL);

        const visibleColumns = COLUMNS.filter(col => !col.hidden);
        const cells = visibleColumns.map(col => {
            const widthStyle = col.width ? `style="min-width: ${col.width};"` : '';
            if (col.editable) {
                if (col.type === 'dropdown') {
                    return `<td ${widthStyle}>${buildSelect(col, '')}</td>`;
                }
                const inputType = col.type || 'text';
                return `<td ${widthStyle}><input type="${inputType}" class="edit-field" data-field="${col.key}" style="width: 100%; height: 30px;"></td>`;
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
        if (!result.success) throw new Error(result.error || 'Failed to add Discount Slab');
        return result.data;
    }

    async function deleteRow(uniqueId, BASE_URL, operation) {
        const [ruleCode, tierOrder, minValue, maxValue, tierName, discountValue] = uniqueId.split('|');
        const response = await fetch(`${BASE_URL}/deleteData`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation: operation,
                RuleCode: ruleCode,
                TierOrder: tierOrder,
                MinValue: minValue,
                MaxValue: maxValue,
                TierName: tierName,
                DiscountValue: discountValue
            })
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to delete Discount Slab');
        return result.data;
    }

    function clearCache() { lookupCache = {}; }
    return {
        getColumns, generateRowId, loadData, saveRow,
        addNewRow, saveNewRow, deleteRow,
        renderDisplayCell, createEditControl, clearCache,
        supportsAdd: true, supportsDelete: true
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = yDiscSlbOperation;
}
