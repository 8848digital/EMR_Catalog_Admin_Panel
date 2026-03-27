const posOperation = (() => {
    const COLUMNS = [
        { key: 'Date', label: 'Date', editable: false, type: 'date', width: '150px' },
        { key: 'InvAmt', label: 'Invoice Amount', editable: false, type: 'number', width: '150px' },
        { key: 'ModeOfPayment', label: 'Mode of Payment', editable: false, type: 'text', width: '200px' },
        { key: 'OpeningAmount', label: 'Opening Amount', editable: false, type: 'number', width: '150px' },
        { key: 'ExpectedAmount', label: 'Expected Amount', editable: false, type: 'number', width: '150px' },
        { key: 'ClosingAmount', label: 'Closing Amount', editable: false, type: 'number', width: '150px' },
        { key: 'Difference', label: 'Difference', editable: false, type: 'number', width: '150px' },
        { key: 'closingStatus', label: 'Closing Status', editable: false, type: 'text', width: '120px' },
        { key: 'ModUsr', label: 'User', editable: false, type: 'text', width: '150px' }
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
            throw new Error(result.error || 'Failed to load POS data');
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
    module.exports = posOperation;
}
window.posOperation = posOperation;
