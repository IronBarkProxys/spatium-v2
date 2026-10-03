(() => {
    "use strict";

    const HUD_CONFIG = {
        gamesJson: "../../games.json",
        gamesPage: "../../games.html",
        defaultTitle: "Game",
        reportEmail: "support@example.com"
    };

    const style = document.createElement("style");

    style.textContent = `
        #hud-wrap {
            position: fixed;
            left: 50%;
            bottom: 14px;
            transform: translateX(-50%);
            z-index: 2147483647;
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 6px;
            border: 1px solid rgba(255,255,255,.09);
            border-radius: 18px;
            background: rgba(12,14,18,.94);
            box-shadow: 0 10px 30px rgba(0,0,0,.42);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            transition: opacity .2s ease, transform .2s ease;
            font-family: Arial, sans-serif;
        }

        .spatium-hud-pill {
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .hud-btn {
            width: 34px;
            height: 34px;
            padding: 0;
            border: 0;
            border-radius: 12px;
            display: grid;
            place-items: center;
            background: rgba(255,255,255,.07);
            color: #fff;
            cursor: pointer;
            transition:
                background .15s ease,
                transform .15s ease;
        }

        .hud-btn:hover {
            background: rgba(255,255,255,.14);
            transform: translateY(-1px);
        }

        .hud-btn:active {
            transform: scale(.93);
        }

        .hud-btn .material-icons {
            font-size: 18px;
            line-height: 1;
        }

        .hud-game {
            display: flex;
            align-items: center;
            gap: 7px;
            min-width: 0;
            padding: 0 7px 0 3px;
        }

        #hud-cover {
            width: 30px;
            height: 30px;
            flex: 0 0 30px;
            object-fit: cover;
            border-radius: 9px;
            background: #20232a;
        }

        #game-name {
            max-width: 120px;
            overflow: hidden;
            color: #fff;
            font-size: 12px;
            font-weight: 700;
            line-height: 1;
            white-space: nowrap;
            text-overflow: ellipsis;
        }

        .hud-divider {
            width: 1px;
            height: 22px;
            margin: 0 2px;
            background: rgba(255,255,255,.09);
        }

        .hud-toggle {
            position: fixed;
            right: 14px;
            bottom: 14px;
            z-index: 2147483647;
            width: 38px;
            height: 38px;
            padding: 0;
            border: 1px solid rgba(255,255,255,.09);
            border-radius: 14px;
            display: none;
            place-items: center;
            background: rgba(12,14,18,.94);
            color: #fff;
            box-shadow: 0 8px 25px rgba(0,0,0,.35);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            cursor: pointer;
        }

        .hud-toggle:hover {
            background: rgba(255,255,255,.12);
        }

        .hud-toggle .material-icons {
            font-size: 20px;
        }

        .hud-help-modal {
            position: fixed;
            inset: 0;
            z-index: 2147483646;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(0,0,0,.55);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
        }

        .hud-help-modal.active {
            display: flex;
        }

        .hud-help-box {
            width: min(400px, 100%);
            padding: 18px;
            border: 1px solid rgba(255,255,255,.09);
            border-radius: 20px;
            background: #111318;
            color: #fff;
            box-shadow: 0 20px 60px rgba(0,0,0,.5);
        }

        .hud-help-box h2 {
            margin: 0 0 8px;
            font-size: 18px;
        }

        .hud-help-box p {
            margin: 0;
            color: rgba(255,255,255,.65);
            font-size: 13px;
            line-height: 1.5;
        }

        .hud-help-close {
            width: 100%;
            height: 36px;
            margin-top: 14px;
            border: 0;
            border-radius: 12px;
            background: rgba(255,255,255,.08);
            color: #fff;
            cursor: pointer;
        }

        .hud-help-close:hover {
            background: rgba(255,255,255,.14);
        }

        #hud-wrap.hud-hidden {
            display: none;
        }

        @media (max-width: 600px) {
            #hud-wrap {
                bottom: 8px;
                max-width: calc(100vw - 16px);
                gap: 4px;
                padding: 5px;
                border-radius: 16px;
            }

            .hud-btn {
                width: 31px;
                height: 31px;
                border-radius: 10px;
            }

            .hud-btn .material-icons {
                font-size: 17px;
            }

            #hud-cover {
                width: 27px;
                height: 27px;
                flex-basis: 27px;
                border-radius: 8px;
            }

            #game-name {
                max-width: 80px;
                font-size: 11px;
            }

            .hud-game {
                gap: 5px;
                padding-right: 4px;
            }

            .hud-divider {
                height: 20px;
                margin: 0;
            }
        }

        @media (max-width: 430px) {
            #game-name,
            #hud-cover {
                display: none;
            }

            .hud-game {
                padding: 0;
            }
        }
    `;

    document.head.appendChild(style);

    function getCurrentGameFolder() {
        const parts = window.location.pathname
            .split("/")
            .filter(Boolean);

        const gamesIndex = parts.findIndex(
            part => part.toLowerCase() === "games"
        );

        if (
            gamesIndex !== -1 &&
            parts[gamesIndex + 1]
        ) {
            return decodeURIComponent(
                parts[gamesIndex + 1]
            );
        }

        return "Game";
    }

    function getGameElement() {
        return (
            document.querySelector("#gameFrame") ||
            document.querySelector("#game-iframe") ||
            document.querySelector("iframe") ||
            document.querySelector("#gameContainer") ||
            document.querySelector(".webgl-content") ||
            document.querySelector("#game-container") ||
            document.querySelector("canvas") ||
            document.documentElement
        );
    }

    async function loadGameInfo() {
        const folder = getCurrentGameFolder();

        try {
            const response = await fetch(
                HUD_CONFIG.gamesJson +
                "?t=" +
                Date.now()
            );

            if (!response.ok) {
                throw new Error("games.json failed");
            }

            const data = await response.json();

            const games = Array.isArray(data)
                ? data
                : Array.isArray(data.games)
                    ? data.games
                    : [];

            const game = games.find(item => {
                const itemFolder =
                    String(item.folder || "")
                        .toLowerCase();

                const itemName =
                    String(item.name || "")
                        .toLowerCase();

                const current =
                    folder.toLowerCase();

                return (
                    itemFolder === current ||
                    itemName === current
                );
            });

            if (game) {
                return {
                    name:
                        game.name ||
                        game.folder ||
                        folder,
                    cover:
                        game.thumbnail ||
                        ""
                };
            }
        } catch (error) {
            console.warn(
                "[Spatium HUD] Could not load games.json",
                error
            );
        }

        return {
            name: folder || HUD_CONFIG.defaultTitle,
            cover: ""
        };
    }

    function createHud(gameInfo) {
        if (document.getElementById("hud-wrap")) {
            return;
        }

        const hud = document.createElement("div");

        hud.id = "hud-wrap";

        hud.innerHTML = `
            <div class="spatium-hud-pill">

                <button
                    class="hud-btn"
                    id="hud-back"
                    type="button"
                    aria-label="Back to games"
                    title="Back to games"
                >
                    <span class="material-icons">
                        arrow_back
                    </span>
                </button>

                <div class="hud-divider"></div>

                <div class="hud-game">
                    <img
                        id="hud-cover"
                        alt=""
                    >

                    <span id="game-name">
                        ${escapeHtml(gameInfo.name)}
                    </span>
                </div>

                <div class="hud-divider"></div>

                <button
                    class="hud-btn"
                    id="hud-fullscreen"
                    type="button"
                    aria-label="Fullscreen"
                    title="Fullscreen"
                >
                    <span class="material-icons">
                        fullscreen
                    </span>
                </button>

                <button
                    class="hud-btn"
                    id="hud-report"
                    type="button"
                    aria-label="Report"
                    title="Report"
                >
                    <span class="material-icons">
                        flag
                    </span>
                </button>

                <button
                    class="hud-btn"
                    id="hud-help"
                    type="button"
                    aria-label="Help"
                    title="Help"
                >
                    <span class="material-icons">
                        help_outline
                    </span>
                </button>

                <button
                    class="hud-btn"
                    id="hud-touch"
                    type="button"
                    aria-label="Touch controls"
                    title="Touch controls"
                >
                    <span class="material-icons">
                        touch_app
                    </span>
                </button>

                <button
                    class="hud-btn"
                    id="hud-settings"
                    type="button"
                    aria-label="Settings"
                    title="Settings"
                >
                    <span class="material-icons">
                        settings
                    </span>
                </button>

                <button
                    class="hud-btn"
                    id="hud-hide"
                    type="button"
                    aria-label="Hide controls"
                    title="Hide controls"
                >
                    <span class="material-icons">
                        expand_more
                    </span>
                </button>

            </div>
        `;

        document.body.appendChild(hud);

        const cover =
            document.getElementById("hud-cover");

        if (gameInfo.cover) {
            cover.src = gameInfo.cover;

            cover.onerror = () => {
                cover.style.display = "none";
            };
        } else {
            cover.style.display = "none";
        }

        createToggle();
        createHelpModal();
        setupEvents();
    }

    function createToggle() {
        if (document.getElementById("hud-toggle")) {
            return;
        }

        const toggle = document.createElement("button");

        toggle.className = "hud-toggle";
        toggle.id = "hud-toggle";
        toggle.type = "button";
        toggle.setAttribute(
            "aria-label",
            "Show controls"
        );
        toggle.title = "Show controls";

        toggle.innerHTML = `
            <span class="material-icons">
                expand_less
            </span>
        `;

        document.body.appendChild(toggle);

        toggle.addEventListener(
            "click",
            toggleHud
        );
    }

    function createHelpModal() {
        if (
            document.getElementById(
                "hud-help-modal"
            )
        ) {
            return;
        }

        const modal =
            document.createElement("div");

        modal.className = "hud-help-modal";
        modal.id = "hud-help-modal";

        modal.innerHTML = `
            <div
                class="hud-help-box"
                role="dialog"
                aria-modal="true"
                aria-labelledby="hud-help-title"
            >
                <h2 id="hud-help-title">
                    Game Controls
                </h2>

                <p>
                    Use the game's built-in controls
                    to play. Use the HUD buttons to
                    navigate, enter fullscreen, access
                    settings, and get help.
                </p>

                <button
                    class="hud-help-close"
                    id="hud-help-close"
                    type="button"
                >
                    Close
                </button>
            </div>
        `;

        document.body.appendChild(modal);

        document
            .getElementById("hud-help-close")
            .addEventListener(
                "click",
                toggleHelpWindow
            );

        modal.addEventListener(
            "click",
            event => {
                if (event.target === modal) {
                    toggleHelpWindow();
                }
            }
        );
    }

    function setupEvents() {
        document
            .getElementById("hud-back")
            .addEventListener(
                "click",
                Backhome
            );

        document
            .getElementById("hud-fullscreen")
            .addEventListener(
                "click",
                ToggleFullscreen
            );

        document
            .getElementById("hud-report")
            .addEventListener(
                "click",
                reportIssue
            );

        document
            .getElementById("hud-help")
            .addEventListener(
                "click",
                toggleHelpWindow
            );

        document
            .getElementById("hud-touch")
            .addEventListener(
                "click",
                toggleControllerSettings
            );

        document
            .getElementById("hud-settings")
            .addEventListener(
                "click",
                toggleControllerSettings
            );

        document
            .getElementById("hud-hide")
            .addEventListener(
                "click",
                toggleHud
            );
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function Backhome() {
        window.location.href =
            HUD_CONFIG.gamesPage;
    }

    async function ToggleFullscreen() {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
                updateFullscreenIcon();
                return;
            }

            const target = getGameElement();

            if (
                target &&
                target.requestFullscreen
            ) {
                await target.requestFullscreen();
            } else if (
                document.documentElement.requestFullscreen
            ) {
                await document.documentElement
                    .requestFullscreen();
            }

            updateFullscreenIcon();
        } catch (error) {
            console.warn(
                "[Spatium HUD] Fullscreen failed",
                error
            );
        }
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

        icon.textContent =
            document.fullscreenElement
                ? "fullscreen_exit"
                : "fullscreen";
    }

    document.addEventListener(
        "fullscreenchange",
        updateFullscreenIcon
    );

    function toggleHud() {
        const hud =
            document.getElementById(
                "hud-wrap"
            );

        const toggle =
            document.getElementById(
                "hud-toggle"
            );

        if (!hud || !toggle) {
            return;
        }

        const hidden =
            hud.classList.toggle(
                "hud-hidden"
            );

        toggle.style.display =
            hidden ? "grid" : "none";
    }

    function toggleHelpWindow() {
        const modal =
            document.getElementById(
                "hud-help-modal"
            );

        if (!modal) {
            return;
        }

        modal.classList.toggle("active");
    }

    function reportIssue() {
        const gameName =
            document.getElementById(
                "game-name"
            )?.textContent ||
            "Game";

        const subject =
            encodeURIComponent(
                `Game Report: ${gameName}`
            );

        const body =
            encodeURIComponent(
                `Game: ${gameName}\n\nIssue:\n\n`
            );

        window.location.href =
            `mailto:${HUD_CONFIG.reportEmail}` +
            `?subject=${subject}&body=${body}`;
    }

    function toggleControllerSettings() {
        const game =
            getGameElement();

        if (
            game &&
            typeof game.toggleTouchControls ===
                "function"
        ) {
            game.toggleTouchControls();
            return;
        }

        const event =
            new CustomEvent(
                "spatium:toggle-touch-controls"
            );

        window.dispatchEvent(event);
    }

    window.Backhome = Backhome;
    window.ToggleFullscreen =
        ToggleFullscreen;
    window.toggleHud = toggleHud;
    window.toggleHelpWindow =
        toggleHelpWindow;
    window.reportIssue = reportIssue;
    window.toggleControllerSettings =
        toggleControllerSettings;

    async function init() {
        if (
            document.readyState ===
            "loading"
        ) {
            await new Promise(resolve => {
                document.addEventListener(
                    "DOMContentLoaded",
                    resolve,
                    { once: true }
                );
            });
        }

        const gameInfo =
            await loadGameInfo();

        createHud(gameInfo);
    }

    init();
})();
