/* =========================================================
   SPATIUM CHAT
   Matches chat.html exactly
   ========================================================= */

(() => {
    "use strict";

    const supabase = window.spatiumSupabase;

    if (!supabase) {
        console.error("[Spatium Chat] Supabase client not found.");
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

    let selectedReportMessageId = null;

    let pollTimer = null;
    let loadingMessages = false;
    let sendingMessage = false;

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

    const reportModal =
        document.getElementById("reportModal");

    const closeReport =
        document.getElementById("closeReport");

    const reportReason =
        document.getElementById("reportReason");

    const submitReport =
        document.getElementById("submitReport");

    const reportError =
        document.getElementById("reportError");

    /* =========================================================
       ERROR / STATUS
       ========================================================= */

    function showError(message) {
        console.error("[Spatium Chat]", message);

        if (chatStatus) {
            chatStatus.textContent = message;
            chatStatus.classList.add("error");

            setTimeout(() => {
                chatStatus.textContent = "";
                chatStatus.classList.remove("error");
            }, 5000);
        }
    }

    function showStatus(message) {
        if (!chatStatus) return;

        chatStatus.textContent = message;

        setTimeout(() => {
            if (chatStatus.textContent === message) {
                chatStatus.textContent = "";
            }
        }, 3000);
    }

    function setConnection(status) {
        if (!connectionStatus) return;

        connectionStatus.textContent = status;

        connectionStatus.classList.remove(
            "connected",
            "error",
            "connecting"
        );

        if (status === "Connected") {
            connectionStatus.classList.add("connected");
        } else if (status === "Connection error") {
            connectionStatus.classList.add("error");
        } else {
            connectionStatus.classList.add("connecting");
        }
    }

    /* =========================================================
       ESCAPE HTML
       ========================================================= */

    function escapeHTML(value) {
        const div = document.createElement("div");
        div.textContent = value ?? "";
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

    /* =========================================================
       TIME
       ========================================================= */

    function formatMessageTime(timestamp) {
        if (!timestamp) {
            return "";
        }

        const date = new Date(timestamp);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        const now = new Date();

        const sameDay =
            date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth() &&
            date.getDate() === now.getDate();

        if (sameDay) {
            return date.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit"
            });
        }

        return date.toLocaleDateString([], {
            month: "short",
            day: "numeric"
        }) + " " +
        date.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
        });
    }

    /* =========================================================
       CHARACTER COUNT
       ========================================================= */

    function updateCharacterCount() {
        if (!messageInput || !characterCount) {
            return;
        }

        const length = messageInput.value.length;

        characterCount.textContent =
            `${length} / ${MAX_MESSAGE_LENGTH}`;

        characterCount.classList.remove("warning");
        characterCount.classList.remove("limit");

        if (length >= MAX_MESSAGE_LENGTH) {
            characterCount.classList.add("limit");
        } else if (length >= MAX_MESSAGE_LENGTH - 50) {
            characterCount.classList.add("warning");
        }
    }

    /* =========================================================
       MENTIONS
       ========================================================= */

    function extractMentions(text) {
        const matches =
            text.match(/@([a-zA-Z0-9_]{1,32})/g);

        if (!matches) {
            return [];
        }

        return [
            ...new Set(
                matches.map(
                    mention => mention.substring(1)
                )
            )
        ];
    }

    function clearMentionList() {
        if (mentionList) {
            mentionList.innerHTML = "";
        }
    }

    /* =========================================================
       MESSAGE HTML
       ========================================================= */

    function createMessage(message) {
        const element =
            document.createElement("div");

        element.className = "message";

        if (
            currentUser &&
            message.user_id === currentUser.id
        ) {
            element.classList.add("own");
        }

        if (message.id) {
            element.dataset.messageId =
                message.id;
        }

        const username =
            currentUser &&
            message.user_id === currentUser.id
                ? currentUsername
                : "User";

        const body =
            escapeHTML(message.body || "");

        const time =
            formatMessageTime(message.created_at);

        element.innerHTML = `
            <div class="message-header">

                <span class="message-username">
                    ${escapeHTML(username)}
                </span>

                <span class="message-time">
                    ${escapeHTML(time)}
                </span>

            </div>

            <div class="message-body">
                ${body}
            </div>

            <button
                type="button"
                class="message-report"
                data-report-id="${escapeHTML(message.id || "")}"
                aria-label="Report message"
                title="Report message"
            >
                Report
            </button>
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

        messagesEl.innerHTML = "";

        if (!messages.length) {
            messagesEl.innerHTML = `
                <div class="loading">
                    No messages yet. Start the conversation!
                </div>
            `;

            return;
        }

        const sortedMessages =
            [...messages].sort((a, b) => {
                const aTime =
                    new Date(a.created_at).getTime();

                const bTime =
                    new Date(b.created_at).getTime();

                return aTime - bTime;
            });

        for (const message of sortedMessages) {
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

        loadingMessages = true;

        try {
            console.log(
                "[Spatium Chat] Loading messages..."
            );

            const {
                data,
                error
            } = await supabase.rpc(
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

                setConnection("Connection error");

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

            setConnection("Connected");

            renderMessages(messages);

        } catch (error) {
            console.error(
                "[Spatium Chat] loadMessages error:",
                error
            );

            setConnection("Connection error");

            showError(
                "Could not load chat messages."
            );

        } finally {
            loadingMessages = false;
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

        if (body.length > MAX_MESSAGE_LENGTH) {
            showError(
                `Messages are limited to ${MAX_MESSAGE_LENGTH} characters.`
            );

            return;
        }

        sendingMessage = true;

        if (sendButton) {
            sendButton.disabled = true;
            sendButton.textContent = "Sending...";
        }

        try {
            const mentions =
                extractMentions(body);

            console.log(
                "[Spatium Chat] Sending message..."
            );

            const {
                data,
                error
            } = await supabase.rpc(
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
                    "Could not send message."
                );

                return;
            }

            console.log(
                "[Spatium Chat] Message saved:",
                data
            );

            messageInput.value = "";

            updateCharacterCount();

            clearMentionList();

            /*
             * Reload directly from Supabase.
             * This confirms the message was actually
             * stored instead of just adding it visually.
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
            sendingMessage = false;

            if (sendButton) {
                sendButton.disabled = false;
                sendButton.textContent = "Send";
            }

            if (messageInput) {
                messageInput.focus();
            }
        }
    }

    /* =========================================================
       REPORT MODAL
       ========================================================= */

    function openReport(messageId) {
        if (!messageId) {
            return;
        }

        selectedReportMessageId =
            messageId;

        if (reportReason) {
            reportReason.value = "";
        }

        if (reportError) {
            reportError.textContent = "";
        }

        if (reportModal) {
            reportModal.classList.remove("hidden");
        }

        if (reportReason) {
            setTimeout(() => {
                reportReason.focus();
            }, 50);
        }
    }

    function closeReportModal() {
        selectedReportMessageId = null;

        if (reportModal) {
            reportModal.classList.add("hidden");
        }

        if (reportReason) {
            reportReason.value = "";
        }

        if (reportError) {
            reportError.textContent = "";
        }
    }

    async function submitReportMessage() {
        if (!currentUser) {
            if (reportError) {
                reportError.textContent =
                    "You must be signed in to report a message.";
            }

            return;
        }

        if (!selectedReportMessageId) {
            return;
        }

        const reason =
            reportReason?.value.trim() || "";

        if (!reason) {
            if (reportError) {
                reportError.textContent =
                    "Please enter a reason.";
            }

            return;
        }

        if (reason.length > 500) {
            if (reportError) {
                reportError.textContent =
                    "Your reason is too long.";
            }

            return;
        }

        if (submitReport) {
            submitReport.disabled = true;
            submitReport.textContent =
                "Submitting...";
        }

        try {
            const {
                error
            } = await supabase.rpc(
                "gv_chat_report",
                {
                    p_message_id:
                        selectedReportMessageId,

                    p_reason:
                        reason
                }
            );

            if (error) {
                console.error(
                    "[Spatium Chat] Report error:",
                    error
                );

                if (reportError) {
                    reportError.textContent =
                        error.message ||
                        "Could not submit report.";
                }

                return;
            }

            closeReportModal();

            showStatus(
                "Report submitted."
            );

        } catch (error) {
            console.error(
                "[Spatium Chat] Report failed:",
                error
            );

            if (reportError) {
                reportError.textContent =
                    "Could not submit report.";
            }

        } finally {
            if (submitReport) {
                submitReport.disabled = false;
                submitReport.textContent =
                    "Submit Report";
            }
        }
    }

    /* =========================================================
       MESSAGE REPORT CLICK
       ========================================================= */

    function setupMessageReporting() {
        if (!messagesEl) {
            return;
        }

        messagesEl.addEventListener(
            "click",
            event => {
                const reportButton =
                    event.target.closest(
                        ".message-report"
                    );

                if (!reportButton) {
                    return;
                }

                const messageId =
                    reportButton.dataset.reportId;

                openReport(messageId);
            }
        );
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
       AUTH
       ========================================================= */

    async function updateUser() {
        try {
            const {
                data,
                error
            } = await supabase.auth.getUser();

            if (error) {
                throw error;
            }

            currentUser =
                data?.user || null;

            if (!currentUser) {
                currentUsername = "User";

                if (messageInput) {
                    messageInput.disabled = true;

                    messageInput.placeholder =
                        "Sign in to send a message...";
                }

                if (sendButton) {
                    sendButton.disabled = true;
                }

                setConnection("Connected");

                return;
            }

            currentUsername =
                getUsername(currentUser);

            console.log(
                "[Spatium Chat] Logged in as:",
                currentUsername
            );

            if (messageInput) {
                messageInput.disabled = false;

                messageInput.placeholder =
                    "Type a message...";
            }

            if (sendButton) {
                sendButton.disabled = false;
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
            async (event, session) => {
                console.log(
                    "[Spatium Chat] Auth event:",
                    event
                );

                currentUser =
                    session?.user || null;

                if (currentUser) {
                    currentUsername =
                        getUsername(currentUser);

                    if (messageInput) {
                        messageInput.disabled = false;

                        messageInput.placeholder =
                            "Type a message...";
                    }

                    if (sendButton) {
                        sendButton.disabled = false;
                    }

                    await loadMessages();

                    startPolling();

                } else {
                    currentUsername = "User";

                    if (messageInput) {
                        messageInput.disabled = true;

                        messageInput.placeholder =
                            "Sign in to send a message...";
                    }

                    if (sendButton) {
                        sendButton.disabled = true;
                    }

                    stopPolling();

                    if (messagesEl) {
                        messagesEl.innerHTML = `
                            <div class="loading">
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
            setInterval(() => {
                if (
                    currentUser &&
                    !document.hidden
                ) {
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

    /* =========================================================
       REPORT CONTROLS
       ========================================================= */

    function setupReportControls() {
        if (closeReport) {
            closeReport.addEventListener(
                "click",
                closeReportModal
            );
        }

        if (submitReport) {
            submitReport.addEventListener(
                "click",
                submitReportMessage
            );
        }

        if (reportModal) {
            reportModal.addEventListener(
                "click",
                event => {
                    if (
                        event.target ===
                        reportModal
                    ) {
                        closeReportModal();
                    }
                }
            );
        }

        document.addEventListener(
            "keydown",
            event => {
                if (
                    event.key === "Escape" &&
                    reportModal &&
                    !reportModal.classList.contains(
                        "hidden"
                    )
                ) {
                    closeReportModal();
                }
            }
        );
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
        setupMessageReporting();
        setupReportControls();
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
