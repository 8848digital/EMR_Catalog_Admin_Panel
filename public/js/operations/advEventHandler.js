const advEventOperation = (() => {
    const COLUMNS = [
        { key: 'yPIdNo', label: 'ID', hidden: false, editable: false, type: 'text', width: '80px' },
        { key: 'PTyp', label: 'Type', hidden: true },
        { key: 'PMCd', label: 'Title', editable: true, type: 'text', width: '200px', maxlength: 140 },
        { key: 'PDesc225', label: 'Description', editable: true, type: 'textarea', width: '250px', maxlength: 225 },
        { key: 'PValue', label: 'Start Date', editable: true, type: 'date', width: '150px' },
        { key: 'PValue1', label: 'End Date', editable: true, type: 'date', width: '150px' },
        { key: 'PNum', label: 'Duration', editable: true, type: 'number', width: '120px' },
        { key: 'PValue2', label: 'Image 1', editable: true, type: 'image', width: '120px', required: true, imageLetter: 'A' },
        { key: 'PValue3', label: 'Image 2', editable: true, type: 'image', width: '120px', imageLetter: 'B' },
        { key: 'PValue4', label: 'Image 3', editable: true, type: 'image', width: '120px', imageLetter: 'C' },
        { key: 'PValue5', label: 'Image 4', editable: true, type: 'image', width: '120px', imageLetter: 'D' },
        { key: 'PValue6', label: 'Image 5', editable: true, type: 'image', width: '120px', imageLetter: 'E' }
    ];

    const BASE_IMAGE_PATH = '/adCfgImages/YAdvEvent';

    function getColumns() {
        return COLUMNS;
    }

    function generateRowId(row) {
        return row.yPIdNo;
    }

    async function loadData(BASE_URL, operation) {
        const response = await fetch(`${BASE_URL}/getData?operation=${operation}`);

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response. Please check API endpoint.');
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to load Advertisement Event data');
        }

        return result.data || [];
    }

    function renderDisplayCell(col, value, row) {
        if (col.type === 'image') {
            if (value && value.trim() !== '') {
                return `<img src="${value}" alt="Image" style="max-width: 100px; max-height: 100px; cursor: pointer; display: block;" 
                onclick="window.open('${value}', '_blank')">`;
            } else {
                return '<span style="color: #999; font-size: 12px;">No image</span>';
            }
        }
        if (col.type === 'textarea') {
            return `<div style="max-height: 60px; overflow-y: auto; white-space: pre-wrap;">${value || ''}</div>`;
        }
        return null;
    }

    function createEditControl(col, value, row) {
        if (col.type === 'textarea') {
            const textarea = document.createElement('textarea');
            textarea.className = 'edit-field';
            textarea.dataset.field = col.key;
            textarea.value = value || '';
            textarea.dataset.originalValue = value || '';
            textarea.style.width = '100%';
            textarea.style.minHeight = '60px';
            if (col.maxlength) {
                textarea.maxLength = col.maxlength;
            }
            return textarea;
        }

        if (col.type === 'image') {
            const container = document.createElement('div');
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '3px';
            container.style.alignItems = 'flex-start';

            // Current image preview
            if (value && value.trim() !== '') {
                const currentImg = document.createElement('img');
                currentImg.src = value;
                currentImg.style.maxWidth = '100px';
                currentImg.style.maxHeight = '100px';
                currentImg.style.cursor = 'pointer';
                currentImg.style.display = 'block';
                currentImg.onclick = () => window.open(value, '_blank');
                container.appendChild(currentImg);
            } else {
                const noImageText = document.createElement('span');
                noImageText.textContent = 'No image';
                noImageText.style.color = '#999';
                noImageText.style.fontSize = '12px';
                container.appendChild(noImageText);
            }

            // Hidden input to store current image path
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.dataset.field = col.key;
            hiddenInput.value = value || '';
            hiddenInput.dataset.originalValue = value || '';
            container.appendChild(hiddenInput);

            // File input (hidden)
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.className = 'edit-field-file';
            fileInput.dataset.field = `${col.key}_file`;
            fileInput.dataset.imageLetter = col.imageLetter || '';
            fileInput.style.display = 'none';
            
            // Only show "change image" link if image exists
            if (value && value.trim() !== '') {
                const changeLink = document.createElement('a');
                changeLink.textContent = 'change image';
                changeLink.href = 'javascript:void(0)';
                changeLink.style.fontSize = '11px';
                changeLink.style.color = '#4CAF50';
                changeLink.style.textDecoration = 'underline';
                changeLink.style.cursor = 'pointer';
                
                // When file is selected, show preview
                fileInput.addEventListener('change', (e) => {
                    if (e.target.files.length > 0) {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        
                        reader.onload = (event) => {
                            // Update preview image
                            const existingImg = container.querySelector('img');
                            const noImageText = container.querySelector('span');
                            
                            if (existingImg) {
                                existingImg.src = event.target.result;
                            } else {
                                // Remove "No image" text if exists
                                if (noImageText) {
                                    noImageText.remove();
                                }
                                
                                // Create new preview image
                                const newImg = document.createElement('img');
                                newImg.src = event.target.result;
                                newImg.style.maxWidth = '100px';
                                newImg.style.maxHeight = '100px';
                                newImg.style.cursor = 'pointer';
                                newImg.style.display = 'block';
                                container.insertBefore(newImg, hiddenInput);
                            }
                            
                            // Mark that new file was selected
                            hiddenInput.dataset.newFileSelected = 'true';
                            
                            // Update change link text
                            changeLink.textContent = 'change image ✓';
                            changeLink.style.color = '#45a049';
                        };
                        
                        reader.readAsDataURL(file);
                    }
                });
                
                changeLink.onclick = () => {
                    fileInput.click();
                };
                
                container.appendChild(changeLink);
            } else {
                // For empty images, show file input when editing
                fileInput.addEventListener('change', (e) => {
                    if (e.target.files.length > 0) {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        
                        reader.onload = (event) => {
                            const noImageText = container.querySelector('span');
                            if (noImageText) {
                                noImageText.remove();
                            }
                            
                            // Create new preview image
                            const newImg = document.createElement('img');
                            newImg.src = event.target.result;
                            newImg.style.maxWidth = '100px';
                            newImg.style.maxHeight = '100px';
                            newImg.style.cursor = 'pointer';
                            newImg.style.display = 'block';
                            container.insertBefore(newImg, hiddenInput);
                            
                            // Mark that new file was selected
                            hiddenInput.dataset.newFileSelected = 'true';
                        };
                        
                        reader.readAsDataURL(file);
                    }
                });
            }
            
            container.appendChild(fileInput);

            return container;
        }

        if (col.type === 'number') {
            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'edit-field';
            input.dataset.field = col.key;
            input.value = value || '';
            input.dataset.originalValue = value || '';
            input.step = 'any';
            input.style.width = '100%';
            return input;
        }

        if (col.type === 'date') {
            const input = document.createElement('input');
            input.type = 'date';
            input.className = 'edit-field';
            input.dataset.field = col.key;
            if (value) {
                const date = new Date(value);
                input.value = date.toISOString().split('T')[0];
            }
            input.dataset.originalValue = value || '';
            input.style.width = '100%';
            return input;
        }

        if (col.type === 'text') {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'edit-field';
            input.dataset.field = col.key;
            input.value = value || '';
            input.dataset.originalValue = value || '';
            if (col.maxlength) {
                input.maxLength = col.maxlength;
            }
            input.style.width = '100%';
            return input;
        }

        return null;
    }

    async function uploadImage(file, recordId, imageLetter) {
        const formData = new FormData();
        formData.append('files', file);
        formData.append('filePath', 'YAdvEvent');
        formData.append('recordId', recordId);
        formData.append('imageLetter', imageLetter);

        const response = await fetch('/api/uploadFile', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Image upload failed: ${errorText}`);
        }

        const result = await response.json();
        return result.files[0].storedAt;
    }

    async function deleteImage(imagePath) {
        if (!imagePath || imagePath.trim() === '') return;

        try {
            let relativePath = imagePath;
            if (imagePath.startsWith('/adCfgImages/')) {
                relativePath = imagePath.substring('/adCfgImages/'.length);
            } else if (imagePath.includes('/adCfgImages/')) {
                const pathParts = imagePath.split('/adCfgImages/');
                relativePath = pathParts[1];
            }

            const response = await fetch('/api/deleteFile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                body: JSON.stringify({ path: relativePath })
            });

            if (response.ok) {
                console.log('Image deleted successfully');
            }
        } catch (err) {
            console.error('Error deleting image:', err);
        }
    }

    async function saveRow(row, uniqueId, BASE_URL, operation) {
        const fields = {};
        const imageFields = ['PValue2', 'PValue3', 'PValue4', 'PValue5', 'PValue6'];
        const imageLetterMap = {
            'PValue2': 'A',
            'PValue3': 'B',
            'PValue4': 'C',
            'PValue5': 'D',
            'PValue6': 'E'
        };
        const recordId = uniqueId || `temp_${Date.now()}`;

        // Get all text/date/number/textarea fields
        row.querySelectorAll('.edit-field').forEach(el => {
            const field = el.dataset.field;
            if (field && !imageFields.includes(field)) {
                fields[field] = el.value.trim();
            }
        });

        // Handle image fields
        for (const imgField of imageFields) {
            const hiddenInput = row.querySelector(`input[type="hidden"][data-field="${imgField}"]`);
            const fileInput = row.querySelector(`input[type="file"][data-field="${imgField}_file"]`);

            if (hiddenInput) {
                const originalValue = hiddenInput.dataset.originalValue || '';
                const newFileSelected = hiddenInput.dataset.newFileSelected === 'true';

                if (fileInput && fileInput.files.length > 0 && newFileSelected) {
                    // Delete old image if exists
                    if (originalValue) {
                        await deleteImage(originalValue);
                    }
                    
                    // Upload new image
                    fields[imgField] = await uploadImage(
                        fileInput.files[0],
                        recordId,
                        imageLetterMap[imgField]
                    );
                } else {
                    // Keep existing image
                    fields[imgField] = originalValue;
                }
            }
        }

        // Validate required fields
        if (!fields.PMCd) {
            throw new Error('Title is required');
        }
        if (!fields.PDesc225) {
            throw new Error('Description is required');
        }
        if (!fields.PValue) {
            throw new Error('Start Date is required');
        }
        if (!fields.PValue1) {
            throw new Error('End Date is required');
        }
        if (!fields.PNum || parseFloat(fields.PNum) <= 0) {
            throw new Error('Duration must be greater than 0');
        }
        if (!fields.PValue2 || fields.PValue2.trim() === '') {
            throw new Error('At least Image 1 is required');
        }

        const modUsr = sessionStorage.getItem('modUsr') || '';

        const response = await fetch(`${BASE_URL}/updateData`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation: operation,
                yPIdNo: uniqueId,
                PMCd: fields.PMCd,
                PSCd: '',  // Not used but required by backend
                PDesc: '',  // Not used but required by backend
                PDesc225: fields.PDesc225,
                PValue: fields.PValue,
                PValue1: fields.PValue1,
                PNum: fields.PNum,
                PValue2: fields.PValue2,
                PValue3: fields.PValue3 || '',
                PValue4: fields.PValue4 || '',
                PValue5: fields.PValue5 || '',
                PValue6: fields.PValue6 || '',
                modUsr: modUsr
            })
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response. Please check API endpoint.');
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to update Advertisement Event');
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
        const recordId = `new_${Date.now()}`;

        const cells = visibleColumns.map(col => {
            const widthStyle = col.width ? `style="min-width: ${col.width};"` : '';

            if (!col.editable) {
                return `<td ${widthStyle}><span style="color: #999;">Auto</span></td>`;
            }

            if (col.type === 'textarea') {
                return `<td ${widthStyle}>
                  <textarea class="edit-field" data-field="${col.key}" 
                    maxlength="${col.maxlength || ''}" 
                    style="width: 100%; min-height: 60px; background-color: white;"></textarea>
                </td>`;
            }

            if (col.type === 'image') {
                return `<td ${widthStyle}>
                  <div>
                    <input type="file" accept="image/*" class="edit-field-file" 
                      data-field="${col.key}_file" data-image-letter="${col.imageLetter || ''}" 
                      style="font-size: 11px;">
                    <input type="hidden" class="edit-field" data-field="${col.key}" value="">
                    ${col.required ? '<span style="color: red;">*</span>' : ''}
                  </div>
                </td>`;
            }

            if (col.type === 'date') {
                return `<td ${widthStyle}>
                  <input type="date" class="edit-field" data-field="${col.key}" 
                    style="width: 100%; background-color: white;">
                </td>`;
            }

            if (col.type === 'number') {
                return `<td ${widthStyle}>
                  <input type="number" class="edit-field" data-field="${col.key}" 
                    step="any" style="width: 100%; background-color: white;">
                </td>`;
            }

            if (col.type === 'text') {
                const maxlength = col.maxlength ? `maxlength="${col.maxlength}"` : '';
                return `<td ${widthStyle}>
                  <input type="text" class="edit-field" data-field="${col.key}" 
                    ${maxlength} style="width: 100%; background-color: white;">
                </td>`;
            }

            return `<td ${widthStyle}></td>`;
        }).join('');

        const newRow = `<tr data-is-new="true" data-record-id="${recordId}" style="background-color: #e8e6dfff;">${cells}
      <td class="action-cell">
        <button class="action-btn save-btn" onclick="ConfigManager.saveNewRow()" title="Save">💾</button>
        <button class="action-btn cancel-btn" onclick="ConfigManager.cancelNewRow()" title="Cancel">❌</button>
      </td></tr>`;

        tableBody.insertAdjacentHTML('afterbegin', newRow);

        const firstInput = tableBody.querySelector('tr[data-is-new="true"] .edit-field, tr[data-is-new="true"] .edit-field-file');
        if (firstInput) {
            firstInput.focus();
        }
    }

    async function saveNewRow(row, BASE_URL, operation) {
        const fields = {};
        const imageFields = ['PValue2', 'PValue3', 'PValue4', 'PValue5', 'PValue6'];
        const imageLetterMap = {
            'PValue2': 'A',
            'PValue3': 'B',
            'PValue4': 'C',
            'PValue5': 'D',
            'PValue6': 'E'
        };
        const recordId = row.dataset.recordId || `new_${Date.now()}`;

        // Get all text/date/number fields
        row.querySelectorAll('.edit-field').forEach(el => {
            const field = el.dataset.field;
            if (field && !imageFields.includes(field)) {
                fields[field] = el.value.trim();
            }
        });

        // Handle image uploads
        for (const imgField of imageFields) {
            const fileInput = row.querySelector(`input[type="file"][data-field="${imgField}_file"]`);

            if (fileInput && fileInput.files.length > 0) {
                fields[imgField] = await uploadImage(
                    fileInput.files[0],
                    recordId,
                    imageLetterMap[imgField]
                );
            } else {
                fields[imgField] = '';
            }
        }

        // Validate required fields
        if (!fields.PMCd) {
            throw new Error('Title is required');
        }
        if (!fields.PDesc225) {
            throw new Error('Description is required');
        }
        if (!fields.PValue) {
            throw new Error('Start Date is required');
        }
        if (!fields.PValue1) {
            throw new Error('End Date is required');
        }
        if (!fields.PNum || parseFloat(fields.PNum) <= 0) {
            throw new Error('Duration must be greater than 0');
        }
        if (!fields.PValue2 || fields.PValue2.trim() === '') {
            throw new Error('At least Image 1 is required');
        }

        const modUsr = sessionStorage.getItem('modUsr') || '';

        const response = await fetch(`${BASE_URL}/addData`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation: operation,
                PMCd: fields.PMCd,
                PSCd: '',  // Not used but required by backend
                PDesc: '',  // Not used but required by backend
                PDesc225: fields.PDesc225,
                PValue: fields.PValue,
                PValue1: fields.PValue1,
                PNum: fields.PNum,
                PValue2: fields.PValue2,
                PValue3: fields.PValue3 || '',
                PValue4: fields.PValue4 || '',
                PValue5: fields.PValue5 || '',
                PValue6: fields.PValue6 || '',
                modUsr: modUsr
            })
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response. Please check API endpoint.');
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to add Advertisement Event');
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
                yPIdNo: uniqueId,
                modUsr: modUsr
            })
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response. Please check API endpoint.');
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to delete Advertisement Event');
        }

        // Delete associated images if returned
        if (result.data && result.data.imagePaths) {
            for (const imagePath of result.data.imagePaths) {
                if (imagePath && imagePath.trim() !== '') {
                    await deleteImage(imagePath);
                }
            }
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
        supportsAdd: true,
        supportsDelete: true
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = advEventOperation;
}