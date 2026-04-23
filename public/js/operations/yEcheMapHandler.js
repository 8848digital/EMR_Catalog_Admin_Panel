const yEcheMapOperation = (() => {
    let lookupCache = {};

    const COLUMNS = [
        { key: 'RuleCode', label: 'Rule Code', editable: true, type: 'dropdown', lookupSource: 'yDisc', width: '150px' },
        { key: 'EchelonType', label: 'Echelon Type', editable: true, type: 'dropdown', lookupSource: 'yEchelon', width: '120px' },
        { key: 'TargetValue', label: 'Target Value', editable: true, type: 'text', width: '120px' },
        { key: 'Description', label: 'Description', editable: true, type: 'text', width: '200px' }
    ];

    function getColumns() {
        return COLUMNS;
    }

    // Use RuleCode + TargetValue as the unique key for the UI
    function generateRowId(row) {
        return `${row.RuleCode}_${row.TargetValue}`;
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

    // Load all lookups needed by dropdown columns
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
        if (!result.success) throw new Error(result.error || 'Failed to load Echelon Mapping data');
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
                OldTargetValue: originalValues.TargetValue,
                ...fields
            })
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to update Echelon Mapping');
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
                return `<td ${widthStyle}><input type="text" class="edit-field" data-field="${col.key}" style="width: 100%; height: 30px;"></td>`;
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
        if (!result.success) throw new Error(result.error || 'Failed to add Echelon Mapping');
        return result.data;
    }

    async function deleteRow(uniqueId, BASE_URL, operation) {
        // uniqueId is RuleCode_TargetValue
        const [ruleCode, targetValue] = uniqueId.split('_');
        const response = await fetch(`${BASE_URL}/deleteData`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation: operation,
                RuleCode: ruleCode,
                TargetValue: targetValue
            })
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to delete Echelon Mapping');
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
    module.exports = yEcheMapOperation;
}
