/* =========================================================
   SPATIUM CHAT
   Message boxes + Supabase RPC chat
   ========================================================= */

(() => {
    "use strict";

    const supabase = window.spatiumSupabase;

    if (!supabase) {
        console.error(
            "[Spatium Chat] Supabase client not found."
        );
        return;
    }

    /* =========================================================
       CONFIG
       ========================================================= */

    const MAX_MESSAGE_LENGTH = 300;
    const MESSAGE_LIMIT = 200;
    const POLL_INTERVAL = 5000;

    let currentUser = null;
    let currentUsername = "User";
    let currentVerified = false;

    let pollTimer = null;
    let loadingMessages = false;
    let sendingMessage = false;

    let profileCache = new Map();


    /* =========================================================
       DOM
       ========================================================= */

    const messagesEl =
        document.getElementById("messages");

    const messageInput =
        document.getElementById("messageInput");

    const sendButton =
        document.getElementById("sendButton");

    const characterCount =
        document.getElementById("characterCount");

    const chatStatus =
        document.getElementById("chatStatus");

    const connectionStatus =
        document.getElementById("connectionStatus");

    const mentionList =
        document.getElementById("mentionList");


    /* =========================================================
       STATUS
       ========================================================= */

    function showError(message) {
        console.error(
            "[Spatium Chat]",
            message
        );

        if (!chatStatus) {
            return;
        }

        chatStatus.textContent =
            message;

        chatStatus.classList.add(
            "error"
        );

        setTimeout(() => {

            chatStatus.textContent =
                "";

            chatStatus.classList.remove(
                "error"
            );

        }, 5000);
    }


    function showStatus(message) {

        if (!chatStatus) {
            return;
        }

        chatStatus.textContent =
            message;

        setTimeout(() => {

            if (
                chatStatus.textContent ===
                message
            ) {
                chatStatus.textContent =
                    "";
            }

        }, 3000);
    }


    function setConnection(status) {

        if (!connectionStatus) {
            return;
        }

        connectionStatus.textContent =
            status;

        connectionStatus.classList.remove(
            "connected",
            "error",
            "connecting"
        );

        if (
            status ===
            "Connected"
        ) {

            connectionStatus.classList.add(
                "connected"
            );

        } else if (
            status ===
            "Connection error"
        ) {

            connectionStatus.classList.add(
                "error"
            );

        } else {

            connectionStatus.classList.add(
                "connecting"
            );

        }
    }


    /* =========================================================
       ESCAPE HTML
       ========================================================= */

    function escapeHTML(value) {

        const div =
            document.createElement(
                "div"
            );

        div.textContent =
            value ?? "";

        return div.innerHTML;
    }


    /* =========================================================
       USERNAME
       ========================================================= */

    function getUsername(user) {

        if (!user) {
            return "User";
        }

        return (
            user.user_metadata?.username ||
            user.user_metadata?.display_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "User"
        );
    }


    /*
     * Try to get the username from whatever shape
     * the RPC returns.
     *
     * This supports several common column names:
     *
     * username
     * display_name
     * name
     * user_name
     * author_username
     * profile_username
     */

    function getMessageUsername(message) {

        if (!message) {
            return "User";
        }

        if (
            currentUser &&
            message.user_id === currentUser.id
        ) {
            return currentUsername;
        }

        const cachedProfile =
            profileCache.get(
                message.user_id
            );

        if (
            cachedProfile &&
            cachedProfile.username
        ) {
            return cachedProfile.username;
        }

        return (
            message.username ||
            message.display_name ||
            message.name ||
            message.user_name ||
            message.author_username ||
            message.profile_username ||
            message.author_name ||
            "User"
        );
    }


    /* =========================================================
       VERIFIED STATUS
       ========================================================= */

    function getMessageVerified(message) {

        if (!message) {
            return false;
        }

        if (
            currentUser &&
            message.user_id === currentUser.id
        ) {
            return currentVerified;
        }

        const cachedProfile =
            profileCache.get(
                message.user_id
            );

        if (cachedProfile) {
            return cachedProfile.verified === true;
        }

        return (
            message.verified === true ||
            message.is_verified === true ||
            message.author_verified === true
        );
    }


    async function loadProfilesForMessages(
        messages
    ) {

        if (
            !messages ||
            !messages.length
        ) {
            return;
        }

        const userIds = [
            ...new Set(
                messages
                    .map(
                        message =>
                            message?.user_id
                    )
                    .filter(Boolean)
            )
        ];

        if (!userIds.length) {
            return;
        }

        try {

            const {
                data,
                error
            } =
                await supabase
                    .from("profiles")
                    .select(
                        "id, username, display_name, verified"
                    )
                    .in(
                        "id",
                        userIds
                    );

            if (error) {

                console.error(
                    "[Spatium Chat] Could not load profiles:",
                    error
                );

                return;
            }

            for (
                const profile
                of data || []
            ) {

                profileCache.set(
                    profile.id,
                    profile
                );

            }

        } catch (error) {

            console.error(
                "[Spatium Chat] Profile loading error:",
                error
            );

        }
    }


    /* =========================================================
       TIME
       ========================================================= */

    function formatMessageTime(timestamp) {

        if (!timestamp) {
            return "";
        }

        const date =
            new Date(timestamp);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "";
        }

        const now =
            new Date();

        const sameDay =
            date.getFullYear() ===
                now.getFullYear() &&
            date.getMonth() ===
                now.getMonth() &&
            date.getDate() ===
                now.getDate();

        if (sameDay) {

            return date.toLocaleTimeString(
                [],
                {
                    hour: "numeric",
                    minute: "2-digit"
                }
            );

        }

        return (
            date.toLocaleDateString(
                [],
                {
                    month: "short",
                    day: "numeric"
                }
            ) +
            " " +
            date.toLocaleTimeString(
                [],
                {
                    hour: "numeric",
                    minute: "2-digit"
                }
            )
        );
    }


    /* =========================================================
       CHARACTER COUNT
       ========================================================= */

    function updateCharacterCount() {

        if (
            !messageInput ||
            !characterCount
        ) {
            return;
        }

        const length =
            messageInput.value.length;

        characterCount.textContent =
            `${length} / ${MAX_MESSAGE_LENGTH}`;

        characterCount.classList.remove(
            "warning"
        );

        characterCount.classList.remove(
            "limit"
        );

        if (
            length >=
            MAX_MESSAGE_LENGTH
        ) {

            characterCount.classList.add(
                "limit"
            );

        } else if (
            length >=
            MAX_MESSAGE_LENGTH - 50
        ) {

            characterCount.classList.add(
                "warning"
            );
        }
    }


    /* =========================================================
       MENTIONS
       ========================================================= */

    function extractMentions(text) {

        const matches =
            text.match(
                /@([a-zA-Z0-9_]{1,32})/g
            );

        if (!matches) {
            return [];
        }

        return [
            ...new Set(
                matches.map(
                    mention =>
                        mention.substring(1)
                )
            )
        ];
    }


    function clearMentionList() {

        if (mentionList) {
            mentionList.innerHTML =
                "";
        }
    }


    /* =========================================================
       CREATE MESSAGE
       ========================================================= */

    function createMessage(message) {

        const element =
            document.createElement(
                "div"
            );

        /*
         * Use the exact classes expected
         * by the Spatium message CSS.
         */

        element.className =
            "gv-msg";

        if (
            currentUser &&
            message.user_id ===
                currentUser.id
        ) {

            element.classList.add(
                "own"
            );
        }

        if (message.id) {

            element.dataset.id =
                message.id;

        }


        const username =
            getMessageUsername(
                message
            );


        const verified =
            getMessageVerified(
                message
            );


        const body =
            message.body ??
            message.content ??
            message.message ??
            "";


        const time =
            formatMessageTime(
                message.created_at
            );


        const verifiedBadge =
            verified
                ? `
                    <span
                        class="gv-verified-badge"
                        aria-label="Verified"
                        title="Verified"
                    >
                        <span class="gv-verified-check">✓</span>
                    </span>
                `
                : "";


        element.innerHTML = `

            <div class="gv-msg-head">

                <button
                    class="gv-msg-name"
                    type="button"
                    data-user-id="${escapeHTML(
                        message.user_id || ""
                    )}"
                >
                    ${escapeHTML(username)}
                    ${verifiedBadge}
                </button>

                <time
                    class="gv-msg-time"
                    datetime="${escapeHTML(
                        message.created_at || ""
                    )}"
                >
                    ${escapeHTML(time)}
                </time>

            </div>

            <div class="gv-msg-body">
                ${escapeHTML(body)}
            </div>

        `;


        return element;
    }


    /* =========================================================
       RENDER MESSAGES
       ========================================================= */

    function renderMessages(messages) {

        if (!messagesEl) {

            console.error(
                "[Spatium Chat] #messages was not found."
            );

            return;
        }


        const wasNearBottom =
            messagesEl.scrollHeight -
            messagesEl.scrollTop -
            messagesEl.clientHeight <
            150;


        messagesEl.innerHTML =
            "";


        if (
            !messages ||
            !messages.length
        ) {

            messagesEl.innerHTML = `

                <div class="gv-chat-empty">

                    No messages yet.
                    Start the conversation!

                </div>

            `;

            return;
        }


        const sortedMessages =
            [...messages].sort(
                (a, b) => {

                    const aTime =
                        new Date(
                            a.created_at
                        ).getTime();

                    const bTime =
                        new Date(
                            b.created_at
                        ).getTime();

                    return aTime - bTime;
                }
            );


        for (
            const message
            of sortedMessages
        ) {

            messagesEl.appendChild(
                createMessage(message)
            );

        }


        if (wasNearBottom) {

            requestAnimationFrame(() => {

                messagesEl.scrollTop =
                    messagesEl.scrollHeight;

            });

        }
    }


    /* =========================================================
       LOAD MESSAGES
       ========================================================= */

    async function loadMessages() {

        if (loadingMessages) {
            return;
        }

        if (!currentUser) {
            return;
        }


        loadingMessages =
            true;


        try {

            console.log(
                "[Spatium Chat] Loading messages..."
            );


            const {
                data,
                error
            } =
                await supabase.rpc(
                    "gv_chat_recent",
                    {
                        p_limit:
                            MESSAGE_LIMIT
                    }
                );


            if (error) {

                console.error(
                    "[Spatium Chat] gv_chat_recent error:",
                    error
                );

                setConnection(
                    "Connection error"
                );

                showError(
                    error.message ||
                    "Could not load chat messages."
                );

                return;
            }


            const messages =
                Array.isArray(data)
                    ? data
                    : [];


            console.log(
                `[Spatium Chat] Loaded ${messages.length} messages.`
            );


            await loadProfilesForMessages(
                messages
            );


            setConnection(
                "Connected"
            );


            renderMessages(
                messages
            );


        } catch (error) {

            console.error(
                "[Spatium Chat] loadMessages error:",
                error
            );

            setConnection(
                "Connection error"
            );

            showError(
                "Could not load chat messages."
            );


        } finally {

            loadingMessages =
                false;

        }
    }


    /* =========================================================
       SEND MESSAGE
       ========================================================= */

    async function sendMessage() {

        if (sendingMessage) {
            return;
        }


        if (!currentUser) {

            showError(
                "Please sign in before sending a message."
            );

            return;
        }


        if (!messageInput) {

            showError(
                "Message input could not be found."
            );

            return;
        }


        const body =
            messageInput.value.trim();


        if (!body) {
            return;
        }


        if (
            body.length >
            MAX_MESSAGE_LENGTH
        ) {

            showError(
                `Messages are limited to ${MAX_MESSAGE_LENGTH} characters.`
            );

            return;
        }


        sendingMessage =
            true;


        if (sendButton) {

            sendButton.disabled =
                true;

            sendButton.textContent =
                "Sending...";

        }


        try {

            const mentions =
                extractMentions(
                    body
                );


            console.log(
                "[Spatium Chat] Sending message..."
            );


            const {
                data,
                error
            } =
                await supabase.rpc(
                    "gv_chat_send",
                    {
                        p_body:
                            body,

                        p_mentions:
                            mentions
                    }
                );


            if (error) {

                console.error(
                    "[Spatium Chat] gv_chat_send error:",
                    error
                );

                showError(
                    error.message ||
                    "Could not send message."
                );

                return;
            }


            console.log(
                "[Spatium Chat] Message saved:",
                data
            );


            messageInput.value =
                "";


            updateCharacterCount();


            clearMentionList();


            /*
             * Reload from Supabase so the message
             * displayed is the actual database row.
             */

            await loadMessages();


        } catch (error) {

            console.error(
                "[Spatium Chat] sendMessage error:",
                error
            );

            showError(
                "Could not send message."
            );


        } finally {

            sendingMessage =
                false;


            if (sendButton) {

                sendButton.disabled =
                    false;

                sendButton.textContent =
                    "Send";

            }


            if (messageInput) {
                messageInput.focus();
            }
        }
    }


    /* =========================================================
       INPUT
       ========================================================= */

    function setupInput() {

        if (!messageInput) {

            console.error(
                "[Spatium Chat] #messageInput not found."
            );

            return;
        }


        messageInput.addEventListener(
            "input",
            () => {

                updateCharacterCount();

            }
        );


        messageInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                        "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    sendMessage();

                }

            }
        );


        updateCharacterCount();
    }


    /* =========================================================
       SEND BUTTON
       ========================================================= */

    function setupSendButton() {

        if (!sendButton) {

            console.error(
                "[Spatium Chat] #sendButton not found."
            );

            return;
        }


        sendButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                sendMessage();

            }
        );
    }


    /* =========================================================
       USERNAME BUTTON
       ========================================================= */

    function setupMessageUserButtons() {

        if (!messagesEl) {
            return;
        }


        messagesEl.addEventListener(
            "click",
            event => {

                const usernameButton =
                    event.target.closest(
                        ".gv-msg-name"
                    );


                if (!usernameButton) {
                    return;
                }


                const userId =
                    usernameButton.dataset.userId;


                if (!userId) {
                    return;
                }


                /*
                 * This is intentionally left as a
                 * simple hook for profile functionality.
                 *
                 * You can later make clicking a username
                 * open their profile.
                 */

                console.log(
                    "[Spatium Chat] Username clicked:",
                    userId
                );

            }
        );
    }


    /* =========================================================
       AUTH
       ========================================================= */

    async function updateUser() {

        try {

            const {
                data,
                error
            } =
                await supabase.auth.getUser();


            if (error) {
                throw error;
            }


            currentUser =
                data?.user ||
                null;


            if (!currentUser) {

                currentUsername =
                    "User";

                currentVerified =
                    false;


                if (messageInput) {

                    messageInput.disabled =
                        true;

                    messageInput.placeholder =
                        "Sign in to send a message...";

                }


                if (sendButton) {

                    sendButton.disabled =
                        true;

                }


                setConnection(
                    "Connected"
                );


                return;
            }


            currentUsername =
                getUsername(
                    currentUser
                );


            console.log(
                "[Spatium Chat] Logged in as:",
                currentUsername
            );


            try {

                const {
                    data: profile,
                    error: profileError
                } =
                    await supabase
                        .from("profiles")
                        .select(
                            "id, username, display_name, verified"
                        )
                        .eq(
                            "id",
                            currentUser.id
                        )
                        .maybeSingle();


                if (profileError) {

                    console.error(
                        "[Spatium Chat] Could not load profile:",
                        profileError
                    );

                    currentVerified =
                        false;

                } else if (profile) {

                    currentUsername =
                        profile.username ||
                        profile.display_name ||
                        currentUsername;

                    currentVerified =
                        profile.verified ===
                        true;

                    profileCache.set(
                        profile.id,
                        profile
                    );

                } else {

                    currentVerified =
                        false;

                }

            } catch (profileError) {

                console.error(
                    "[Spatium Chat] Profile lookup failed:",
                    profileError
                );

                currentVerified =
                    false;

            }


            if (messageInput) {

                messageInput.disabled =
                    false;

                messageInput.placeholder =
                    "Type a message...";

            }


            if (sendButton) {

                sendButton.disabled =
                    false;

            }


            await loadMessages();


        } catch (error) {

            console.error(
                "[Spatium Chat] updateUser error:",
                error
            );

            showError(
                "Could not verify your account."
            );
        }
    }


    /* =========================================================
       AUTH STATE LISTENER
       ========================================================= */

    function setupAuthListener() {

        supabase.auth.onAuthStateChange(
            async (
                event,
                session
            ) => {

                console.log(
                    "[Spatium Chat] Auth event:",
                    event
                );


                currentUser =
                    session?.user ||
                    null;


                if (currentUser) {

                    currentUsername =
                        getUsername(
                            currentUser
                        );


                    await updateUser();


                    startPolling();


                } else {

                    currentUsername =
                        "User";

                    currentVerified =
                        false;


                    if (messageInput) {

                        messageInput.disabled =
                            true;

                        messageInput.placeholder =
                            "Sign in to send a message...";

                    }


                    if (sendButton) {

                        sendButton.disabled =
                            true;

                    }


                    stopPolling();


                    if (messagesEl) {

                        messagesEl.innerHTML = `

                            <div class="gv-chat-empty">

                                Sign in to view chat.

                            </div>

                        `;

                    }

                }

            }
        );
    }


    /* =========================================================
       POLLING
       ========================================================= */

    function startPolling() {

        stopPolling();


        pollTimer =
            setInterval(
                () => {

                    if (
                        currentUser &&
                        !document.hidden
                    ) {

                        loadMessages();

                    }

                },
                POLL_INTERVAL
            );
    }


    function stopPolling() {

        if (pollTimer) {

            clearInterval(
                pollTimer
            );

            pollTimer =
                null;
        }
    }


    /* =========================================================
       INITIALIZATION
       ========================================================= */

    async function initSpatiumChat() {

        console.log(
            "[Spatium Chat] Initializing..."
        );


        if (!messagesEl) {

            console.error(
                "[Spatium Chat] #messages not found."
            );

        }


        if (!messageInput) {

            console.error(
                "[Spatium Chat] #messageInput not found."
            );

        }


        if (!sendButton) {

            console.error(
                "[Spatium Chat] #sendButton not found."
            );

        }


        setupInput();

        setupSendButton();

        setupMessageUserButtons();

        setupAuthListener();


        await updateUser();


        startPolling();


        console.log(
            "[Spatium Chat] Ready."
        );
    }


    /* =========================================================
       PUBLIC API
       ========================================================= */

    window.spatiumChat = {

        loadMessages,

        sendMessage,

        updateUser,

        showError

    };


    /* =========================================================
       START
       ========================================================= */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initSpatiumChat
        );

    } else {

        initSpatiumChat();

    }

})();
