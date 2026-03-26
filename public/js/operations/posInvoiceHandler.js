const posInvoiceOperation = (() => {
    const COLUMNS = [
        { key: 'Date', label: 'Date', editable: false, type: 'date', width: '150px' },
        { key: 'InvNo', label: 'Invoice No', editable: false, type: 'text', width: '200px' },
        { key: 'ModeOfPayment', label: 'Mode of Payment', editable: false, type: 'text', width: '200px' },
        { key: 'Amount', label: 'Amount', editable: false, type: 'number', width: '150px' }
    ];

    function getColumns() {
        return COLUMNS;
    }

    function generateRowId(row) {
        return row.yId;
    }

    async function loadData(BASE_URL, operation) {
        const response = await fetch(`${BASE_URL}/getData?operation=${operation}`);

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response. Please check API endpoint.');
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to load POS Invoice data');
        }

        return result.data || [];
    }

    return {
        getColumns,
        generateRowId,
        loadData,
        supportsAdd: false,
        supportsEdit: false,
        supportsDelete: false
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = posInvoiceOperation;
}
window.posInvoiceOperation = posInvoiceOperation;
