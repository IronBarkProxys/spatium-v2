/* =========================================================
   SPATIUM ACCOUNT
   Username + Password Authentication
   ========================================================= */

(() => {
    "use strict";

    const supabase = window.spatiumSupabase;

    if (!supabase) {
        console.error("[Spatium Account] Supabase client not found.");
        return;
    }

    /* =========================================================
       ELEMENTS
    ========================================================= */

    const loginTab =
        document.getElementById("loginTab");

    const signupTab =
        document.getElementById("signupTab");

    const loginForm =
        document.getElementById("loginForm");

    const signupForm =
        document.getElementById("signupForm");

    const loginMessage =
        document.getElementById("loginMessage");

    const signupMessage =
        document.getElementById("signupMessage");

    const loginButton =
        document.getElementById("loginButton");

    const signupButton =
        document.getElementById("signupButton");

    const accountTitle =
        document.getElementById("accountTitle");

    const accountSubtitle =
        document.getElementById("accountSubtitle");


    /* =========================================================
       HELPERS
    ========================================================= */

    function showMessage(element, message, type) {

        if (!element) {
            return;
        }

        element.textContent = message;

        element.className =
            "message " + type;
    }


    function validUsername(username) {

        return /^[A-Za-z0-9_]{2,24}$/.test(
            username
        );

    }


    function validPassword(password) {

        return password.length >= 6;

    }


    /*
     * Supabase Auth requires an email for its
     * standard email/password authentication.
     *
     * The user never sees this address.
     *
     * We generate one from the username.
     */

    function usernameToEmail(username) {

        return (
            username.toLowerCase() +
            "@spatium.internal"
        );

    }


    /* =========================================================
       LOGIN / SIGNUP TABS
    ========================================================= */

    if (loginTab) {

        loginTab.addEventListener(
            "click",
            () => {

                loginTab.classList.add("active");

                signupTab.classList.remove(
                    "active"
                );

                loginForm.classList.add("active");

                signupForm.classList.remove(
                    "active"
                );

                accountTitle.textContent =
                    "Welcome back";

                accountSubtitle.textContent =
                    "Sign in to your Spatium account.";

                loginMessage.textContent = "";
                signupMessage.textContent = "";

            }
        );

    }


    if (signupTab) {

        signupTab.addEventListener(
            "click",
            () => {

                signupTab.classList.add("active");

                loginTab.classList.remove(
                    "active"
                );

                signupForm.classList.add("active");

                loginForm.classList.remove(
                    "active"
                );

                accountTitle.textContent =
                    "Create your account";

                accountSubtitle.textContent =
                    "Join the Spatium community.";

                loginMessage.textContent = "";
                signupMessage.textContent = "";

            }
        );

    }


    /* =========================================================
       LOGIN
    ========================================================= */

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            loginMessage.textContent = "";
            loginMessage.className = "message";


            const username =
                document
                    .getElementById("loginUsername")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("loginPassword")
                    .value;


            /* Username */

            if (!validUsername(username)) {

                showMessage(
                    loginMessage,

                    "Username must be 2-24 characters and only use letters, numbers, or underscores.",

                    "error"
                );

                return;
            }


            /* Password */

            if (!validPassword(password)) {

                showMessage(
                    loginMessage,

                    "Password must be at least 6 characters.",

                    "error"
                );

                return;
            }


            loginButton.disabled = true;

            loginButton.textContent =
                "Signing in...";


            try {

                const email =
                    usernameToEmail(username);


                const {
                    data,
                    error
                } =
                    await supabase.auth.signInWithPassword({

                        email: email,

                        password: password

                    });


                if (error) {
                    throw error;
                }


                if (!data?.user) {
                    throw new Error(
                        "Sign in failed."
                    );
                }


                showMessage(
                    loginMessage,

                    "Signed in! Redirecting...",

                    "success"
                );


                setTimeout(
                    () => {

                        window.location.href =
                            "./chat.html";

                    },
                    500
                );


            } catch (error) {

                console.error(
                    "[Spatium Account] Login error:",
                    error
                );


                showMessage(
                    loginMessage,

                    getAuthError(error),

                    "error"
                );


                loginButton.disabled = false;

                loginButton.textContent =
                    "Sign In";

            }

        }
    );


    /* =========================================================
       CREATE ACCOUNT
    ========================================================= */

    signupForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            signupMessage.textContent = "";

            signupMessage.className =
                "message";


            const username =
                document
                    .getElementById("signupUsername")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("signupPassword")
                    .value;


            const confirmPassword =
                document
                    .getElementById(
                        "signupPasswordConfirm"
                    )
                    .value;


            /* =========================
               USERNAME VALIDATION
            ========================= */

            if (!validUsername(username)) {

                showMessage(
                    signupMessage,

                    "Username must be 2-24 characters and only use letters, numbers, or underscores.",

                    "error"
                );

                return;
            }


            /* =========================
               PASSWORD VALIDATION
            ========================= */

            if (!validPassword(password)) {

                showMessage(
                    signupMessage,

                    "Password must be at least 6 characters.",

                    "error"
                );

                return;
            }


            /* =========================
               PASSWORD CONFIRMATION
            ========================= */

            if (password !== confirmPassword) {

                showMessage(
                    signupMessage,

                    "Passwords do not match.",

                    "error"
                );

                return;
            }


            signupButton.disabled = true;

            signupButton.textContent =
                "Creating account...";


            try {

                /*
                 * Check whether the username
                 * is already in the profiles table.
                 */

                const {
                    data: existingProfile,
                    error: usernameCheckError
                } =
                    await supabase
                        .from("profiles")
                        .select("id")
                        .eq(
                            "username",
                            username
                        )
                        .maybeSingle();


                if (usernameCheckError) {

                    throw usernameCheckError;

                }


                if (existingProfile) {

                    showMessage(
                        signupMessage,

                        "That username is already taken.",

                        "error"
                    );

                    return;

                }


                /* =========================
                   CREATE AUTH ACCOUNT
                ========================= */

                const email =
                    usernameToEmail(username);


                const {
                    data,
                    error
                } =
                    await supabase.auth.signUp({

                        email: email,

                        password: password,

                        options: {

                            data: {

                                username:
                                    username,

                                display_name:
                                    username

                            }

                        }

                    });


                if (error) {
                    throw error;
                }


                if (!data?.user) {

                    throw new Error(
                        "Account creation failed."
                    );

                }


                /*
                 * If email confirmation is disabled,
                 * Supabase gives us a session immediately.
                 */

                if (data.session) {

                    showMessage(
                        signupMessage,

                        "Account created! Redirecting...",

                        "success"
                    );


                    setTimeout(
                        () => {

                            window.location.href =
                                "./chat.html";

                        },
                        500
                    );


                    return;

                }


                /*
                 * No session means Supabase is
                 * requiring email confirmation.
                 */

                showMessage(
                    signupMessage,

                    "Account created, but email confirmation is required in Supabase.",

                    "error"
                );


                signupButton.disabled = false;

                signupButton.textContent =
                    "Create Account";

            } catch (error) {

                console.error(
                    "[Spatium Account] Signup error:",
                    error
                );


                showMessage(
                    signupMessage,

                    getAuthError(error),

                    "error"
                );


                signupButton.disabled = false;

                signupButton.textContent =
                    "Create Account";

            }

        }
    );


    /* =========================================================
       AUTH ERROR HANDLING
    ========================================================= */

    function getAuthError(error) {

        const message =
            String(
                error?.message || ""
            ).toLowerCase();


        if (
            message.includes(
                "invalid login credentials"
            )
        ) {

            return "Incorrect username or password.";

        }


        if (
            message.includes(
                "user already registered"
            )
        ) {

            return "That username is already taken.";

        }


        if (
            message.includes(
                "already registered"
            )
        ) {

            return "That username is already taken.";

        }


        if (
            message.includes(
                "email"
            ) &&
            message.includes(
                "invalid"
            )
        ) {

            return "The account could not be created. Check your Supabase email authentication settings.";

        }


        if (
            message.includes(
                "password"
            )
        ) {

            return error.message;

        }


        if (
            message.includes(
                "rate limit"
            )
        ) {

            return "Too many attempts. Please wait a little and try again.";

        }


        return (
            error?.message ||
            "Something went wrong. Please try again."
        );

    }


    /* =========================================================
       CHECK EXISTING SESSION
    ========================================================= */

    async function checkExistingSession() {

        try {

            const {
                data
            } =
                await supabase.auth.getSession();


            if (data?.session) {

                console.log(
                    "[Spatium Account] Existing session detected."
                );

            }

        } catch (error) {

            console.error(
                "[Spatium Account] Session check failed:",
                error
            );

        }

    }


    checkExistingSession();

})();
