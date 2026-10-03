// ============================================================
// SPATIUM ACCOUNT.JS
// Email + Password Authentication
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    const supabase = window.spatiumSupabase;

    if (!supabase) {
        console.error("[Spatium] Supabase client not found.");
        return;
    }


    // ========================================================
    // ELEMENTS
    // ========================================================

    const loginTab = document.getElementById("loginTab");
    const signupTab = document.getElementById("signupTab");

    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    const loginEmail = document.getElementById("loginEmail");
    const loginPassword = document.getElementById("loginPassword");

    const signupUsername = document.getElementById("signupUsername");
    const signupEmail = document.getElementById("signupEmail");
    const signupPassword = document.getElementById("signupPassword");
    const signupPasswordConfirm =
        document.getElementById("signupPasswordConfirm");

    const loginMessage = document.getElementById("loginMessage");
    const signupMessage = document.getElementById("signupMessage");

    const loginButton = document.getElementById("loginButton");
    const signupButton = document.getElementById("signupButton");

    const accountTitle =
        document.getElementById("accountTitle");

    const accountSubtitle =
        document.getElementById("accountSubtitle");


    // ========================================================
    // SETTINGS
    // ========================================================

    const MIN_PASSWORD_LENGTH = 6;

    const USERNAME_REGEX =
        /^[A-Za-z0-9_]{2,24}$/;


    // ========================================================
    // MESSAGE HELPERS
    // ========================================================

    function showMessage(element, message, type = "error") {

        if (!element) return;

        element.textContent = message;

        element.classList.remove(
            "error",
            "success",
            "info"
        );

        element.classList.add(type);
    }


    function clearMessage(element) {

        if (!element) return;

        element.textContent = "";

        element.classList.remove(
            "error",
            "success",
            "info"
        );
    }


    // ========================================================
    // BUTTON LOADING
    // ========================================================

    function setButtonLoading(
        button,
        loading,
        normalText
    ) {

        if (!button) return;

        if (loading) {

            button.disabled = true;

            button.dataset.originalText =
                button.textContent;

            button.textContent =
                "Please wait...";

        } else {

            button.disabled = false;

            button.textContent =
                button.dataset.originalText ||
                normalText;
        }
    }


    // ========================================================
    // ERROR HANDLING
    // ========================================================

    function friendlyAuthError(error) {

        const message =
            String(error?.message || "").toLowerCase();


        if (
            message.includes("invalid login credentials") ||
            message.includes("invalid credentials")
        ) {
            return "Incorrect email or password.";
        }


        if (
            message.includes("email rate limit") ||
            message.includes("rate limit")
        ) {
            return "Too many attempts. Please wait a little while and try again.";
        }


        if (
            message.includes("user already registered") ||
            message.includes("already registered")
        ) {
            return "An account with this email already exists.";
        }


        if (
            message.includes("password should be at least")
        ) {
            return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
        }


        if (
            message.includes("unable to validate email") ||
            message.includes("invalid email")
        ) {
            return "Please enter a valid email address.";
        }


        if (
            message.includes("email not confirmed")
        ) {
            return "Please confirm your email address before signing in.";
        }


        if (
            message.includes("too many requests")
        ) {
            return "Too many requests. Please wait and try again.";
        }


        return (
            error?.message ||
            "Something went wrong. Please try again."
        );
    }


    // ========================================================
    // TAB SWITCHING
    // ========================================================

    function showLogin() {

        if (loginForm) {
            loginForm.style.display = "block";
        }

        if (signupForm) {
            signupForm.style.display = "none";
        }

        if (loginTab) {
            loginTab.classList.add("active");
        }

        if (signupTab) {
            signupTab.classList.remove("active");
        }

        if (accountTitle) {
            accountTitle.textContent =
                "Welcome back";
        }

        if (accountSubtitle) {
            accountSubtitle.textContent =
                "Sign in to your Spatium account.";
        }

        clearMessage(loginMessage);
        clearMessage(signupMessage);
    }


    function showSignup() {

        if (loginForm) {
            loginForm.style.display = "none";
        }

        if (signupForm) {
            signupForm.style.display = "block";
        }

        if (loginTab) {
            loginTab.classList.remove("active");
        }

        if (signupTab) {
            signupTab.classList.add("active");
        }

        if (accountTitle) {
            accountTitle.textContent =
                "Create your account";
        }

        if (accountSubtitle) {
            accountSubtitle.textContent =
                "Join Spatium and start playing.";
        }

        clearMessage(loginMessage);
        clearMessage(signupMessage);
    }


    if (loginTab) {
        loginTab.addEventListener(
            "click",
            showLogin
        );
    }


    if (signupTab) {
        signupTab.addEventListener(
            "click",
            showSignup
        );
    }


    // ========================================================
    // LOGIN
    // ========================================================

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();

                clearMessage(loginMessage);

                const email =
                    loginEmail?.value.trim() || "";

                const password =
                    loginPassword?.value || "";


                if (!email) {

                    showMessage(
                        loginMessage,
                        "Please enter your email."
                    );

                    loginEmail?.focus();

                    return;
                }


                if (!password) {

                    showMessage(
                        loginMessage,
                        "Please enter your password."
                    );

                    loginPassword?.focus();

                    return;
                }


                if (
                    password.length <
                    MIN_PASSWORD_LENGTH
                ) {

                    showMessage(
                        loginMessage,
                        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
                    );

                    loginPassword?.focus();

                    return;
                }


                setButtonLoading(
                    loginButton,
                    true,
                    "Sign In"
                );


                try {

                    const {
                        data,
                        error
                    } =
                        await supabase.auth
                            .signInWithPassword({
                                email,
                                password
                            });


                    if (error) {
                        throw error;
                    }


                    if (!data?.session) {

                        showMessage(
                            loginMessage,
                            "Unable to create a session. Please try again."
                        );

                        return;
                    }


                    showMessage(
                        loginMessage,
                        "Signed in successfully. Redirecting...",
                        "success"
                    );


                    setTimeout(() => {

                        window.location.href =
                            "./chat.html";

                    }, 400);


                } catch (error) {

                    console.error(
                        "[Spatium] Login error:",
                        error
                    );

                    showMessage(
                        loginMessage,
                        friendlyAuthError(error)
                    );

                } finally {

                    setButtonLoading(
                        loginButton,
                        false,
                        "Sign In"
                    );

                }

            }
        );

    }


    // ========================================================
    // SIGN UP
    // ========================================================

    if (signupForm) {

        signupForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();

                clearMessage(signupMessage);

                const username =
                    signupUsername?.value.trim() || "";

                const email =
                    signupEmail?.value.trim() || "";

                const password =
                    signupPassword?.value || "";

                const passwordConfirm =
                    signupPasswordConfirm?.value || "";


                // ------------------------------------------------
                // USERNAME
                // ------------------------------------------------

                if (!username) {

                    showMessage(
                        signupMessage,
                        "Please choose a username."
                    );

                    signupUsername?.focus();

                    return;
                }


                if (!USERNAME_REGEX.test(username)) {

                    showMessage(
                        signupMessage,
                        "Username must be 2-24 characters and can only contain letters, numbers, and underscores."
                    );

                    signupUsername?.focus();

                    return;
                }


                // ------------------------------------------------
                // EMAIL
                // ------------------------------------------------

                if (!email) {

                    showMessage(
                        signupMessage,
                        "Please enter your email."
                    );

                    signupEmail?.focus();

                    return;
                }


                if (
                    signupEmail?.validity &&
                    !signupEmail.validity.valid
                ) {

                    showMessage(
                        signupMessage,
                        "Please enter a valid email address."
                    );

                    signupEmail?.focus();

                    return;
                }


                // ------------------------------------------------
                // PASSWORD
                // ------------------------------------------------

                if (!password) {

                    showMessage(
                        signupMessage,
                        "Please create a password."
                    );

                    signupPassword?.focus();

                    return;
                }


                if (
                    password.length <
                    MIN_PASSWORD_LENGTH
                ) {

                    showMessage(
                        signupMessage,
                        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
                    );

                    signupPassword?.focus();

                    return;
                }


                // ------------------------------------------------
                // CONFIRM PASSWORD
                // ------------------------------------------------

                if (!passwordConfirm) {

                    showMessage(
                        signupMessage,
                        "Please confirm your password."
                    );

                    signupPasswordConfirm?.focus();

                    return;
                }


                if (password !== passwordConfirm) {

                    showMessage(
                        signupMessage,
                        "Passwords do not match."
                    );

                    signupPasswordConfirm?.focus();

                    return;
                }


                // ------------------------------------------------
                // CREATE ACCOUNT
                // ------------------------------------------------

                setButtonLoading(
                    signupButton,
                    true,
                    "Create Account"
                );


                try {

                    const {
                        data,
                        error
                    } =
                        await supabase.auth.signUp({

                            email,
                            password,

                            options: {

                                data: {
                                    username,
                                    display_name: username
                                }

                            }

                        });


                    if (error) {
                        throw error;
                    }


                    // ------------------------------------------------
                    // EMAIL CONFIRMATION OFF
                    // ------------------------------------------------

                    if (data?.session) {

                        showMessage(
                            signupMessage,
                            "Account created. Redirecting...",
                            "success"
                        );


                        setTimeout(() => {

                            window.location.href =
                                "./chat.html";

                        }, 400);


                        return;
                    }


                    // ------------------------------------------------
                    // EMAIL CONFIRMATION ON
                    // ------------------------------------------------

                    showMessage(
                        signupMessage,
                        "Account created! Check your email to confirm your account, then sign in.",
                        "success"
                    );


                    if (signupPassword) {
                        signupPassword.value = "";
                    }

                    if (signupPasswordConfirm) {
                        signupPasswordConfirm.value = "";
                    }


                } catch (error) {

                    console.error(
                        "[Spatium] Signup error:",
                        error
                    );

                    showMessage(
                        signupMessage,
                        friendlyAuthError(error)
                    );

                } finally {

                    setButtonLoading(
                        signupButton,
                        false,
                        "Create Account"
                    );

                }

            }
        );

    }


    // ========================================================
    // IMPORTANT
    // ========================================================
    //
    // There is intentionally NO:
    //
    // supabase.auth.getUser()
    //
    // redirect here.
    //
    // This means account.html stays on the account page.
    // The user only goes to chat.html after successfully
    // signing in or creating an account.
    // ========================================================

    showLogin();

});
