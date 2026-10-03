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

        const email =
            document
                .getElementById("loginEmail")
                .value
                .trim();

        const password =
            document
                .getElementById("loginPassword")
                .value;

        if (!email || !password) {
            showMessage(
                loginMessage,
                "Enter your email and password.",
                "error"
            );
            return;
        }

        loginButton.disabled = true;
        loginButton.textContent = "Signing in...";

        try {

            const {
                data,
                error
            } = await supabaseClient.auth.signInWithPassword({
                email,
                password
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
            loginButton.textContent = "Sign In";
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

        const email =
            document
                .getElementById("signupEmail")
                .value
                .trim();

        const password =
            document
                .getElementById("signupPassword")
                .value;

        /* Username validation */

        if (!/^[a-zA-Z0-9_]{2,24}$/.test(username)) {

            showMessage(
                signupMessage,
                "Username must be 2-24 characters and only use letters, numbers, or underscores.",
                "error"
            );

            return;
        }


        if (password.length < 6) {

            showMessage(
                signupMessage,
                "Password must be at least 6 characters.",
                "error"
            );

            return;
        }


        signupButton.disabled = true;
        signupButton.textContent =
            "Creating account...";


        try {

            const {
                data,
                error
            } = await supabaseClient.auth.signUp({

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
             * If email confirmation is disabled,
             * Supabase will normally return a session.
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
             * If email confirmation is enabled.
             */

            showMessage(
                signupMessage,
                "Account created! Check your email to confirm your account.",
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

    element.textContent = message;
    element.className =
        "message " + type;

}


/* =========================
   SUPABASE ERRORS
========================= */

function getAuthError(error) {

    const message =
        String(error?.message || "").toLowerCase();


    if (message.includes("invalid login credentials")) {
        return "Incorrect email or password.";
    }


    if (message.includes("user already registered")) {
        return "An account with that email already exists.";
    }


    if (message.includes("password")) {
        return error.message;
    }


    if (message.includes("email")) {
        return error.message;
    }


    if (message.includes("rate limit")) {
        return "Too many attempts. Please wait a little and try again.";
    }


    return error.message ||
        "Something went wrong. Please try again.";

}
