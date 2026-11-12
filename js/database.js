/**
 * Zone Space Database Persistence Layer (localStorage SQL Simulator)
 * Saved in cbl-m1 folder
 * Default password is '12345'
 * Sequential receipt number format '000001'
 */

const DB_PREFIX = "zonespace_cbl_";

const db = {
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash |= 0;
        }
        return "zs_hash_" + Math.abs(hash) + "_" + btoa(password).replace(/=/g, "");
    },

    verifyPassword(password, storedHash) {
        return this.hashPassword(password) === storedHash;
    },

    _read(table) {
        const data = localStorage.getItem(DB_PREFIX + table);
        return data ? JSON.parse(data) : [];
    },

    _write(table, data) {
        localStorage.setItem(DB_PREFIX + table, JSON.stringify(data));
    },

    init() {
        if (!localStorage.getItem(DB_PREFIX + "users")) {
            const defaultUsers = [
                {
                    id: 1,
                    username: "superadmin",
                    password: this.hashPassword("12345"),
                    fullname: "المدير العام (Super Admin)",
                    role: "SuperAdmin",
                    status: "Active",
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    username: "admin",
                    password: this.hashPassword("12345"),
                    fullname: "مدير النظام (Admin)",
                    role: "Admin",
                    status: "Active",
                    createdAt: new Date().toISOString()
                },
                {
                    id: 3,
                    username: "user",
                    password: this.hashPassword("12345"),
                    fullname: "موظف مبيعات (User)",
                    role: "User",
                    status: "Active",
                    createdAt: new Date().toISOString()
                }
            ];
            this._write("users", defaultUsers);
        }

        const defaultSettings = {
            systemName: "ZONE SPACE",
            systemLogo: "🟢",
            currency: "LYD",
            receiptFooter: "شكراً لزيارتكم - ZONE SPACE",
            dailyPrice: 10.00,
            weeklyPrice: 70.00,
            monthlyPrice: 400.00
        };

        const initialData = window.initialZoneSpaceData || {};

        if (!localStorage.getItem(DB_PREFIX + "settings")) {
            const settings = { ...defaultSettings, ...(initialData.settings || {}) };
            localStorage.setItem(DB_PREFIX + "settings", JSON.stringify(settings));
        }

        const tables = ["subscribers", "receipts", "payments", "bookings", "rents", "closings", "activity_logs"];
        tables.forEach(table => {
            if (!localStorage.getItem(DB_PREFIX + table)) {
                if (Array.isArray(initialData[table])) {
                    this._write(table, initialData[table]);
                } else {
                    this._write(table, []);
                }
            }
        });

        this.logActivity(1, "superadmin", "System Initialized", "تم تهيئة قاعدة البيانات بنجاح في مجلد cbl-m1.");
    },

    getUsers() {
        return this._read("users");
    },

    getUserById(id) {
        return this.getUsers().find(u => u.id === parseInt(id));
    },

    getUserByUsername(username) {
        return this.getUsers().find(u => u.username.toLowerCase() === username.toLowerCase());
    },

    saveUser(user) {
        const users = this.getUsers();
        if (user.id) {
            const index = users.findIndex(u => u.id === parseInt(user.id));
            if (index !== -1) {
                if (user.password && !user.password.startsWith("zs_hash_")) {
                    user.password = this.hashPassword(user.password);
                } else {
                    user.password = users[index].password;
                }
                users[index] = { ...users[index], ...user, id: parseInt(user.id) };
                this._write("users", users);
                return users[index];
            }
        } else {
            const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
            const newUser = {
                id: newId,
                username: user.username,
                password: this.hashPassword(user.password || "12345"),
                fullname: user.fullname,
                role: user.role || "User",
                status: user.status || "Active",
                createdAt: new Date().toISOString()
            };
            users.push(newUser);
            this._write("users", users);
            return newUser;
        }
        return null;
    },

    deleteUser(id) {
        const users = this.getUsers();
        const updated = users.filter(u => u.id !== parseInt(id));
        this._write("users", updated);
        return true;
    },

    getSubscribers() {
        return this._read("subscribers");
    },

    addSubscriber(name, phone) {
        const subscribers = this.getSubscribers();
        const existing = subscribers.find(s => s.name.trim() === name.trim() && s.phone === phone);
        if (existing) return existing;

        const newId = subscribers.length > 0 ? Math.max(...subscribers.map(s => s.id)) + 1 : 1;
        const newSub = {
            id: newId,
            name: name.trim(),
            phone: phone || "",
            createdAt: new Date().toISOString()
        };
        subscribers.push(newSub);
        this._write("subscribers", subscribers);
        return newSub;
    },

    getReceipts() {
        return this._read("receipts");
    },

    getNextReceiptNo() {
        const receipts = this.getReceipts();
        const nextNum = receipts.length + 1;
        return String(nextNum).padStart(6, "0");
    },

    getReceiptById(receiptId) {
        return this.getReceipts().find(r => r.id === parseInt(receiptId, 10));
    },

    cancelReceipt(receiptId) {
        const receipts = this.getReceipts();
        const index = receipts.findIndex(r => r.id === parseInt(receiptId, 10));
        if (index === -1) return null;

        receipts[index].status = 'Cancelled';
        this._write("receipts", receipts);
        return receipts[index];
    },

    activateReceipt(receiptId) {
        const receipts = this.getReceipts();
        const index = receipts.findIndex(r => r.id === parseInt(receiptId, 10));
        if (index === -1) return null;

        receipts[index].status = 'Active';
        this._write("receipts", receipts);
        return receipts[index];
    },

    updateReceipt(receiptId, updates) {
        const receipts = this.getReceipts();
        const index = receipts.findIndex(r => r.id === parseInt(receiptId, 10));
        if (index === -1) return null;

        const oldAmount = receipts[index].amount || 0;
        const newAmount = updates['amount'] !== undefined ? parseFloat(updates['amount']) : oldAmount;
        const amountDiff = newAmount - oldAmount;

        const allowedFields = ['subType', 'amount', 'startDate', 'endDate', 'comment', 'status', 'paymentMethod', 'serialNumber'];
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                receipts[index][field] = field === 'amount' ? parseFloat(updates[field]) : updates[field];
            }
        });

        if (receipts[index].closingId && amountDiff !== 0) {
            const closings = this.getClosings();
            const closingIndex = closings.findIndex(c => c.id === receipts[index].closingId);
            if (closingIndex !== -1) {
                const method = receipts[index].paymentMethod || 'Cash';
                if (method === 'Cash') closings[closingIndex].totalCash += amountDiff;
                if (method === 'Card') closings[closingIndex].totalCard += amountDiff;
                closings[closingIndex].totalAmount += amountDiff;

                const subType = receipts[index].subType;
                if (['Daily', 'Weekly', 'Monthly'].includes(subType) && closings[closingIndex].totalSubscriptions !== undefined) {
                    closings[closingIndex].totalSubscriptions += amountDiff;
                } else if (['Rent', 'Booking'].includes(subType) && closings[closingIndex].totalRents !== undefined) {
                    closings[closingIndex].totalRents += amountDiff;
                } else if (subType === 'InternetCard' && closings[closingIndex].totalInternet !== undefined) {
                    closings[closingIndex].totalInternet += amountDiff;
                }
                this._write("closings", closings);
            }
        }

        this._write("receipts", receipts);
        return receipts[index];
    },

    deleteReceipt(receiptId) {
        const receipts = this.getReceipts();
        const remaining = receipts.filter(r => r.id !== parseInt(receiptId, 10));
        this._write("receipts", remaining);

        const payments = this.getPayments();
        const remainingPayments = payments.filter(p => p.receiptId !== parseInt(receiptId, 10));
        this._write("payments", remainingPayments);
        return true;
    },

    addReceipt(receiptData) {
        const receipts = this.getReceipts();
        const newId = receipts.length > 0 ? Math.max(...receipts.map(r => r.id)) + 1 : 1;
        const receiptNo = this.getNextReceiptNo();

        const newReceipt = {
            id: newId,
            receiptNo: receiptNo,
            subscriberId: receiptData.subscriberId || null,
            subType: receiptData.subType,
            amount: parseFloat(receiptData.amount),
            startDate: receiptData.startDate || null,
            endDate: receiptData.endDate || null,
            comment: receiptData.comment || '',
            status: receiptData.status || 'Active',
            paymentMethod: receiptData.paymentMethod || 'Cash',
            serialNumber: receiptData.serialNumber || null,
            createdBy: receiptData.createdBy,
            createdAt: new Date().toISOString()
        };

        receipts.push(newReceipt);
        this._write("receipts", receipts);

        this.addPayment(newId, newReceipt.amount);

        return newReceipt;
    },

    getPayments() {
        return this._read("payments");
    },

    addPayment(receiptId, amount) {
        const payments = this.getPayments();
        const newId = payments.length > 0 ? Math.max(...payments.map(p => p.id)) + 1 : 1;
        const newPayment = {
            id: newId,
            receiptId: receiptId,
            amount: parseFloat(amount),
            paymentDate: new Date().toISOString()
        };
        payments.push(newPayment);
        this._write("payments", payments);
        return newPayment;
    },

    getBookings() {
        return this._read("bookings");
    },

    addBooking(bookingData) {
        const bookings = this.getBookings();
        const newId = bookings.length > 0 ? Math.max(...bookings.map(b => b.id)) + 1 : 1;

        // Register/reuse the client as a subscriber, and issue a receipt sharing
        // the same sequential numbering used for subscription receipts.
        const subscriber = this.addSubscriber(bookingData.name, bookingData.phone);
        const receipt = this.addReceipt({
            subscriberId: subscriber.id,
            subType: 'Booking',
            amount: parseFloat(bookingData.total),
            startDate: new Date().toISOString().split('T')[0],
            endDate: null,
            comment: `حجز ${bookingData.room} - ${bookingData.hours} ساعة`,
            status: 'Active',
            createdBy: bookingData.createdBy || 'unknown'
        });

        const newBooking = {
            id: newId,
            room: bookingData.room,
            name: bookingData.name,
            phone: bookingData.phone,
            hours: parseInt(bookingData.hours, 10),
            rate: parseFloat(bookingData.rate),
            total: parseFloat(bookingData.total),
            notes: bookingData.notes || '',
            status: 'Confirmed',
            receiptId: receipt.id,
            receiptNo: receipt.receiptNo,
            createdAt: new Date().toISOString()
        };
        bookings.push(newBooking);
        this._write("bookings", bookings);
        return newBooking;
    },

    updateBooking(bookingId, updates) {
        const bookings = this.getBookings();
        const index = bookings.findIndex(b => b.id === parseInt(bookingId, 10));
        if (index === -1) return null;

        const allowedFields = ['room', 'name', 'phone', 'hours', 'rate', 'total', 'notes'];
        allowedFields.forEach(field => {
            if (updates[field] === undefined) return;
            if (field === 'hours') {
                bookings[index][field] = parseInt(updates[field], 10);
            } else if (field === 'rate' || field === 'total') {
                bookings[index][field] = parseFloat(updates[field]);
            } else {
                bookings[index][field] = updates[field];
            }
        });

        this._write("bookings", bookings);

        // Keep the linked receipt's amount/comment in sync with the booking
        if (bookings[index].receiptId) {
            this.updateReceipt(bookings[index].receiptId, {
                amount: bookings[index].total,
                comment: `حجز ${bookings[index].room} - ${bookings[index].hours} ساعة`
            });
        }

        return bookings[index];
    },

    toggleBookingStatus(bookingId) {
        const bookings = this.getBookings();
        const index = bookings.findIndex(b => b.id === parseInt(bookingId, 10));
        if (index === -1) return null;
        bookings[index].status = bookings[index].status === 'Confirmed' ? 'Cancelled' : 'Confirmed';
        this._write("bookings", bookings);
        return bookings[index];
    },

    getRents() {
        return this._read("rents");
    },

    addRent(rentData) {
        const rents = this.getRents();
        const newId = rents.length > 0 ? Math.max(...rents.map(r => r.id)) + 1 : 1;

        // Every rent payment also issues a receipt sharing the same sequential numbering
        const receipt = this.addReceipt({
            subscriberId: null,
            subType: 'Rent',
            amount: parseFloat(rentData.amount),
            startDate: new Date().toISOString().split('T')[0],
            endDate: null,
            comment: [rentData.rentType, rentData.notes].filter(Boolean).join(' - '),
            status: 'Active',
            paymentMethod: rentData.paymentMethod || 'Cash',
            createdBy: rentData.createdBy || 'unknown'
        });

        const newRent = {
            id: newId,
            rentType: rentData.rentType,
            amount: parseFloat(rentData.amount),
            paymentMethod: rentData.paymentMethod || 'Cash',
            notes: rentData.notes || '',
            receiptId: receipt.id,
            receiptNo: receipt.receiptNo,
            createdBy: rentData.createdBy || 'unknown',
            createdAt: new Date().toISOString()
        };
        rents.push(newRent);
        this._write("rents", rents);
        return newRent;
    },

    getClosings() {
        return this._read("closings");
    },

    // Closes today's not-yet-closed receipts (subscriptions/bookings/rents all share the
    // Receipts table) created by `username`. Marks them with a closingId — nothing is
    // deleted — and stores a totals summary in the closings log.
    closeDailyAccount(username) {
        const today = new Date().toISOString().split('T')[0];
        const receipts = this.getReceipts();

        const eligible = receipts.filter(r =>
            r.createdBy === username &&
            !r.closingId &&
            (r.createdAt || '').split('T')[0] === today
        );

        if (eligible.length === 0) return null;

        const closings = this.getClosings();
        const newId = closings.length > 0 ? Math.max(...closings.map(c => c.id)) + 1 : 1;

        const totalCash = eligible.filter(r => (r.paymentMethod || 'Cash') === 'Cash').reduce((s, r) => s + r.amount, 0);
        const totalCard = eligible.filter(r => r.paymentMethod === 'Card').reduce((s, r) => s + r.amount, 0);

        const totalSubscriptions = eligible.filter(r => ['Daily', 'Weekly', 'Monthly'].includes(r.subType)).reduce((s, r) => s + r.amount, 0);
        const totalRents = eligible.filter(r => ['Rent', 'Booking'].includes(r.subType)).reduce((s, r) => s + r.amount, 0);
        const totalInternet = eligible.filter(r => r.subType === 'InternetCard').reduce((s, r) => s + r.amount, 0);
        const internetCardsCount = eligible.filter(r => r.subType === 'InternetCard').length;

        const newClosing = {
            id: newId,
            closedBy: username,
            receiptsCount: eligible.length,
            totalCash,
            totalCard,
            totalAmount: totalCash + totalCard,
            totalSubscriptions,
            totalRents,
            totalInternet,
            internetCardsCount,
            dateClosed: today,
            closedAt: new Date().toISOString()
        };

        eligible.forEach(r => { r.closingId = newId; });
        this._write("receipts", receipts);

        closings.push(newClosing);
        this._write("closings", closings);
        return newClosing;
    },

    getSettings() {
        const settings = localStorage.getItem(DB_PREFIX + "settings");
        return settings ? JSON.parse(settings) : {};
    },

    saveSettings(newSettings) {
        const current = this.getSettings();
        const updated = { ...current, ...newSettings };
        localStorage.setItem(DB_PREFIX + "settings", JSON.stringify(updated));
        return updated;
    },

    getLogs() {
        return this._read("activity_logs");
    },

    logActivity(userId, username, action, details) {
        const logs = this.getLogs();
        const newId = logs.length > 0 ? Math.max(...logs.map(l => l.id)) + 1 : 1;
        const newLog = {
            id: newId,
            userId: userId,
            username: username,
            action: action,
            details: details || "",
            timestamp: new Date().toISOString()
        };
        logs.push(newLog);
        this._write("activity_logs", logs);
        if (logs.length > 1000) {
            logs.shift();
            this._write("activity_logs", logs);
        }
        return newLog;
    }
};

db.init();
window.db = db;
