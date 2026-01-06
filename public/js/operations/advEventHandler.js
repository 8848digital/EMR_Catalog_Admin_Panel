const advEventOperation = (() => {
    const COLUMNS = [
        { key: 'yPIdNo', label: 'ID', hidden: true, editable: false, type: 'text', width: '80px' },
        { key: 'PTyp', label: 'Type', hidden: true },
        { key: 'PMCd', label: 'Title', editable: true, type: 'text', width: '200px', maxlength: 140 },
        { key: 'PDesc225', label: 'Description', editable: true, type: 'text', width: '250px', maxlength: 225 },
        { key: 'PValue', label: 'Start Date', editable: true, type: 'date', width: '150px' },
        { key: 'PValue1', label: 'End Date', editable: true, type: 'date', width: '150px' },
        { key: 'PNum', label: 'Duration', editable: true, type: 'number', width: '120px' },
        { key: 'PValue2', label: 'Image 1', editable: true, type: 'image', width: '120px', required: true, imageLetter: 'A' },
        { key: 'PValue3', label: 'Image 2', editable: true, type: 'image', width: '120px', imageLetter: 'B' },
        { key: 'PValue4', label: 'Image 3', editable: true, type: 'image', width: '120px', imageLetter: 'C' },
        { key: 'PValue5', label: 'Image 4', editable: true, type: 'image', width: '120px', imageLetter: 'D' },
        { key: 'PValue6', label: 'Image 5', editable: true, type: 'image', width: '120px', imageLetter: 'E' }
    ];

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
                return `<img src="${value}" alt="Image" class="image-display" style="max-width: 100px; max-height: 100px; cursor: pointer; display: block; border: 1px solid #ddd; border-radius: 4px;">`;
            } else {
                return '<span class="no-image-text" style="color: #999; font-size: 12px;">No image</span>';
            }
        }
        if (col.type === 'textarea') {
            return `<div class="textarea-display" style="max-height: 60px; overflow-y: auto; white-space: pre-wrap; cursor: text;">${value || ''}</div>`;
        }
        if (col.type === 'date') {
            if (value) {
                const date = new Date(value);
                return `<span class="date-display" style="cursor: text;">${date.toISOString().split('T')[0]}</span>`;
            }
            return '<span class="date-display" style="cursor: text; color: #999;">Select date</span>';
        }
        return null;
    }

    function createEditControl(col, value, row) {
        if (col.type === 'textarea') {
            const container = document.createElement('div');
            const textarea = document.createElement('textarea');
            textarea.className = 'edit-field';
            textarea.dataset.field = col.key;
            textarea.value = value || '';
            textarea.dataset.originalValue = value || '';
            textarea.style.width = '100%';
            textarea.style.minHeight = '60px';
            textarea.style.backgroundColor = 'white';
            if (col.maxlength) {
                textarea.maxLength = col.maxlength;
            }
            container.appendChild(textarea);
            return container;
        }

        if (col.type === 'date') {
            const container = document.createElement('div');
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
            input.style.backgroundColor = 'white';
            container.appendChild(input);
            return container;
        }

        if (col.type === 'number') {
            const container = document.createElement('div');
            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'edit-field';
            input.dataset.field = col.key;
            input.value = value || '';
            input.dataset.originalValue = value || '';
            input.step = 'any';
            input.style.width = '100%';
            input.style.backgroundColor = 'white';
            container.appendChild(input);
            return container;
        }

        if (col.type === 'text') {
            const container = document.createElement('div');
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
            input.style.backgroundColor = 'white';
            container.appendChild(input);
            return container;
        }

        if (col.type === 'image') {
            const container = document.createElement('div');
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '8px';
            container.style.alignItems = 'flex-start';

            // Image preview container
            const imagePreviewContainer = document.createElement('div');
            imagePreviewContainer.style.position = 'relative';
            imagePreviewContainer.className = 'image-preview-container';
            imagePreviewContainer.style.cursor = 'pointer';
            imagePreviewContainer.style.border = '2px dashed #ccc';
            imagePreviewContainer.style.padding = '10px';
            imagePreviewContainer.style.borderRadius = '4px';
            imagePreviewContainer.style.minHeight = '100px';
            imagePreviewContainer.style.minWidth = '100px';
            imagePreviewContainer.style.display = 'flex';
            imagePreviewContainer.style.alignItems = 'center';
            imagePreviewContainer.style.justifyContent = 'center';
            imagePreviewContainer.style.transition = 'all 0.3s ease';

            // Hidden input to store the image path
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.className = 'edit-field';
            hiddenInput.dataset.field = col.key;
            hiddenInput.value = value || '';
            hiddenInput.dataset.originalValue = value || '';

            // File input
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.className = 'edit-field-file';
            fileInput.dataset.field = `${col.key}_file`;
            fileInput.dataset.imageLetter = col.imageLetter || '';
            fileInput.style.display = 'none';

            // Function to update preview
            function updatePreview(imgSrc, isNewFile = false) {
                imagePreviewContainer.innerHTML = '';

                const img = document.createElement('img');
                img.src = imgSrc;
                img.style.maxWidth = '100px';
                img.style.maxHeight = '100px';
                img.style.cursor = 'pointer';
                img.style.display = 'block';
                img.style.borderRadius = '4px';
                img.style.objectFit = 'cover';

                if (isNewFile) {
                    imagePreviewContainer.style.border = '2px solid #4CAF50';
                    imagePreviewContainer.style.backgroundColor = '#f0fff0';
                } else {
                    imagePreviewContainer.style.border = '2px dashed #4CAF50';
                    imagePreviewContainer.style.backgroundColor = 'transparent';
                }

                imagePreviewContainer.appendChild(img);
            }

            // Initialize preview
            if (value && value.trim() !== '') {
                updatePreview(value, false);
            } else {
                const placeholder = document.createElement('div');
                placeholder.style.textAlign = 'center';
                placeholder.style.color = '#999';
                placeholder.innerHTML = `
                    <div style="font-size: 32px; margin-bottom: 5px;">📷</div>
                    <div style="font-size: 11px;">Click to upload</div>
                `;
                imagePreviewContainer.appendChild(placeholder);
            }

            // Hover effect
            imagePreviewContainer.addEventListener('mouseenter', () => {
                imagePreviewContainer.style.borderColor = '#4CAF50';
                imagePreviewContainer.style.backgroundColor = '#f9fff9';
            });

            imagePreviewContainer.addEventListener('mouseleave', () => {
                if (!hiddenInput.dataset.newFileSelected || hiddenInput.dataset.newFileSelected !== 'true') {
                    imagePreviewContainer.style.borderColor = '#ccc';
                    imagePreviewContainer.style.backgroundColor = 'transparent';
                } else {
                    imagePreviewContainer.style.borderColor = '#4CAF50';
                    imagePreviewContainer.style.backgroundColor = '#f0fff0';
                }
            });

            // Click handler for the preview container
            imagePreviewContainer.addEventListener('click', () => {
                fileInput.click();
            });

            // File input change handler
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    const file = e.target.files[0];

                    // Validate file type
                    if (!file.type.startsWith('image/')) {
                        alert('Please select a valid image file');
                        return;
                    }

                    // Validate file size (max 5MB)
                    if (file.size > 5 * 1024 * 1024) {
                        alert('File size must be less than 5MB');
                        return;
                    }

                    const reader = new FileReader();

                    reader.onload = (event) => {
                        updatePreview(event.target.result, true);
                        hiddenInput.dataset.newFileSelected = 'true';

                        // Update hint text
                        if (hint) {
                            hint.textContent = '✓ New image selected';
                            hint.style.color = '#4CAF50';
                            hint.style.fontWeight = 'bold';
                        }
                    };

                    reader.readAsDataURL(file);
                }
            });

            container.appendChild(imagePreviewContainer);
            container.appendChild(hiddenInput);
            container.appendChild(fileInput);

            // Add text hint below
            const hint = document.createElement('div');
            hint.style.fontSize = '11px';
            hint.style.color = '#666';
            hint.textContent = value && value.trim() !== '' ? 'Click image to change' : 'Click to upload';
            hint.className = 'image-hint';
            container.appendChild(hint);

            return container;
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

        // Get ALL text/date/number/textarea fields
        row.querySelectorAll('.edit-field:not([type="hidden"])').forEach(el => {
            const field = el.dataset.field;
            if (field && !imageFields.includes(field)) {
                fields[field] = el.value.trim();
            }
        });

        // Also check for textarea elements directly
        row.querySelectorAll('textarea.edit-field').forEach(el => {
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
                    // Keep original value
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
        const startDate = new Date(fields.PValue);
        const endDate = new Date(fields.PValue1);
        if (startDate >= endDate) {
            throw new Error('End Date must be after Start Date');
        }

        const modUsr = sessionStorage.getItem('modUsr') || '';

        const response = await fetch(`${BASE_URL}/updateData`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation: operation,
                yPIdNo: uniqueId,
                PMCd: fields.PMCd,
                PSCd: '',
                PDesc: '',
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

        const newRow = document.createElement('tr');
        newRow.dataset.isNew = 'true';
        newRow.dataset.recordId = recordId;
        newRow.style.backgroundColor = '#e8f4f8';

        visibleColumns.forEach(col => {
            const td = document.createElement('td');
            if (col.width) {
                td.style.minWidth = col.width;
            }

            if (!col.editable) {
                td.innerHTML = '<span style="color: #999;">Auto</span>';
            } else {
                // Use createEditControl for all editable fields to get consistent UI
                const editControl = createEditControl(col, '', {});
                if (editControl) {
                    td.appendChild(editControl);
                } else {
                    // Fallback for types not handled by createEditControl
                    td.innerHTML = '<input type="text" class="edit-field" style="width: 100%;">';
                }
            }

            newRow.appendChild(td);
        });

        // Add action buttons
        const actionTd = document.createElement('td');
        actionTd.className = 'action-cell';
        actionTd.innerHTML = `
            <button class="action-btn save-btn" onclick="ConfigManager.saveNewRow()" title="Save">💾</button>
            <button class="action-btn cancel-btn" onclick="ConfigManager.cancelNewRow()" title="Cancel">❌</button>
        `;
        newRow.appendChild(actionTd);

        tableBody.insertBefore(newRow, tableBody.firstChild);

        // Focus first input
        const firstInput = newRow.querySelector('.edit-field, input[type="date"], input[type="number"]');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
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

        row.querySelectorAll('.edit-field:not([type="hidden"])').forEach(el => {
            const field = el.dataset.field;
            if (field && !imageFields.includes(field)) {
                fields[field] = el.value.trim();
            }
        });

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
        const startDate = new Date(fields.PValue);
        const endDate = new Date(fields.PValue1);
        if (startDate >= endDate) {
            throw new Error('End Date must be after Start Date');
        }

        const modUsr = sessionStorage.getItem('modUsr') || '';

        const response = await fetch(`${BASE_URL}/addData`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation: operation,
                PMCd: fields.PMCd,
                PSCd: '',
                PDesc: '',
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