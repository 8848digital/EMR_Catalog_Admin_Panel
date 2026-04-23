const yPromoOperation = (() => {
    const COLUMNS = [
        { key: 'PMCd', label: 'Promo Code', editable: true, type: 'text', width: '150px' },
        { key: 'PDesc', label: 'Description', editable: true, type: 'text', width: '250px' },
        { key: 'StartDate', label: 'Start Date', editable: true, type: 'date', width: '120px' },
        { key: 'EndDate', label: 'End Date', editable: true, type: 'date', width: '120px' },
        {
            key: 'PValidYn', label: 'Valid', editable: true, type: 'dropdown', staticOptions: [
                { value: 'Y', label: 'Y' }, { value: 'N', label: 'N' }
            ], width: '80px'
        }
    ];

    function getColumns() {
        return COLUMNS;
    }

    function generateRowId(row) {
        return row.PMCd;
    }

    function getOptionsForColumn(col) {
        if (col.staticOptions) return col.staticOptions;
        return [];
    }

    function buildSelect(col, currentValue) {
        const options = getOptionsForColumn(col);
        let html = `<select class="edit-field" data-field="${col.key}" style="width:100%;height:30px;">`;
        options.forEach(opt => {
            const sel = (opt.value == currentValue) ? ' selected' : '';
            html += `<option value="${opt.value}"${sel}>${opt.label}</option>`;
        });
        html += `</select>`;
        return html;
    }

    function renderDisplayCell(col, value) {
        if (col.type === 'dropdown') {
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
        if (col.type === 'date') {
            const input = document.createElement('input');
            input.type = 'date';
            input.className = 'edit-field';
            input.dataset.field = col.key;
            // Ensure value is in YYYY-MM-DD format for <input type="date">
            if (value) {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    input.value = date.toISOString().split('T')[0];
                } else {
                    input.value = value;
                }
            }
            input.dataset.originalValue = input.value;
            input.style.width = '100%';
            input.style.height = '30px';
            return input;
        }
        return null;
    }

    async function loadData(BASE_URL, operation) {
        const response = await fetch(`${BASE_URL}/getData?operation=${operation}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to load Promotion data');
        return result.data || [];
    }

    async function saveRow(row, uniqueId, BASE_URL, operation) {
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
                PMCd: fields.PMCd,
                ...fields
            })
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to update Promotion');
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
                if (col.type === 'dropdown') {
                    return `<td ${widthStyle}>${buildSelect(col, '')}</td>`;
                }
                const type = col.type === 'date' ? 'date' : 'text';
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
        if (!result.success) throw new Error(result.error || 'Failed to add Promotion');
        return result.data;
    }

    async function deleteRow(uniqueId, BASE_URL, operation) {
        const response = await fetch(`${BASE_URL}/deleteData`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation: operation,
                PMCd: uniqueId
            })
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to delete Promotion');
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
    module.exports = yPromoOperation;
}
