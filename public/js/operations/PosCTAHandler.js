const PosCTAOperation = (() => {
  // Add sticky styles for CTA column
  const styleId = 'pos-cta-sticky-styles';
  if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #resultsTable th:first-child,
      #resultsTable td:first-child {
        position: sticky;
        left: 0;
        background-color: white;
        z-index: 10;
        box-shadow: 2px 0 5px -2px rgba(0,0,0,0.2);
        border-right: 1px solid #ddd;
      }
      #resultsTable th:first-child {
        z-index: 20;
        background-color: #f8fafc !important;
      }
      #resultsTable tr:hover td:first-child {
        background-color: #f1f5f9;
      }
      #resultsTable tr.editing-row td:first-child {
        background-color: #fff;
      }
    `;
    document.head.appendChild(style);
  }

  const SCREEN_MAPPING = {
    'Checkout': 'Checkout',
    'CheckoutExit': 'Checkout Exit',
    'Closing': 'Closing',
    'ClosingValidated': 'Closing Validated',
    'CPayCredit': 'CPayCredit',
    'CPayNotCredit': 'CPayNotCredit',
    'CustSearch': 'Cust Search',
    'CustSearchSelect': 'Cust Search Select',
    'Entry': 'Entry',
    'HCustSelect': 'Home Customer Select',
    'HItmSelect': 'Home Item Select',
    'HMulItmSelect': 'Home Multiple Item Select',
    'HomeScreen': 'Home Screen',
    'HStkCart': 'Home Stk Cart',
    'HTranSearchBYB': 'Transaction Search BYB',
    'HTranSearchEXC': 'Transaction Search EXC',
    'HTranSearchJMR': 'Transaction Search JMR',
    'HTranSearchJMS': 'Transaction Search JMS',
    'HTranSearchJSA': 'Transaction Search JSA',
    'HTranSearchJST': 'Transaction Search JST',
    'Invoice': 'Invoice',
    'ItemSearch': 'Item Search',
    'ItemSearchSelect': 'Item Search Select',
    'SalSearch': 'Sales Search',
    'SalSearchSelect': 'Sales Search Select',
    'Transaction': 'Transaction',
    'TransactionSearch': 'Transaction Search',
    'tranSearchTranSelected': 'Transaction Search Selected',
    'TranVoucher': 'Transaction Voucher',
    'TVchrItmSelected': 'Transaction Voucher Item Selected'
  };

  const SCREEN_KEYS = Object.keys(SCREEN_MAPPING);

  const COLUMNS = [
    { key: 'yId', label: 'ID', hidden: true },
    { key: 'CTA', label: 'CTA', editable: true, type: 'text', width: '150px', maxlength: 50 },
    {
      key: 'Screen',
      label: 'Screen Name',
      editable: true,
      type: 'select',
      options: Object.values(SCREEN_MAPPING),
      width: '300px',
      maxlength: 50
    },
    {
      key: 'Value',
      label: 'Value',
      editable: true,
      type: 'select',
      options: ['True', 'False'],
      width: '120px'

    },
    { key: 'ColHexCd', label: 'Color Hex Code', editable: true, type: 'text', width: '130px', maxlength: 50 },
    { key: 'Position', label: 'Position', editable: true, type: 'text', width: '120px', maxlength: 50 },
    { key: 'ModUsr', label: 'Modified By', hidden: true },
    { key: 'ModDate', label: 'Modified Date', hidden: true }
  ];

  function getColumns() {
    return COLUMNS;
  }

  function generateRowId(row) {
    return row.yId;
  }

  function validateFieldsRealtime(row) {
    row.querySelectorAll('.validation-message').forEach(msg => msg.remove());

    const fieldData = {};
    const editableColumns = COLUMNS.filter(col => col.editable);

    for (const col of editableColumns) {
      let field = row.querySelector(`[data-field="${col.key}"]`);
      if (!field) {
        field = row.querySelector(`input[data-field="${col.key}"], select[data-field="${col.key}"]`);
      }
      if (field) {
        fieldData[col.key] = field.value ? field.value.trim() : '';
      }
    }

    const showFieldError = (fieldName, message) => {
      let field = row.querySelector(`[data-field="${fieldName}"]`);
      if (!field) {
        field = row.querySelector(`input[data-field="${fieldName}"], select[data-field="${fieldName}"]`);
      }
      if (field && field.parentElement) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-message';
        errorDiv.style.cssText = 'color: #dc2626; font-size: 12px; margin-top: 2px;';
        errorDiv.textContent = message;
        field.parentElement.appendChild(errorDiv);
      }
    };

    if (!fieldData.CTA) showFieldError('CTA', 'Required');
    if (!fieldData.Screen) showFieldError('Screen', 'Required');
    if (!fieldData.Value) showFieldError('Value', 'Required');
    if (!fieldData.ColHexCd) showFieldError('ColHexCd', 'Required');
    if (!fieldData.Position) showFieldError('Position', 'Required');
  }

  function attachRealtimeValidation(row) {
    const inputs = row.querySelectorAll('input.edit-field, select.edit-field');
    inputs.forEach(input => {
      input.addEventListener('input', () => validateFieldsRealtime(row));
      input.addEventListener('change', () => validateFieldsRealtime(row));
      input.addEventListener('blur', () => validateFieldsRealtime(row));
    });
  }

  async function loadData(BASE_URL, operation) {
    const response = await fetch(`${BASE_URL}/getData?operation=${operation}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to load data');
    }

    const data = result.data || [];

    // Map database columns to virtual UI columns
    return data.map(row => {
      const activeScreenKey = SCREEN_KEYS.find(key =>
        row[key] && row[key].trim().toUpperCase() !== 'NA'
      );

      if (activeScreenKey) {
        row.Screen = SCREEN_MAPPING[activeScreenKey];
        row.Value = (row[activeScreenKey] || 'True').charAt(0).toUpperCase() + (row[activeScreenKey] || 'True').slice(1).toLowerCase();
      } else {
        row.Screen = 'Home Screen';
        row.Value = 'NA';
      }
      return row;
    });
  }

  async function saveRow(row, uniqueId, BASE_URL, operation) {
    row.querySelectorAll('.validation-message').forEach(msg => msg.remove());

    const fieldData = {};
    const editableColumns = COLUMNS.filter(col => col.editable);

    for (const col of editableColumns) {
      const field = row.querySelector(`[data-field="${col.key}"]`);
      if (field) {
        fieldData[col.key] = field.value ? field.value.trim() : '';
      }
    }

    if (!fieldData.CTA || !fieldData.Screen || !fieldData.Value || !fieldData.ColHexCd || !fieldData.Position) {
      throw new Error('Please fill all required fields');
    }

    // Map virtual columns back to database columns
    const payload = {
      operation: operation,
      yId: uniqueId,
      CTA: fieldData.CTA,
      ColHexCd: fieldData.ColHexCd,
      Position: fieldData.Position,
      modUsr: sessionStorage.getItem('modUsr') || ''
    };

    // Set all screen columns to NA first
    SCREEN_KEYS.forEach(key => {
      payload[key] = 'NA';
    });

    // Find the original key for the selected screen label
    const selectedScreenKey = Object.keys(SCREEN_MAPPING).find(key =>
      SCREEN_MAPPING[key] === fieldData.Screen
    );

    if (selectedScreenKey) {
      payload[selectedScreenKey] = fieldData.Value;
    }

    const response = await fetch(`${BASE_URL}/updateData`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Update failed');
    return result.data;
  }

  async function addNewRow(tableBody, showMessage, BASE_URL, operation) {
    const existingNewRow = document.querySelector('tr[data-is-new="true"]');
    if (existingNewRow) {
      showMessage('Please save or cancel the current row first', 'error');
      return;
    }

    const cells = COLUMNS.filter(col => !col.hidden).map(col => {
      const widthStyle = col.width ? `style="min-width: ${col.width};"` : '';
      if (col.editable && col.type === 'text') {
        const maxlength = col.maxlength ? `maxlength="${col.maxlength}"` : '';
        return `<td ${widthStyle}><input type="text" class="edit-field" data-field="${col.key}" ${maxlength} style="width: 100%;"></td>`;
      } else if (col.editable && col.type === 'select') {
        return `<td ${widthStyle}>
                  <select class="edit-field" data-field="${col.key}" style="width: 100%;">
                    ${col.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                  </select>
                </td>`;
      }
      return `<td ${widthStyle} style="color: #64748b; font-style: italic;">Auto</td>`;
    }).join('');

    const newRowHtml = `<tr data-is-new="true" style="background-color: #f8fafc;">${cells}
      <td class="action-cell">
        <button class="action-btn save-btn" onclick="ConfigManager.saveNewRow()" title="Save">💾</button>
        <button class="action-btn cancel-btn" onclick="ConfigManager.cancelNewRow()" title="Cancel">❌</button>
      </td></tr>`;

    tableBody.insertAdjacentHTML('afterbegin', newRowHtml);
    const newRow = tableBody.querySelector('tr[data-is-new="true"]');
    attachRealtimeValidation(newRow);
    newRow.querySelector('.edit-field').focus();
  }

  async function saveNewRow(row, BASE_URL, operation) {
    row.querySelectorAll('.validation-message').forEach(msg => msg.remove());

    const fieldData = {};
    const editableColumns = COLUMNS.filter(col => col.editable);

    for (const col of editableColumns) {
      const input = row.querySelector(`[data-field="${col.key}"]`);
      if (input) {
        fieldData[col.key] = input.value ? input.value.trim() : '';
      }
    }

    if (!fieldData.CTA || !fieldData.Screen || !fieldData.Value || !fieldData.ColHexCd || !fieldData.Position) {
      throw new Error('Please fill all required fields');
    }

    const payload = {
      operation: operation,
      CTA: fieldData.CTA,
      ColHexCd: fieldData.ColHexCd,
      Position: fieldData.Position,
      modUsr: sessionStorage.getItem('modUsr') || ''
    };

    SCREEN_KEYS.forEach(key => {
      payload[key] = 'NA';
    });

    const selectedScreenKey = Object.keys(SCREEN_MAPPING).find(key =>
      SCREEN_MAPPING[key] === fieldData.Screen
    );

    if (selectedScreenKey) {
      payload[selectedScreenKey] = fieldData.Value;
    }

    const response = await fetch(`${BASE_URL}/addData`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Failed to add');
    return result.data;
  }

  async function deleteRow(uniqueId, BASE_URL, operation) {
    const response = await fetch(`${BASE_URL}/deleteData`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation, yId: uniqueId })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Delete failed');
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
    enableEditMode: (row) => attachRealtimeValidation(row)
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PosCTAOperation;
}
