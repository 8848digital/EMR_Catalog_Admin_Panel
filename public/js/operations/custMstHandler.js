const CustMstHandler = (() => {
  const COLUMNS = [
    { key: 'yCmCd', label: 'Customer Code' },
    { key: 'yCmName', label: 'Name' },
    { key: 'yCmEmail', label: 'Email' },
    { key: 'yCmCurCd', label: 'Currency' },
    { key: 'yCmDfltLng', label: 'Language' },
    { key: 'yCmMulBy', label: 'Multiplier', editable: true, type: 'number' },
    { key: 'yCmValidYN', label: 'Valid Y/N', editable: true, type: 'select', options: ['Y', 'N'] }
  ];

  function getColumns() {
    return COLUMNS;
  }

  function generateRowId(row) {
    return row.yCmId;
  }

  async function loadData(BASE_URL, operation) {
    const response = await fetch(`${BASE_URL}/getData?operation=${operation}`);
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to load customer data');
    }
    
    return result.data || [];
  }

  async function saveRow(row, uniqueId, BASE_URL, operation) {
    const multiplierInput = row.querySelector('input[data-field="yCmMulBy"]');
    const validYNSelect = row.querySelector('select[data-field="yCmValidYN"]');
    
    const multiplierValue = multiplierInput.value.trim();
    const validYNValue = validYNSelect.value;
    
    // Validate multiplier
    if (!multiplierValue) {
      throw new Error('Multiplier value is required');
    }
    
    const numValue = parseFloat(multiplierValue);
    
    if (isNaN(numValue)) {
      throw new Error('Multiplier must be a valid number');
    }
    
    if (numValue === 1) {
      throw new Error('Cannot set multiplier to 1. Multiplier must be greater than 1.');
    }
    
    if (numValue < 1) {
      throw new Error('Multiplier must be greater than 1');
    }
    
    // Validate Valid Y/N
    if (!validYNValue || (validYNValue !== 'Y' && validYNValue !== 'N')) {
      throw new Error('Valid Y/N must be Y or N');
    }
    
    const modUsr = sessionStorage.getItem('modUsr') || '';
    
    const response = await fetch(`${BASE_URL}/updateData`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        operation: operation,
        yCmId: parseInt(uniqueId),
        yCmMulBy: parseFloat(multiplierValue),
        yCmValidYN: validYNValue,
        modUsr: modUsr 
      })
    });
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update customer');
    }
    
    return result.data;
  }

  function validateInput(input) {
    // Save cursor position
    const cursorPosition = input.selectionStart;
    let value = input.value;
    
    if (value === '') return;
    
    const originalLength = value.length;
    const hasNegative = value.startsWith('-');
    
    // Remove invalid characters
    value = value.replace(/[^\d.-]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Ensure only one negative sign at the start
    if (value.indexOf('-') > 0) {
      value = value.replace(/-/g, '');
      if (hasNegative) value = '-' + value;
    }
    
    // Enforce minimum value of 1
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue < 1 && value !== '' && value !== '-' && value !== '.') {
      if (numValue <= 0) {
        value = '1';
      }
    }
    
    // Limit to 2 decimal places
    if (value.includes('.')) {
      const decimalParts = value.split('.');
      if (decimalParts[1] && decimalParts[1].length > 2) {
        value = decimalParts[0] + '.' + decimalParts[1].substring(0, 2);
      }
    }
    
    const lengthDiff = value.length - originalLength;
    const newCursorPosition = cursorPosition + lengthDiff;
    
    input.value = value;
    input.setSelectionRange(newCursorPosition, newCursorPosition);
  }

  return {
    getColumns,
    generateRowId,
    loadData,
    saveRow,
    validateInput,
    supportsAdd: false
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CustMstHandler;
}