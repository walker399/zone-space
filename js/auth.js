/**
 * Zone Space Authentication System
 */

const auth = {
    // Attempt Login
    login(username, password) {
        if (!username || !password) {
            return { success: false, message: "يرجى إدخال اسم المستخدم وكلمة المرور" };
        }

        const user = window.db.getUserByUsername(username);

        if (!user) {
            return { success: false, message: "اسم المستخدم أو كلمة المرور غير صحيحة" };
        }

        // Check if account is Suspended
        if (user.status === "Suspended") {
            window.db.logActivity(user.id, user.username, "Login Attempt Blocked", "محاولة دخول فاشلة للمستخدم لأن الحساب موقوف.");
            return { 
                success: false, 
                message: "حسابك موقوف، يرجى مراجعة الإدارة" 
            };
        }

        // Verify password
        if (!window.db.verifyPassword(password, user.password)) {
            return { success: false, message: "اسم المستخدم أو كلمة المرور غير صحيحة" };
        }

        // Save session (simulating JWT session token)
        const sessionToken = "zs_token_" + Math.random().toString(36).substr(2) + "_" + btoa(user.username);
        const sessionData = {
            token: sessionToken,
            user: {
                id: user.id,
                username: user.username,
                fullname: user.fullname,
                role: user.role,
                status: user.status
            },
            loginTime: new Date().toISOString()
        };

        localStorage.setItem("zonespace_cbl_session", JSON.stringify(sessionData));
        window.db.logActivity(user.id, user.username, "Login", "تم تسجيل الدخول بنجاح.");
        return { success: true, user: sessionData.user };
    },

    // Perform Logout
    logout() {
        const currentUser = this.getCurrentUser();
        if (currentUser) {
            window.db.logActivity(currentUser.id, currentUser.username, "Logout", "تم تسجيل الخروج.");
        }
        localStorage.removeItem("zonespace_cbl_session");
        window.location.replace(new URL("login.html", window.location.href).href);
    },

    // Get current user details and check status
    getCurrentUser() {
        const sessionStr = localStorage.getItem("zonespace_cbl_session");
        if (!sessionStr) return null;

        try {
            const session = JSON.parse(sessionStr);
            const dbUser = window.db.getUserById(session.user.id);
            if (!dbUser || dbUser.status === "Suspended") {
                // Instantly force logout if they were suspended during session
                localStorage.removeItem("zonespace_cbl_session");
                return null;
            }
            return dbUser;
        } catch (e) {
            return null;
        }
    },

    // Check if session is active
    isLoggedIn() {
        return this.getCurrentUser() !== null;
    },

    // Check role authorization
    checkRole(allowedRoles) {
        const user = this.getCurrentUser();
        if (!user) return false;
        return allowedRoles.includes(user.role);
    },

    // Redirect handler
    checkAuthRedirect() {
        const user = this.getCurrentUser();
        const currentPage = window.location.pathname.split("/").pop();

        if (!user && currentPage !== "login.html") {
            window.location.href = "login.html";
        } else if (user && currentPage === "login.html") {
            window.location.href = "index.html";
        }
    }
};

window.auth = auth;
