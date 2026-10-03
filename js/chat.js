"use strict";


/* =========================================
   SUPABASE
========================================= */

const supabaseClient =
    window.spatiumSupabase;


if (!supabaseClient) {

    console.error(
        "[Spatium Chat] Supabase client not found."
    );

}


/* =========================================
   ELEMENTS
========================================= */

const messagesEl =
    document.getElementById("messages");

const messageInput =
    document.getElementById("messageInput");

const sendButton =
    document.getElementById("sendButton");

const characterCount =
    document.getElementById("characterCount");

const connectionStatus =
    document.getElementById(
        "connectionStatus"
    );

const chatStatus =
    document.getElementById(
        "chatStatus"
    );

const accountName =
    document.getElementById(
        "accountName"
    );

const accountStatus =
    document.getElementById(
        "accountStatus"
    );

const headerUsername =
    document.getElementById(
        "headerUsername"
    );

const mentionList =
    document.getElementById(
        "mentionList"
    );

const reportModal =
    document.getElementById(
        "reportModal"
    );

const reportReason =
    document.getElementById(
        "reportReason"
    );

const reportError =
    document.getElementById(
        "reportError"
    );

const closeReport =
    document.getElementById(
        "closeReport"
    );

const submitReport =
    document.getElementById(
        "submitReport"
    );


/* =========================================
   STATE
========================================= */

let currentUser = null;

let messages = [];

let lastMessageId = 0;

let usernames = [];

let reportMessageId = null;

let pollingTimer = null;

let sending = false;

let authSubscription = null;


/* =========================================
   INITIALIZATION
========================================= */

async function initSpatiumChat() {

    if (!supabaseClient) {

        setConnection(
            "Supabase unavailable",
            false
        );

        showError(
            "Supabase could not be initialized."
        );

        return;

    }


    /*
     * Check the current session.
     */

    await updateUser();


    /*
     * Listen for login/logout changes.
     */

    const {
        data
    } =
        supabaseClient.auth.onAuthStateChange(
            async () => {

                await updateUser();

            }
        );


    authSubscription = data.subscription;


    /*
     * Start polling.
     */

    startPolling();

}


/* =========================================
   USER
========================================= */

async function updateUser() {

    const {
        data,
        error
    } =
        await supabaseClient.auth.getUser();


    if (
        error ||
        !data ||
        !data.user
    ) {

        currentUser = null;

        showSignedOut();

        return;

    }


    currentUser =
        data.user;


    const username =
        getUsername(
            currentUser
        );


    accountName.textContent =
        username;


    accountStatus.textContent =
        "Signed in";


    headerUsername.textContent =
        username;


    messageInput.disabled =
        false;


    sendButton.disabled =
        false;


    messageInput.placeholder =
        "Write a message...";


    setConnection(
        "Connected",
        true
    );


    await loadMessages();

}


/* =========================================
   USERNAME
========================================= */

function getUsername(user) {

    if (!user) {

        return "User";

    }


    return (
        user.user_metadata?.username ||
        user.user_metadata?.name ||
        user.user_metadata?.display_name ||
        user.email?.split("@")[0] ||
        "User"
    );

}


/* =========================================
   SIGNED OUT
========================================= */

function showSignedOut() {

    currentUser = null;


    accountName.textContent =
        "Not signed in";


    accountStatus.textContent =
        "Sign in to chat";


    headerUsername.textContent =
        "Guest";


    messageInput.disabled =
        true;


    sendButton.disabled =
        true;


    messageInput.placeholder =
        "Sign in to send a message...";


    setConnection(
        "Sign in required",
        false
    );


    messagesEl.innerHTML = `
        <div class="empty-state">

            <div class="empty-icon">
                🔒
            </div>

            <h2>
                Sign in to chat
            </h2>

            <p>
                You need a Spatium account
                to use community chat.
            </p>

        </div>
    `;

}


/* =========================================
   LOAD MESSAGES
========================================= */

async function loadMessages() {

    if (!currentUser) {

        return;

    }


    setConnection(
        "Loading...",
        false
    );


    const {
        data,
        error
    } =
        await supabaseClient.rpc(
            "gv_chat_recent",
            {
                p_after_id: 0
            }
        );


    if (error) {

        console.error(
            "[Spatium Chat]",
            error
        );


        showError(
            error.message
        );


        setConnection(
            "Connection error",
            false
        );


        return;

    }


    const rows =
        normalizeRpcResult(
            data
        );


    messages =
        rows;


    lastMessageId =
        getLastMessageId(
            rows
        );


    collectUsernames(
        rows
    );


    renderMessages(
        true
    );


    setConnection(
        "Connected",
        true
    );

}


/* =========================================
   POLLING
========================================= */

function startPolling() {

    if (pollingTimer) {

        return;

    }


    pollingTimer =
        setInterval(
            checkForNewMessages,
            3000
        );

}


async function checkForNewMessages() {

    if (!currentUser) {

        return;

    }


    const {
        data,
        error
    } =
        await supabaseClient.rpc(
            "gv_chat_recent",
            {
                p_after_id:
                    lastMessageId
            }
        );


    if (error) {

        console.error(
            "[Spatium Chat] Poll error:",
            error
        );

        return;

    }


    const newRows =
        normalizeRpcResult(
            data
        );


    if (
        !newRows.length
    ) {

        return;

    }


    let added =
        false;


    for (
        const message
        of newRows
    ) {

        const exists =
            messages.some(
                existing =>
                    String(
                        existing.id
                    ) ===
                    String(
                        message.id
                    )
            );


        if (!exists) {

            messages.push(
                message
            );

            added = true;

        }

    }


    if (!added) {

        return;

    }


    lastMessageId =
        getLastMessageId(
            messages
        );


    collectUsernames(
        newRows
    );


    renderMessages(
        true
    );

}


/* =========================================
   SEND MESSAGE
========================================= */

async function sendMessage() {

    if (!currentUser) {

        setStatus(
            "You must be signed in."
        );

        return;

    }


    if (sending) {

        return;

    }


    const body =
        messageInput.value.trim();


    if (!body) {

        return;

    }


    if (body.length > 300) {

        setStatus(
            "Messages can only be 300 characters."
        );

        return;

    }


    sending = true;


    sendButton.disabled =
        true;


    setStatus(
        "Sending..."
    );


    /*
     * The SQL function accepts UUID[]
     * for mentions.
     *
     * The backend also performs its own
     * mention validation.
     */

    const mentions =
        [];


    const {
        data,
        error
    } =
        await supabaseClient.rpc(
            "gv_chat_send",
            {
                p_body: body,
                p_mentions: mentions
            }
        );


    sending = false;


    sendButton.disabled =
        false;


    if (error) {

        handleRpcError(
            error
        );

        return;

    }


    const message =
        normalizeSingleRpcResult(
            data
        );


    if (message) {

        const exists =
            messages.some(
                existing =>
                    String(
                        existing.id
                    ) ===
                    String(
                        message.id
                    )
            );


        if (!exists) {

            messages.push(
                message
            );

        }


        lastMessageId =
            Math.max(
                lastMessageId,
                Number(
                    message.id
                ) || 0
            );


        collectUsernames(
            [
                message
            ]
        );


        renderMessages(
            true
        );

    }


    messageInput.value =
        "";


    updateCharacterCount();


    hideMentions();


    setStatus(
        ""
    );

}


/* =========================================
   ENTER TO SEND
========================================= */

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


sendButton.addEventListener(
    "click",
    sendMessage
);


/* =========================================
   CHARACTER COUNT
========================================= */

messageInput.addEventListener(
    "input",
    () => {

        updateCharacterCount();

        showMentionSuggestions();

    }
);


function updateCharacterCount() {

    const length =
        messageInput.value.length;


    characterCount.textContent =
        `${length} / 300`;


    characterCount.classList.toggle(
        "warning",
        length >= 280
    );

}


/* =========================================
   RENDER MESSAGES
========================================= */

function renderMessages(
    forceScroll = false
) {

    if (
        !messages.length
    ) {

        messagesEl.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    💬
                </div>

                <h2>
                    No messages yet
                </h2>

                <p>
                    Be the first person
                    to say something.
                </p>

            </div>
        `;

        return;

    }


    const nearBottom =
        messagesEl.scrollHeight -
        messagesEl.scrollTop -
        messagesEl.clientHeight <
        180;


    messages.sort(
        (a, b) =>
            Number(a.id) -
            Number(b.id)
    );


    messagesEl.innerHTML =
        messages
            .map(
                renderMessage
            )
            .join("");


    if (
        forceScroll ||
        nearBottom
    ) {

        messagesEl.scrollTop =
            messagesEl.scrollHeight;

    }

}


/* =========================================
   RENDER ONE MESSAGE
========================================= */

function renderMessage(
    message
) {

    const username =
        escapeHtml(
            message.username ||
            "User"
        );


    const body =
        escapeHtml(
            message.body ||
            ""
        );


    const time =
        formatTime(
            message.created_at
        );


    const mine =
        Boolean(
            message.mine
        ) ||
        (
            currentUser &&
            String(
                message.user_id
            ) ===
            String(
                currentUser.id
            )
        );


    const verified =
        message.verified
            ? `
                <span
                    class="verified"
                    title="Verified"
                >
                    ✓
                </span>
            `
            : "";


    const mineClass =
        mine
            ? " mine"
            : "";


    const avatar =
        escapeHtml(
            (
                message.username ||
                "U"
            )
            .charAt(0)
            .toUpperCase()
        );


    return `
        <article
            class="message${mineClass}"
            data-message-id="${escapeAttribute(
                message.id
            )}"
        >

            <div class="message-avatar">
                ${avatar}
            </div>


            <div class="message-content">

                <div class="message-meta">

                    <strong>
                        ${username}
                        ${verified}
                    </strong>

                    <time>
                        ${time}
                    </time>

                </div>


                <div class="message-body">
                    ${linkify(body)}
                </div>


                ${
                    !mine
                        ? `
                            <button
                                class="report-button"
                                type="button"
                                onclick="openReport(${Number(
                                    message.id
                                )})"
                            >
                                Report
                            </button>
                        `
                        : ""
                }

            </div>

        </article>
    `;

}


/* =========================================
   REPORT
========================================= */

window.openReport =
    function(messageId) {

        if (!currentUser) {

            setStatus(
                "Sign in to report messages."
            );

            return;

        }


        reportMessageId =
            messageId;


        reportReason.value =
            "";


        reportError.textContent =
            "";


        reportModal.classList.remove(
            "hidden"
        );


        setTimeout(
            () =>
                reportReason.focus(),
            50
        );

    };


function closeReportModal() {

    reportMessageId =
        null;


    reportModal.classList.add(
        "hidden"
    );

}


closeReport.addEventListener(
    "click",
    closeReportModal
);


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


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            !reportModal.classList.contains(
                "hidden"
            )
        ) {

            closeReportModal();

        }

    }
);


submitReport.addEventListener(
    "click",
    submitMessageReport
);


async function submitMessageReport() {

    if (
        !reportMessageId
    ) {

        return;

    }


    const reason =
        reportReason.value.trim();


    if (!reason) {

        reportError.textContent =
            "Please enter a reason.";

        return;

    }


    submitReport.disabled =
        true;


    reportError.textContent =
        "";


    const {
        data,
        error
    } =
        await supabaseClient.rpc(
            "gv_chat_report",
            {
                p_message_id:
                    reportMessageId,

                p_reason:
                    reason
            }
        );


    submitReport.disabled =
        false;


    if (error) {

        reportError.textContent =
            error.message;

        return;

    }


    closeReportModal();


    setStatus(
        "Message reported."
    );


    setTimeout(
        () => {

            setStatus(
                ""
            );

        },
        3000
    );

}


/* =========================================
   MENTIONS
========================================= */

function collectUsernames(
    rows
) {

    for (
        const message
        of rows
    ) {

        const username =
            message.username;


        if (
            username &&
            !usernames.includes(
                username
            )
        ) {

            usernames.push(
                username
            );

        }

    }

}


function showMentionSuggestions() {

    const value =
        messageInput.value;


    const match =
        value.match(
            /@([a-zA-Z0-9_-]*)$/
        );


    if (!match) {

        hideMentions();

        return;

    }


    const query =
        match[1].toLowerCase();


    const results =
        usernames
            .filter(
                username =>
                    username
                        .toLowerCase()
                        .startsWith(
                            query
                        )
            )
            .slice(
                0,
                6
            );


    if (!results.length) {

        hideMentions();

        return;

    }


    mentionList.innerHTML =
        results
            .map(
                username => `
                    <button
                        type="button"
                        data-username="${escapeAttribute(
                            username
                        )}"
                    >
                        @${escapeHtml(
                            username
                        )}
                    </button>
                `
            )
            .join("");


    mentionList
        .querySelectorAll(
            "button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        selectMention(
                            button.dataset.username
                        );

                    }
                );

            }
        );


    mentionList.classList.add(
        "show"
    );

}


function selectMention(
    username
) {

    messageInput.value =
        messageInput.value.replace(
            /@[a-zA-Z0-9_-]*$/,
            `@${username} `
        );


    hideMentions();


    messageInput.focus();


    updateCharacterCount();

}


function hideMentions() {

    mentionList.classList.remove(
        "show"
    );


    mentionList.innerHTML =
        "";

}


/* =========================================
   RPC HELPERS
========================================= */

function normalizeRpcResult(
    data
) {

    if (!data) {

        return [];

    }


    if (
        Array.isArray(data)
    ) {

        return data;

    }


    if (
        typeof data === "string"
    ) {

        try {

            const parsed =
                JSON.parse(data);


            if (
                Array.isArray(parsed)
            ) {

                return parsed;

            }


            if (
                Array.isArray(
                    parsed.messages
                )
            ) {

                return parsed.messages;

            }


            return [];

        } catch {

            return [];

        }

    }


    if (
        Array.isArray(
            data.messages
        )
    ) {

        return data.messages;

    }


    return [];

}


function normalizeSingleRpcResult(
    data
) {

    if (!data) {

        return null;

    }


    if (
        typeof data === "string"
    ) {

        try {

            return JSON.parse(
                data
            );

        } catch {

            return null;

        }

    }


    return data;

}


function getLastMessageId(
    rows
) {

    if (
        !rows.length
    ) {

        return 0;

    }


    return Math.max(
        ...rows.map(
            row =>
                Number(
                    row.id
                ) || 0
        )
    );

}


/* =========================================
   ERROR HANDLING
========================================= */

function handleRpcError(
    error
) {

    console.error(
        "[Spatium Chat]",
        error
    );


    const message =
        error?.message ||
        "Unable to send message.";


    /*
     * Slow mode.
     *
     * Your SQL can return:
     *
     * hint=wait=5
     */

    const waitMatch =
        message.match(
            /hint=wait=(\d+)/
        );


    if (waitMatch) {

        const seconds =
            Number(
                waitMatch[1]
            );


        setStatus(
            `Slow mode: wait ${seconds}s.`
        );


        return;

    }


    /*
     * Ban.
     */

    const banMatch =
        message.match(
            /hint=until=([^\s]+)/
        );


    if (banMatch) {

        setStatus(
            "You are currently banned from chat."
        );


        return;

    }


    /*
     * Generic error.
     */

    setStatus(
        message
    );

}


/* =========================================
   UI STATUS
========================================= */

function setConnection(
    text,
    connected
) {

    connectionStatus.textContent =
        text;


    connectionStatus.classList.toggle(
        "online",
        Boolean(
            connected
        )
    );

}


function setStatus(
    text
) {

    chatStatus.textContent =
        text;

}


/* =========================================
   FORMATTERS
========================================= */

function formatTime(
    date
) {

    if (!date) {

        return "";

    }


    const parsed =
        new Date(
            date
        );


    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {

        return "";

    }


    return parsed.toLocaleTimeString(
        [],
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


/* =========================================
   SECURITY
========================================= */

function escapeHtml(
    value
) {

    return String(
        value
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


function escapeAttribute(
    value
) {

    return String(
        value
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        );

}


function linkify(
    text
) {

    return text.replace(
        /(https?:\/\/[^\s<]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );

}


/* =========================================
   START
========================================= */

initSpatiumChat();
