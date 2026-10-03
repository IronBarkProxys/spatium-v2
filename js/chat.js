/* =========================================================
   SPATIUM CHAT
   ========================================================= */

(() => {
    "use strict";

    const supabase = window.spatiumSupabase;

    if (!supabase) {
        console.error("[Spatium Chat] Supabase client not found.");
        return;
    }

    /* ---------------------------------------------------------
       CONFIG
    --------------------------------------------------------- */

    const MAX_MESSAGE_LENGTH = 2000;
    const MESSAGE_LIMIT = 200;
    const POLL_INTERVAL = 3000;

    let currentUser = null;
    let currentUsername = "User";
    let pollTimer = null;
    let loadingMessages = false;
    let sendingMessage = false;

    const renderedMessageIds = new Set();

    /* ---------------------------------------------------------
       HELPERS
    --------------------------------------------------------- */

    function $(selector) {
        return document.querySelector(selector);
    }

    function escapeHTML(value) {
        const div = document.createElement("div");
        div.textContent = value ?? "";
        return div.innerHTML;
    }

    function showError(message) {
        console.error("[Spatium Chat]", message);

        const errorEl =
            document.getElementById("chatError") ||
            document.querySelector(".chat-error");

        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = "block";

            clearTimeout(errorEl._hideTimer);

            errorEl._hideTimer = setTimeout(() => {
                errorEl.style.display = "none";
            }, 5000);
        }
    }

    function clearError() {
        const errorEl =
            document.getElementById("chatError") ||
            document.querySelector(".chat-error");

        if (errorEl) {
            errorEl.textContent = "";
            errorEl.style.display = "none";
        }
    }

    function getChatContainer() {
        return (
            document.getElementById("chatMessages") ||
            document.querySelector(".chat-messages") ||
            document.querySelector("[data-chat-messages]")
        );
    }

    function getInput() {
        return (
            document.getElementById("chatInput") ||
            document.querySelector('textarea[name="message"]') ||
            document.querySelector('input[name="message"]') ||
            document.querySelector(".chat-input")
        );
    }

    function getSendButton() {
        return (
            document.getElementById("sendMessage") ||
            document.querySelector("#sendBtn") ||
            document.querySelector(".send-message") ||
            document.querySelector(".chat-send")
        );
    }

    function scrollToBottom() {
        const container = getChatContainer();

        if (!container) return;

        container.scrollTop = container.scrollHeight;
    }

    function formatTime(timestamp) {
        if (!timestamp) return "";

        const date = new Date(timestamp);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
        });
    }

    function formatDate(timestamp) {
        if (!timestamp) return "";

        const date = new Date(timestamp);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleDateString([], {
            month: "short",
            day: "numeric"
        });
    }

    function getUsername(userId) {
        if (
            currentUser &&
            userId &&
            currentUser.id === userId
        ) {
            return currentUsername;
        }

        return "User";
    }

    function extractUsername(user) {
        if (!user) return "User";

        const metadata = user.user_metadata || {};

        return (
            metadata.username ||
            metadata.display_name ||
            metadata.name ||
            user.email?.split("@")[0] ||
            "User"
        );
    }

    /* ---------------------------------------------------------
       MESSAGE RENDERING
       --------------------------------------------------------- */

    function createMessageElement(message) {
        const wrapper = document.createElement("div");

        wrapper.className = "chat-message";

        if (
            currentUser &&
            message.user_id === currentUser.id
        ) {
            wrapper.classList.add("own-message");
        }

        if (message.id) {
            wrapper.dataset.messageId = message.id;
        }

        const username = getUsername(message.user_id);
        const body = message.body || "";

        wrapper.innerHTML = `
            <div class="chat-message-header">
                <span class="chat-message-user">
                    ${escapeHTML(username)}
                </span>

                <span class="chat-message-time">
                    ${escapeHTML(formatTime(message.created_at))}
                </span>
            </div>

            <div class="chat-message-body">
                ${escapeHTML(body)}
            </div>
        `;

        return wrapper;
    }

    function renderMessages(messages) {
        const container = getChatContainer();

        if (!container) {
            console.error(
                "[Spatium Chat] Could not find chat message container."
            );
            return;
        }

        container.innerHTML = "";

        renderedMessageIds.clear();

        const sorted = [...messages].sort((a, b) => {
            const timeA = new Date(a.created_at).getTime();
            const timeB = new Date(b.created_at).getTime();

            return timeA - timeB;
        });

        for (const message of sorted) {
            if (message.id) {
                renderedMessageIds.add(message.id);
            }

            container.appendChild(
                createMessageElement(message)
            );
        }

        requestAnimationFrame(scrollToBottom);
    }

    /* ---------------------------------------------------------
       LOAD MESSAGES
       --------------------------------------------------------- */

    async function loadMessages() {
        if (loadingMessages) {
            return;
        }

        if (!currentUser) {
            return;
        }

        loadingMessages = true;
        clearError();

        try {
            console.log(
                "[Spatium Chat] Loading messages..."
            );

            const { data, error } = await supabase.rpc(
                "gv_chat_recent",
                {
                    p_limit: MESSAGE_LIMIT
                }
            );

            if (error) {
                console.error(
                    "[Spatium Chat] gv_chat_recent error:",
                    error
                );

                showError(
                    "Unable to load chat messages."
                );

                return;
            }

            const messages = Array.isArray(data)
                ? data
                : [];

            console.log(
                `[Spatium Chat] Loaded ${messages.length} messages.`
            );

            renderMessages(messages);
        } catch (error) {
            console.error(
                "[Spatium Chat] loadMessages failed:",
                error
            );

            showError(
                "Unable to load chat messages."
            );
        } finally {
            loadingMessages = false;
        }
    }

    /* ---------------------------------------------------------
       SEND MESSAGE
       --------------------------------------------------------- */

    async function sendMessage() {
        if (sendingMessage) {
            return;
        }

        if (!currentUser) {
            showError(
                "You must be signed in to send messages."
            );
            return;
        }

        const input = getInput();

        if (!input) {
            console.error(
                "[Spatium Chat] Message input not found."
            );
            return;
        }

        let body = input.value.trim();

        if (!body) {
            return;
        }

        if (body.length > MAX_MESSAGE_LENGTH) {
            showError(
                `Message is too long. Maximum is ${MAX_MESSAGE_LENGTH} characters.`
            );
            return;
        }

        sendingMessage = true;

        const button = getSendButton();

        if (button) {
            button.disabled = true;
        }

        clearError();

        try {
            const mentions = findMentions(body);

            console.log(
                "[Spatium Chat] Sending message..."
            );

            const { data, error } = await supabase.rpc(
                "gv_chat_send",
                {
                    p_body: body,
                    p_mentions: mentions
                }
            );

            if (error) {
                console.error(
                    "[Spatium Chat] gv_chat_send error:",
                    error
                );

                showError(
                    error.message ||
                    "Unable to send message."
                );

                return;
            }

            console.log(
                "[Spatium Chat] Message sent.",
                data
            );

            input.value = "";

            updateCharacterCount();

            /*
             * Reload from Supabase so the database remains
             * the source of truth.
             */
            await loadMessages();
        } catch (error) {
            console.error(
                "[Spatium Chat] sendMessage failed:",
                error
            );

            showError(
                "Unable to send message."
            );
        } finally {
            sendingMessage = false;

            if (button) {
                button.disabled = false;
            }

            input.focus();
        }
    }

    /* ---------------------------------------------------------
       MENTIONS
       --------------------------------------------------------- */

    function findMentions(text) {
        const matches = text.match(
            /@([a-zA-Z0-9_]{1,32})/g
        );

        if (!matches) {
            return [];
        }

        return [
            ...new Set(
                matches.map(username =>
                    username.substring(1)
                )
            )
        ];
    }

    /* ---------------------------------------------------------
       CHARACTER COUNT
       --------------------------------------------------------- */

    function updateCharacterCount() {
        const input = getInput();

        if (!input) return;

        const counter =
            document.getElementById("charCount") ||
            document.querySelector(".char-count");

        if (!counter) return;

        const length = input.value.length;

        counter.textContent =
            `${length}/${MAX_MESSAGE_LENGTH}`;

        if (length >= MAX_MESSAGE_LENGTH) {
            counter.classList.add("limit");
        } else {
            counter.classList.remove("limit");
        }
    }

    /* ---------------------------------------------------------
       AUTH / USER
       --------------------------------------------------------- */

    async function updateUser() {
        try {
            const {
                data: {
                    session
                }
            } = await supabase.auth.getSession();

            currentUser = session?.user || null;

            if (!currentUser) {
                currentUsername = "User";

                console.log(
                    "[Spatium Chat] No logged-in user."
                );

                return;
            }

            currentUsername =
                extractUsername(currentUser);

            console.log(
                "[Spatium Chat] Logged in as:",
                currentUsername
            );

            await loadMessages();
        } catch (error) {
            console.error(
                "[Spatium Chat] updateUser failed:",
                error
            );

            showError(
                "Unable to load your account."
            );
        }
    }

    /* ---------------------------------------------------------
       AUTH STATE
       --------------------------------------------------------- */

    function setupAuthListener() {
        supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log(
                    "[Spatium Chat] Auth event:",
                    event
                );

                currentUser = session?.user || null;

                if (currentUser) {
                    currentUsername =
                        extractUsername(currentUser);

                    await loadMessages();

                    startPolling();
                } else {
                    currentUsername = "User";
                    stopPolling();

                    const container =
                        getChatContainer();

                    if (container) {
                        container.innerHTML = "";
                    }
                }
            }
        );
    }

    /* ---------------------------------------------------------
       POLLING
       --------------------------------------------------------- */

    function startPolling() {
        stopPolling();

        pollTimer = setInterval(() => {
            if (!document.hidden && currentUser) {
                loadMessages();
            }
        }, POLL_INTERVAL);
    }

    function stopPolling() {
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
    }

    /* ---------------------------------------------------------
       INPUT EVENTS
       --------------------------------------------------------- */

    function setupInput() {
        const input = getInput();

        if (!input) {
            console.warn(
                "[Spatium Chat] Message input not found."
            );
            return;
        }

        input.addEventListener(
            "input",
            updateCharacterCount
        );

        input.addEventListener(
            "keydown",
            event => {
                /*
                 * Enter sends.
                 * Shift + Enter creates a new line.
                 */
                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {
                    event.preventDefault();
                    sendMessage();
                }
            }
        );

        updateCharacterCount();
    }

    function setupSendButton() {
        const button = getSendButton();

        if (!button) {
            console.warn(
                "[Spatium Chat] Send button not found."
            );
            return;
        }

        button.addEventListener(
            "click",
            event => {
                event.preventDefault();
                sendMessage();
            }
        );
    }

    /* ---------------------------------------------------------
       GLOBAL FUNCTIONS
       --------------------------------------------------------- */

    window.spatiumChat = {
        loadMessages,
        sendMessage,
        updateUser,
        showError
    };

    /* ---------------------------------------------------------
       INIT
       --------------------------------------------------------- */

    async function initSpatiumChat() {
        console.log(
            "[Spatium Chat] Initializing..."
        );

        setupInput();
        setupSendButton();
        setupAuthListener();

        await updateUser();

        startPolling();

        console.log(
            "[Spatium Chat] Ready."
        );
    }

    if (
        document.readyState === "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initSpatiumChat
        );
    } else {
        initSpatiumChat();
    }
})();
