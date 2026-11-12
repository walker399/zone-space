const results = [];
function check(name, run) {
    try { run(); results.push('PASS ' + name); }
    catch (error) { results.push('FAIL ' + name + ': ' + error.message); }
}
function equal(actual, expected) {
    if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new Error(JSON.stringify(actual) + ' != ' + JSON.stringify(expected));
}
const fields = {};
document.getElementById = id => fields[id] ||= { value: '', textContent: '', innerHTML: '' };
let currentUser = { username: 'admin', role: 'Admin' };
auth.getCurrentUser = () => currentUser;
app.getDeviceDateString = () => '2026-11-12';
fields['report-type-filter'] = { value: 'monthly' };
fields['report-user-filter'] = { value: 'all' };
fields['scope-user-filter'] = { value: 'admin' };
const receipts = [
    { id: 1, amount: 10, subType: 'Daily', createdBy: 'admin', createdAt: '2026-11-01T10:00:00+02:00', closingId: 1 },
    { id: 2, amount: 70, subType: 'Weekly', createdBy: 'user', createdAt: '2026-11-05T10:00:00+02:00', paymentMethod: 'Card', closingId: 2 },
    { id: 3, amount: 400, subType: 'Monthly', createdBy: 'user', createdAt: '2026-11-12T23:59:59+02:00' },
    { id: 4, amount: 500, subType: 'Monthly', createdBy: 'admin', createdAt: '2026-10-31T10:00:00+02:00' },
    { id: 5, amount: 50, subType: 'Booking', createdBy: 'admin', createdAt: '2026-11-13T10:00:00+02:00' },
    { id: 6, amount: 999, subType: 'Daily', createdBy: 'admin', createdAt: '2026-11-07T10:00:00+02:00', status: 'Cancelled' },
    { id: 7, amount: 20, subType: 'InternetCard', createdBy: 'user', createdAt: '2026-11-08T10:00:00+02:00', status: 'Expired' }
].map(r => ({ receiptNo: String(r.id), ...r }));
db._write('receipts', receipts);
db._write('settings', { currency: 'LYD' });
db._write('closings', [{ id: 1, closedBy: 'admin', dateClosed: '2026-11-01', closedAt: '2026-11-01T10:00:00+02:00', totalCash: 10, totalCard: 0, totalAmount: 10 }, { id: 2, closedBy: 'user', dateClosed: '2026-11-05', closedAt: '2026-11-05T10:00:00+02:00', totalCash: 0, totalCard: 70, totalAmount: 70 }]);
check('monthly period includes every sale type, closed receipts and expired subscriptions', () => {
    equal(app.getReportReceipts().map(r => r.id), [1, 2, 3, 7]);
    equal(app.getReportReceipts().reduce((s, r) => s + r.amount, 0), 500);
});
check('screen totals and closing list ignore dashboard scope', () => {
    app.renderReportTable();
    equal(fields['report-total-revenue'].textContent, '500.00');
    equal(fields['report-cash-total'].textContent, '430.00');
    equal(fields['report-card-total'].textContent, '70.00');
    if (!fields['report-closings-rows'].innerHTML.includes('user')) throw Error('Missing employee closing');
});
check('print agrees with screen and period', () => {
    app.populateReportPrint(app.getReportReceipts());
    equal(fields['report-print-total'].textContent, '500.00 LYD');
    if (!fields['report-print-period'].textContent.includes('2026-11-01')) throw Error('Missing start date');
});
check('CSV exports the same monthly total', () => {
    const OriginalBlob = window.Blob;
    const originalURL = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    const originalCreateElement = document.createElement.bind(document);
    const originalAlert = app.showAlert;
    let csv = '';
    try {
        window.Blob = class { constructor(parts) { csv = parts.join(''); } };
        URL.createObjectURL = () => 'blob:test';
        URL.revokeObjectURL = () => {};
        document.createElement = tag => {
            const element = originalCreateElement(tag);
            if (tag === 'a') element.click = () => {};
            return element;
        };
        app.showAlert = () => {};
        app.exportReportCSV();
        if (!csv.includes('"500.00"')) throw Error('Wrong CSV total');
        if (csv.includes('"999.00"')) throw Error('Cancelled sale exported');
    } finally {
        window.Blob = OriginalBlob;
        URL.createObjectURL = originalURL;
        URL.revokeObjectURL = originalRevoke;
        document.createElement = originalCreateElement;
        app.showAlert = originalAlert;
    }
});
check('explicit monthly dates include both boundaries and previous months', () => {
    fields['report-date-from'].value = '2026-10-31';
    fields['report-date-to'].value = '2026-11-01';
    equal(app.getReportReceipts().map(r => r.id), [1, 4]);
    fields['report-date-from'].value = '';
    fields['report-date-to'].value = '';
});
check('employee filter and employee permissions', () => {
    fields['report-user-filter'].value = 'user';
    equal(app.getReportReceipts().map(r => r.id), [2, 3, 7]);
    currentUser = { username: 'admin', role: 'User' };
    equal(app.getReportReceipts().map(r => r.id), [1]);
    currentUser = null;
    equal(app.getReportReceipts(), []);
    currentUser = { username: 'admin', role: 'Admin' };
    fields['report-user-filter'].value = 'all';
});
check('daily and weekly defaults and invalid ranges', () => {
    fields['report-type-filter'].value = 'daily';
    equal(app.getReportPeriod(), { fromDate: '2026-11-12', toDate: '2026-11-12' });
    fields['report-type-filter'].value = 'weekly';
    equal(app.getReportPeriod(), { fromDate: '2026-11-06', toDate: '2026-11-12' });
    fields['report-date-from'].value = '2026-11-12';
    fields['report-date-to'].value = '2026-11-01';
    app.renderReportTable();
    equal(app.getReportReceipts(), []);
    if (!fields['report-period-description'].textContent.includes('غير صحيحة')) throw Error('Missing range validation');
    fields['report-date-from'].value = '';
    fields['report-date-to'].value = '';
    fields['report-type-filter'].value = 'monthly';
});
check('report reads preserve historical data', () => {
    const before = JSON.stringify([db.getReceipts(), db.getClosings()]);
    app.renderReportTable(); app.populateReportPrint(app.getReportReceipts());
    equal(JSON.stringify([db.getReceipts(), db.getClosings()]), before);
});
check('explicit closing recalculation persists after reload', () => {
    db.updateReceipt(1, { amount: 15 });
    db.recalculateClosing(1);
    equal(db.getClosingById(1).totalAmount, 15);
});
check('initialization preserves legacy rent receipts and saved closing totals', () => {
    db._write('receipts', [...db.getReceipts(), { id: 8, subType: 'Rent', amount: 100 }]);
    const before = JSON.stringify([db.getReceipts(), db.getClosings()]);
    db.init();
    equal(JSON.stringify([db.getReceipts(), db.getClosings()]), before);
});
document.body.innerHTML = '<pre id="results">' + results.join('\n') + '</pre>';
