const yEcheMapOperation = (() => {
    let lookupCache = {};

    const COLUMNS = [
        { key: 'RuleCode', label: 'Rule Code', editable: true, type: 'dropdown', lookupSource: 'yDiscRule', width: '150px' },
        { key: 'EchelonType', label: 'Echelon Type', editable: true, type: 'dropdown', lookupSource: 'yEchelon', width: '120px' },
        { key: 'TargetValue', label: 'Target Value', editable: true, type: 'dropdown', width: '120px' },
        { key: 'Description', label: 'Description', editable: true, type: 'text', width: '200px' }
    ];

    function getColumns() {
        return COLUMNS;
    }

    // Use RuleCode + TargetValue as the unique key for the UI
    function generateRowId(row) {
        return `${row.RuleCode}|${row.TargetValue}`;
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
        // Ensure new lookups are also loaded
        if (!sources.includes('yCtg')) sources.push('yCtg');
        if (!sources.includes('yBOM')) sources.push('yBOM');
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
    function createEditControl(col, value, rowData = {}) {
        if (col.type === 'dropdown') {
            const wrapper = document.createElement('span');

            // For TargetValue, we need to populate options based on EchelonType
            if (col.key === 'TargetValue') {
                const echelonType = (rowData.EchelonType || '').trim();
                let options = [];
                if (echelonType === 'CATEGORY') options = lookupCache['yCtg'] || [];
                else if (echelonType === 'GROUP') options = lookupCache['yBOM'] || [];

                let html = `<select class="edit-field" data-field="${col.key}" style="width:100%;height:30px;">`;
                html += `<option value="">--Select--</option>`;
                options.forEach(opt => {
                    const sel = (opt.value === value || opt.value === (value || '').trim()) ? ' selected' : '';
                    html += `<option value="${opt.value}"${sel}>${opt.label}</option>`;
                });
                html += `</select>`;
                wrapper.innerHTML = html;
            } else {
                wrapper.innerHTML = buildSelect(col, value);
            }

            const select = wrapper.firstChild;
            select.dataset.originalValue = value || '';

            // If it's EchelonType, add a listener to update TargetValue dropdown in the same row
            if (col.key === 'EchelonType') {
                select.addEventListener('change', (e) => {
                    const newType = (e.target.value || '').trim();
                    const row = e.target.closest('tr');
                    if (!row) return;

                    const targetValSelect = row.querySelector('[data-field="TargetValue"]');
                    if (targetValSelect) {
                        let newOptions = [];
                        if (newType === 'CATEGORY') newOptions = lookupCache['yCtg'] || [];
                        else if (newType === 'GROUP') newOptions = lookupCache['yBOM'] || [];

                        targetValSelect.innerHTML = '<option value="">--Select--</option>';
                        newOptions.forEach(opt => {
                            const option = document.createElement('option');
                            option.value = opt.value;
                            option.textContent = opt.label;
                            targetValSelect.appendChild(option);
                        });
                    }
                });
            }

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
        const row = document.createElement('tr');
        row.dataset.isNew = 'true';
        row.style.backgroundColor = '#f0f7ff';

        visibleColumns.forEach(col => {
            const td = document.createElement('td');
            if (col.width) td.style.minWidth = col.width;

            if (col.editable) {
                const control = createEditControl(col, '', {});
                if (control) {
                    td.appendChild(control);
                } else {
                    td.innerHTML = `<input type="text" class="edit-field" data-field="${col.key}" style="width: 100%; height: 30px;">`;
                }
            }
            row.appendChild(td);
        });

        const actionTd = document.createElement('td');
        actionTd.className = 'action-cell';
        actionTd.innerHTML = `
            <button class="action-btn save-btn" onclick="ConfigManager.saveNewRow()" title="Save">💾</button>
            <button class="action-btn cancel-btn" onclick="ConfigManager.cancelNewRow()" title="Cancel">❌</button>
        `;
        row.appendChild(actionTd);

        tableBody.insertBefore(row, tableBody.firstChild);
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
        // uniqueId is RuleCode|TargetValue
        const [ruleCode, targetValue] = uniqueId.split('|');
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

    function clearCache() { lookupCache = {}; }
    return {
        getColumns, generateRowId, loadData, saveRow,
        addNewRow, saveNewRow, deleteRow,
        renderDisplayCell, createEditControl, clearCache,
        supportsAdd: true, supportsDelete: true
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = yEcheMapOperation;
}
