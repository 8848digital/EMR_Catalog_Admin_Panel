const PosCTAOperation = (() => {
  const COLUMNS = [
    { key: 'yId', label: 'ID', hidden: true },
    { key: 'CTA', label: 'CTA', editable: true, type: 'text', width: '120px', maxlength: 50 },
    { key: 'HomeScreen', label: 'Home Screen', editable: true, type: 'text', width: '120px', maxlength: 50 },
    { key: 'HCustSelect', label: 'Home Customer Select', editable: true, type: 'text', width: '120px', maxlength: 50 },
    { key: 'HItmSelect', label: 'Home Item Select', editable: true, type: 'text', width: '120px', maxlength: 50 },
    { key: 'HMulItmSelect', label: 'Home Multiple Item Select', editable: true, type: 'text', width: '140px', maxlength: 50 },
    { key: 'HStkCart', label: 'Home Stk Cart', editable: true, type: 'text', width: '120px', maxlength: 50 },
    { key: 'Transaction', label: 'Transaction', editable: true, type: 'text', width: '120px', maxlength: 50 },
    { key: 'CustSearch', label: 'Cust Search', editable: true, type: 'text', width: '120px', maxlength: 50 },
    { key: 'CustSearchSelect', label: 'Cust Search Select', editable: true, type: 'text', width: '150px', maxlength: 50 },
    { key: 'ItemSearch', label: 'Item Search', editable: true, type: 'text', width: '120px', maxlength: 50 },
    { key: 'ItemSearchSelect', label: 'Item Search Select', editable: true, type: 'text', width: '150px', maxlength: 50 },
    { key: 'TransactionSearch', label: 'Transaction Search', editable: true, type: 'text', width: '150px', maxlength: 50 },
    { key: 'Checkout', label: 'Checkout', editable: true, type: 'text', width: '120px', maxlength: 50 },
    { key: 'CheckoutExit', label: 'Checkout Exit', editable: true, type: 'text', width: '130px', maxlength: 50 },
    { key: 'ColHexCd', label: 'Color Hex Code', editable: true, type: 'text', width: '130px', maxlength: 50 },
    { key: 'Invoice', label: 'Invoice', editable: true, type: 'text', width: '120px', maxlength: 50 },
    { key: 'Entry', label: 'Entry', editable: true, type: 'text', width: '120px', maxlength: 50 },
    { key: 'Closing', label: 'Closing', editable: true, type: 'text', width: '120px', maxlength: 50 },
    { key: 'ClosingValidated', label: 'ClosingValidated', editable: true, type: 'text', width: '120px', maxlength: 50 },
    { key: 'HTranSearchJST', label: 'HTranSearchJST', editable: true, type: 'text', width: '120px', maxlength: 50 },
    { key: 'HTranSearchJMR', label: 'HTranSearchJMR', editable: true, type: 'text', width: '120px', maxlength: 50 },
    { key: 'HTranSearchJMS', label: 'HTranSearchJMS', editable: true, type: 'text', width: '120px', maxlength: 50 },
    { key: 'Position', label: 'Position', editable: true, type: 'text', width: '120px', maxlength: 50 },
    { key: 'ModUsr', label: 'Modified By', hidden: true },
    { key: 'ModDate', label: 'Modified Date', hidden: true }
  ];

  function validateScreenColumns(row) {
    // Clear existing validation messages
    row.querySelectorAll('.validation-message').forEach(msg => msg.remove());

    const screenColumns = [
      'HomeScreen', 'HCustSelect', 'HItmSelect', 'HMulItmSelect', 'HStkCart',
      'Transaction', 'CustSearch', 'CustSearchSelect', 'ItemSearch',
      'ItemSearchSelect', 'TransactionSearch', 'Checkout', 'CheckoutExit',
      'Invoice', 'Entry', 'Closing', 'ClosingValidated','HTranSearchJST', 'HTranSearchJMR', 'HTranSearchJMS'
    ];

    const showFieldError = (fieldName, message) => {
      const field = row.querySelector(`[data-field="${fieldName}"]`);
      if (field && field.parentElement) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-message';
        errorDiv.style.cssText = 'color: #dc2626; font-size: 12px; margin-top: 2px;';
        errorDiv.textContent = message;
        field.parentElement.appendChild(errorDiv);
      }
    };

    // Get values from all screen columns
    const fieldData = {};
    screenColumns.forEach(col => {
      const field = row.querySelector(`[data-field="${col}"]`);
      if (field) {
        fieldData[col] = field.value ? field.value.trim() : '';
      }
    });

    // Check which columns have non-NA values
    const nonNAColumns = screenColumns.filter(col => {
      const value = fieldData[col];
      return value && value !== '' && value.toUpperCase() !== 'NA';
    });

    // Validate based on number of filled columns
    if (nonNAColumns.length > 1) {
      // Show error on all columns that have values
      nonNAColumns.forEach(col => {
        showFieldError(col, 'Only one screen allowed');
      });
    } else if (nonNAColumns.length === 1) {
      // Validate that the value is either 'True' or 'False'
      const activeColumn = nonNAColumns[0];
      const activeValue = fieldData[activeColumn].toLowerCase();
      if (activeValue !== 'true' && activeValue !== 'false') {
        showFieldError(activeColumn, 'Must be "True" or "False"');
      }
    }
  }

  function getColumns() {
    return COLUMNS;
  }

  // Generate unique ID using yId
  function generateRowId(row) {
    return row.yId;
  }

  // Real-time validation function
  function validateFieldsRealtime(row) {
    // Clear existing validation messages
    row.querySelectorAll('.validation-message').forEach(msg => msg.remove());

    const fieldData = {};
    const editableColumns = COLUMNS.filter(col => col.editable);

    // Get all field values
    for (const col of editableColumns) {
      let field = row.querySelector(`[data-field="${col.key}"]`);
      if (!field) {
        field = row.querySelector(`input[data-field="${col.key}"]`);
      }
      if (field) {
        fieldData[col.key] = field.value ? field.value.trim() : '';
      }
    }

    // Helper function to show validation message below field
    const showFieldError = (fieldName, message) => {
      let field = row.querySelector(`[data-field="${fieldName}"]`);
      if (!field) {
        field = row.querySelector(`input[data-field="${fieldName}"]`);
      }
      if (field && field.parentElement) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-message';
        errorDiv.style.cssText = 'color: #dc2626; font-size: 12px; margin-top: 2px;';
        errorDiv.textContent = message;
        field.parentElement.appendChild(errorDiv);
      }
    };

    // Validate required fields
    if (fieldData.CTA !== undefined && !fieldData.CTA) {
      showFieldError('CTA', 'CTA is required');
    }

    if (fieldData.ColHexCd !== undefined && !fieldData.ColHexCd) {
      showFieldError('ColHexCd', 'Required');
    }

    if (fieldData.Position !== undefined && !fieldData.Position) {
      showFieldError('Position', 'Required');
    }

    // Validate screen columns
    const screenColumns = [
      'HomeScreen', 'HCustSelect', 'HItmSelect', 'HMulItmSelect', 'HStkCart',
      'Transaction', 'CustSearch', 'CustSearchSelect', 'ItemSearch',
      'ItemSearchSelect', 'TransactionSearch', 'Checkout', 'CheckoutExit',
      'Invoice', 'Entry', 'Closing', 'ClosingValidated','HTranSearchJST', 'HTranSearchJMR', 'HTranSearchJMS'
    ];

    const nonNAColumns = screenColumns.filter(col => {
      const value = fieldData[col];
      return value && value !== '' && value.toUpperCase() !== 'NA';
    });

    if (nonNAColumns.length === 0 && screenColumns.some(col => fieldData[col] === '')) {
      // Show error only if at least one field has been touched
      showFieldError('HomeScreen', 'At least one screen must have True/False');
    } else if (nonNAColumns.length > 1) {
      // Show error on all columns that have values
      nonNAColumns.forEach(col => {
        showFieldError(col, 'Only one screen allowed');
      });
    } else if (nonNAColumns.length === 1) {
      // Validate that the non-NA value is either 'True' or 'False'
      const activeColumn = nonNAColumns[0];
      const activeValue = fieldData[activeColumn].toLowerCase();
      if (activeValue !== 'true' && activeValue !== 'false') {
        showFieldError(activeColumn, 'Must be "True" or "False"');
      }
    }
  }

  // Attach real-time validation to input fields
  function attachRealtimeValidation(row) {
    const inputs = row.querySelectorAll('input.edit-field, select.edit-field, textarea.edit-field');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        validateFieldsRealtime(row);
      });
      input.addEventListener('blur', () => {
        validateFieldsRealtime(row);
      });
    });
  }

  async function loadData(BASE_URL, operation) {
    const response = await fetch(`${BASE_URL}/getData?operation=${operation}`);

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to load Button Configuration data');
    }

    return result.data || [];
  }

  async function saveRow(row, uniqueId, BASE_URL, operation) {
    // Clear any existing validation messages
    row.querySelectorAll('.validation-message').forEach(msg => msg.remove());

    // Get all editable field values
    const fieldData = {};
    const editableColumns = COLUMNS.filter(col => col.editable);

    for (const col of editableColumns) {
      const field = row.querySelector(`[data-field="${col.key}"]`);
      if (field) {
        fieldData[col.key] = field.value ? field.value.trim() : '';
      }
    }

    // Helper function to show validation message below field
    const showFieldError = (fieldName, message) => {
      const field = row.querySelector(`[data-field="${fieldName}"]`);
      if (field && field.parentElement) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-message';
        errorDiv.style.cssText = 'color: #dc2626; font-size: 12px; margin-top: 2px;';
        errorDiv.textContent = message;
        field.parentElement.appendChild(errorDiv);
      }
    };

    // Validate required fields
    let hasError = false;

    if (!fieldData.CTA) {
      showFieldError('CTA', 'CTA is required');
      hasError = true;
    }

    if (!fieldData.ColHexCd) {
      showFieldError('ColHexCd', 'Required');
      hasError = true;
    }

    if (!fieldData.Position) {
      showFieldError('Position', 'Required');
      hasError = true;
    }

    // Validate: Exactly one screen column should have 'True' or 'False', rest should be 'NA'
    const screenColumns = [
      'HomeScreen', 'HCustSelect', 'HItmSelect', 'HMulItmSelect', 'HStkCart',
      'Transaction', 'CustSearch', 'CustSearchSelect', 'ItemSearch',
      'ItemSearchSelect', 'TransactionSearch', 'Checkout', 'CheckoutExit',
      'Invoice', 'Entry', 'Closing', 'ClosingValidated','HTranSearchJST', 'HTranSearchJMR', 'HTranSearchJMS'
    ];

    const nonNAColumns = screenColumns.filter(col => {
      const value = fieldData[col];
      return value && value !== '' && value.toUpperCase() !== 'NA';
    });

    if (nonNAColumns.length === 0) {
      // Show error on first screen column
      showFieldError('HomeScreen', 'At least one screen must have True/False');
      hasError = true;
    } else if (nonNAColumns.length > 1) {
      // Show error on all columns that have values
      nonNAColumns.forEach(col => {
        showFieldError(col, 'Only one screen allowed');
      });
      hasError = true;
    } else {
      // Validate that the non-NA value is either 'True' or 'False'
      const activeColumn = nonNAColumns[0];
      const activeValue = fieldData[activeColumn].toLowerCase();
      if (activeValue !== 'true' && activeValue !== 'false') {
        showFieldError(activeColumn, 'Must be "True" or "False"');
        hasError = true;
      }
    }

    if (hasError) {
      throw new Error('Please fix the validation errors');
    }

    // Set all other screen columns to 'NA'
    screenColumns.forEach(col => {
      if (!nonNAColumns.includes(col)) {
        fieldData[col] = 'NA';
      }
    });

    const modUsr = sessionStorage.getItem('modUsr') || '';

    const response = await fetch(`${BASE_URL}/updateData`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: operation,
        yId: uniqueId,
        ...fieldData,
        modUsr: modUsr
      })
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to update Button Configuration');
    }

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

      if (col.editable && col.type === 'text') {
        const maxlength = col.maxlength ? `maxlength="${col.maxlength}"` : '';
        return `<td ${widthStyle}>
                  <input type="text" class="edit-field" data-field="${col.key}" 
                    ${maxlength} style="width: 100%; background-color: white;">
                </td>`;
      } else if (!col.editable) {
        // For non-editable fields like ModUsr, ModDate, show empty or auto
        return `<td ${widthStyle} style="color: #64748b; font-style: italic;">${col.key === 'yId' ? 'Auto' : ''}</td>`;
      }
      return `<td ${widthStyle}></td>`;
    }).join('');

    const newRow = `<tr data-is-new="true" style="background-color: #e8e6dfff;">${cells}
      <td class="action-cell">
        <button class="action-btn save-btn" onclick="ConfigManager.saveNewRow()" title="Save">💾</button>
        <button class="action-btn cancel-btn" onclick="ConfigManager.cancelNewRow()" title="Cancel">❌</button>
      </td></tr>`;

    tableBody.insertAdjacentHTML('afterbegin', newRow);

    const newRowElement = tableBody.querySelector('tr[data-is-new="true"]');

    // Attach real-time validation to the new row
    if (newRowElement) {
      attachRealtimeValidation(newRowElement);
    }

    const firstInput = tableBody.querySelector('tr[data-is-new="true"] .edit-field');
    if (firstInput) {
      firstInput.focus();
    }
  }

  async function saveNewRow(row, BASE_URL, operation) {
    // Clear any existing validation messages
    row.querySelectorAll('.validation-message').forEach(msg => msg.remove());

    // Get all editable field values
    const fieldData = {};
    const editableColumns = COLUMNS.filter(col => col.editable);

    for (const col of editableColumns) {
      const input = row.querySelector(`input[data-field="${col.key}"]`);
      if (input) {
        fieldData[col.key] = input.value ? input.value.trim() : '';
      }
    }

    // Helper function to show validation message below field
    const showFieldError = (fieldName, message) => {
      const field = row.querySelector(`input[data-field="${fieldName}"]`);
      if (field && field.parentElement) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-message';
        errorDiv.style.cssText = 'color: #dc2626; font-size: 12px; margin-top: 2px;';
        errorDiv.textContent = message;
        field.parentElement.appendChild(errorDiv);
      }
    };

    // Validate required fields
    let hasError = false;

    if (!fieldData.CTA) {
      showFieldError('CTA', 'CTA is required');
      hasError = true;
    }

    if (!fieldData.ColHexCd) {
      showFieldError('ColHexCd', 'Required');
      hasError = true;
    }

    if (!fieldData.Position) {
      showFieldError('Position', 'Required');
      hasError = true;
    }

    // Validate: Exactly one screen column should have 'True' or 'False', rest should be 'NA'
    const screenColumns = [
      'HomeScreen', 'HCustSelect', 'HItmSelect', 'HMulItmSelect', 'HStkCart',
      'Transaction', 'CustSearch', 'CustSearchSelect', 'ItemSearch',
      'ItemSearchSelect', 'TransactionSearch', 'Checkout', 'CheckoutExit',
      'Invoice', 'Entry', 'Closing', 'ClosingValidated','HTranSearchJST', 'HTranSearchJMR', 'HTranSearchJMS'
    ];

    const nonNAColumns = screenColumns.filter(col => {
      const value = fieldData[col];
      return value && value !== '' && value.toUpperCase() !== 'NA';
    });

    if (nonNAColumns.length === 0) {
      // Show error on first screen column
      showFieldError('HomeScreen', 'At least one screen must have True/False');
      hasError = true;
    } else if (nonNAColumns.length > 1) {
      // Show error on all columns that have values
      nonNAColumns.forEach(col => {
        showFieldError(col, 'Only one screen allowed');
      });
      hasError = true;
    } else {
      // Validate that the non-NA value is either 'True' or 'False'
      const activeColumn = nonNAColumns[0];
      const activeValue = fieldData[activeColumn].toLowerCase();
      if (activeValue !== 'true' && activeValue !== 'false') {
        showFieldError(activeColumn, 'Must be "True" or "False"');
        hasError = true;
      }
    }

    if (hasError) {
      throw new Error('Please fix the validation errors');
    }

    // Set all other screen columns to 'NA'
    screenColumns.forEach(col => {
      if (!nonNAColumns.includes(col)) {
        fieldData[col] = 'NA';
      }
    });

    const modUsr = sessionStorage.getItem('modUsr') || '';

    const response = await fetch(`${BASE_URL}/addData`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: operation,
        ...fieldData,
        modUsr: modUsr
      })
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to add Button Configuration');
    }

    return result.data;
  }

  async function deleteRow(uniqueId, BASE_URL, operation) {
    const modUsr = sessionStorage.getItem('modUsr') || '';

    const response = await fetch(`${BASE_URL}/deleteData`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: operation,
        yId: uniqueId,
        modUsr: modUsr
      })
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete Button Configuration');
    }

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
    // Called by config.js after enabling edit mode on a row
    enableEditMode: (row) => {
      attachRealtimeValidation(row);
    }
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PosCTAOperation;
}