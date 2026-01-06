const designSizeHandler = (() => {
  const COLUMNS = [
    { key: 'PMCd', label: 'Design Category', editable: false, type: 'text', width: '200px' },
    { key: 'PSCd', label: 'Size Code', editable: true, type: 'dropdown', width: '150px' },
    { key: 'PDesc', label: 'Label', editable: true, type: 'text', width: '300px', maxlength: 30 },
    { key: 'PValue3', label: 'Sequence', editable: false, type: 'text', width: '100px', hidden: true }
  ];

  let pmcdListCache = null;
  let pscdListCache = null;
  let newCategoryListCache = null;
  let currentPMCd = null;

  function getColumns() {
    return COLUMNS;
  }

  // Generate unique ID using PMCd + PValue3
  function generateRowId(row) {
    return `${row.PMCd}_${row.PValue3}`;
  }

  // Clear PMCd cache to force refresh
  function clearPMCdCache() {
    console.log('Clearing PMCd cache...');
    pmcdListCache = null;
  }

  async function loadPMCdList(BASE_URL, operation, forceRefresh = false) {
    if (pmcdListCache && !forceRefresh) {
      console.log('Using cached PMCd list');
      return pmcdListCache;
    }

    try {
      console.log('Fetching fresh PMCd list from server...');
      const response = await fetch(`${BASE_URL}/pmcdList?operation=${operation}`);
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response for PMCd list');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load design category list');
      }
      
      pmcdListCache = result.data || [];
      console.log('Loaded Design Category list (PMCd):', pmcdListCache);
      return pmcdListCache;
    } catch (error) {
      console.error('Error loading PMCd list:', error);
      throw error;
    }
  }

  async function loadPSCdList(BASE_URL, operation) {
    if (pscdListCache) {
      return pscdListCache;
    }

    try {
      const response = await fetch(`${BASE_URL}/pscdList?operation=${operation}`);
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response for PSCd list');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load size code list');
      }
      
      pscdListCache = result.data || [];
      console.log('Loaded Size Code list (PSCd):', pscdListCache);
      return pscdListCache;
    } catch (error) {
      console.error('Error loading PSCd list:', error);
      throw error;
    }
  }

  // Load new category dropdown list
  async function loadNewCategoryList(BASE_URL, operation) {
    if (newCategoryListCache) {
      return newCategoryListCache;
    }

    try {
      console.log('Fetching new category list from server...');
      const response = await fetch(`${BASE_URL}/newCategoryList?operation=${operation}`);
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response for new category list');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load new category list');
      }
      
      newCategoryListCache = result.data || [];
      console.log('Loaded New Category list:', newCategoryListCache);
      return newCategoryListCache;
    } catch (error) {
      console.error('Error loading new category list:', error);
      throw error;
    }
  }

  async function loadData(BASE_URL, operation, selectedPMCd) {
    // Load PSCd dropdown list first
    await loadPSCdList(BASE_URL, operation);

    if (!selectedPMCd) {
      throw new Error('Please select a Design Category (PMCd) first');
    }

    currentPMCd = selectedPMCd;

    const response = await fetch(`${BASE_URL}/getData?operation=${operation}&PMCd=${encodeURIComponent(selectedPMCd)}`);
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to load design size data');
    }
    
    return result.data || [];
  }

  // Render display cell for plain text or dropdown values
  function renderDisplayCell(col, value, row) {
    if (col.type === 'dropdown') {
      return value;
    }
    return null;
  }

  // Create edit control for dropdown or text fields
  function createEditControl(col, value, row) {
    if (col.type === 'dropdown' && col.key === 'PSCd') {
      if (!pscdListCache || pscdListCache.length === 0) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'edit-field';
        input.dataset.field = col.key;
        input.value = value;
        input.dataset.originalValue = value;
        if (col.maxlength) {
          input.maxLength = col.maxlength;
        }
        return input;
      }

      const select = document.createElement('select');
      select.className = 'edit-field';
      select.dataset.field = col.key;
      select.dataset.originalValue = value;
      select.style.width = '100%';
      
      // Add default option
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = '--Select Size Code--';
      select.appendChild(defaultOption);
      
      // Add all options with proper pre-selection
      pscdListCache.forEach(item => {
        const option = document.createElement('option');
        const itemValue = item.PMCd;
        option.value = itemValue;
        option.textContent = itemValue;
        
        if (itemValue === value || itemValue?.trim() === value?.trim()) {
          option.selected = true;
        }
        
        select.appendChild(option);
      });
      
      return select;
    }
    return null;
  }

  async function saveRow(row, uniqueId, BASE_URL, operation, originalValues) {
    // Parse uniqueId to get PMCd and PValue3
    const [oldPMCd, oldPValue3] = uniqueId.split('_');

    // Look for both select and input elements for PSCd field
    let pscdField = row.querySelector('select[data-field="PSCd"]');
    if (!pscdField) {
      pscdField = row.querySelector('input[data-field="PSCd"]');
    }
    if (!pscdField) {
      pscdField = row.querySelector('td[data-field="PSCd"]');
    }
    
    let pdescField = row.querySelector('input[data-field="PDesc"]');
    if (!pdescField) {
      pdescField = row.querySelector('td[data-field="PDesc"]');
    }
    
    console.log('PSCd field:', pscdField);
    console.log('PDesc field:', pdescField);
    
    let PSCd = '';
    let PDesc = '';
    
    // Get PSCd value based on element type
    if (pscdField) {
      if (pscdField.tagName === 'SELECT' || pscdField.tagName === 'INPUT') {
        PSCd = (pscdField.value || '').trim();
      } else if (pscdField.tagName === 'TD') {
        PSCd = (pscdField.dataset.value || pscdField.textContent || '').trim();
      }
    }
    
    // Get PDesc value based on element type
    if (pdescField) {
      if (pdescField.tagName === 'INPUT') {
        PDesc = (pdescField.value || '').trim();
      } else if (pdescField.tagName === 'TD') {
        PDesc = (pdescField.textContent || '').trim();
      }
    }
    
    console.log('PSCd value:', PSCd);
    console.log('PDesc value:', PDesc);
    
    // Validate
    if (!PSCd) {
      throw new Error('Size Code (PSCd) is required');
    }
    
    if (!PDesc) {
      throw new Error('Label (PDesc) is required');
    }
    
    const modUsr = sessionStorage.getItem('modUsr') || '';
    
    // PMCd doesn't change in edit mode (it's fixed per filter)
    const PMCd = currentPMCd;
    const OldPMCd = oldPMCd || currentPMCd;
    const OldPValue3 = oldPValue3 || '';
    
    console.log('Saving design size:', { PMCd, PSCd, PDesc, OldPMCd, OldPValue3 });
    
    const response = await fetch(`${BASE_URL}/updateData`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        operation: operation,
        PMCd: PMCd,
        PSCd: PSCd,
        PDesc: PDesc,
        OldPValue3: OldPValue3,
        modUsr: modUsr 
      })
    });
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update design size');
    }
    
    return result.data;
  }

  async function addNewRow(tableBody, showMessage, BASE_URL, operation) {
    const existingNewRow = document.querySelector('tr[data-is-new="true"]');
    if (existingNewRow) {
      showMessage('Please save or cancel the current new row first', 'error');
      return;
    }

    if (!currentPMCd) {
      showMessage('Please select a Design Category first', 'error');
      return;
    }

    // Load PSCd dropdown list if not already loaded
    try {
      if (!pscdListCache) {
        await loadPSCdList(BASE_URL, operation);
      }
    } catch (error) {
      showMessage('Failed to load size code list: ' + error.message, 'error');
      return;
    }

    const visibleColumns = COLUMNS.filter(col => !col.hidden);
    
    const cells = visibleColumns.map(col => {
      const widthStyle = col.width ? `style="min-width: ${col.width};"` : '';
      
      if (col.key === 'PMCd') {
        // Show current PMCd (read-only)
        return `<td ${widthStyle}><strong>${currentPMCd}</strong></td>`;
      } else if (col.editable && col.type === 'dropdown' && col.key === 'PSCd') {
        const options = pscdListCache.map(item => 
          `<option value="${item.PMCd}">${item.PMCd}</option>`
        ).join('');

        return `<td ${widthStyle}>
                  <select class="edit-field" data-field="${col.key}" 
                    style="width: 100%; background-color: white;">
                    <option value="">--Select Size Code--</option>
                    ${options}
                  </select>
                </td>`;
      } else if (col.editable && col.type === 'text') {
        const maxlength = col.maxlength ? `maxlength="${col.maxlength}"` : '';
        return `<td ${widthStyle}>
                  <input type="text" class="edit-field" data-field="${col.key}" 
                    ${maxlength} style="width: 100%; background-color: white;">
                </td>`;
      }
      return `<td ${widthStyle}></td>`;
    }).join('');
    
    const newRow = `<tr data-is-new="true" style="background-color: #e8e6dfff;">${cells}
      <td class="action-cell">
        <button class="action-btn save-btn" onclick="ConfigManager.saveNewRow()" title="Save">💾</button>
        <button class="action-btn cancel-btn" onclick="ConfigManager.cancelNewRow()" title="Cancel">❌</button>
      </td></tr>`;
    
    tableBody.insertAdjacentHTML('afterbegin', newRow);
    
    const firstInput = tableBody.querySelector('tr[data-is-new="true"] select[data-field="PSCd"]');
    if (firstInput) {
      firstInput.focus();
    }
  }

  async function saveNewRow(row, BASE_URL, operation) {
    const pscdSelect = row.querySelector('select[data-field="PSCd"]');
    const pdescInput = row.querySelector('input[data-field="PDesc"]');
    
    const PMCd = currentPMCd;
    const PSCd = pscdSelect ? pscdSelect.value.trim() : '';
    const PDesc = pdescInput ? pdescInput.value.trim() : '';
    
    if (!PMCd) {
      throw new Error('Design Category (PMCd) is required');
    }
    
    if (!PSCd) {
      throw new Error('Size Code (PSCd) is required');
    }
    
    if (!PDesc) {
      throw new Error('Label (PDesc) is required');
    }
    
    const modUsr = sessionStorage.getItem('modUsr') || '';
    
    const response = await fetch(`${BASE_URL}/addData`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        operation: operation,
        PMCd: PMCd,
        PSCd: PSCd,
        PDesc: PDesc,
        modUsr: modUsr 
      })
    });
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to add design size');
    }
    
    return result.data;
  }

  async function deleteRow(uniqueId, BASE_URL, operation) {
    
    // Parse uniqueId to get PMCd and PValue3
    const [PMCd, PValue3] = uniqueId.split('_');
    
    const modUsr = sessionStorage.getItem('modUsr') || '';
    
    const response = await fetch(`${BASE_URL}/deleteData`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        operation: operation,
        PMCd: PMCd,
        PValue3: PValue3,
        modUsr: modUsr 
      })
    });
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check API endpoint.');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete design size');
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
    renderDisplayCell,
    createEditControl,
    loadPMCdList,
    loadNewCategoryList,
    clearPMCdCache,
    supportsAdd: true,
    supportsDelete: true,
    requiresPMCdFilter: true,
    showAddNewCategory: true  
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = designSizeHandler;
}