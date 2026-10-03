(() => {
    "use strict";

    const HUD_CONFIG = {
        gamesJson: "../../games.json",
        gamesPage: "../../games.html",
        defaultTitle: "Game",
        defaultSubtitle: "Now Playing",
        reportEmail: "support@example.com"
    };

    function getCurrentGameFolder() {
        const parts = window.location.pathname
            .split("/")
            .filter(Boolean);

        const gamesIndex = parts.findIndex(
            part => part.toLowerCase() === "games"
        );

        if (gamesIndex !== -1 && parts[gamesIndex + 1]) {
            return decodeURIComponent(parts[gamesIndex + 1]);
        }

        return "Game";
    }

    function cleanGameName(name) {
        return String(name || "")
            .replace(/[-_]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    const HUD_HTML = `
        <div class="spatium-hud-wrap" id="hud-wrap">
            <div class="spatium-hud-pill" role="region" aria-label="Game controls">

                <div class="spatium-controls-group">
                    <button
                        class="spatium-hud-btn"
                        id="hud-back"
                        type="button"
                        aria-label="Back to games"
                        title="Back to games"
                    >
                        <span class="material-icons">arrow_back</span>
                    </button>

                    <button
                        class="spatium-hud-btn"
                        id="hud-fullscreen"
                        type="button"
                        aria-label="Toggle fullscreen"
                        title="Fullscreen"
                    >
                        <span class="material-icons">fullscreen</span>
                    </button>
                </div>

                <img
                    class="spatium-hud-cover"
                    id="hud-cover"
                    src=""
                    alt="Game cover"
                >

                <div class="spatium-player-info">
                    <div class="spatium-game-title" id="game-name">
                        Loading...
                    </div>

                    <div class="spatium-game-subtitle">
                        Now Playing
                    </div>
                </div>

                <div class="spatium-controls-group">
                    <button
                        class="spatium-hud-btn"
                        id="hud-report"
                        type="button"
                        aria-label="Report issue"
                        title="Report issue"
                    >
                        <span class="material-icons">bug_report</span>
                    </button>

                    <button
                        class="spatium-hud-btn"
                        id="hud-help-btn"
                        type="button"
                        aria-label="Help"
                        title="Help"
                    >
                        <span class="material-icons">help_outline</span>
                    </button>

                    <button
                        class="spatium-hud-btn"
                        id="touch-toggle-btn"
                        type="button"
                        aria-label="Touch controls"
                        title="Touch controls"
                        hidden
                    >
                        <span class="material-icons">touch_app</span>
                    </button>

                    <button
                        class="spatium-hud-btn"
                        id="hud-settings"
                        type="button"
                        aria-label="Settings"
                        title="Settings"
                    >
                        <span class="material-icons">settings</span>
                    </button>

                    <button
                        class="spatium-hud-btn spatium-btn-hide"
                        id="hud-hide"
                        type="button"
                        aria-label="Hide controls"
                        title="Hide controls"
                    >
                        <span class="material-icons">expand_more</span>
                    </button>
                </div>

            </div>
        </div>

        <button
            class="hud-toggle"
            id="hud-toggle"
            type="button"
            aria-label="Show controls"
            title="Show controls"
        >
            <span class="material-icons">expand_less</span>
        </button>

        <div
            class="spatium-hud-modal"
            id="hud-help"
            aria-hidden="true"
        >
            <div
                class="spatium-hud-modal-box"
                role="dialog"
                aria-modal="true"
                aria-labelledby="hud-help-title"
            >
                <div class="spatium-hud-modal-header">
                    <div
                        class="spatium-hud-modal-title"
                        id="hud-help-title"
                    >
                        Game Help
                    </div>

                    <button
                        class="spatium-hud-modal-x"
                        id="hud-help-close"
                        type="button"
                        aria-label="Close"
                    >
                        <span class="material-icons">close</span>
                    </button>
                </div>

                <div class="spatium-hud-modal-content">
                    <p>
                        Use the controls at the bottom
                        of the screen to manage your game.
                    </p>

                    <div class="spatium-help-row">
                        <span class="material-icons">fullscreen</span>
                        <span>Enter or exit fullscreen.</span>
                    </div>

                    <div class="spatium-help-row">
                        <span class="material-icons">expand_more</span>
                        <span>Minimize the game controls.</span>
                    </div>

                    <div class="spatium-help-row">
                        <span class="material-icons">arrow_back</span>
                        <span>Return to the games page.</span>
                    </div>
                </div>

                <button
                    class="spatium-hud-modal-close"
                    id="hud-help-close-bottom"
                    type="button"
                >
                    Close
                </button>
            </div>
        </div>
    `;

    const HUD_CSS = `
        .spatium-hud-wrap,
        .spatium-hud-wrap *,
        .hud-toggle,
        .hud-toggle * {
            box-sizing: border-box;
        }

        .spatium-hud-wrap {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 18px;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 14px;
            z-index: 2147483646;
            pointer-events: none;
            opacity: 1;
            transform: translateY(0);
            transition: opacity 0.22s ease, transform 0.22s ease;
        }

        .spatium-hud-wrap.hud-hidden {
            opacity: 0;
            transform: translateY(24px);
            pointer-events: none;
        }

        .spatium-hud-pill {
            width: min(760px, 100%);
            min-height: 64px;
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 8px 10px;
            border-radius: 18px;
            background: rgba(18, 18, 22, 0.94);
            border: 1px solid rgba(255, 255, 255, 0.10);
            box-shadow:
                0 12px 40px rgba(0, 0, 0, 0.45),
                0 2px 8px rgba(0, 0, 0, 0.25);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
            pointer-events: auto;
            color: #fff;
        }

        .spatium-controls-group {
            display: flex;
            align-items: center;
            gap: 4px;
            flex-shrink: 0;
        }

        .spatium-hud-btn {
            width: 42px;
            height: 42px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            border: 0;
            border-radius: 12px;
            background: transparent;
            color: rgba(255, 255, 255, 0.78);
            cursor: pointer;
            transition:
                background 0.15s ease,
                color 0.15s ease,
                transform 0.15s ease;
        }

        .spatium-hud-btn:hover {
            background: rgba(255, 255, 255, 0.09);
            color: #fff;
            transform: translateY(-1px);
        }

        .spatium-hud-btn:active {
            transform: scale(0.93);
        }

        .spatium-hud-btn:focus-visible,
        .hud-toggle:focus-visible {
            outline: 2px solid rgba(255, 255, 255, 0.8);
            outline-offset: 2px;
        }

        .spatium-hud-btn .material-icons,
        .hud-toggle .material-icons {
            font-size: 22px;
            line-height: 1;
        }

        .spatium-hud-cover {
            width: 48px;
            height: 48px;
            flex: 0 0 48px;
            object-fit: cover;
            display: block;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .spatium-player-info {
            min-width: 0;
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            overflow: hidden;
        }

        .spatium-game-title {
            font-size: 14px;
            font-weight: 700;
            line-height: 18px;
            color: #fff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .spatium-game-subtitle {
            margin-top: 2px;
            font-size: 11px;
            font-weight: 500;
            line-height: 14px;
            color: rgba(255, 255, 255, 0.48);
        }

        .hud-toggle {
            position: fixed;
            right: 18px;
            bottom: 18px;
            width: 44px;
            height: 44px;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 0;
            border: 0;
            border-radius: 12px;
            background: rgba(18, 18, 22, 0.94);
            color: #fff;
            cursor: pointer;
            z-index: 2147483647;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.40);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            transition:
                transform 0.15s ease,
                background 0.15s ease;
        }

        .hud-toggle.show {
            display: flex;
        }

        .hud-toggle:hover {
            background: rgba(35, 35, 40, 0.98);
            transform: translateY(-2px);
        }

        .hud-toggle:active {
            transform: scale(0.93);
        }

        .spatium-hud-modal {
            position: fixed;
            inset: 0;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
            z-index: 2147483647;
            background: rgba(0, 0, 0, 0.55);
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
        }

        .spatium-hud-modal.show {
            display: flex;
        }

        .spatium-hud-modal-box {
            width: min(430px, 100%);
            padding: 20px;
            border-radius: 18px;
            background: #18181d;
            border: 1px solid rgba(255, 255, 255, 0.10);
            color: #fff;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .spatium-hud-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }

        .spatium-hud-modal-title {
            font-size: 19px;
            font-weight: 700;
        }

        .spatium-hud-modal-x {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            border: 0;
            border-radius: 10px;
            background: transparent;
            color: rgba(255, 255, 255, 0.65);
            cursor: pointer;
        }

        .spatium-hud-modal-x:hover {
            background: rgba(255, 255, 255, 0.08);
            color: #fff;
        }

        .spatium-hud-modal-content {
            margin-top: 16px;
            color: rgba(255, 255, 255, 0.65);
            font-size: 14px;
            line-height: 1.6;
        }

        .spatium-hud-modal-content p {
            margin: 0 0 16px;
        }

        .spatium-help-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 10px 0;
        }

        .spatium-help-row .material-icons {
            font-size: 20px;
            color: rgba(255, 255, 255, 0.85);
        }

        .spatium-hud-modal-close {
            width: 100%;
            height: 42px;
            margin-top: 18px;
            border: 0;
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.09);
            color: #fff;
            font-weight: 600;
            cursor: pointer;
        }

        .spatium-hud-modal-close:hover {
            background: rgba(255, 255, 255, 0.14);
        }

        @media (max-width: 650px) {
            .spatium-hud-wrap {
                bottom: 10px;
                padding: 0 8px;
            }

            .spatium-hud-pill {
                min-height: 58px;
                gap: 7px;
                padding: 6px 7px;
                border-radius: 16px;
            }

            .spatium-hud-btn {
                width: 37px;
                height: 37px;
                border-radius: 10px;
            }

            .spatium-hud-btn .material-icons {
                font-size: 20px;
            }

            .spatium-hud-cover {
                width: 42px;
                height: 42px;
                flex-basis: 42px;
                border-radius: 10px;
            }

            .spatium-game-title {
                font-size: 13px;
            }

            .spatium-game-subtitle {
                font-size: 10px;
            }
        }

        @media (max-width: 470px) {
            .spatium-hud-pill {
                gap: 3px;
            }

            .spatium-controls-group {
                gap: 0;
            }

            .spatium-hud-btn {
                width: 34px;
                height: 34px;
            }

            .spatium-hud-cover {
                width: 38px;
                height: 38px;
                flex-basis: 38px;
            }

            .spatium-hud-pill
            .spatium-controls-group:last-child
            #hud-report,
            .spatium-hud-pill
            .spatium-controls-group:last-child
            #hud-help-btn {
                display: none;
            }
        }
    `;

    function injectStyles() {
        if (document.getElementById("spatium-hud-styles")) {
            return;
        }

        const style = document.createElement("style");

        style.id = "spatium-hud-styles";
        style.textContent = HUD_CSS;

        document.head.appendChild(style);
    }

    function injectHUD() {
        if (document.getElementById("spatium-hud-container")) {
            return;
        }

        const container = document.createElement("div");

        container.id = "spatium-hud-container";
        container.innerHTML = HUD_HTML;

        document.body.appendChild(container);
    }

    async function loadGameInfo() {
        const folder = getCurrentGameFolder();

        const titleElement =
            document.getElementById("game-name");

        const coverElement =
            document.getElementById("hud-cover");

        if (!titleElement || !coverElement) {
            return;
        }

        const cleaned = cleanGameName(folder);

        titleElement.textContent =
            cleaned || HUD_CONFIG.defaultTitle;

        try {
            const response = await fetch(
                HUD_CONFIG.gamesJson +
                "?t=" +
                Date.now()
            );

            if (!response.ok) {
                throw new Error("Could not load games.json");
            }

            const data = await response.json();

            const games =
                Array.isArray(data)
                    ? data
                    : data.games || [];

            const current =
                String(folder)
                    .trim()
                    .toLowerCase();

            const game = games.find(item => {
                const itemFolder =
                    String(item.folder || "")
                        .trim()
                        .toLowerCase();

                const itemName =
                    String(item.name || "")
                        .trim()
                        .toLowerCase();

                return (
                    itemFolder === current ||
                    itemName === current
                );
            });

            if (game) {
                const displayName =
                    game.name ||
                    game.folder ||
                    cleaned;

                titleElement.textContent =
                    displayName;

                if (game.thumbnail) {
                    coverElement.src =
                        game.thumbnail;

                    coverElement.alt =
                        displayName + " cover";
                }

                return;
            }
        } catch (error) {
            console.warn(
                "[Spatium HUD] games.json could not be loaded:",
                error
            );
        }

        const coverName =
            folder
                .toLowerCase()
                .replace(/\s+/g, "")
                .replace(/[^a-z0-9.-]/g, "");

        const possibleCovers = [
            `../../covers/${coverName}.png`,
            `../../covers/${coverName}.jpg`,
            `../../covers/${coverName}.jpeg`,
            `../../covers/${coverName}.webp`
        ];

        let currentCover = 0;

        function tryNextCover() {
            if (
                currentCover >=
                possibleCovers.length
            ) {
                coverElement.removeAttribute("src");
                return;
            }

            coverElement.src =
                possibleCovers[currentCover];

            currentCover++;
        }

        coverElement.onerror =
            tryNextCover;

        tryNextCover();
    }

    function Backhome() {
        window.location.href =
            HUD_CONFIG.gamesPage;
    }

    function getGameElement() {
        const iframe =
            document.querySelector(
                "#gameFrame, #game-iframe, iframe"
            );

        if (iframe) {
            return iframe;
        }

        const container =
            document.querySelector(
                "#gameContainer, .webgl-content, #game-container"
            );

        if (container) {
            return container;
        }

        const canvas =
            document.querySelector("canvas");

        if (canvas) {
            return canvas;
        }

        return document.documentElement;
    }

    async function ToggleFullscreen() {
        const gameElement =
            getGameElement();

        try {
            if (!document.fullscreenElement) {
                if (gameElement.requestFullscreen) {
                    await gameElement.requestFullscreen();
                } else if (
                    gameElement.webkitRequestFullscreen
                ) {
                    gameElement.webkitRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if (
                    document.webkitExitFullscreen
                ) {
                    document.webkitExitFullscreen();
                }
            }
        } catch (error) {
            console.error(
                "[Spatium HUD] Fullscreen failed:",
                error
            );
        }
    }

    function toggleHud() {
        const hud =
            document.getElementById("hud-wrap");

        const toggle =
            document.getElementById("hud-toggle");

        if (!hud || !toggle) {
            return;
        }

        const isHidden =
            hud.classList.toggle("hud-hidden");

        if (isHidden) {
            toggle.classList.add("show");

            toggle.setAttribute(
                "aria-label",
                "Show controls"
            );

            toggle.setAttribute(
                "title",
                "Show controls"
            );
        } else {
            toggle.classList.remove("show");

            toggle.setAttribute(
                "aria-label",
                "Hide controls"
            );

            toggle.setAttribute(
                "title",
                "Hide controls"
            );
        }
    }

    function toggleHelpWindow() {
        const modal =
            document.getElementById("hud-help");

        if (!modal) {
            return;
        }

        const open =
            modal.classList.toggle("show");

        modal.setAttribute(
            "aria-hidden",
            String(!open)
        );
    }

    function reportIssue() {
        const title =
            document.getElementById(
                "game-name"
            )?.textContent ||
            "Game";

        const subject =
            encodeURIComponent(
                `Spatium game issue - ${title}`
            );

        window.location.href =
            `mailto:${HUD_CONFIG.reportEmail}?subject=${subject}`;
    }

    function toggleControllerSettings() {
        const possibleFunctions = [
            "openControllerSettings",
            "toggleControllerSettings",
            "openSettings"
        ];

        for (
            const functionName of
            possibleFunctions
        ) {
            if (
                typeof window[functionName] ===
                "function" &&
                window[functionName] !==
                toggleControllerSettings
            ) {
                try {
                    window[functionName]();
                    return;
                } catch (error) {
                    console.warn(
                        `[Spatium HUD] ${functionName} failed:`,
                        error
                    );
                }
            }
        }
    }

    function checkTouchControls() {
        const button =
            document.getElementById(
                "touch-toggle-btn"
            );

        if (!button) {
            return;
        }

        if (
            window.QZGameTouchInput &&
            typeof window.QZGameTouchInput.toggle ===
            "function"
        ) {
            button.hidden = false;
            button.style.display = "flex";
        } else {
            button.hidden = true;
            button.style.display = "none";
        }
    }

    function setupEvents() {
        const back =
            document.getElementById("hud-back");

        const fullscreen =
            document.getElementById(
                "hud-fullscreen"
            );

        const report =
            document.getElementById("hud-report");

        const help =
            document.getElementById(
                "hud-help-btn"
            );

        const settings =
            document.getElementById(
                "hud-settings"
            );

        const hide =
            document.getElementById("hud-hide");

        const toggle =
            document.getElementById("hud-toggle");

        const helpClose =
            document.getElementById(
                "hud-help-close"
            );

        const helpCloseBottom =
            document.getElementById(
                "hud-help-close-bottom"
            );

        if (back) {
            back.addEventListener(
                "click",
                Backhome
            );
        }

        if (fullscreen) {
            fullscreen.addEventListener(
                "click",
                ToggleFullscreen
            );
        }

        if (report) {
            report.addEventListener(
                "click",
                reportIssue
            );
        }

        if (help) {
            help.addEventListener(
                "click",
                toggleHelpWindow
            );
        }

        if (settings) {
            settings.addEventListener(
                "click",
                toggleControllerSettings
            );
        }

        if (hide) {
            hide.addEventListener(
                "click",
                toggleHud
            );
        }

        if (toggle) {
            toggle.addEventListener(
                "click",
                toggleHud
            );
        }

        if (helpClose) {
            helpClose.addEventListener(
                "click",
                toggleHelpWindow
            );
        }

        if (helpCloseBottom) {
            helpCloseBottom.addEventListener(
                "click",
                toggleHelpWindow
            );
        }

        const modal =
            document.getElementById("hud-help");

        if (modal) {
            modal.addEventListener(
                "click",
                event => {
                    if (event.target === modal) {
                        toggleHelpWindow();
                    }
                }
            );
        }

        document.addEventListener(
            "keydown",
            event => {
                if (event.key === "Escape") {
                    const modal =
                        document.getElementById(
                            "hud-help"
                        );

                    if (
                        modal &&
                        modal.classList.contains("show")
                    ) {
                        toggleHelpWindow();
                    }
                }
            }
        );

        document.addEventListener(
            "fullscreenchange",
            updateFullscreenIcon
        );
    }

    function updateFullscreenIcon() {
        const button =
            document.getElementById(
                "hud-fullscreen"
            );

        if (!button) {
            return;
        }

        const icon =
            button.querySelector(
                ".material-icons"
            );

        if (!icon) {
            return;
        }

        if (document.fullscreenElement) {
            icon.textContent =
                "fullscreen_exit";

            button.setAttribute(
                "title",
                "Exit fullscreen"
            );

            button.setAttribute(
                "aria-label",
                "Exit fullscreen"
            );
        } else {
            icon.textContent =
                "fullscreen";

            button.setAttribute(
                "title",
                "Fullscreen"
            );

            button.setAttribute(
                "aria-label",
                "Toggle fullscreen"
            );
        }
    }

    window.Backhome =
        Backhome;

    window.ToggleFullscreen =
        ToggleFullscreen;

    window.toggleHud =
        toggleHud;

    window.toggleHelpWindow =
        toggleHelpWindow;

    window.reportIssue =
        reportIssue;

    window.toggleControllerSettings =
        toggleControllerSettings;

    function initializeHUD() {
        if (
            document.getElementById(
                "spatium-hud-container"
            )
        ) {
            return;
        }

        injectStyles();

        if (!document.body) {
            window.addEventListener(
                "DOMContentLoaded",
                initializeHUD,
                { once: true }
            );

            return;
        }

        injectHUD();
        setupEvents();
        loadGameInfo();
        checkTouchControls();

        setTimeout(
            checkTouchControls,
            1000
        );

        setTimeout(
            checkTouchControls,
            3000
        );

        updateFullscreenIcon();
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initializeHUD,
            { once: true }
        );
    } else {
        initializeHUD();
    }
})();
