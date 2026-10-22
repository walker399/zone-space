const app = {
    state: {
        selectedSubscriptionType: null
    },

    init() {
        this.bindNavItems();
        this.bindModalCloseButtons();
        this.bindLogoutButton();
        this.bindReceiptSearch();
        this.bindReportFilters();
        this.bindSubscriptionForm();
        this.bindUserForm();
        this.bindSettingsForms();
        this.bindActionMenus();
        this.bindReceiptEditForm();
        this.bindBookingForm();
        this.bindBookingEditForm();
        this.bindRentForm();
        this.updateCurrentDate();
        this.updateUserProfile();
        this.applyRoleAccess();
        this.resetSubscriptionFlow();
        this.loadSettingsForms();
        this.renderDashboardStats();
        this.renderLatestReceipts();
        this.renderReceiptSearch();
        this.renderReportTable();
        this.renderBookings();
        this.renderRents();
        this.renderClosingPage();
        this.renderSubscribers();
        this.renderUsers();
        this.renderProfilePage();
    },

    // Close any open "تخصيص" action dropdown menus when clicking elsewhere or scrolling.
    // Scrolling INSIDE the dropdown menu itself must keep it open so all items can be reached.
    bindActionMenus() {
        document.addEventListener('click', () => {
            this.closeActionsMenus();
        });
        window.addEventListener('scroll', (event) => {
            if (event.target && event.target.classList && event.target.classList.contains('dropdown-menu')) {
                return;
            }
            this.closeActionsMenus();
        }, true);
    },

    closeActionsMenus() {
        document.querySelectorAll('.dropdown-menu.open').forEach(menu => {
            menu.classList.remove('open');
        });
    },

    toggleActionsMenu(event, menuId) {
        event.stopPropagation();
        const menu = document.getElementById(menuId);
        if (!menu) return;

        const wasOpen = menu.classList.contains('open');
        this.closeActionsMenus();
        if (wasOpen) return;

        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        const viewportPadding = 8;

        // Reset inline positioning so the menu can be measured at its natural size
        menu.style.left = 'auto';
        menu.style.top = 'auto';
        menu.style.right = 'auto';
        menu.style.maxHeight = '';
        menu.style.maxWidth = '';
        menu.classList.add('open');

        const menuWidth = menu.offsetWidth || 180;
        const menuHeight = menu.offsetHeight;

        // Horizontal placement: keep the whole menu inside the viewport
        const maxLeft = Math.max(viewportPadding, window.innerWidth - menuWidth - viewportPadding);
        menu.style.left = `${Math.min(Math.max(viewportPadding, rect.right - menuWidth), maxLeft)}px`;

        // Vertical placement: try downward first, then upward, then clamp inside the viewport
        const maxHeight = Math.max(100, window.innerHeight - (viewportPadding * 2));
        menu.style.maxHeight = `${maxHeight}px`;
        menu.style.overflowY = 'auto';

        let top = rect.bottom + 4;
        if (top + menuHeight > window.innerHeight - viewportPadding) {
            top = rect.top - menuHeight - 4;
        }
        top = Math.max(viewportPadding, Math.min(top, window.innerHeight - menuHeight - viewportPadding));

        menu.style.top = `${top}px`;
    },

    bindNavItems() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', event => {
                event.preventDefault();
                const target = item.dataset.target;
                if (target) {
                    this.activatePage(target);
                }
            });
        });
    },

    bindModalCloseButtons() {
        const closeButtons = document.querySelectorAll('.modal-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => this.closeModals());
        });
    },

    bindLogoutButton() {
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', event => {
                event.preventDefault();
                auth.logout();
            });
        }
    },

    bindReceiptSearch() {
        const searchInput = document.getElementById('search-query');
        const filterType = document.getElementById('filter-type');
        const filterDate = document.getElementById('filter-date');

        const refresh = () => {
            this.renderReceiptSearch();
            this.renderLatestReceipts();
            this.renderReportTable();
        };

        if (searchInput) {
            searchInput.addEventListener('input', refresh);
        }
        if (filterType) {
            filterType.addEventListener('change', refresh);
        }
        if (filterDate) {
            filterDate.addEventListener('change', refresh);
        }
    },

    bindReportFilters() {
        const reportType = document.getElementById('report-type-filter');
        const reportUser = document.getElementById('report-user-filter');
        const reportFrom = document.getElementById('report-date-from');
        const reportTo = document.getElementById('report-date-to');

        const refresh = () => this.renderReportTable();

        if (reportType) {
            reportType.addEventListener('change', refresh);
        }
        if (reportUser) {
            reportUser.addEventListener('change', refresh);
        }
        if (reportFrom) {
            reportFrom.addEventListener('change', refresh);
        }
        if (reportTo) {
            reportTo.addEventListener('change', refresh);
        }

        this.populateReportUserFilter();
    },

    populateReportUserFilter() {
        const reportUser = document.getElementById('report-user-filter');
        if (!reportUser) return;

        const users = db.getUsers();
        reportUser.innerHTML = `
            <option value="all">كل الموظفين</option>
            ${users.map(user => `<option value="${user.username}">${user.fullname} (${user.role})</option>`).join('')}
        `;
    },

    bindSubscriptionForm() {
        const form = document.getElementById('subscription-form');
        if (!form) return;

        form.addEventListener('submit', event => {
            event.preventDefault();
            this.handleSubscriptionFormSubmit();
        });

        const typeSelect = document.getElementById('sub-type-select');
        if (typeSelect) {
            typeSelect.addEventListener('change', () => {
                const type = typeSelect.value;
                if (type) {
                    this.selectSubscriptionType(type);
                }
            });
        }
    },

    bindReceiptEditForm() {
        const form = document.getElementById('receipt-edit-form');
        if (!form) return;

        form.addEventListener('submit', event => {
            event.preventDefault();
            this.handleReceiptEditFormSubmit();
        });

        const typeSelect = document.getElementById('edit-receipt-type');
        if (typeSelect) {
            typeSelect.addEventListener('change', () => {
                this.toggleEditEndDateField(typeSelect.value);
            });
        }
    },

    bindUserForm() {
        const form = document.getElementById('user-form');
        if (!form) return;

        form.addEventListener('submit', event => {
            event.preventDefault();
            this.handleUserFormSubmit();
        });

        const statusSwitch = document.getElementById('user-status-switch');
        if (statusSwitch) {
            statusSwitch.addEventListener('change', () => {
                const statusText = document.getElementById('user-status-text');
                if (statusText) {
                    if (statusSwitch.checked) {
                        statusText.textContent = 'Active (نشط)';
                        statusText.style.color = 'var(--success)';
                    } else {
                        statusText.textContent = 'Suspended (موقوف)';
                        statusText.style.color = 'var(--danger)';
                    }
                }
            });
        }
    },

    bindSettingsForms() {
        const brandingForm = document.getElementById('settings-branding-form');
        const pricingForm = document.getElementById('settings-pricing-form');

        if (brandingForm) {
            brandingForm.addEventListener('submit', event => {
                event.preventDefault();
                this.handleSettingsBrandingSubmit();
            });
        }

        if (pricingForm) {
            pricingForm.addEventListener('submit', event => {
                event.preventDefault();
                this.handleSettingsPricingSubmit();
            });
        }
    },

    bindReportFilters() {
        const reportType = document.getElementById('report-type-filter');
        const reportUser = document.getElementById('report-user-filter');
        const reportFrom = document.getElementById('report-date-from');
        const reportTo = document.getElementById('report-date-to');

        const refresh = () => this.renderReportTable();

        if (reportType) {
            reportType.addEventListener('change', refresh);
        }
        if (reportUser) {
            reportUser.addEventListener('change', refresh);
        }
        if (reportFrom) {
            reportFrom.addEventListener('change', refresh);
        }
        if (reportTo) {
            reportTo.addEventListener('change', refresh);
        }

        this.populateReportUserFilter();
    },

    populateReportUserFilter() {
        const reportUser = document.getElementById('report-user-filter');
        if (!reportUser) return;

        const users = db.getUsers();
        reportUser.innerHTML = `
            <option value="all">كل الموظفين</option>
            ${users.map(user => `<option value="${user.username}">${user.fullname} (${user.role})</option>`).join('')}
        `;
    },

    bindBookingForm() {
        const form = document.getElementById('booking-form');
        const hours = document.getElementById('booking-hours');
        const rate = document.getElementById('booking-rate');

        const refreshTotal = () => this.calculateBookingTotal();

        if (form) {
            form.addEventListener('submit', event => {
                event.preventDefault();
                this.handleBookingFormSubmit();
            });
        }
        if (hours) {
            hours.addEventListener('input', refreshTotal);
        }
        if (rate) {
            rate.addEventListener('input', refreshTotal);
        }
    },

    activatePage(target) {
        const targetSection = document.getElementById(target);
        if (targetSection && targetSection.style.display === 'none') {
            this.showAlert('غير مسموح لك بالدخول لهذه الصفحة.', 'warning');
            this.activatePage('dashboard');
            return;
        }

        const sections = document.querySelectorAll('.page-section');
        sections.forEach(section => {
            section.classList.toggle('active', section.id === target);
        });

        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.target === target);
        });

        if (target === 'profile') {
            this.renderProfilePage();
        }
        if (target === 'closing') {
            this.renderClosingPage();
        }
    },

    showNewSubscriptionModal() {
        this.closeModals();
        this.resetSubscriptionFlow();
        const modal = document.getElementById('subscription-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    },

    showBookingModal() {
        this.activatePage('bookings');
        const roomInput = document.getElementById('booking-room');
        const nameInput = document.getElementById('booking-name');
        const phoneInput = document.getElementById('booking-phone');
        const hoursInput = document.getElementById('booking-hours');
        const rateInput = document.getElementById('booking-rate');
        const totalInput = document.getElementById('booking-total');

        if (roomInput) roomInput.value = '';
        if (nameInput) nameInput.value = '';
        if (phoneInput) phoneInput.value = '';
        if (hoursInput) hoursInput.value = '';
        if (rateInput) rateInput.value = '';
        if (totalInput) totalInput.value = '';
    },

    showAddUserModal() {
        this.closeModals();
        const modal = document.getElementById('user-modal');
        if (modal) {
            const title = document.getElementById('user-modal-title');
            const idField = document.getElementById('user-id-field');
            const nameInput = document.getElementById('user-fullname-input');
            const usernameInput = document.getElementById('user-username-input');
            const passwordInput = document.getElementById('user-password-input');
            const passwordHint = document.getElementById('user-password-hint');
            const statusText = document.getElementById('user-status-text');
            const statusSwitch = document.getElementById('user-status-switch');
            const canEditReceiptsSwitch = document.getElementById('user-can-edit-receipts-switch');

            if (title) title.textContent = 'إضافة مستخدم جديد';
            if (idField) idField.value = '';
            if (nameInput) nameInput.value = '';
            if (usernameInput) usernameInput.value = '';
            if (passwordInput) passwordInput.value = '';
            if (passwordHint) passwordHint.textContent = 'كلمة المرور الافتراضية هي 12345 إذا لم تُدخل كلمة مرور.';
            if (statusSwitch) statusSwitch.checked = true;
            if (canEditReceiptsSwitch) canEditReceiptsSwitch.checked = false;
            if (statusText) {
                statusText.textContent = 'Active (نشط)';
                statusText.style.color = 'var(--success)';
            }

            modal.style.display = 'flex';
        }
    },

    showEditUserModal(userId) {
        if (!auth.checkRole(['Admin', 'SuperAdmin'])) {
            this.showAlert('غير مسموح بإدارة المستخدمين.', 'danger');
            return;
        }

        const user = db.getUserById(userId);
        if (!user) {
            this.showAlert('المستخدم غير موجود.', 'danger');
            return;
        }

        this.closeModals();
        const modal = document.getElementById('user-modal');
        if (modal) {
            const title = document.getElementById('user-modal-title');
            const idField = document.getElementById('user-id-field');
            const nameInput = document.getElementById('user-fullname-input');
            const usernameInput = document.getElementById('user-username-input');
            const passwordInput = document.getElementById('user-password-input');
            const passwordHint = document.getElementById('user-password-hint');
            const roleSelect = document.getElementById('user-role-select');
            const statusText = document.getElementById('user-status-text');
            const statusSwitch = document.getElementById('user-status-switch');
            const canEditReceiptsSwitch = document.getElementById('user-can-edit-receipts-switch');

            if (title) title.textContent = `تعديل المستخدم: ${user.fullname}`;
            if (idField) idField.value = user.id;
            if (nameInput) nameInput.value = user.fullname;
            if (usernameInput) usernameInput.value = user.username;
            if (passwordInput) passwordInput.value = '';
            if (passwordHint) passwordHint.textContent = 'اتركها فارغة إذا لا ترغب بتغيير كلمة المرور.';
            if (roleSelect) roleSelect.value = user.role;
            if (canEditReceiptsSwitch) canEditReceiptsSwitch.checked = !!user.canEditReceipts;
            if (statusSwitch) statusSwitch.checked = user.status === 'Active';
            if (statusText) {
                if (user.status === 'Active') {
                    statusText.textContent = 'Active (نشط)';
                    statusText.style.color = 'var(--success)';
                } else {
                    statusText.textContent = 'Suspended (موقوف)';
                    statusText.style.color = 'var(--danger)';
                }
            }

            modal.style.display = 'flex';
        }
    },

    changeUserPassword(userId) {
        if (!auth.checkRole(['Admin', 'SuperAdmin'])) {
            this.showAlert('غير مسموح بإدارة المستخدمين.', 'danger');
            return;
        }

        const currentUser = auth.getCurrentUser();
        const user = db.getUserById(userId);
        if (!user) {
            this.showAlert('المستخدم غير موجود.', 'danger');
            return;
        }

        if (user.username === 'superadmin' && currentUser.role !== 'SuperAdmin') {
            this.showAlert('فقط السوبر أدمن يمكنه تغيير كلمة مرور السوبر أدمن.', 'warning');
            return;
        }

        const newPassword = prompt(`أدخل كلمة المرور الجديدة للمستخدم "${user.fullname}":`);
        if (newPassword === null) return;
        if (!newPassword.trim()) {
            this.showAlert('يرجى إدخال كلمة مرور صحيحة.', 'warning');
            return;
        }

        db.saveUser({ id: user.id, password: newPassword.trim() });
        db.logActivity(currentUser.id, currentUser.username, 'Change Password', `تم تغيير كلمة مرور المستخدم ${user.username}.`);
        this.showAlert(`تم تغيير كلمة مرور ${user.fullname} بنجاح.`);
    },

    closeModals() {
        const overlays = document.querySelectorAll('.modal-overlay');
        overlays.forEach(overlay => {
            overlay.style.display = 'none';
        });

        this.resetSubscriptionFlow();
    },

    selectSubscriptionType(type) {
        this.state.selectedSubscriptionType = type;
        const settings = db.getSettings();
        const priceMap = {
            Daily: settings.dailyPrice || 0,
            Weekly: settings.weeklyPrice || 0,
            Monthly: settings.monthlyPrice || 0
        };
        const price = priceMap[type] || 0;
        const subTypeField = document.getElementById('sub-type-field');
        const amountInput = document.getElementById('sub-amount');
        const startDateInput = document.getElementById('sub-start-date');
        const endDateInput = document.getElementById('sub-end-date');

        if (subTypeField) {
            subTypeField.value = type;
        }
        const typeSelect = document.getElementById('sub-type-select');
        if (typeSelect) {
            typeSelect.value = type;
        }
        if (amountInput) {
            amountInput.value = price;
        }
        if (startDateInput) {
            startDateInput.value = this.getDeviceDateString();
        }
        if (endDateInput) {
            endDateInput.value = (type === 'Daily' || type === 'InternetCard') ? '' : this.calculateEndDate(startDateInput.value || this.getDeviceDateString(), type);
        }

        this.toggleEndDateField(type);
        this.updateCommentRequirement(type);

        const dailyOptionsGroup = document.getElementById('sub-daily-options-group');
        if (dailyOptionsGroup) {
            dailyOptionsGroup.style.display = type === 'Daily' ? 'block' : 'none';
        }

        const internetCardGroup = document.getElementById('sub-internet-card-group');
        if (internetCardGroup) {
            internetCardGroup.style.display = type === 'InternetCard' ? 'block' : 'none';
        }

        const buttonsContainer = document.getElementById('subscription-buttons-container');
        const form = document.getElementById('subscription-form');
        if (buttonsContainer && form) {
            buttonsContainer.style.display = 'none';
            form.style.display = 'block';
        }

        this.updateSubscriptionButtonStates(type);
    },

    // Marks the comment field as required for Weekly/Monthly plans so it's clear before saving
    updateCommentRequirement(type) {
        const label = document.getElementById('sub-comment-label');
        const commentInput = document.getElementById('sub-comment');
        if (!label || !commentInput) return;

        if (type === 'Weekly' || type === 'Monthly') {
            label.innerHTML = 'تعليق الاشتراك (أسبوعي/شهري) *مطلوب';
            commentInput.required = true;
        } else {
            label.innerHTML = 'تعليق الاشتراك (أسبوعي/شهري)';
            commentInput.required = false;
        }
    },

    updateSubscriptionButtonStates(type) {
        const buttons = document.querySelectorAll('.sub-btn-option');
        buttons.forEach(button => {
            const buttonText = button.textContent || '';
            const matches = buttonText.includes(type) || button.getAttribute('onclick')?.includes(type);
            button.classList.toggle('active', !!matches);
        });
    },

    handleUserFormSubmit() {
        const idField = document.getElementById('user-id-field');
        const fullnameInput = document.getElementById('user-fullname-input');
        const usernameInput = document.getElementById('user-username-input');
        const passwordInput = document.getElementById('user-password-input');
        const roleSelect = document.getElementById('user-role-select');
        const statusSwitch = document.getElementById('user-status-switch');
        const canEditReceiptsSwitch = document.getElementById('user-can-edit-receipts-switch');

        const fullname = fullnameInput?.value.trim();
        const username = usernameInput?.value.trim();
        const password = passwordInput?.value;
        const role = roleSelect?.value || 'User';
        const status = statusSwitch?.checked ? 'Active' : 'Suspended';
        const canEditReceipts = !!canEditReceiptsSwitch?.checked;

        if (!fullname) {
            this.showAlert('يرجى إدخال الاسم الكامل للمستخدم.', 'warning');
            return;
        }
        if (!username) {
            this.showAlert('يرجى إدخال اسم المستخدم.', 'warning');
            return;
        }

        const userData = {
            id: idField?.value ? parseInt(idField.value) : undefined,
            fullname,
            username,
            password: password || undefined,
            role,
            status,
            canEditReceipts
        };

        const savedUser = db.saveUser(userData);
        if (!savedUser) {
            this.showAlert('فشل حفظ المستخدم. حاول مرة أخرى.', 'danger');
            return;
        }

        this.closeModals();
        this.renderUsers();
        this.showAlert(`تم حفظ المستخدم ${savedUser.fullname} بنجاح.`);
    },

    resetSubscriptionFlow() {
        this.state.selectedSubscriptionType = null;

        const buttonsContainer = document.getElementById('subscription-buttons-container');
        const form = document.getElementById('subscription-form');
        if (buttonsContainer && form) {
            buttonsContainer.style.display = 'grid';
            form.style.display = 'none';
        }

        const subTypeField = document.getElementById('sub-type-field');
        const typeSelect = document.getElementById('sub-type-select');
        const amountInput = document.getElementById('sub-amount');
        const customerName = document.getElementById('sub-customer-name');
        const phone = document.getElementById('sub-phone');
        const commentInput = document.getElementById('sub-comment');
        const startDate = document.getElementById('sub-start-date');
        const endDate = document.getElementById('sub-end-date');

        if (subTypeField) subTypeField.value = '';
        if (typeSelect) typeSelect.value = '';
        if (amountInput) amountInput.value = '';
        if (customerName) customerName.value = '';
        if (phone) phone.value = '';
        if (commentInput) commentInput.value = '';
        if (startDate) startDate.value = '';
        const externalStudySwitch = document.getElementById('sub-external-study-switch');
        const cardSerial = document.getElementById('sub-card-serial');
        const examCardSwitch = document.getElementById('sub-exam-card-switch');
        const paymentMethod = document.getElementById('sub-payment-method');
        if (externalStudySwitch) externalStudySwitch.checked = false;
        if (cardSerial) cardSerial.value = '';
        if (examCardSwitch) examCardSwitch.checked = false;
        if (paymentMethod) paymentMethod.value = 'Cash';
        if (endDate) endDate.value = '';

        this.updateCommentRequirement('');

        const buttons = document.querySelectorAll('.sub-btn-option');
        buttons.forEach(button => button.classList.remove('active'));
    },

    handleSubscriptionFormSubmit() {
        const subTypeField = document.getElementById('sub-type-field');
        const typeSelect = document.getElementById('sub-type-select');
        const type = this.state.selectedSubscriptionType || typeSelect?.value || subTypeField?.value;
        const nameInput = document.getElementById('sub-customer-name');
        const noteInput = document.getElementById('sub-phone');
        const commentInput = document.getElementById('sub-comment');
        const amountInput = document.getElementById('sub-amount');
        const startDateInput = document.getElementById('sub-start-date');
        const endDateInput = document.getElementById('sub-end-date');

        const name = nameInput?.value.trim();
        const note = noteInput?.value.trim();
        let comment = commentInput?.value.trim();
        const amount = parseFloat(amountInput?.value || 0);
        const startDate = startDateInput?.value || this.getDeviceDateString();
        const endDate = (type === 'Daily' || type === 'InternetCard') ? null : (endDateInput?.value || this.calculateEndDate(startDate, type));
        const paymentMethod = document.getElementById('sub-payment-method')?.value || 'Cash';

        if (!name) {
            this.showAlert('يرجى إدخال اسم المشترك.', 'warning');
            return;
        }
        if (!type) {
            this.showAlert('يرجى اختيار نوع الاشتراك.', 'warning');
            return;
        }
        if (amount <= 0) {
            this.showAlert('يرجى إدخال قيمة اشتراك صحيحة.', 'warning');
            return;
        }
        if ((type === 'Weekly' || type === 'Monthly') && !comment) {
            this.showAlert('يُرجى إضافة ملاحظة لخطط الاشتراك الأسبوعية أو الشهرية.', 'warning');
            return;
        }

        let serialNumber = null;
        let isExamCard = false;
        if (type === 'InternetCard') {
            serialNumber = document.getElementById('sub-card-serial')?.value.trim();
            isExamCard = !!document.getElementById('sub-exam-card-switch')?.checked;
            if (!serialNumber) {
                this.showAlert('يرجى إدخال الرقم التسلسلي للكرت.', 'warning');
                return;
            }
            comment = [comment, `الرقم التسلسلي: ${serialNumber}`, isExamCard ? 'كرت خاص لأصحاب الامتحان أونلاين' : ''].filter(Boolean).join(' - ');
        }

        if (type === 'Daily' && document.getElementById('sub-external-study-switch')?.checked) {
            comment = [comment, 'دراسة خارجية'].filter(Boolean).join(' - ');
        }

        const subscriber = db.addSubscriber(name, note);
        const receipt = db.addReceipt({
            subscriberId: subscriber.id,
            subType: type,
            amount: amount,
            startDate: startDate,
            endDate: endDate,
            comment: comment || '',
            status: 'Active',
            paymentMethod: paymentMethod,
            serialNumber: serialNumber,
            createdBy: auth.getCurrentUser()?.username || 'unknown'
        });

        this.resetSubscriptionFlow();
        this.closeModals();
        this.renderDashboardStats();
        this.renderLatestReceipts();
        this.renderReceiptSearch();
        this.renderReportTable();
        this.renderSubscribers();
        this.showAlert(`تم حفظ الوصل ${receipt.receiptNo} بنجاح.`);
        this.openReceiptPrintPreview(receipt);
    },

    openReceiptPrintPreview(receipt) {
        const modal = document.getElementById('print-modal');
        if (!modal) return;

        const receiptNo = document.getElementById('receipt-no-val');
        const receiptDate = document.getElementById('receipt-date-val');
        const receiptTime = document.getElementById('receipt-time-val');
        const receiptType = document.getElementById('receipt-type-val');
        const receiptName = document.getElementById('receipt-name-val');
        const receiptAmount = document.getElementById('receipt-amount-val');
        const receiptUser = document.getElementById('receipt-user-val');
        const receiptStatus = document.getElementById('receipt-status-val');
        const receiptPaymentMethod = document.getElementById('receipt-payment-method-val');
        const receiptCommentRow = document.getElementById('receipt-comment-row');
        const receiptComment = document.getElementById('receipt-comment-val');
        const receiptFooter = document.getElementById('receipt-footer-val');

        if (receiptNo) receiptNo.textContent = receipt.receiptNo;
        if (receiptDate) receiptDate.textContent = receipt.createdAt.split('T')[0];
        if (receiptTime) receiptTime.textContent = new Date(receipt.createdAt).toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit', hour12: false });
        if (receiptType) receiptType.textContent = this.subTypeLabel(receipt.subType);
        if (receiptName) receiptName.textContent = this.resolveSubscriberName(receipt.subscriberId);
        if (receiptAmount) receiptAmount.textContent = `${receipt.amount.toFixed(2)} ${db.getSettings().currency || 'LYD'}`;
        if (receiptUser) receiptUser.textContent = receipt.createdBy;
        if (receiptStatus) receiptStatus.textContent = receipt.status || 'Active';
        if (receiptPaymentMethod) receiptPaymentMethod.textContent = receipt.paymentMethod === 'Card' ? 'تم الدفع بالبطاقة' : 'نقداً';
        if (receiptFooter) receiptFooter.textContent = db.getSettings().receiptFooter || 'شكراً لزيارتكم - ZONE SPACE';
        if (receiptCommentRow && receiptComment) {
            if (receipt.comment) {
                receiptCommentRow.style.display = 'flex';
                receiptComment.textContent = receipt.comment;
            } else {
                receiptCommentRow.style.display = 'none';
            }
        }

        // Type-specific extra rows: booking / rent / internet card details
        const extraRowsContainer = document.getElementById('receipt-extra-rows');
        if (extraRowsContainer) {
            let extraRowsHtml = '';

            if (receipt.subType === 'Booking') {
                const booking = db.getBookings().find(b => b.receiptId === receipt.id);
                if (booking) {
                    extraRowsHtml = `
                        <div class="receipt-row"><span>القاعة:</span><span>${booking.room}</span></div>
                        <div class="receipt-row"><span>رقم الهاتف:</span><span>${booking.phone}</span></div>
                        <div class="receipt-row"><span>عدد الساعات:</span><span>${booking.hours}</span></div>
                        <div class="receipt-row"><span>سعر الساعة:</span><span>${booking.rate.toFixed(2)} LYD</span></div>
                    `;
                }
            } else if (receipt.subType === 'Rent') {
                const rent = db.getRents().find(r => r.receiptId === receipt.id);
                if (rent) {
                    extraRowsHtml = `
                        <div class="receipt-row"><span>نوع الإيجار:</span><span>${rent.rentType}</span></div>
                    `;
                }
            } else if (receipt.subType === 'InternetCard') {
                extraRowsHtml = `
                    <div class="receipt-row"><span>الرقم التسلسلي:</span><span>${receipt.serialNumber || '-'}</span></div>
                `;
            }

            extraRowsContainer.innerHTML = extraRowsHtml;
        }

        modal.style.display = 'flex';
    },

    triggerThermalPrint() {
        const modal = document.getElementById('print-modal');
        if (!modal || modal.style.display === 'none') {
            this.showAlert('افتح نافذة معاينة الطباعة أولاً ثم اضغط طباعة.', 'warning');
            return;
        }

        this.showAlert('يتم فتح نافذة الطباعة الآن...');
        window.print();
    },

    printReport() {
        this.showAlert('سيتم فتح واجهة الطباعة لطباعة التقرير.');
        window.print();
    },

    exportReportPDF() {
        this.showAlert('يتم إنشاء ملف PDF للتقرير...');
        // Placeholder: actual PDF export not implemented yet.
    },

    exportReportCSV() {
        this.showAlert('يتم تنزيل تقرير CSV الآن...');
        // Placeholder: actual CSV export not implemented yet.
    },

    updateCurrentDate() {
        const dateLabel = document.getElementById('current-date-label');
        if (!dateLabel) return;
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateLabel.textContent = new Date().toLocaleDateString('ar-LY', options);
    },

    updateUserProfile() {
        const user = auth.getCurrentUser();
        if (!user) return;

        const avatar = document.getElementById('user-avatar');
        const fullname = document.getElementById('user-fullname');
        const roleLabel = document.getElementById('user-role-label');

        if (avatar) {
            avatar.textContent = user.fullname ? user.fullname.charAt(0).toUpperCase() : 'U';
        }
        if (fullname) {
            fullname.textContent = user.fullname || user.username;
        }
        if (roleLabel) {
            roleLabel.textContent = user.role || 'User';
        }
    },

    applyRoleAccess() {
        const user = auth.getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        const usersNav = document.querySelector('.nav-item[data-target="users"]');
        const settingsNav = document.querySelector('.nav-item[data-target="settings"]');
        const profileNav = document.querySelector('.nav-item[data-target="profile"]');
        const profileActions = document.getElementById('profile-admin-actions');
        const profileSettingsBtn = document.getElementById('profile-settings-btn');
        const usersSection = document.getElementById('users');
        const settingsSection = document.getElementById('settings');

        if (usersNav) {
            usersNav.style.display = auth.checkRole(['Admin', 'SuperAdmin']) ? '' : 'none';
        }
        if (settingsNav) {
            settingsNav.style.display = auth.checkRole(['SuperAdmin']) ? '' : 'none';
        }
        if (profileNav) {
            profileNav.style.display = '';
        }
        if (profileActions) {
            profileActions.style.display = auth.checkRole(['Admin', 'SuperAdmin']) ? 'block' : 'none';
        }
        if (profileSettingsBtn) {
            profileSettingsBtn.style.display = auth.checkRole(['SuperAdmin']) ? 'inline-flex' : 'none';
        }
        if (usersSection) {
            usersSection.style.display = auth.checkRole(['Admin', 'SuperAdmin']) ? '' : 'none';
        }
        if (settingsSection) {
            settingsSection.style.display = auth.checkRole(['SuperAdmin']) ? '' : 'none';
        }

        const activeSection = document.querySelector('.page-section.active');
        if (activeSection && activeSection.style.display === 'none') {
            this.activatePage('dashboard');
        }
    },

    renderProfilePage() {
        const user = auth.getCurrentUser();
        if (!user) return;

        const fullname = document.getElementById('profile-fullname');
        const username = document.getElementById('profile-username');
        const role = document.getElementById('profile-role');
        const status = document.getElementById('profile-status');
        const created = document.getElementById('profile-created');
        const roleLabel = document.getElementById('profile-role-label');

        if (fullname) fullname.textContent = user.fullname || '-';
        if (username) username.textContent = user.username || '-';
        if (role) role.textContent = user.role || '-';
        if (status) status.textContent = user.status || '-';
        if (created) status.textContent = user.createdAt ? this.formatDateTime(user.createdAt) : '-';
        if (created) created.textContent = user.createdAt ? this.formatDateTime(user.createdAt) : '-';
        if (roleLabel) roleLabel.textContent = `حساب ${user.role}`;
    },

    showAlert(message, type = 'info') {
        const alertBanner = document.getElementById('global-alert');
        if (!alertBanner) {
            console.log(message);
            return;
        }

        alertBanner.textContent = message;
        alertBanner.className = `alert-banner alert-${type}`;
        alertBanner.style.display = 'block';

        setTimeout(() => {
            alertBanner.style.display = 'none';
        }, 3500);
    },

    // Arabic display label for a receipt's subscription type
    subTypeLabel(type) {
        const map = { Daily: 'يومي', Weekly: 'أسبوعي', Monthly: 'شهري', Booking: 'حجز قاعة', InternetCard: 'كرت نت', Rent: 'إيجار' };
        return map[type] || type;
    },

    resolveSubscriberName(subscriberId) {
        if (!subscriberId) return '-';
        const subscriber = db.getSubscribers().find(s => s.id === parseInt(subscriberId));
        return subscriber ? subscriber.name : '-';
    },

    getDeviceDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    calculateEndDate(startDate, type) {
        if (!startDate) return '';
        const date = new Date(startDate);
        if (type === 'Weekly') {
            date.setDate(date.getDate() + 7);
        } else if (type === 'Monthly') {
            date.setMonth(date.getMonth() + 1);
        }
        return date.toISOString().split('T')[0];
    },

    calculateBookingTotal() {
        const hours = parseInt(document.getElementById('booking-hours')?.value || 0, 10);
        const rate = parseFloat(document.getElementById('booking-rate')?.value || 0);
        const total = hours * rate;
        const bookingTotal = document.getElementById('booking-total');
        if (bookingTotal) {
            bookingTotal.value = total > 0 ? total.toFixed(2) : '';
        }
    },

    handleBookingFormSubmit() {
        const room = document.getElementById('booking-room')?.value;
        const name = document.getElementById('booking-name')?.value.trim();
        const phone = document.getElementById('booking-phone')?.value.trim();
        const hours = parseInt(document.getElementById('booking-hours')?.value || 0, 10);
        const rate = parseFloat(document.getElementById('booking-rate')?.value || 0);
        const notes = document.getElementById('booking-notes')?.value.trim();
        const totalInput = document.getElementById('booking-total');
        const manualTotal = parseFloat(totalInput?.value || 0);

        if (!room) {
            this.showAlert('اختر القاعة أولاً.', 'warning');
            return;
        }
        if (!name) {
            this.showAlert('ادخل اسم الشخص.', 'warning');
            return;
        }
        if (!phone) {
            this.showAlert('ادخل رقم الهاتف.', 'warning');
            return;
        }
        if (hours <= 0) {
            this.showAlert('اختر عدد ساعات صحيح.', 'warning');
            return;
        }
        if (rate <= 0) {
            this.showAlert('ادخل سعر ساعة صحيح.', 'warning');
            return;
        }

        // Use a manually-entered total if provided, otherwise fall back to hours × rate
        const total = manualTotal > 0 ? manualTotal : (hours * rate);
        if (total <= 0) {
            this.showAlert('ادخل إجمالي صحيح.', 'warning');
            return;
        }

        db.addBooking({ room, name, phone, hours, rate, total, notes, createdBy: auth.getCurrentUser()?.username || 'unknown' });
        this.showAlert('تم حفظ الحجز ووصل الدفع بنجاح.');
        document.getElementById('booking-form')?.reset();
        this.calculateBookingTotal();
        this.renderBookings();
        this.renderLatestReceipts();
        this.renderReceiptSearch();
        this.renderReportTable();
        this.renderDashboardStats();
    },

    toggleEndDateField(type) {
        const endDateGroup = document.getElementById('sub-end-group');
        const endDateInput = document.getElementById('sub-end-date');
        if (type === 'Daily' || type === 'InternetCard') {
            if (endDateGroup) endDateGroup.style.display = 'none';
            if (endDateInput) endDateInput.value = '';
        } else {
            if (endDateGroup) endDateGroup.style.display = 'block';
            if (endDateInput && !endDateInput.value) {
                const startDateInput = document.getElementById('sub-start-date');
                endDateInput.value = this.calculateEndDate(startDateInput?.value || this.getDeviceDateString(), type);
            }
        }
    },

    formatDateTime(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '-';
        return date.toLocaleString('ar-LY', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    },

    openReceiptPrintPreviewById(receiptId) {
        const receipt = db.getReceiptById(receiptId);
        if (!receipt) {
            this.showAlert('الوصل غير موجود.', 'warning');
            return;
        }
        this.openReceiptPrintPreview(receipt);
    },

    // Activate a (previously stopped/cancelled) subscription
    activateReceiptStatus(receiptId) {
        const receipt = db.getReceiptById(receiptId);
        if (!receipt) {
            this.showAlert('الوصل غير موجود.', 'warning');
            return;
        }

        const confirmed = confirm(`هل تريد تنشيط الاشتراك رقم ${receipt.receiptNo}؟`);
        if (!confirmed) return;

        const updatedReceipt = db.activateReceipt(receiptId);
        if (!updatedReceipt) {
            this.showAlert('تعذر تنشيط الاشتراك.', 'danger');
            return;
        }

        const currentUser = auth.getCurrentUser();
        if (currentUser) {
            db.logActivity(currentUser.id, currentUser.username, "Activate Receipt", `تم تنشيط الاشتراك رقم ${updatedReceipt.receiptNo}.`);
        }

        this.showAlert(`تم تنشيط الاشتراك رقم ${updatedReceipt.receiptNo} بنجاح.`);
        this.renderLatestReceipts();
        this.renderReceiptSearch();
        this.renderReportTable();
    },

    // Stop a subscription (soft, non-destructive — can be re-activated later)
    stopReceiptStatus(receiptId) {
        const receipt = db.getReceiptById(receiptId);
        if (!receipt) {
            this.showAlert('الوصل غير موجود.', 'warning');
            return;
        }

        const confirmed = confirm(`هل تريد إيقاف الاشتراك رقم ${receipt.receiptNo}؟\nيمكنك تنشيطه مرة أخرى لاحقاً.`);
        if (!confirmed) return;

        const updatedReceipt = db.cancelReceipt(receiptId);
        if (!updatedReceipt) {
            this.showAlert('تعذر إيقاف الاشتراك.', 'danger');
            return;
        }

        const currentUser = auth.getCurrentUser();
        if (currentUser) {
            db.logActivity(currentUser.id, currentUser.username, "Stop Receipt", `تم إيقاف الاشتراك رقم ${updatedReceipt.receiptNo}.`);
        }

        this.showAlert(`تم إيقاف الاشتراك رقم ${updatedReceipt.receiptNo}.`);
        this.renderLatestReceipts();
        this.renderReceiptSearch();
        this.renderReportTable();
    },

    // Cancel a subscription -> asks for confirmation, then permanently deletes it
    cancelReceiptConfirm(receiptId) {
        const receipt = db.getReceiptById(receiptId);
        if (!receipt) {
            this.showAlert('الوصل غير موجود.', 'warning');
            return;
        }

        const confirmed = confirm(`هل أنت متأكد من إلغاء الاشتراك رقم ${receipt.receiptNo}؟\nسيتم حذف هذا الاشتراك نهائياً ولا يمكن التراجع عن هذه العملية.`);
        if (!confirmed) return;

        db.deleteReceipt(receiptId);

        const currentUser = auth.getCurrentUser();
        if (currentUser) {
            db.logActivity(currentUser.id, currentUser.username, "Cancel Receipt", `تم إلغاء وحذف الاشتراك رقم ${receipt.receiptNo}.`);
        }

        this.showAlert(`تم إلغاء وحذف الاشتراك رقم ${receipt.receiptNo}.`);
        this.renderLatestReceipts();
        this.renderReceiptSearch();
        this.renderReportTable();
    },

    filterReceipts(receipts) {
        const query = document.getElementById('search-query')?.value.trim().toLowerCase() || '';
        const typeFilter = document.getElementById('filter-type')?.value || '';
        const dateFilter = document.getElementById('filter-date')?.value || '';

        return receipts.filter(receipt => {
            const receiptNoMatch = receipt.receiptNo.toLowerCase().includes(query);
            const typeMatch = receipt.subType.toLowerCase().includes(query);
            const subscriberName = this.resolveSubscriberName(receipt.subscriberId).toLowerCase();
            const subscriberMatch = subscriberName.includes(query);
            const createdByMatch = receipt.createdBy.toLowerCase().includes(query);
            const fullMatch = receiptNoMatch || typeMatch || subscriberMatch || createdByMatch;

            const typeFilterMatch = !typeFilter || receipt.subType === typeFilter;
            const dateFilterMatch = !dateFilter || receipt.createdAt.startsWith(dateFilter);

            return fullMatch && typeFilterMatch && dateFilterMatch;
        });
    },

    filterReportReceipts(receipts) {
        const reportType = document.getElementById('report-type-filter')?.value || 'all';
        const reportUser = document.getElementById('report-user-filter')?.value || 'all';
        const fromDate = document.getElementById('report-date-from')?.value || '';
        const toDate = document.getElementById('report-date-to')?.value || '';
        const typeMap = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };
        const mappedType = typeMap[reportType] || reportType;

        return receipts.filter(receipt => {
            const typeMatch = reportType === 'all' || receipt.subType === mappedType;
            const userMatch = reportUser === 'all' || receipt.createdBy === reportUser;
            const createdDate = receipt.createdAt ? receipt.createdAt.split('T')[0] : '';
            const fromMatch = !fromDate || createdDate >= fromDate;
            const toMatch = !toDate || createdDate <= toDate;
            return typeMatch && userMatch && fromMatch && toMatch;
        });
    },

    renderLatestReceipts() {
        const rowsContainer = document.getElementById('latest-receipts-rows');
        if (!rowsContainer) return;

        const receipts = db.getReceipts();
        const latest = receipts.slice(-5).reverse();
        rowsContainer.innerHTML = latest.map((receipt, index) => {
            const serial = index + 1;
            return `
                <tr>
                    <td>${serial}</td>
                    <td>${receipt.receiptNo}</td>
                    <td>${this.subTypeLabel(receipt.subType)}</td>
                    <td>${this.resolveSubscriberName(receipt.subscriberId)}</td>
                    <td>${receipt.amount.toFixed(2)} LYD</td>
                    <td>${receipt.createdBy}</td>
                    <td>${this.formatDateTime(receipt.createdAt)}</td>
                    <td>
                        ${this.renderReceiptActionsMenu(receipt, 'latest')}
                    </td>
                </tr>
            `;
        }).join('');

        this.renderDashboardSubscriptionsList();
    },

    // Dashboard list: active subscribers on Weekly/Monthly plans, soonest-to-expire first
    renderDashboardSubscriptionsList() {
        const listContainer = document.getElementById('dashboard-latest-subscriptions-list');
        if (!listContainer) return;

        const today = this.getDeviceDateString();
        const active = db.getReceipts().filter(r =>
            r.status === 'Active' && (r.subType === 'Weekly' || r.subType === 'Monthly')
        );

        const withDaysLeft = active.map(receipt => {
            let daysLeft = null;
            if (receipt.endDate) {
                daysLeft = Math.ceil((new Date(receipt.endDate) - new Date(today)) / 86400000);
            }
            return { receipt, daysLeft };
        });

        withDaysLeft.sort((a, b) => {
            if (a.daysLeft === null) return 1;
            if (b.daysLeft === null) return -1;
            return a.daysLeft - b.daysLeft;
        });

        if (!withDaysLeft.length) {
            listContainer.innerHTML = '<li class="quick-list-empty">لا يوجد مشتركين نشطين حالياً في الاشتراك الأسبوعي أو الشهري.</li>';
            return;
        }

        listContainer.innerHTML = withDaysLeft.map(({ receipt, daysLeft }) => {
            let statusText;
            let statusClass = '';
            if (daysLeft === null) {
                statusText = 'نشط';
            } else if (daysLeft < 0) {
                statusText = 'منتهي';
                statusClass = 'quick-list-sub-danger';
            } else if (daysLeft === 0) {
                statusText = 'ينتهي اليوم';
                statusClass = 'quick-list-sub-danger';
            } else if (daysLeft <= 2) {
                statusText = `قارب على الانتهاء (متبقي ${daysLeft} يوم)`;
                statusClass = 'quick-list-sub-warning';
            } else {
                statusText = `نشط (متبقي ${daysLeft} يوم)`;
            }

            return `
                <li class="quick-list-item">
                    <div class="quick-list-main">
                        <span class="quick-list-title">${this.resolveSubscriberName(receipt.subscriberId)}</span>
                        <span class="quick-list-sub ${statusClass}">${this.subTypeLabel(receipt.subType)} · وصل ${receipt.receiptNo} · ${statusText}</span>
                    </div>
                    <span class="quick-list-amount">${receipt.amount.toFixed(2)} LYD</span>
                </li>
            `;
        }).join('');
    },

    renderReceiptSearch() {
        const rowsContainer = document.getElementById('receipts-search-rows');
        if (!rowsContainer) return;

        const receipts = this.filterReceipts(db.getReceipts());
        rowsContainer.innerHTML = receipts.map((receipt, index) => {
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${receipt.receiptNo}</td>
                    <td>${this.subTypeLabel(receipt.subType)}</td>
                    <td>${this.resolveSubscriberName(receipt.subscriberId)}</td>
                    <td>${receipt.amount.toFixed(2)} LYD</td>
                    <td>${receipt.startDate || '-'}</td>
                    <td>${receipt.endDate || '-'}</td>
                    <td>${receipt.createdBy}</td>
                    <td>${this.formatDateTime(receipt.createdAt)}</td>
                    <td>
                        ${this.renderReceiptActionsMenu(receipt, 'search')}
                    </td>
                </tr>
            `;
        }).join('');
    },

    // Whether the currently logged-in user is allowed to edit any receipt
    canCurrentUserEditReceipts() {
        const user = auth.getCurrentUser();
        if (!user) return false;
        if (user.role === 'Admin' || user.role === 'SuperAdmin') return true;
        return !!user.canEditReceipts;
    },

    // Builds the "تخصيص" dropdown for a receipt row: preview, edit, activate/stop, and cancel (delete)
    // `context` keeps the generated menu id unique when the same receipt appears in more than one table
    renderReceiptActionsMenu(receipt, context) {
        const menuId = `actions-menu-${context}-${receipt.id}`;
        const statusOption = receipt.status === 'Cancelled'
            ? `<button onclick="app.activateReceiptStatus(${receipt.id})">تنشيط الاشتراك</button>`
            : `<button onclick="app.stopReceiptStatus(${receipt.id})">إيقاف الاشتراك</button>`;
        const editOption = this.canCurrentUserEditReceipts()
            ? `<button onclick="app.openReceiptEditModal(${receipt.id})">تعديل الوصل</button>`
            : '';

        return `
            <div class="dropdown-actions">
                <button class="btn btn-secondary btn-small" onclick="app.toggleActionsMenu(event, '${menuId}')">تخصيص ▾</button>
                <div class="dropdown-menu" id="${menuId}">
                    <button onclick="app.openReceiptPrintPreviewById(${receipt.id})">معاينة الوصل</button>
                    ${editOption}
                    ${statusOption}
                    <div class="menu-divider"></div>
                    <button class="danger" onclick="app.cancelReceiptConfirm(${receipt.id})">إلغاء الاشتراك</button>
                </div>
            </div>
        `;
    },

    // Opens the receipt edit modal, pre-filled with the receipt's current data
    openReceiptEditModal(receiptId) {
        if (!this.canCurrentUserEditReceipts()) {
            this.showAlert('غير مسموح لك بتعديل الوصلات.', 'danger');
            return;
        }

        const receipt = db.getReceiptById(receiptId);
        if (!receipt) {
            this.showAlert('الوصل غير موجود.', 'warning');
            return;
        }

        this.closeModals();
        const modal = document.getElementById('receipt-edit-modal');
        if (!modal) return;

        document.getElementById('edit-receipt-id').value = receipt.id;
        document.getElementById('edit-receipt-no-label').textContent = receipt.receiptNo;
        document.getElementById('edit-receipt-type').value = receipt.subType;
        document.getElementById('edit-receipt-amount').value = receipt.amount;
        document.getElementById('edit-receipt-start-date').value = receipt.startDate || '';
        document.getElementById('edit-receipt-end-date').value = receipt.endDate || '';
        document.getElementById('edit-receipt-comment').value = receipt.comment || '';
        const paymentMethodField = document.getElementById('edit-receipt-payment-method');
        if (paymentMethodField) paymentMethodField.value = receipt.paymentMethod || 'Cash';

        this.toggleEditEndDateField(receipt.subType);

        modal.style.display = 'flex';
    },

    toggleEditEndDateField(type) {
        const endGroup = document.getElementById('edit-receipt-end-date-group');
        if (endGroup) {
            endGroup.style.display = type === 'Daily' ? 'none' : 'block';
        }
    },

    handleReceiptEditFormSubmit() {
        if (!this.canCurrentUserEditReceipts()) {
            this.showAlert('غير مسموح لك بتعديل الوصلات.', 'danger');
            return;
        }

        const receiptId = document.getElementById('edit-receipt-id')?.value;
        const subType = document.getElementById('edit-receipt-type')?.value;
        const amount = parseFloat(document.getElementById('edit-receipt-amount')?.value || 0);
        const startDate = document.getElementById('edit-receipt-start-date')?.value;
        const endDate = document.getElementById('edit-receipt-end-date')?.value;
        const comment = document.getElementById('edit-receipt-comment')?.value.trim();
        const paymentMethod = document.getElementById('edit-receipt-payment-method')?.value || 'Cash';

        if (!subType) {
            this.showAlert('يرجى اختيار نوع الاشتراك.', 'warning');
            return;
        }
        if (amount <= 0) {
            this.showAlert('يرجى إدخال قيمة اشتراك صحيحة.', 'warning');
            return;
        }

        const updates = {
            subType,
            amount,
            startDate: startDate || null,
            endDate: subType === 'Daily' ? null : (endDate || null),
            comment: comment || '',
            paymentMethod
        };

        const updated = db.updateReceipt(receiptId, updates);
        if (!updated) {
            this.showAlert('تعذر تحديث الوصل.', 'danger');
            return;
        }

        const currentUser = auth.getCurrentUser();
        if (currentUser) {
            db.logActivity(currentUser.id, currentUser.username, 'Edit Receipt', `تم تعديل الوصل رقم ${updated.receiptNo}.`);
        }

        this.closeModals();
        this.renderLatestReceipts();
        this.renderReceiptSearch();
        this.renderReportTable();
        this.showAlert(`تم تحديث الوصل رقم ${updated.receiptNo} بنجاح.`);
    },

    renderReportTable() {
        const rowsContainer = document.getElementById('report-table-rows');
        if (!rowsContainer) return;

        const receipts = this.filterReportReceipts(db.getReceipts());
        const totalRevenue = receipts.reduce((sum, receipt) => sum + (parseFloat(receipt.amount) || 0), 0);
        const currency = db.getSettings().currency || 'LYD';

        document.getElementById('report-total-revenue').textContent = totalRevenue.toFixed(2);
        document.getElementById('report-currency-label').textContent = currency;

        if (receipts.length === 0) {
            rowsContainer.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 14px;">لا توجد بيانات تقارير لهذا الفلتر.</td></tr>';
            return;
        }

        rowsContainer.innerHTML = receipts.map((receipt, index) => {
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${receipt.receiptNo}</td>
                    <td>${this.subTypeLabel(receipt.subType)}</td>
                    <td>${this.resolveSubscriberName(receipt.subscriberId)}</td>
                    <td>${receipt.amount.toFixed(2)} ${currency}</td>
                    <td>${receipt.startDate || '-'}</td>
                    <td>${receipt.createdBy}</td>
                    <td>${this.formatDateTime(receipt.createdAt)}</td>
                </tr>
            `;
        }).join('');
    },

    renderSubscribers() {
        const rowsContainer = document.getElementById('subscribers-table-rows');
        if (!rowsContainer) return;

        const subscribers = db.getSubscribers();
        rowsContainer.innerHTML = subscribers.map(subscriber => {
            return `
                <tr>
                    <td>${subscriber.id}</td>
                    <td>${subscriber.name}</td>
                    <td>${subscriber.phone || '-'}</td>
                    <td>${this.formatDateTime(subscriber.createdAt)}</td>
                </tr>
            `;
        }).join('');
    },

    renderBookings() {
        const rowsContainer = document.getElementById('booking-rows');
        if (!rowsContainer) return;

        const bookings = window.db.getBookings();
        if (bookings.length === 0) {
            rowsContainer.innerHTML = '<tr><td colspan="12" style="text-align:center; padding: 14px;">لا توجد حجوزات مسجلة بعد.</td></tr>';
            return;
        }

        const statusLabel = { Confirmed: 'مؤكد', Cancelled: 'ملغي' };

        rowsContainer.innerHTML = bookings.map((booking, index) => {
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${booking.receiptNo || '-'}</td>
                    <td>${booking.room}</td>
                    <td>${booking.name}</td>
                    <td>${booking.phone}</td>
                    <td>${booking.hours}</td>
                    <td>${booking.rate.toFixed(2)} LYD</td>
                    <td>${booking.total.toFixed(2)} LYD</td>
                    <td>${this.formatDateTime(booking.createdAt)}</td>
                    <td>${statusLabel[booking.status] || booking.status}</td>
                    <td>${booking.notes || '-'}</td>
                    <td>
                        <button class="btn btn-secondary btn-small" onclick="app.openReceiptPrintPreviewById(${booking.receiptId})">طباعة الواصل</button>
                        <button class="btn btn-secondary btn-small" onclick="app.openBookingEditModal(${booking.id})">تعديل</button>
                        <button class="btn btn-secondary btn-small" onclick="app.toggleBookingStatusUI(${booking.id})">
                            ${booking.status === 'Confirmed' ? 'إلغاء الحجز' : 'تأكيد الحجز'}
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    bindRentForm() {
        const form = document.getElementById('rent-form');
        if (!form) return;

        form.addEventListener('submit', event => {
            event.preventDefault();
            this.handleRentFormSubmit();
        });
    },

    handleRentFormSubmit() {
        const rentType = document.getElementById('rent-type')?.value;
        const amount = parseFloat(document.getElementById('rent-amount')?.value || 0);
        const paymentMethod = document.getElementById('rent-payment-method')?.value || 'Cash';
        const notes = document.getElementById('rent-notes')?.value.trim();

        if (!rentType) {
            this.showAlert('يرجى اختيار نوع الإيجار.', 'warning');
            return;
        }
        if (amount <= 0) {
            this.showAlert('يرجى إدخال قيمة إيجار صحيحة.', 'warning');
            return;
        }

        db.addRent({ rentType, amount, paymentMethod, notes, createdBy: auth.getCurrentUser()?.username || 'unknown' });
        this.showAlert('تم حفظ الإيجار ووصل الدفع بنجاح.');
        document.getElementById('rent-form')?.reset();
        this.renderRents();
        this.renderLatestReceipts();
        this.renderReceiptSearch();
        this.renderReportTable();
        this.renderDashboardStats();
    },

    renderRents() {
        const rowsContainer = document.getElementById('rent-rows');
        if (!rowsContainer) return;

        const rents = db.getRents();
        if (rents.length === 0) {
            rowsContainer.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 14px;">لا توجد إيجارات مسجلة بعد.</td></tr>';
            return;
        }

        rowsContainer.innerHTML = rents.map((rent, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${rent.receiptNo || '-'}</td>
                <td>${rent.rentType}</td>
                <td>${rent.amount.toFixed(2)} LYD</td>
                <td>${rent.paymentMethod === 'Card' ? 'تم الدفع بالبطاقة' : 'نقداً'}</td>
                <td>${rent.notes || '-'}</td>
                <td>${rent.createdBy}</td>
                <td>${this.formatDateTime(rent.createdAt)}</td>
                <td>
                    <button class="btn btn-secondary btn-small" onclick="app.openReceiptPrintPreviewById(${rent.receiptId})">طباعة الواصل</button>
                </td>
            </tr>
        `).join('');
    },

    // Live "today, not yet closed" totals for the current user
    renderClosingPage() {
        const currentUser = auth.getCurrentUser();
        if (!currentUser) return;

        const today = new Date().toISOString().split('T')[0];
        const eligible = db.getReceipts().filter(r =>
            r.createdBy === currentUser.username &&
            !r.closingId &&
            (r.createdAt || '').split('T')[0] === today
        );

        const totalCash = eligible.filter(r => (r.paymentMethod || 'Cash') === 'Cash').reduce((s, r) => s + r.amount, 0);
        const totalCard = eligible.filter(r => r.paymentMethod === 'Card').reduce((s, r) => s + r.amount, 0);

        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setText('closing-today-count', eligible.length);
        setText('closing-today-cash', `${totalCash.toFixed(2)} LYD`);
        setText('closing-today-card', `${totalCard.toFixed(2)} LYD`);
        setText('closing-today-total', `${(totalCash + totalCard).toFixed(2)} LYD`);

        this.renderClosingLog();
    },

    renderClosingLog() {
        const rowsContainer = document.getElementById('closing-log-rows');
        if (!rowsContainer) return;

        const closings = db.getClosings().slice().reverse();
        if (closings.length === 0) {
            rowsContainer.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 14px;">لا توجد عمليات تسكير سابقة.</td></tr>';
            return;
        }

        rowsContainer.innerHTML = closings.map((closing, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${closing.closedBy}</td>
                <td>${closing.receiptsCount}</td>
                <td>${closing.totalCash.toFixed(2)} LYD</td>
                <td>${closing.totalCard.toFixed(2)} LYD</td>
                <td>${closing.totalAmount.toFixed(2)} LYD</td>
                <td>${this.formatDateTime(closing.closedAt)}</td>
                <td><button class="btn btn-secondary btn-small" onclick="app.printClosingReceipt(${closing.id})">طباعة الواصل</button></td>
            </tr>
        `).join('');
    },

    printClosingReceipt(closingId) {
        const closing = db.getClosings().find(c => c.id === parseInt(closingId, 10));
        if (!closing) {
            this.showAlert('سجل التسكير غير موجود.', 'warning');
            return;
        }

        const modal = document.getElementById('print-modal');
        if (!modal) return;

        const receiptNo = document.getElementById('receipt-no-val');
        const receiptDate = document.getElementById('receipt-date-val');
        const receiptTime = document.getElementById('receipt-time-val');
        const receiptType = document.getElementById('receipt-type-val');
        const receiptName = document.getElementById('receipt-name-val');
        const receiptAmount = document.getElementById('receipt-amount-val');
        const receiptUser = document.getElementById('receipt-user-val');
        const receiptStatus = document.getElementById('receipt-status-val');
        const receiptPaymentMethod = document.getElementById('receipt-payment-method-val');
        const receiptCommentRow = document.getElementById('receipt-comment-row');
        const receiptFooter = document.getElementById('receipt-footer-val');
        const extraRowsContainer = document.getElementById('receipt-extra-rows');

        if (receiptNo) receiptNo.textContent = `تسكير-${closing.id}`;
        if (receiptDate) receiptDate.textContent = closing.closedAt.split('T')[0];
        if (receiptTime) receiptTime.textContent = new Date(closing.closedAt).toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit', hour12: false });
        if (receiptType) receiptType.textContent = 'تسكير حساب يومي';
        if (receiptName) receiptName.textContent = closing.closedBy;
        if (receiptAmount) receiptAmount.textContent = `${closing.totalAmount.toFixed(2)} ${db.getSettings().currency || 'LYD'}`;
        if (receiptUser) receiptUser.textContent = closing.closedBy;
        if (receiptStatus) receiptStatus.textContent = 'مُسكّر';
        if (receiptPaymentMethod) receiptPaymentMethod.textContent = '-';
        if (receiptFooter) receiptFooter.textContent = db.getSettings().receiptFooter || 'شكراً لزيارتكم - ZONE SPACE';
        if (receiptCommentRow) receiptCommentRow.style.display = 'none';

        if (extraRowsContainer) {
            extraRowsContainer.innerHTML = `
                <div class="receipt-row"><span>عدد العمليات:</span><span>${closing.receiptsCount}</span></div>
                <div class="receipt-row"><span>إجمالي النقدي:</span><span>${closing.totalCash.toFixed(2)} LYD</span></div>
                <div class="receipt-row"><span>إجمالي البطاقة:</span><span>${closing.totalCard.toFixed(2)} LYD</span></div>
            `;
        }

        modal.style.display = 'flex';
    },

    closeDailyAccount() {
        const currentUser = auth.getCurrentUser();
        if (!currentUser) return;

        const confirmed = confirm('هل أنت متأكد من تسكير حساب اليوم؟ سيتم تصفير عداد اليوم الحالي لحسابك، مع حفظ كل البيانات كاملة في التقارير المالية وسجل التسكير.');
        if (!confirmed) return;

        const closing = db.closeDailyAccount(currentUser.username);
        if (!closing) {
            this.showAlert('لا توجد عمليات جديدة اليوم لتسكيرها.', 'warning');
            return;
        }

        db.logActivity(currentUser.id, currentUser.username, 'Close Daily Account', `تم تسكير حساب اليوم بإجمالي ${closing.totalAmount.toFixed(2)} LYD (${closing.receiptsCount} عملية).`);
        this.showAlert(`تم تسكير الحساب بنجاح. الإجمالي: ${closing.totalAmount.toFixed(2)} LYD`);
        this.renderClosingPage();
        this.printClosingReceipt(closing.id);
    },

    toggleBookingStatusUI(bookingId) {
        const updated = db.toggleBookingStatus(bookingId);
        if (!updated) {
            this.showAlert('تعذر تحديث حالة الحجز.', 'danger');
            return;
        }
        this.showAlert(`تم تحديث حالة الحجز إلى ${updated.status === 'Confirmed' ? 'مؤكد' : 'ملغي'}.`);
        this.renderBookings();
    },

    openBookingEditModal(bookingId) {
        const booking = db.getBookings().find(b => b.id === parseInt(bookingId, 10));
        if (!booking) {
            this.showAlert('الحجز غير موجود.', 'warning');
            return;
        }

        this.closeModals();
        const modal = document.getElementById('booking-edit-modal');
        if (!modal) return;

        document.getElementById('edit-booking-id').value = booking.id;
        document.getElementById('edit-booking-room').value = booking.room;
        document.getElementById('edit-booking-name').value = booking.name;
        document.getElementById('edit-booking-phone').value = booking.phone;
        document.getElementById('edit-booking-hours').value = booking.hours;
        document.getElementById('edit-booking-rate').value = booking.rate;
        document.getElementById('edit-booking-total').value = booking.total;
        document.getElementById('edit-booking-notes').value = booking.notes || '';

        modal.style.display = 'flex';
    },

    calculateBookingEditTotal() {
        const hours = parseInt(document.getElementById('edit-booking-hours')?.value || 0, 10);
        const rate = parseFloat(document.getElementById('edit-booking-rate')?.value || 0);
        const total = hours * rate;
        const totalInput = document.getElementById('edit-booking-total');
        if (totalInput && total > 0) {
            totalInput.value = total.toFixed(2);
        }
    },

    handleBookingEditFormSubmit() {
        const bookingId = document.getElementById('edit-booking-id')?.value;
        const room = document.getElementById('edit-booking-room')?.value;
        const name = document.getElementById('edit-booking-name')?.value.trim();
        const phone = document.getElementById('edit-booking-phone')?.value.trim();
        const hours = parseInt(document.getElementById('edit-booking-hours')?.value || 0, 10);
        const rate = parseFloat(document.getElementById('edit-booking-rate')?.value || 0);
        const total = parseFloat(document.getElementById('edit-booking-total')?.value || 0);
        const notes = document.getElementById('edit-booking-notes')?.value.trim();

        if (!room || !name || !phone || hours <= 0 || rate <= 0 || total <= 0) {
            this.showAlert('يرجى تعبئة جميع الحقول المطلوبة بقيم صحيحة.', 'warning');
            return;
        }

        const updated = db.updateBooking(bookingId, { room, name, phone, hours, rate, total, notes });
        if (!updated) {
            this.showAlert('تعذر تحديث الحجز.', 'danger');
            return;
        }

        this.closeModals();
        this.renderBookings();
        this.renderLatestReceipts();
        this.renderReceiptSearch();
        this.renderReportTable();
        this.showAlert('تم تحديث الحجز بنجاح.');
    },

    bindBookingEditForm() {
        const form = document.getElementById('booking-edit-form');
        if (!form) return;

        form.addEventListener('submit', event => {
            event.preventDefault();
            this.handleBookingEditFormSubmit();
        });

        const hours = document.getElementById('edit-booking-hours');
        const rate = document.getElementById('edit-booking-rate');
        if (hours) hours.addEventListener('input', () => this.calculateBookingEditTotal());
        if (rate) rate.addEventListener('input', () => this.calculateBookingEditTotal());
    },

    renderDashboardStats() {
        const receipts = db.getReceipts();
        const dailyReceipts = receipts.filter(r => r.subType === 'Daily');
        const weeklyReceipts = receipts.filter(r => r.subType === 'Weekly');
        const monthlyReceipts = receipts.filter(r => r.subType === 'Monthly');

        const dailyCount = dailyReceipts.length;
        const weeklyCount = weeklyReceipts.length;
        const monthlyCount = monthlyReceipts.length;

        const dailyRevenue = dailyReceipts.reduce((sum, receipt) => sum + (parseFloat(receipt.amount) || 0), 0);
        const weeklyRevenue = weeklyReceipts.reduce((sum, receipt) => sum + (parseFloat(receipt.amount) || 0), 0);
        const monthlyRevenue = monthlyReceipts.reduce((sum, receipt) => sum + (parseFloat(receipt.amount) || 0), 0);
        const totalReceipts = receipts.length;
        const totalRevenue = receipts.reduce((sum, receipt) => sum + (parseFloat(receipt.amount) || 0), 0);
        const subscriberCount = db.getSubscribers().length;

        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setText('stat-daily-count', dailyCount);
        setText('stat-weekly-count', weeklyCount);
        setText('stat-monthly-count', monthlyCount);
        setText('stat-daily-revenue', `إجمالي: ${dailyRevenue.toFixed(2)} LYD`);
        setText('stat-weekly-revenue', `إجمالي: ${weeklyRevenue.toFixed(2)} LYD`);
        setText('stat-monthly-revenue', `إجمالي: ${monthlyRevenue.toFixed(2)} LYD`);
        setText('stat-total-receipts', totalReceipts);
        setText('stat-total-revenue', totalRevenue.toFixed(2));
        setText('stat-total-currency', 'دينار ليبي');
        setText('stat-subscribers-count', subscriberCount);
    },

    renderUsers() {
        const rowsContainer = document.getElementById('users-table-rows');
        if (!rowsContainer) return;

        const users = db.getUsers();
        const canManageUsers = auth.checkRole(['Admin', 'SuperAdmin']);

        rowsContainer.innerHTML = users.map(user => {
            const actionButtons = canManageUsers ? `
                <button class="btn btn-secondary btn-small" onclick="app.showEditUserModal(${user.id})">تعديل</button>
                <button class="btn btn-secondary btn-small" onclick="app.changeUserPassword(${user.id})">تغيير كلمة المرور</button>
                <button class="btn btn-secondary btn-small" onclick="app.toggleUserStatus(${user.id})">
                    ${user.status === 'Active' ? 'إيقاف الحساب' : 'تنشيط الحساب'}
                </button>
            ` : '--';

            return `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.fullname}</td>
                    <td>${user.username}</td>
                    <td>${user.role}</td>
                    <td>${user.status}${user.canEditReceipts ? ' <span style="color: var(--success); font-size: 0.75rem;">(بإمكانه تعديل الوصلات)</span>' : ''}</td>
                    <td>${actionButtons}</td>
                </tr>
            `;
        }).join('');
    },

    toggleUserStatus(userId) {
        if (!auth.checkRole(['Admin', 'SuperAdmin'])) {
            this.showAlert('غير مسموح بإدارة المستخدمين.', 'danger');
            return;
        }

        const currentUser = auth.getCurrentUser();
        const user = db.getUserById(userId);
        if (!user) {
            this.showAlert('المستخدم غير موجود.', 'danger');
            return;
        }

        if (user.username === 'superadmin' && currentUser.role !== 'SuperAdmin') {
            this.showAlert('فقط السوبر أدمن يمكنه تعديل حالة السوبر أدمن.', 'warning');
            return;
        }

        user.status = user.status === 'Active' ? 'Suspended' : 'Active';
        db.saveUser(user);
        this.renderUsers();
        this.showAlert(`تم ${user.status === 'Active' ? 'تنشيط' : 'إيقاف'} حساب ${user.fullname}.`);
    },

    loadSettingsForms() {
        const settings = db.getSettings();
        const systemName = document.getElementById('set-system-name');
        const systemLogo = document.getElementById('set-system-logo');
        const currency = document.getElementById('set-currency');
        const receiptFooter = document.getElementById('set-receipt-footer');
        const dailyPrice = document.getElementById('set-daily-price');
        const weeklyPrice = document.getElementById('set-weekly-price');
        const monthlyPrice = document.getElementById('set-monthly-price');

        if (systemName) systemName.value = settings.systemName || '';
        if (systemLogo) systemLogo.value = settings.systemLogo || '';
        if (currency) currency.value = settings.currency || '';
        if (receiptFooter) receiptFooter.value = settings.receiptFooter || '';
        if (dailyPrice) dailyPrice.value = settings.dailyPrice || '';
        if (weeklyPrice) weeklyPrice.value = settings.weeklyPrice || '';
        if (monthlyPrice) monthlyPrice.value = settings.monthlyPrice || '';
    },

    handleSettingsBrandingSubmit() {
        const systemName = document.getElementById('set-system-name')?.value.trim();
        const systemLogo = document.getElementById('set-system-logo')?.value.trim();
        const currency = document.getElementById('set-currency')?.value.trim();
        const receiptFooter = document.getElementById('set-receipt-footer')?.value.trim();

        if (!systemName || !systemLogo || !currency || !receiptFooter) {
            this.showAlert('يرجى تعبئة جميع حقول إعدادات الفاتورة.', 'warning');
            return;
        }

        db.saveSettings({
            systemName,
            systemLogo,
            currency,
            receiptFooter
        });

        this.showAlert('تم حفظ إعدادات الفاتورة بنجاح.');
        this.updateUserProfile();
    },

    handleSettingsPricingSubmit() {
        const dailyPrice = parseFloat(document.getElementById('set-daily-price')?.value || 0);
        const weeklyPrice = parseFloat(document.getElementById('set-weekly-price')?.value || 0);
        const monthlyPrice = parseFloat(document.getElementById('set-monthly-price')?.value || 0);

        if (dailyPrice <= 0 || weeklyPrice <= 0 || monthlyPrice <= 0) {
            this.showAlert('يرجى إدخال أسعار صحيحة للاشتراكات.', 'warning');
            return;
        }

        db.saveSettings({
            dailyPrice,
            weeklyPrice,
            monthlyPrice
        });

        this.showAlert('تم حفظ أسعار الاشتراكات بنجاح.');
    },

    exportReceiptsJSON() {
        const receipts = db.getReceipts();
        const payload = JSON.stringify(receipts, null, 2);
        const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `zone-space-receipts-${this.getDeviceDateString()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        this.showAlert('تم تنزيل بيانات الوصلات للمراجعة.', 'success');
    }
};

window.app = app;

document.addEventListener('DOMContentLoaded', () => {
    if (typeof auth === 'undefined' || typeof db === 'undefined') {
        console.error('Missing auth or db module. Please ensure js/auth.js and js/database.js are loaded before js/app.js.');
        return;
    }

    app.init();
});
