const supabaseClient = window.spatiumSupabase;

if (!supabaseClient) {
    console.error("Supabase client was not initialized.");
}


/* =========================
   ELEMENTS
========================= */

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


/* =========================
   USERNAME RULES
========================= */

function isValidUsername(username) {
    return /^[a-zA-Z0-9_]{2,24}$/.test(username);
}


/*
 * Supabase Auth normally requires an email.
 *
 * We hide the email completely from the user
 * and create a consistent internal email from
 * their username.
 *
 * IMPORTANT:
 * This is only appropriate if your Supabase
 * project is configured to allow these accounts
 * without requiring real email verification.
 */

function usernameToAuthEmail(username) {
    return username.toLowerCase() + "@accounts.spatium.local";
}


/* =========================
   TABS
========================= */

loginTab.addEventListener("click", () => {

    loginTab.classList.add("active");
    signupTab.classList.remove("active");

    loginForm.classList.add("active");
    signupForm.classList.remove("active");

    accountTitle.textContent =
        "Welcome back";

    accountSubtitle.textContent =
        "Sign in to your Spatium account.";

    loginMessage.textContent = "";
    signupMessage.textContent = "";

});


signupTab.addEventListener("click", () => {

    signupTab.classList.add("active");
    loginTab.classList.remove("active");

    signupForm.classList.add("active");
    loginForm.classList.remove("active");

    accountTitle.textContent =
        "Create your account";

    accountSubtitle.textContent =
        "Join the Spatium community.";

    loginMessage.textContent = "";
    signupMessage.textContent = "";

});


/* =========================
   LOGIN
========================= */

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


        /* Username validation */

        if (!isValidUsername(username)) {

            showMessage(
                loginMessage,
                "Username must be 2-24 characters and only use letters, numbers, or underscores.",
                "error"
            );

            return;
        }


        /* Password validation */

        if (password.length < 6) {

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
                usernameToAuthEmail(username);


            const {
                data,
                error
            } =
                await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });


            if (error) {
                throw error;
            }


            if (!data.user) {
                throw new Error(
                    "Sign in failed."
                );
            }


            showMessage(
                loginMessage,
                "Signed in! Redirecting...",
                "success"
            );


            setTimeout(() => {

                window.location.href =
                    "./chat.html";

            }, 700);


        } catch (error) {

            console.error(error);

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


/* =========================
   CREATE ACCOUNT
========================= */

signupForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        signupMessage.textContent = "";
        signupMessage.className = "message";


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
                .getElementById("signupPasswordConfirm")
                .value;


        /* Username validation */

        if (!isValidUsername(username)) {

            showMessage(
                signupMessage,
                "Username must be 2-24 characters and only use letters, numbers, or underscores.",
                "error"
            );

            return;
        }


        /* Password length */

        if (password.length < 6) {

            showMessage(
                signupMessage,
                "Password must be at least 6 characters.",
                "error"
            );

            return;
        }


        /* Password confirmation */

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

            const email =
                usernameToAuthEmail(username);


            const {
                data,
                error
            } =
                await supabaseClient.auth.signUp({

                    email: email,

                    password: password,

                    options: {

                        data: {

                            username: username,

                            display_name: username

                        }

                    }

                });


            if (error) {
                throw error;
            }


            /*
             * If Supabase immediately creates
             * a session, send them to chat.
             */

            if (data.session) {

                showMessage(
                    signupMessage,
                    "Account created! Redirecting...",
                    "success"
                );


                setTimeout(() => {

                    window.location.href =
                        "./chat.html";

                }, 700);


                return;
            }


            /*
             * If Supabase requires confirmation,
             * tell the user.
             */

            showMessage(
                signupMessage,
                "Account created! Your account may require confirmation before signing in.",
                "success"
            );


            signupButton.disabled = false;

            signupButton.textContent =
                "Create Account";


        } catch (error) {

            console.error(error);

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


/* =========================
   MESSAGE
========================= */

function showMessage(
    element,
    message,
    type
) {

    element.textContent =
        message;

    element.className =
        "message " + type;

}


/* =========================
   SUPABASE ERRORS
========================= */

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
        error.message ||
        "Something went wrong. Please try again."
    );

}
